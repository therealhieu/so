import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import type { AppState, MouseTarget } from "../../core/state/types";
import type { LayoutClass } from "../shell";
import { drawCells, themeOf } from "../theme";
import { drawFrame, wrap } from "./host";

const VISIBLE = 3;
const MAX_LINES = 4;
/** The first body row. */
const TOP = 1;

type Box = { x: number; y: number; w: number; h: number };

/**
 * Toasts at the top right of the body, newest on top: `✓` info, `✗` error,
 * at most 3 shown plus `+N more`. Expiry is the core's toast timers. The
 * wheel over a toast does nothing; a click passes through to what is beneath.
 */
export class ToastStack extends Renderable {
  readonly wheelOnly = true;
  private s: AppState | undefined;
  /** The painted toasts and the `+N more` row, from the last `update`. */
  private shown: {
    toasts: { box: Box; lines: string[]; token: string }[];
    more: { box: Box; count: number } | undefined;
  } = { toasts: [], more: undefined };

  constructor(ctx: RenderContext) {
    super(ctx, { position: "absolute", left: 0, top: TOP, zIndex: 40 });
  }

  update(s: AppState, _lc: LayoutClass): void {
    this.s = s;
    const cols = s.terminal.cols;
    const width = Math.min(40, Math.floor(cols / 2));
    const left = Math.max(0, cols - width - 1);
    const height = Math.max(0, s.terminal.rows - 3);
    this.width = width;
    this.left = left;
    this.height = height;
    this.visible = s.notifications.toasts.length > 0;
    this.shown = { toasts: [], more: undefined };
    if (!this.visible) return;
    const toasts = [...s.notifications.toasts].reverse();
    const bottom = TOP + height;
    let y = TOP;
    for (const t of toasts.slice(0, VISIBLE)) {
      const icon = t.level === "error" ? "✗" : "✓";
      const lines = wrap(`${icon} ${t.text}`, width - 4).slice(0, MAX_LINES);
      const h = lines.length + 2;
      if (y + h > bottom) break;
      const token = t.level === "error" ? "toastError" : "toastInfo";
      this.shown.toasts.push({
        box: { x: left, y, w: width, h },
        lines,
        token,
      });
      y += h;
    }
    const more = toasts.length - VISIBLE;
    if (more > 0 && y < bottom)
      this.shown.more = { box: { x: left, y, w: width, h: 1 }, count: more };
  }

  /** Any painted toast cell, where the wheel does nothing. */
  targetAt(x: number, y: number): MouseTarget | undefined {
    if (!this.visible) return undefined;
    const boxes = this.shown.toasts.map((t) => t.box);
    if (this.shown.more !== undefined) boxes.push(this.shown.more.box);
    const hit = boxes.some(
      (b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h,
    );
    return hit ? { kind: "inert" } : undefined;
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    if (s === undefined) return;
    const theme = themeOf(s);
    for (const { box, lines, token } of this.shown.toasts) {
      drawFrame(buf, theme, box, { border: token, fill: "float" });
      lines.forEach((l, i) => {
        drawCells(
          buf,
          theme.style(i === 0 ? token : "float"),
          box.x + 2,
          box.y + 1 + i,
          l,
          box.w - 4,
        );
      });
    }
    const more = this.shown.more;
    if (more !== undefined)
      drawCells(
        buf,
        theme.style("floatDim"),
        more.box.x,
        more.box.y,
        ` +${more.count} more`,
        more.box.w,
      );
  }
}
