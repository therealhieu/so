import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import { cmdlineCompletions } from "../../core/state/keys";
import type { AppState } from "../../core/state/types";
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
  private items: string[] = [];
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
    this.items =
      typing && s.vim.cmdline.startsWith(":") && s.vim.cmdline.length > 1
        ? cmdlineCompletions(s, this.deps.reg).slice(0, MAX_ITEMS)
        : [];
    const rows = s.terminal.rows;
    const listH = this.items.length === 0 ? 0 : this.items.length + 2;
    const top = Math.max(0, listH === 0 ? rows - 1 : rows - 2 - listH);
    this.top = top;
    this.height = rows - top;
    this.width = s.terminal.cols;
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
    if (this.items.length > 0) this.list(buf, theme);
  }

  /** Completions in a float ending above the statusline, `name · title`. */
  private list(buf: OptimizedBuffer, theme: ReturnType<typeof themeOf>): void {
    const lines = this.items.map((id) => {
      const title = this.deps.reg.commands.get(id)?.title;
      return title === undefined ? `:${id}` : `:${id} · ${title}`;
    });
    const s = this.s;
    if (s === undefined) return;
    const w = Math.min(
      s.terminal.cols - 2,
      Math.max(20, ...lines.map((l) => cells(l) + 4)),
    );
    const h = lines.length + 2;
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
