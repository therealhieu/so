import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import { cmdlineCompletions } from "../../core/state/keys";
import type { AppState, MouseTarget } from "../../core/state/types";
import { drawFrame } from "../overlays/host";
import type { Cursor, LayoutClass, ViewDeps } from "../shell";
import { drawCells, themeOf } from "../theme";

const MAX_ITEMS = 8;
const cells = (text: string) => [...text].length;

/**
 * The last row: the `:`, `/`, or `?` line while typing (scrolled so the
 * cursor stays visible) with up to 8 completions in a float above the
 * statusline, or else the latest message. Pending keys show on the right.
 */
export class CommandLine extends Renderable {
  private s: AppState | undefined;
  /** The completion float's lines and box; `h` is 0 without completions. */
  private list = { lines: [] as string[], top: 0, w: 0, h: 0 };
  private cursorAt: Cursor | undefined;

  constructor(
    ctx: RenderContext,
    private readonly deps: Pick<ViewDeps, "reg">,
  ) {
    super(ctx, { position: "absolute", left: 0, top: 0, zIndex: 30 });
  }

  update(s: AppState, _lc: LayoutClass): void {
    this.s = s;
    const typing = s.vim.mode === "cmdline";
    const items =
      typing && s.vim.cmdline.startsWith(":") && s.vim.cmdline.length > 1
        ? cmdlineCompletions(s, this.deps.reg).slice(0, MAX_ITEMS)
        : [];
    const rows = s.terminal.rows;
    const listH = items.length === 0 ? 0 : items.length + 2;
    const top = Math.max(0, listH === 0 ? rows - 1 : rows - 2 - listH);
    this.top = top;
    this.height = rows - top;
    this.width = s.terminal.cols;
    const lines = items.map((id) => {
      const title = this.deps.reg.commands.get(id)?.title;
      return title === undefined ? `:${id}` : `:${id} · ${title}`;
    });
    this.list = {
      lines,
      top,
      w: Math.min(
        s.terminal.cols - 2,
        Math.max(20, ...lines.map((l) => cells(l) + 4)),
      ),
      h: listH,
    };
    this.cursorAt = typing
      ? {
          x: Math.min(cells(s.vim.cmdline), s.terminal.cols - 1),
          y: rows - 1,
          style: "line",
        }
      : undefined;
  }

  cursor(): Cursor | undefined {
    return this.cursorAt;
  }

  /** The last row and the completion float take no click. */
  targetAt(x: number, y: number): MouseTarget | undefined {
    const t = this.s?.terminal;
    if (t === undefined || x < 0 || x >= t.cols) return undefined;
    const l = this.list;
    const inList = y >= l.top && y < l.top + l.h && x < l.w;
    return y === t.rows - 1 || inList ? { kind: "inert" } : undefined;
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    if (s === undefined) return;
    const theme = themeOf(s);
    const cols = s.terminal.cols;
    const y = s.terminal.rows - 1;
    if (s.vim.mode === "cmdline") {
      const text = [...s.vim.cmdline];
      const shown = text.slice(Math.max(0, text.length - cols + 1)).join("");
      drawCells(buf, theme.style("message"), 0, y, shown, cols);
    } else {
      const m = s.notifications.message;
      drawCells(
        buf,
        theme.style(m?.level === "error" ? "messageError" : "message"),
        0,
        y,
        m?.text ?? "",
        cols,
      );
      const pending = s.vim.pending.join("");
      if (pending !== "")
        drawCells(
          buf,
          theme.style("dim"),
          cols - cells(pending) - 1,
          y,
          pending,
        );
    }
    if (this.list.h > 0) this.paintList(buf, theme);
  }

  /** Completions in a float ending above the statusline, `name · title`. */
  private paintList(
    buf: OptimizedBuffer,
    theme: ReturnType<typeof themeOf>,
  ): void {
    const { lines, w, h } = this.list;
    drawFrame(
      buf,
      theme,
      { x: 0, y: this.y, w, h },
      { border: "floatBorder", fill: "float" },
    );
    lines.forEach((l, i) => {
      drawCells(buf, theme.style("float"), 2, this.y + 1 + i, l, w - 3);
    });
  }
}
