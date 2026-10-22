import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import { hunkSigns } from "../../core/features/git/signs";
import type { FileType } from "../../core/filetypes/registry";
import { cellWidth, clusters } from "../../core/kernel/text/cells";
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
  lineRows,
  rowAt,
  sourceColAt,
  spanAt,
} from "../../core/kernel/view/hit";
import {
  type InlayHint,
  inlayHintMarks,
} from "../../core/kernel/view/inlay-hints";
import { justifyRow } from "../../core/kernel/view/justify";
import {
  highlightMarks,
  referenceMarks,
  searchMarks,
  selectionMarks,
} from "../../core/kernel/view/marks";
import {
  sizedCell,
  type TextZoom,
  zoomCellOf,
  zoomColAt,
  zoomRowOf,
  zoomRowsOf,
  zoomScale,
  zoomStep,
} from "../../core/kernel/view/sized";
import { layoutText } from "../../core/kernel/view/text-view";
import type {
  RenderLine,
  Sign,
  SizedChunk,
  Span,
  TextView,
} from "../../core/kernel/view/types";
import {
  displayWidth,
  prefixCells,
  rowOf,
  wrapLine,
  wrapText,
} from "../../core/kernel/view/wrap";
import { bodyRows } from "../../core/state/layout";
import { panelFocused } from "../../core/state/side-panel";
import type {
  AppState,
  BufferState,
  MouseTarget,
  WindowId,
} from "../../core/state/types";
import type { ViewHost } from "../../core/state/view-context";
import type { Cursor, ViewDeps } from "../shell";
import { type SizedText, scriptBytes } from "../sized-text";
import { drawCells, middle, type Theme, themeOf } from "../theme";
import { kittyPictures } from "../widgets/image";
import { type WidgetPainter, widgetPainters } from "../widgets/registry";
import { lookOf, paintZoomRow } from "../zoom-row";
import type { WindowView } from "./registry";

const NO_FOLDS: ReadonlySet<number> = new Set();
const NO_DIAGNOSTICS: readonly Diagnostic[] = [];

/** Every attached server's inlay hints for `path`. */
const hintsOf = (s: AppState, path: string): InlayHint[] =>
  Object.values(s.lsp.inlayHints[path] ?? {}).flat();

/**
 * A git change cell inside a repository, line numbers (room for the largest,
 * at least 4 digits), a space, and the sign cell.
 */
const gutterWidth = (lineCount: number, change: boolean) =>
  (change ? 1 : 0) + Math.max(4, String(lineCount).length) + 2;

/** Where a window paints its gutter and its text, in screen cells. */
type Columns = { gutterX: number; textX: number; textW: number };

/**
 * The gutter and text columns of `r`: the text takes at most `maxWidth`
 * cells, and the gutter and text are centered together in the window.
 */
export function columns(r: Rect, gutterW: number, maxWidth: number): Columns {
  const room = Math.max(1, r.w - gutterW);
  const textW = Math.min(room, maxWidth);
  const gutterX = r.x + Math.floor((room - textW) / 2);
  return { gutterX, textX: gutterX + gutterW, textW };
}

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
  height: (row: RenderLine) => number,
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
    y += widget ? Math.max(1, row.widget?.rows ?? 1) : height(row);
  }
  // Every row came before `line`: it is hidden at the end, or ran out of room.
  return y < rows ? (covering ?? missing) : missing;
}

/** The text zoom zoomed lines are drawn at, when it is on. */
const textZoom = (s: AppState, deps: ViewDeps): TextZoom | undefined => {
  const size = s.config.preview.zoom;
  if (size <= 1) return undefined;
  const cellPx = deps.images.cellPixels()?.width;
  return cellPx === undefined ? { size } : { size, cellPx };
};

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
 * multiple of `tabWidth` and wide characters taking two cells; the cells
 * from `leftCol` up to `endCol` (or the
 * row's width) are painted and the rest of the row is filled. A span
 * without a background of its own takes its line style's. On the cursor
 * line every token keeps its foreground and takes the cursorline
 * background, except selection and search matches. With `scripts`, each
 * half-size script cell drawn is sent there to be drawn at its size.
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
    /** A stretched row's `justifyRow` cells: extra spaces after a gap. */
    shift?: readonly number[];
    scripts?: SizedText;
  },
): void {
  const line = theme.style("cursorline");
  const styleOf = (span: Span) => lookOf(theme, span, o.cursorline);
  const end = o.endCol ?? Number.POSITIVE_INFINITY;
  let v = 0;
  let x = 0;
  for (const span of spans) {
    if (v >= end) break;
    let run = "";
    let cells = 0;
    for (const ch of clusters(span.text)) {
      const w = cellWidth(ch, v, o.tabWidth);
      // A tab, or a wide character cut at the row's edge, paints blank cells.
      const whole = ch !== "\t" && v >= o.leftCol && v + w <= end;
      for (let i = 0; i < w; i++, v++)
        if (v >= o.leftCol && v < end) {
          if (!whole) run += " ";
          else if (i === 0) run += ch;
          cells++;
          const at = v - o.leftCol;
          if (o.shift !== undefined) {
            const extra = (o.shift[at + 1] ?? 0) - (o.shift[at] ?? 0);
            run += " ".repeat(extra);
            cells += extra;
          }
        }
    }
    const room = at.width - x;
    if (cells === 0 || room <= 0) continue;
    const n = Math.min(room, cells);
    const style = styleOf(span);
    const left = at.x + x;
    drawCells(buf, style, left, at.y, run, n);
    if (span.script !== undefined && o.scripts !== undefined)
      o.scripts.draw(
        [{ x: left, y: at.y, w: 1, h: 1 }],
        scriptBytes(span.script, left, at.y, style),
        (b) => drawCells(b, style, left, at.y, run, n),
      );
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
  /** Whether this frame's gutter has the git change column: inside a repository. */
  private change = false;

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
    this.change = s.git.repo !== null;
    const w = s.windows.byId[id];
    const b = w && s.buffers[w.content.bufferId];
    if (w === undefined || b === undefined) return;
    const rows = this.textRows();
    const { line, col } = w.content.cursor;
    const { tabWidth, wrap } = s.config.editor;
    // The core keeps the cursor within the body's rows from `scroll`; a
    // split window is shorter, so it scrolls further. A mouse scroll that
    // left the cursor off screen is kept.
    const coreRows = Math.max(1, bodyRows(s.terminal));
    this.topLine = w.content.scroll;
    const followsCursor =
      line >= this.topLine && line < this.topLine + coreRows;
    if (followsCursor) this.topLine = Math.max(this.topLine, line - rows + 1);
    const text = b.text.line(Math.min(line, b.text.lineCount - 1));
    const insert = s.vim.mode === "insert";
    const rawCol = displayColOf(
      [{ text, style: "text" }],
      col,
      tabWidth,
      insert,
    );
    const { textX, textW } = this.columnsOf(s, b);
    const zoom = textZoom(s, this.deps);
    /**
     * The cursor's screen row within its line and its cell in `lines`. A
     * zoomed line places it in its sized chunks, at the top of the row; a
     * row with virtual text or stretched rows places it among its spans; any
     * other row uses the buffer line.
     */
    const place = (lines: readonly RenderLine[]) => {
      const shown = lines.find(
        (l) =>
          l.sourceLine === line &&
          !(l.widget !== undefined && l.spans.length === 0),
      );
      if (shown?.zoom === true && zoom !== undefined) {
        const dc = displayColOf(shown.spans, col, tabWidth, insert);
        const zoomed = zoomRowsOf(shown, zoom, textW, tabWidth);
        const k = zoomRowOf(zoomed, dc);
        const at = zoomed[k];
        const x = at === undefined ? 0 : zoomCellOf(at, dc);
        return {
          k: zoomStep(zoom.size) * k,
          x: Math.min(x, textW - 1),
          dc,
          zoomed: true,
        };
      }
      const bySpans =
        shown?.spans.some((sp) => sp.virtual !== undefined) === true ||
        (wrap && shown?.justify === true);
      const dc =
        shown !== undefined && bySpans
          ? displayColOf(shown.spans, col, tabWidth, insert)
          : rawCol;
      if (!wrap) return { k: 0, x: dc, dc, zoomed: false };
      const prefix = shown === undefined ? 0 : prefixCells(shown);
      const starts = wrapLine(
        shown !== undefined && bySpans ? wrapText(shown.spans) : text,
        textW,
        tabWidth,
        prefix,
      );
      const k = rowOf(starts, dc);
      const indent = k === 0 ? 0 : prefix;
      const start = starts[k] ?? 0;
      const shift =
        shown?.justify === true
          ? justifyRow(
              shown.spans,
              start,
              starts[k + 1],
              Math.max(1, textW - indent),
              tabWidth,
            )
          : undefined;
      const x = dc - start + indent + (shift?.[dc - start] ?? 0);
      // An Insert cursor just past a full row sits at the start of the next.
      return x >= textW
        ? { k: k + 1, x: prefix, dc, zoomed: false }
        : { k, x, dc, zoomed: false };
    };
    const height = (row: RenderLine) =>
      lineRows(row, {
        width: textW,
        tabWidth,
        wrap,
        ...(zoom === undefined ? {} : { zoom }),
      });
    const at = (lines: RenderLine[]) =>
      rowOfLine(lines, line, this.laidTo, rows, height);
    this.lines = followsCursor
      ? this.fitCursor(
          s,
          b,
          rows,
          textW,
          (lines) => {
            const p = place(lines);
            // A zoomed cursor row shows whole.
            const tall =
              p.zoomed && zoom !== undefined ? zoomStep(zoom.size) : 1;
            return at(lines) + p.k + tall - rows;
          },
          height,
        )
      : this.layoutFrame(s, b, this.topLine, rows, w.content.cursor, textW);
    const placed = place(this.lines);
    const k = placed.k;
    let x = placed.x;
    this.leftCol = 0;
    if (!wrap && !placed.zoomed) {
      this.leftCol = placed.dc >= textW ? placed.dc - textW + 1 : 0;
      x = placed.dc - this.leftCol;
    }
    let row = at(this.lines);
    // A line taller than the window shows the rows holding the cursor; a
    // zoomed line drops whole sized rows.
    const step = placed.zoomed && zoom !== undefined ? zoomStep(zoom.size) : 1;
    if (row === 0 && k + step > rows)
      this.skipRows = Math.ceil((k + step - rows) / step) * step;
    row += k - this.skipRows;
    const visible = line >= this.topLine && row < rows;
    const focused =
      id === s.windows.active &&
      !s.panels.explorer.focused &&
      !panelFocused(s) &&
      visible;
    if (focused)
      this.cursorAt = {
        x: textX + x,
        y: r.y + (winbar ? 1 : 0) + row,
        style: s.vim.mode === "insert" ? "line" : "block",
      };
  }

  /**
   * Lay out from the current top line and advance it until the cursor's row
   * fits: past the lines whose `height` covers the rows `over` says the
   * cursor is below the window, else one line; bounded by the window height,
   * and usually one pass.
   */
  private fitCursor(
    s: AppState,
    b: BufferState,
    rows: number,
    width: number,
    over: (lines: RenderLine[]) => number,
    height: (row: RenderLine) => number,
  ): RenderLine[] {
    const cursor = s.windows.byId[this.windowId]?.content.cursor ?? {
      line: 0,
      col: 0,
    };
    for (let tries = 0; ; tries++) {
      const lines = this.layoutFrame(s, b, this.topLine, rows, cursor, width);
      const below = over(lines);
      if (below <= 0 || this.topLine >= cursor.line || tries > rows)
        return lines;
      let skipped = 0;
      let i = 0;
      if (Number.isFinite(below))
        while (i < lines.length - 1 && skipped < below) {
          skipped += height(lines[i] as RenderLine);
          i++;
        }
      const next = lines[i]?.sourceLine ?? this.topLine + 1;
      this.topLine = Math.min(cursor.line, Math.max(this.topLine + 1, next));
    }
  }

  cursor(): Cursor | undefined {
    return this.cursorAt;
  }

  /** Where this frame paints text: right of the gutter, below the winbar. */
  textArea(): Rect {
    const r = this.rect;
    const s = this.s;
    const w = s?.windows.byId[this.windowId];
    const b = w && s?.buffers[w.content.bufferId];
    const { textX, textW } = this.columnsOf(s, b);
    const top = this.winbar ? 1 : 0;
    return {
      x: textX,
      y: r.y + top,
      w: Math.min(textW, Math.max(0, r.x + r.w - textX)),
      h: this.textRows(),
    };
  }

  /** The view `b` shows: its file type's view by id, else the first. */
  private specOf(b: BufferState) {
    const ft = this.deps.reg.fileTypes.get(b.fileType);
    return ft?.views.find((v) => v.id === b.view) ?? ft?.views[0];
  }

  /**
   * This frame's gutter and text columns for `b`: with `preview.readable`
   * on, the text is capped at the readable width, centered with the gutter.
   */
  private columnsOf(
    s: AppState | undefined,
    b: BufferState | undefined,
  ): Columns {
    const gw = gutterWidth(b?.text.lineCount ?? 0, this.change);
    return columns(
      this.rect,
      gw,
      s?.config.preview.readable === true
        ? s.config.preview.readableWidth
        : Number.POSITIVE_INFINITY,
    );
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
    const { textX, textW } = this.columnsOf(s, b);
    const row = y - this.rect.y - (this.winbar ? 1 : 0);
    const zoom = textZoom(s, this.deps);
    const shown = rowAt(this.lines, row, {
      width: textW,
      tabWidth,
      wrap,
      skipRows: this.skipRows,
      ...(zoom === undefined ? {} : { zoom }),
    });
    const line = Math.min(
      shown?.line.sourceLine ?? this.topLine,
      b.text.lineCount - 1,
    );
    const length = b.text.line(line).length;
    const widget =
      shown?.line.widget !== undefined && shown.line.spans.length === 0;
    const dc =
      shown === undefined
        ? 0
        : shown.zoom !== undefined
          ? zoomColAt(shown.zoom, x - textX)
          : displayColAt(shown, this.leftCol + x - textX);
    const span =
      markers && shown !== undefined && !widget && x >= textX
        ? spanAt(shown.line.spans, dc, tabWidth)
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
        : sourceColAt(shown.line.spans, dc, tabWidth, length);
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
    const change = this.change;
    const gw = gutterWidth(b?.text.lineCount ?? 0, change);
    const cols = this.columnsOf(s, b);
    const textW = cols.textW;
    // Cells count from this renderable, which sits where the rect starts.
    const gx = this.x + cols.gutterX - this.rect.x;
    const tx = gx + gw;
    // A capped text column leaves margins, painted as plain background.
    if (tx + textW < this.x + this.width || gx > this.x)
      for (let r = 0; r < rows; r++)
        drawCells(buf, theme.style("text"), this.x, y + r, "", this.width);
    const { tabWidth, wrap, relativeNumbers } = s.config.editor;
    const zoom = textZoom(s, this.deps);
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
      // The change cell, then the number and sign cells; the change cell
      // shows a git sign on a line's first screen row only.
      const gutter = (
        text: string,
        at: number,
        sign?: Sign,
        changeSign?: Sign,
      ) => {
        if (change)
          drawCells(
            buf,
            theme.style(changeSign?.style ?? "gutter"),
            gx,
            y + at,
            changeSign?.text ?? "",
            1,
          );
        const nx = gx + (change ? 1 : 0);
        drawCells(
          buf,
          theme.style(isCursor && text !== "" ? "gutterCursor" : "gutter"),
          nx,
          y + at,
          `${text.padStart(gw - (change ? 3 : 2))} `,
          gw - (change ? 2 : 1),
        );
        drawCells(
          buf,
          theme.style(sign?.style ?? "gutter"),
          tx - 1,
          y + at,
          sign?.text ?? "",
          1,
        );
      };
      if (row.widget !== undefined && row.spans.length === 0) {
        const height = Math.min(Math.max(1, row.widget.rows), rows - i);
        gutter(number(), i, row.sign, row.changeSign);
        for (let r = 1; r < height; r++) gutter("", i + r);
        const paint = widgetPainters.get(row.widget.type) ?? paintMissing;
        paint(
          {
            buf,
            theme,
            x: tx,
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
      if (row.zoom === true && zoom !== undefined) {
        i = this.paintZoomed(buf, theme, row, zoom, {
          x: tx,
          y,
          i,
          rows,
          width: textW,
          tabWidth,
          cursorline: isCursor && active,
          gutter: (at, first) =>
            first
              ? gutter(number(), at, row.sign, row.changeSign)
              : gutter("", at),
        });
        continue;
      }
      const text = wrapText(row.spans);
      const prefix = prefixCells(row);
      const starts = wrap
        ? wrapLine(text, textW, tabWidth, prefix)
        : [this.leftCol];
      const skip = row.sourceLine === this.topLine ? this.skipRows : 0;
      for (let k = skip; k < starts.length && i < rows; k++, i++) {
        const start = starts[k] ?? 0;
        if (k === 0) gutter(number(), i, row.sign, row.changeSign);
        else gutter("", i);
        const end = starts[k + 1];
        const indent = k === 0 ? 0 : Math.min(prefix, textW - 1);
        if (indent > 0)
          paintLine(
            buf,
            theme,
            { x: tx, y: y + i, width: indent },
            row.wrapPrefix ?? [],
            { leftCol: 0, tabWidth, cursorline: isCursor && active },
          );
        const shift =
          wrap && row.justify
            ? justifyRow(row.spans, start, end, textW - indent, tabWidth)
            : undefined;
        paintLine(
          buf,
          theme,
          { x: tx + indent, y: y + i, width: textW - indent },
          row.spans,
          {
            leftCol: start,
            ...(end === undefined ? {} : { endCol: end }),
            ...(shift === undefined ? {} : { shift }),
            tabWidth,
            cursorline: isCursor && active,
            scripts: this.deps.sizedText,
          },
        );
        if (!wrap && displayWidth(text, tabWidth) > start + textW)
          drawCells(buf, theme.style("dim"), tx + textW - 1, y + i, "›", 1);
      }
    }
    for (; i < rows; i++)
      drawCells(buf, theme.style("text"), this.x, y + i, "", this.width);
  }

  /**
   * A zoomed line's rows from screen row `o.i`, each a sized cell tall:
   * every character at normal size on the first of its sized cells, in its look,
   * blanks below it, and the terminal drawing it larger over them. A row cut
   * at the window bottom or wider than the window keeps its normal-size text
   * and is not sent. Returns the screen row after the line.
   */
  private paintZoomed(
    buf: OptimizedBuffer,
    theme: Theme,
    line: RenderLine,
    zoom: TextZoom,
    o: {
      x: number;
      y: number;
      i: number;
      rows: number;
      width: number;
      tabWidth: number;
      cursorline: boolean;
      gutter: (at: number, first: boolean) => void;
    },
  ): number {
    const scale = zoomScale(zoom);
    const step = sizedCell(scale);
    const zoomed = zoomRowsOf(line, zoom, o.width, o.tabWidth);
    const skip =
      line.sourceLine === this.topLine ? Math.floor(this.skipRows / step) : 0;
    const look = (c: SizedChunk) => lookOf(theme, c, o.cursorline);
    const fill = lookOf(theme, { style: "text" }, o.cursorline);
    let i = o.i;
    for (let k = skip; k < zoomed.length && i < o.rows; k++) {
      const row = i;
      paintZoomRow({
        buf,
        sizedText: this.deps.sizedText,
        x: o.x,
        y: o.y + i,
        width: o.width,
        rows: o.rows - i,
        scale,
        chunks: zoomed[k]?.chunks ?? [],
        look,
        fill,
        gutter: (r) => o.gutter(row + r, k === 0 && r === 0),
      });
      i += step;
    }
    return i;
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
      const spec = this.specOf(b);
      const pictures = kittyPictures(this.deps, s);
      const cellPx = this.deps.images.cellPixels()?.width;
      const host: ViewHost = {
        width,
        rows,
        imageSize: (path) => {
          const got = pictures?.size(path);
          return pictures === undefined
            ? this.deps.images.size(path)
            : got === undefined || "failed" in got
              ? undefined
              : got;
        },
        cell: this.deps.images.cellSize(),
        ...(cellPx === undefined ? {} : { cellPx }),
        sizedText: this.deps.capabilities().caps?.scaled_text === true,
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
      const git = this.change
        ? [hunkSigns(s.git.files[b.path]?.hunks ?? [])]
        : [];
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
        ...(s.lsp.highlights?.path === b.path &&
        s.lsp.highlights.version === b.text.version
          ? [referenceMarks(s.lsp.highlights.ranges)]
          : []),
        searchMarks(
          s.vim.search,
          this.windowId === s.windows.active ? cursor : undefined,
        ),
        selectionMarks(selection),
        ...git,
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
