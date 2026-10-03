import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import type { Range } from "../../core/kernel/text/pos";
import type { TextBuffer } from "../../core/kernel/text/text-buffer";
import {
  highlightMarks,
  searchMarks,
  selectionMarks,
} from "../../core/kernel/view/marks";
import { layoutText } from "../../core/kernel/view/text-view";
import type { RenderLine, Span } from "../../core/kernel/view/types";
import {
  cellWidth,
  displayWidth,
  rowOf,
  wrapLine,
} from "../../core/kernel/view/wrap";
import { cursorDisplayCol } from "../../core/kernel/vim/motions";
import type { AppState, BufferState, WindowId } from "../../core/state/types";
import type { Cursor, ViewDeps } from "../shell";
import { drawCells, middle, type Theme, themeOf } from "../theme";

const SCROLL_LINES = 3;

/** Line numbers: room for the largest one (at least 4 digits) and a space. */
const gutterWidth = (lineCount: number) =>
  Math.max(4, String(lineCount).length) + 1;

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
export class EditorView extends Renderable {
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

  constructor(
    ctx: RenderContext,
    protected readonly deps: ViewDeps,
  ) {
    super(ctx, { position: "absolute" });
    this.onMouseScroll = (e) => {
      const up = e.scroll?.direction === "up";
      deps.dispatch({
        type: "mouse",
        event: { kind: "scroll", delta: up ? -SCROLL_LINES : SCROLL_LINES },
      });
    };
  }

  /** Place the view and follow window `id`; `winbar` when there are splits. */
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
    if (line >= this.topLine && line < this.topLine + coreRows)
      this.topLine = Math.max(this.topLine, line - rows + 1);
    const text = b.text.line(Math.min(line, b.text.lineCount - 1));
    const dc =
      s.vim.mode === "insert"
        ? cursorDisplayCol(text.slice(0, col), col, tabWidth)
        : cursorDisplayCol(text, col, tabWidth);
    const gw = gutterWidth(b.text.lineCount);
    const textW = Math.max(1, r.w - gw);
    let row = line - this.topLine;
    let x = dc;
    if (!wrap) {
      this.leftCol = dc >= textW ? dc - textW + 1 : 0;
      x = dc - this.leftCol;
    } else {
      this.leftCol = 0;
      const starts = wrapLine(text, textW, tabWidth);
      let k = rowOf(starts, dc);
      x = dc - (starts[k] ?? 0);
      // An Insert cursor just past a full row sits at the start of the next.
      if (x >= textW) {
        k++;
        x = 0;
      }
      if (line >= this.topLine && line < this.topLine + rows) {
        const height = (l: number) =>
          wrapLine(b.text.line(l), textW, tabWidth).length;
        let above = 0;
        for (let l = this.topLine; l < line; l++) above += height(l);
        while (above + k >= rows && this.topLine < line) {
          above -= height(this.topLine);
          this.topLine++;
        }
        // A line taller than the window shows the rows holding the cursor.
        if (above + k >= rows) this.skipRows = k - rows + 1;
        row = above + k - this.skipRows;
      }
    }
    const visible = line >= this.topLine && row < rows;
    const focused =
      id === s.windows.active && !s.panels.explorer.focused && visible;
    if (focused)
      this.cursorAt = {
        x: r.x + gw + x,
        y: r.y + (winbar ? 1 : 0) + row,
        style: s.vim.mode === "insert" ? "line" : "block",
      };
  }

  cursor(): Cursor | undefined {
    return this.cursorAt;
  }

  private textRows(): number {
    return Math.max(0, this.rect.h - (this.winbar ? 1 : 0));
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
    let lines: RenderLine[] = [];
    if (w !== undefined && b !== undefined)
      lines = this.layout(s, b, rows, w.content.cursor, textW);
    const { tabWidth, wrap, relativeNumbers } = s.config.editor;
    const active = this.windowId === s.windows.active;
    const cursorLine = w?.content.cursor.line ?? -1;
    let i = 0;
    for (const row of lines) {
      if (i >= rows) break;
      const isCursor = row.sourceLine === cursorLine;
      const text = row.spans.map((sp) => sp.text).join("");
      const starts = wrap ? wrapLine(text, textW, tabWidth) : [this.leftCol];
      const skip = row.sourceLine === this.topLine ? this.skipRows : 0;
      for (let k = skip; k < starts.length && i < rows; k++, i++) {
        const start = starts[k] ?? 0;
        const num =
          k > 0
            ? ""
            : relativeNumbers && !isCursor
              ? Math.abs(row.sourceLine - cursorLine)
              : row.sourceLine + 1;
        drawCells(
          buf,
          theme.style(isCursor && k === 0 ? "gutterCursor" : "gutter"),
          this.x,
          y + i,
          `${String(num).padStart(gw - 1)} `,
          gw,
        );
        const end = starts[k + 1];
        paintLine(
          buf,
          theme,
          { x: this.x + gw, y: y + i, width: Math.max(0, this.width - gw) },
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
        "~".padStart(gw),
        this.width,
      );
  }

  private layout(
    s: AppState,
    b: BufferState,
    rows: number,
    cursor: { line: number; col: number },
    width: number,
  ): RenderLine[] {
    const view = {
      buf: b.text,
      width,
      topRow: this.topLine,
      rows,
      cursor,
      folds: new Set<number>(),
      visible: { from: this.topLine, to: this.topLine + rows },
    };
    try {
      const ft = this.deps.reg.fileTypes.get(b.fileType);
      const spec = ft?.views.find((v) => v.id === b.view) ?? ft?.views[0];
      const selection =
        this.windowId === s.windows.active ? selectionOf(s, b.text) : undefined;
      return layoutText(
        view,
        [
          highlightMarks(ft?.highlighter),
          ...(spec?.decorations ?? []),
          searchMarks(s.vim.search),
          selectionMarks(selection),
        ],
        b.analysis,
      );
    } catch {
      const out: RenderLine[] = [];
      const last = Math.min(b.text.lineCount, this.topLine + rows);
      for (let l = this.topLine; l < last; l++)
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
