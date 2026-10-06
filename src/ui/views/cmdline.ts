import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import { cmdlineCompletions } from "../../core/state/keys";
import { statusRow } from "../../core/state/layout";
import type { MessageLevel } from "../../core/state/result";
import type { AppState, MouseTarget } from "../../core/state/types";
import { drawFrame } from "../overlays/host";
import type { Cursor, LayoutClass, ViewDeps } from "../shell";
import { drawCells, themeOf } from "../theme";

const MAX_ITEMS = 8;
/** The popup's frame: one text row between two borders. */
const POPUP_H = 3;
const cells = (text: string) => [...text].length;

type Box = { x: number; y: number; w: number; h: number };

/** The message's token for each message level. */
const MESSAGE_TOKEN: Readonly<Record<MessageLevel, string>> = {
  info: "message",
  warn: "messageWarn",
  error: "messageError",
};

/**
 * While typing a `:`, `/`, or `?` line: a popup just above the statusline
 * (scrolled so the cursor stays visible) with up to 8 completions in a float
 * above it. Otherwise the latest message, right-aligned on the row above the
 * statusline and cut to the terminal width.
 */
export class CommandLine extends Renderable {
  private s: AppState | undefined;
  private popup: Box = { x: 0, y: 0, w: 0, h: 0 };
  /** The message's cells; `w` is 0 without one. */
  private message: Box & { text: string; token: string } = {
    x: 0,
    y: 0,
    w: 0,
    h: 1,
    text: "",
    token: "message",
  };
  /** The completion float's lines and box; `h` is 0 without completions. */
  private list = { lines: [] as string[], top: 0, w: 0, h: 0 };
  private shown = "";
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
    const m = s.notifications.message;
    this.visible = typing || m !== undefined;
    this.cursorAt = undefined;
    this.popup = { x: 0, y: 0, w: 0, h: 0 };
    this.list = { lines: [], top: 0, w: 0, h: 0 };
    this.message.w = 0;
    if (!typing) {
      if (m !== undefined) this.placeMessage(s, m.text, m.level);
      return;
    }
    const items =
      s.vim.cmdline.startsWith(":") && s.vim.cmdline.length > 1
        ? cmdlineCompletions(s, this.deps.reg).slice(0, MAX_ITEMS)
        : [];
    const cols = s.terminal.cols;
    const popupTop = Math.max(0, statusRow(s.terminal) - POPUP_H);
    this.popup = { x: 0, y: popupTop, w: cols, h: POPUP_H };
    const listH = items.length === 0 ? 0 : items.length + 2;
    const top = Math.max(0, popupTop - listH);
    this.top = top;
    this.height = popupTop + POPUP_H - top;
    this.width = cols;
    const lines = items.map((id) => {
      const title = this.deps.reg.commands.get(id)?.title;
      return title === undefined ? `:${id}` : `:${id} · ${title}`;
    });
    this.list = {
      lines,
      top,
      w: Math.min(cols - 2, Math.max(20, ...lines.map((l) => cells(l) + 4))),
      h: listH,
    };
    // Text runs from column 2 to the right border, with a cell left for the cursor.
    const room = Math.max(1, cols - 3);
    const text = [...s.vim.cmdline];
    this.shown = text.slice(Math.max(0, text.length - room + 1)).join("");
    this.cursorAt = {
      x: Math.min(2 + cells(this.shown), cols - 1),
      y: popupTop + 1,
      style: "line",
    };
  }

  /** The message's box, right-aligned on the row above the statusline. */
  private placeMessage(s: AppState, text: string, level: MessageLevel): void {
    const cols = s.terminal.cols;
    const shown = ` ${[...text].slice(0, Math.max(0, cols - 2)).join("")} `;
    const w = Math.min(cols, cells(shown));
    const y = Math.max(0, statusRow(s.terminal) - 1);
    this.top = y;
    this.height = 1;
    this.width = cols;
    this.message = {
      x: cols - w,
      y,
      w,
      h: 1,
      text: shown,
      token: MESSAGE_TOKEN[level],
    };
  }

  cursor(): Cursor | undefined {
    return this.cursorAt;
  }

  /** The popup, the completion float, and the message take no click. */
  targetAt(x: number, y: number): MouseTarget | undefined {
    if (!this.visible) return undefined;
    const inside = (b: Box) =>
      y >= b.y && y < b.y + b.h && x >= b.x && x < b.x + b.w;
    const l = this.list;
    return inside(this.popup) ||
      inside(this.message) ||
      inside({ x: 0, y: l.top, w: l.w, h: l.h })
      ? { kind: "inert" }
      : undefined;
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    if (s === undefined || !this.visible) return;
    const theme = themeOf(s);
    const msg = this.message;
    if (msg.w > 0) {
      drawCells(buf, theme.style(msg.token), msg.x, msg.y, msg.text, msg.w);
      return;
    }
    const p = this.popup;
    drawFrame(buf, theme, p, {
      border: "floatBorder",
      fill: "float",
      title: s.vim.cmdline.startsWith(":") ? "Cmdline" : "Search",
    });
    drawCells(buf, theme.style("float"), 2, p.y + 1, this.shown, p.w - 3);
    if (this.list.h > 0) this.paintList(buf, theme);
  }

  /** Completions in a float ending above the popup, `name · title`. */
  private paintList(
    buf: OptimizedBuffer,
    theme: ReturnType<typeof themeOf>,
  ): void {
    const { lines, top, w, h } = this.list;
    drawFrame(
      buf,
      theme,
      { x: 0, y: top, w, h },
      { border: "floatBorder", fill: "float" },
    );
    lines.forEach((l, i) => {
      drawCells(buf, theme.style("float"), 2, top + 1 + i, l, w - 3);
    });
  }
}
