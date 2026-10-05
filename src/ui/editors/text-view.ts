import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import type { FileType } from "../../core/filetypes/registry";
import type { Range } from "../../core/kernel/text/pos";
import type { TextBuffer } from "../../core/kernel/text/text-buffer";
import type { DecorationProvider } from "../../core/kernel/view/decorations";
import {
  type Diagnostic,
  diagnosticMarks,
  endOfLineDiagnosticMarks,
} from "../../core/kernel/view/diagnostics";
import {
  displayColAt,
  displayColOf,
  rowAt,
  sourceColAt,
  spanAt,
} from "../../core/kernel/view/hit";
import {
  type InlayHint,
  inlayHintMarks,
} from "../../core/kernel/view/inlay-hints";
import {
  highlightMarks,
  searchMarks,
  selectionMarks,
} from "../../core/kernel/view/marks";
import { layoutText } from "../../core/kernel/view/text-view";
import type {
  RenderLine,
  Sign,
  Span,
  TextView,
} from "../../core/kernel/view/types";
import {
  cellWidth,
  displayWidth,
  rowOf,
  wrapLine,
  wrapText,
} from "../../core/kernel/view/wrap";
import { cursorDisplayCol } from "../../core/kernel/vim/motions";
import { panelFocused } from "../../core/state/side-panel";
import type {
  AppState,
  BufferState,
  MouseTarget,
  WindowId,
} from "../../core/state/types";
import type { ViewHost } from "../../core/state/view-context";
import type { Cursor, ViewDeps } from "../shell";
import { drawCells, middle, type Theme, themeOf } from "../theme";
import { type WidgetPainter, widgetPainters } from "../widgets/registry";
import type { WindowView } from "./registry";

const NO_FOLDS: ReadonlySet<number> = new Set();
const NO_DIAGNOSTICS: readonly Diagnostic[] = [];

/** Every attached server's inlay hints for `path`. */
const hintsOf = (s: AppState, path: string): InlayHint[] =>
  Object.values(s.lsp.inlayHints[path] ?? {}).flat();

/** Line numbers (room for the largest, at least 4 digits), a space, and the sign cell. */
const gutterWidth = (lineCount: number) =>
  Math.max(4, String(lineCount).length) + 2;

/**
 * The screen row where `line` starts in `lines`: its own text row, else the
 * row of the block or widget that covers it; past the bottom when it is not
 * laid out within `rows` rows of lines before `laidTo`.
 */
function rowOfLine(
  lines: readonly RenderLine[],
  line: number,
  laidTo: number,
  rows: number,
  height: (text: string) => number,
): number {
  const missing = Number.POSITIVE_INFINITY;
  if (line >= laidTo) return missing;
  let y = 0;
  let covering: number | undefined;
  for (const row of lines) {
    if (row.sourceLine > line) return covering ?? missing;
    const widget = row.widget !== undefined && row.spans.length === 0;
    if (row.sourceLine === line && !widget) return y;
    covering = y;
    y += widget
      ? Math.max(1, row.widget?.rows ?? 1)
      : height(wrapText(row.spans));
  }
  // Every row came before `line`: it is hidden at the end, or ran out of room.
  return y < rows ? (covering ?? missing) : missing;
}

/** How often a frame with hidden lines lays out more lines to fill its rows. */
const FILL_PASSES = 3;

/** Rows `layoutText` counted for `lines`: one per text row, a widget's own rows. */
const usedRows = (lines: readonly RenderLine[]) =>
  lines.reduce(
    (n, r) =>
      n +
      (r.widget !== undefined && r.spans.length === 0
        ? Math.max(1, r.widget.rows)
        : 1),
    0,
  );

/** A widget type nobody registered paints as a dim `[type]` row. */
const paintMissing: WidgetPainter = (t, w) => {
  for (let i = 0; i < t.rows; i++)
    drawCells(
      t.buf,
      t.theme.style(i === 0 ? "dim" : "text"),
      t.x,
      t.y + i,
      i === 0 ? `[${w.type}]` : "",
      t.width,
    );
};

/** A window's place on screen, in cells. */
export type Rect = { x: number; y: number; w: number; h: number };

/**
 * Paint one screen row of a line's spans at (x, y), `width` cells wide.
 * Display columns count from the line start, with tabs reaching the next
 * multiple of `tabWidth`; the cells from `leftCol` up to `endCol` (or the
 * row's width) are painted and the rest of the row is filled. On the cursor
 * line every token keeps its foreground and takes the cursorline
 * background, except selection and search matches.
 */
export function paintLine(
  buf: OptimizedBuffer,
  theme: Theme,
  at: { x: number; y: number; width: number },
  spans: readonly Span[],
  o: {
    leftCol: number;
    endCol?: number;
    tabWidth: number;
    cursorline: boolean;
  },
): void {
  const line = theme.style("cursorline");
  const styleOf = (token: string) => {
    const st = theme.style(token);
    return o.cursorline && token !== "selection" && token !== "searchMatch"
      ? { ...st, bg: line.bg }
      : st;
  };
  const end = o.endCol ?? Number.POSITIVE_INFINITY;
  let v = 0;
  let x = 0;
  for (const span of spans) {
    if (v >= end) break;
    let run = "";
    for (const ch of span.text) {
      const w = cellWidth(ch, v, o.tabWidth);
      for (let i = 0; i < w; i++, v++)
        if (v >= o.leftCol && v < end) run += ch === "\t" ? " " : ch;
    }
    const room = at.width - x;
    if (run === "" || room <= 0) continue;
    const n = Math.min(room, [...run].length);
    drawCells(buf, styleOf(span.style), at.x + x, at.y, run, n);
    x += n;
  }
  if (x < at.width)
    drawCells(
      buf,
      o.cursorline ? line : theme.style("text"),
      at.x + x,
      at.y,
      "",
      at.width - x,
    );
}

/**
 * Paint `text` in `r` in the file type's source view without a gutter: the
 * target `line` sits a third of the way down, and `mark` on that line is
 * styled as a search match. Wrap and tab width follow the editor options,
 * so a preview looks like the window that would open it.
 */
export function paintPreview(
  buf: OptimizedBuffer,
  theme: Theme,
  r: Rect,
  p: {
    text: TextBuffer;
    fileType: FileType | undefined;
    line: number;
    mark?: { col: number; len: number };
    analysis?: unknown;
    tabWidth: number;
    wrap: boolean;
  },
): void {
  if (r.w <= 0 || r.h <= 0) return;
  const line = Math.max(0, Math.min(p.line, p.text.lineCount - 1));
  const top = Math.max(0, line - Math.floor(r.h / 3));
  const view = {
    buf: p.text,
    width: r.w,
    topRow: top,
    rows: r.h,
    cursor: { line, col: 0 },
    folds: new Set<number>(),
    visible: { from: top, to: top + r.h },
  };
  const mark = p.mark;
  const marks: DecorationProvider = () =>
    mark === undefined
      ? []
      : [
          {
            kind: "mark",
            range: {
              start: { line, col: mark.col },
              end: { line, col: mark.col + mark.len },
            },
            style: "searchMatch",
          },
        ];
  let lines: RenderLine[];
  try {
    const spec = p.fileType?.views.find((v) => v.id === "source");
    lines = layoutText(
      view,
      [
        highlightMarks(p.fileType?.highlighter),
        ...(spec?.decorations ?? []),
        marks,
      ],
      p.analysis,
    );
  } catch {
    lines = [];
    for (let l = top; l < Math.min(p.text.lineCount, top + r.h); l++)
      lines.push({
        sourceLine: l,
        spans: [{ text: p.text.line(l), style: "text" }],
      });
  }
  let y = 0;
  for (const row of lines) {
    const text = wrapText(row.spans);
    const starts = p.wrap ? wrapLine(text, r.w, p.tabWidth) : [0];
    for (let k = 0; k < starts.length && y < r.h; k++, y++) {
      const end = starts[k + 1];
      paintLine(buf, theme, { x: r.x, y: r.y + y, width: r.w }, row.spans, {
        leftCol: starts[k] ?? 0,
        ...(end === undefined ? {} : { endCol: end }),
        tabWidth: p.tabWidth,
        cursorline: false,
      });
    }
  }
  for (; y < r.h; y++)
    drawCells(buf, theme.style("text"), r.x, r.y + y, "", r.w);
}

/** The selection a Visual mode shows, end exclusive. */
function selectionOf(s: AppState, text: TextBuffer): Range | undefined {
  const anchor = s.vim.visualAnchor;
  const w = s.windows.byId[s.windows.active];
  if (anchor === undefined || w === undefined) return undefined;
  if (s.vim.mode !== "visual" && s.vim.mode !== "visualLine") return undefined;
  const c = w.content.cursor;
  const [a, b] =
    anchor.line < c.line || (anchor.line === c.line && anchor.col <= c.col)
      ? [anchor, c]
      : [c, anchor];
  if (s.vim.mode === "visualLine")
    return {
      start: { line: a.line, col: 0 },
      end: { line: b.line, col: text.line(b.line).length },
    };
  return { start: a, end: { line: b.line, col: b.col + 1 } };
}

/**
 * The text editor of one window: an optional winbar, a gutter of relative
 * line numbers, and the rows `layoutText` lays out with the file type's
 * highlighter and view decorations plus search and selection marks. A
 * failing layout paints the raw lines instead. Editor kinds extend this.
 */
export class EditorView extends Renderable implements WindowView {
  protected s: AppState | undefined;
  protected windowId: WindowId = 0;
  protected winbar = false;
  /** Layout getters lag until the next frame, so the rect is kept here. */
  protected rect: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private topLine = 0;
  private leftCol = 0;
  /** Rows hidden at the top of a cursor line taller than the window. */
  private skipRows = 0;
  private cursorAt: Cursor | undefined;
  /** The rows `show` laid out for this frame, and the line after the last one laid out. */
  private lines: RenderLine[] = [];
  private laidTo = 0;

  constructor(
    ctx: RenderContext,
    protected readonly deps: ViewDeps,
  ) {
    super(ctx, { position: "absolute" });
  }

  /**
   * Place the view and follow window `id`; `winbar` when there are splits.
   * The frame is laid out here, once, with the top line advanced until the
   * cursor's row fits; `renderSelf` paints the cached rows.
   */
  show(s: AppState, id: WindowId, r: Rect, winbar: boolean): void {
    this.s = s;
    this.windowId = id;
    this.winbar = winbar;
    this.rect = r;
    this.left = r.x;
    this.top = r.y;
    this.width = r.w;
    this.height = r.h;
    this.cursorAt = undefined;
    this.skipRows = 0;
    this.lines = [];
    const w = s.windows.byId[id];
    const b = w && s.buffers[w.content.bufferId];
    if (w === undefined || b === undefined) return;
    const rows = this.textRows();
    const { line, col } = w.content.cursor;
    const { tabWidth, wrap } = s.config.editor;
    // The core keeps the cursor within `rows − 2` lines from `scroll`; this
    // window may be shorter, so it scrolls further. A mouse scroll that
    // left the cursor off screen is kept.
    const coreRows = Math.max(1, s.terminal.rows - 2);
    this.topLine = w.content.scroll;
    const followsCursor =
      line >= this.topLine && line < this.topLine + coreRows;
    if (followsCursor) this.topLine = Math.max(this.topLine, line - rows + 1);
    const text = b.text.line(Math.min(line, b.text.lineCount - 1));
    const insert = s.vim.mode === "insert";
    const rawCol = insert
      ? cursorDisplayCol(text.slice(0, col), col, tabWidth)
      : cursorDisplayCol(text, col, tabWidth);
    const gw = gutterWidth(b.text.lineCount);
    const textW = Math.max(1, r.w - gw);
    /**
     * The cursor's wrap row and cell in `lines`. A row with virtual text
     * places it among its spans; any other row uses the buffer line.
     */
    const place = (lines: readonly RenderLine[]) => {
      const shown = lines.find(
        (l) =>
          l.sourceLine === line &&
          !(l.widget !== undefined && l.spans.length === 0),
      );
      const virtual = shown?.spans.some((sp) => sp.virtual !== undefined);
      const dc =
        shown !== undefined && virtual === true
          ? displayColOf(shown.spans, col, tabWidth, insert)
          : rawCol;
      if (!wrap) return { k: 0, x: dc, dc };
      const starts = wrapLine(
        shown !== undefined && virtual === true ? wrapText(shown.spans) : text,
        textW,
        tabWidth,
      );
      const k = rowOf(starts, dc);
      const x = dc - (starts[k] ?? 0);
      // An Insert cursor just past a full row sits at the start of the next.
      return x >= textW ? { k: k + 1, x: 0, dc } : { k, x, dc };
    };
    const at = (lines: RenderLine[]) =>
      rowOfLine(lines, line, this.laidTo, rows, (t) =>
        wrap ? wrapLine(t, textW, tabWidth).length : 1,
      );
    this.lines = followsCursor
      ? this.fitCursor(
          s,
          b,
          rows,
          textW,
          (lines) => at(lines) + place(lines).k < rows,
        )
      : this.layoutFrame(s, b, this.topLine, rows, w.content.cursor, textW);
    const placed = place(this.lines);
    const k = placed.k;
    let x = placed.x;
    this.leftCol = 0;
    if (!wrap) {
      this.leftCol = placed.dc >= textW ? placed.dc - textW + 1 : 0;
      x = placed.dc - this.leftCol;
    }
    let row = at(this.lines);
    // A line taller than the window shows the rows holding the cursor.
    if (row === 0 && k >= rows) this.skipRows = k - rows + 1;
    row += k - this.skipRows;
    const visible = line >= this.topLine && row < rows;
    const focused =
      id === s.windows.active &&
      !s.panels.explorer.focused &&
      !panelFocused(s) &&
      visible;
    if (focused)
      this.cursorAt = {
        x: r.x + gw + x,
        y: r.y + (winbar ? 1 : 0) + row,
        style: s.vim.mode === "insert" ? "line" : "block",
      };
  }

  /**
   * Lay out from the current top line and advance it one line at a time
   * until `fits` holds; bounded by the window height, and usually one pass.
   */
  private fitCursor(
    s: AppState,
    b: BufferState,
    rows: number,
    width: number,
    fits: (lines: RenderLine[]) => boolean,
  ): RenderLine[] {
    const cursor = s.windows.byId[this.windowId]?.content.cursor ?? {
      line: 0,
      col: 0,
    };
    for (let tries = 0; ; tries++) {
      const lines = this.layoutFrame(s, b, this.topLine, rows, cursor, width);
      if (fits(lines) || this.topLine >= cursor.line || tries > rows)
        return lines;
      this.topLine++;
    }
  }

  cursor(): Cursor | undefined {
    return this.cursorAt;
  }

  private textRows(): number {
    return Math.max(0, this.rect.h - (this.winbar ? 1 : 0));
  }

  /**
   * What is under (x, y) from this frame's layout: the winbar, a fold
   * marker, else the source position shown there, with the tag drawn there. The gutter gives the line's first column
   * and the rows below the text the last line.
   */
  targetAt(x: number, y: number): MouseTarget | undefined {
    const r = this.rect;
    if (x < r.x || x >= r.x + r.w || y < r.y || y >= r.y + r.h)
      return undefined;
    if (this.winbar && y === r.y)
      return {
        kind: "window",
        window: this.windowId,
        spot: { kind: "winbar" },
      };
    return this.textAt(x, y, 0, true);
  }

  /**
   * Where a drag that started in this window's text is now: the cell is
   * clamped into the text area, and `edge` says the pointer left it above
   * (-1) or below (1).
   */
  dragAt(x: number, y: number): MouseTarget | undefined {
    const r = this.rect;
    const top = r.y + (this.winbar ? 1 : 0);
    const bottom = top + this.textRows() - 1;
    const edge = y < top ? -1 : y > bottom ? 1 : 0;
    const cy = Math.max(top, Math.min(y, bottom));
    return this.textAt(Math.max(r.x, Math.min(x, r.x + r.w - 1)), cy, edge);
  }

  /**
   * The text position shown at screen cell (x, y), inside the text rows, or
   * the fold marker there and the tag drawn there when `markers` is set.
   */
  private textAt(
    x: number,
    y: number,
    edge: -1 | 0 | 1,
    markers = false,
  ): MouseTarget | undefined {
    const s = this.s;
    const w = s?.windows.byId[this.windowId];
    const b = w && s?.buffers[w.content.bufferId];
    const rows = this.textRows();
    if (s === undefined || b === undefined || rows <= 0) return undefined;
    const { tabWidth, wrap } = s.config.editor;
    const gw = gutterWidth(b.text.lineCount);
    const textX = this.rect.x + gw;
    const row = y - this.rect.y - (this.winbar ? 1 : 0);
    const shown = rowAt(this.lines, row, {
      width: Math.max(1, this.rect.w - gw),
      tabWidth,
      wrap,
      skipRows: this.skipRows,
    });
    const line = Math.min(
      shown?.line.sourceLine ?? this.topLine,
      b.text.lineCount - 1,
    );
    const length = b.text.line(line).length;
    const widget =
      shown?.line.widget !== undefined && shown.line.spans.length === 0;
    const span =
      markers && shown !== undefined && !widget && x >= textX
        ? spanAt(
            shown.line.spans,
            displayColAt(shown, this.leftCol + x - textX),
            tabWidth,
          )
        : undefined;
    const block = span?.fold;
    if (block !== undefined)
      return {
        kind: "window",
        window: this.windowId,
        spot: { kind: "fold", block },
      };
    const col =
      shown === undefined || widget || x < textX
        ? 0
        : sourceColAt(
            shown.line.spans,
            displayColAt(shown, this.leftCol + x - textX),
            tabWidth,
            length,
          );
    const pos = { line, col: Math.min(col, length) };
    return {
      kind: "window",
      window: this.windowId,
      spot:
        span?.tag === undefined
          ? { kind: "text", pos, edge }
          : { kind: "text", pos, edge, tag: span.tag },
    };
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    if (s === undefined) return;
    const theme = themeOf(s);
    const w = s.windows.byId[this.windowId];
    const b = w && s.buffers[w.content.bufferId];
    let y = this.y;
    if (this.winbar) {
      this.paintWinbar(buf, theme, b);
      y++;
    }
    const rows = this.textRows();
    const gw = gutterWidth(b?.text.lineCount ?? 0);
    const textW = Math.max(1, this.width - gw);
    const { tabWidth, wrap, relativeNumbers } = s.config.editor;
    const active = this.windowId === s.windows.active;
    const cursorLine = w?.content.cursor.line ?? -1;
    let numbered = -1;
    let i = 0;
    for (const row of this.lines) {
      if (i >= rows) break;
      const isCursor = row.sourceLine === cursorLine;
      // A line's number goes on its first screen row only.
      const number = () => {
        if (numbered === row.sourceLine) return "";
        numbered = row.sourceLine;
        return String(
          relativeNumbers && !isCursor
            ? Math.abs(row.sourceLine - cursorLine)
            : row.sourceLine + 1,
        );
      };
      const gutter = (text: string, at: number, sign?: Sign) => {
        drawCells(
          buf,
          theme.style(isCursor && text !== "" ? "gutterCursor" : "gutter"),
          this.x,
          y + at,
          `${text.padStart(gw - 2)} `,
          gw - 1,
        );
        drawCells(
          buf,
          theme.style(sign?.style ?? "gutter"),
          this.x + gw - 1,
          y + at,
          sign?.text ?? "",
          1,
        );
      };
      if (row.widget !== undefined && row.spans.length === 0) {
        const height = Math.min(Math.max(1, row.widget.rows), rows - i);
        gutter(number(), i, row.sign);
        for (let r = 1; r < height; r++) gutter("", i + r);
        const paint = widgetPainters.get(row.widget.type) ?? paintMissing;
        paint(
          {
            buf,
            theme,
            x: this.x + gw,
            y: y + i,
            width: textW,
            rows: height,
            deps: this.deps,
            state: s,
          },
          row.widget,
        );
        i += height;
        continue;
      }
      const text = wrapText(row.spans);
      const starts = wrap ? wrapLine(text, textW, tabWidth) : [this.leftCol];
      const skip = row.sourceLine === this.topLine ? this.skipRows : 0;
      for (let k = skip; k < starts.length && i < rows; k++, i++) {
        const start = starts[k] ?? 0;
        if (k === 0) gutter(number(), i, row.sign);
        else gutter("", i);
        const end = starts[k + 1];
        paintLine(
          buf,
          theme,
          { x: this.x + gw, y: y + i, width: textW },
          row.spans,
          {
            leftCol: start,
            ...(end === undefined ? {} : { endCol: end }),
            tabWidth,
            cursorline: isCursor && active,
          },
        );
        if (!wrap && displayWidth(text, tabWidth) > start + textW)
          drawCells(
            buf,
            theme.style("dim"),
            this.x + gw + textW - 1,
            y + i,
            "›",
            1,
          );
      }
    }
    for (; i < rows; i++)
      drawCells(
        buf,
        theme.style("dim"),
        this.x,
        y + i,
        "~".padStart(gw - 1),
        this.width,
      );
  }

  /**
   * Lay out `rows` rows from `top` with the view's providers. A view with an
   * `input` hook gets the input it builds from the analysis and the file
   * type's window context; a failing layout gives the raw lines.
   */
  private layoutFrame(
    s: AppState,
    b: BufferState,
    top: number,
    rows: number,
    cursor: { line: number; col: number },
    width: number,
  ): RenderLine[] {
    const selection =
      this.windowId === s.windows.active ? selectionOf(s, b.text) : undefined;
    const view: TextView = {
      buf: b.text,
      width,
      topRow: top,
      rows,
      cursor,
      folds: NO_FOLDS,
      visible: { from: top, to: top + rows },
      ...(selection === undefined ? {} : { selection }),
    };
    try {
      const ft = this.deps.reg.fileTypes.get(b.fileType);
      const spec = ft?.views.find((v) => v.id === b.view) ?? ft?.views[0];
      const host: ViewHost = {
        width,
        rows,
        imageSize: (path) => this.deps.images.size(path),
        cell: this.deps.images.cellSize(),
      };
      const input =
        spec?.input === undefined
          ? b.analysis
          : spec.input(
              b.analysis,
              this.deps.reg.viewContexts.build(
                b.fileType,
                s,
                this.windowId,
                host,
              ),
            );
      const providers = [
        highlightMarks(ft?.highlighter),
        ...(spec?.decorations ?? []),
        diagnosticMarks(s.lsp.shown[b.path] ?? NO_DIAGNOSTICS),
        ...(s.config.lsp.endOfLineDiagnostics
          ? [endOfLineDiagnosticMarks(s.lsp.shown[b.path] ?? NO_DIAGNOSTICS)]
          : []),
        ...(s.config.lsp.inlayHints
          ? [
              inlayHintMarks(
                hintsOf(s, b.path),
                this.windowId === s.windows.active && s.vim.mode === "insert"
                  ? cursor.line
                  : undefined,
              ),
            ]
          : []),
        searchMarks(s.vim.search),
        selectionMarks(selection),
      ];
      // Lines a view hides take no rows, so the visible lines grow by the
      // rows still empty, a few times at most: never more lines than rows.
      let lines = layoutText(view, providers, input);
      for (let more = 0; more < FILL_PASSES; more++) {
        const short = rows - usedRows(lines);
        if (short <= 0 || view.visible.to >= b.text.lineCount) break;
        view.visible = { from: top, to: view.visible.to + short };
        lines = layoutText(view, providers, input);
      }
      this.laidTo = view.visible.to;
      return lines;
    } catch {
      const out: RenderLine[] = [];
      const last = Math.min(b.text.lineCount, top + rows);
      this.laidTo = last;
      for (let l = top; l < last; l++)
        out.push({
          sourceLine: l,
          spans: [{ text: b.text.line(l), style: "text" }],
        });
      return out;
    }
  }

  private paintWinbar(
    buf: OptimizedBuffer,
    theme: Theme,
    b: BufferState | undefined,
  ): void {
    const s = this.s;
    if (s === undefined) return;
    const token =
      this.windowId === s.windows.active ? "winbarActive" : "winbar";
    // The path is cut in the middle, so a narrow window keeps the file name.
    const room = this.width - 1 - (b?.dirty ? 2 : 0);
    const title = ` ${middle(b?.path ?? "[No Name]", Math.max(1, room))}`;
    drawCells(buf, theme.style(token), this.x, this.y, title, this.width);
    if (b?.dirty && [...title].length + 2 <= this.width)
      drawCells(
        buf,
        theme.style("bufferDirty"),
        this.x + [...title].length + 1,
        this.y,
        "●",
      );
  }
}
