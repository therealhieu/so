import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import type { AppState } from "../../core/state/types";
import type { LayoutClass } from "../shell";
import { drawCells, themeOf } from "../theme";
import { drawFrame, wrap } from "./host";

const VISIBLE = 3;
const MAX_LINES = 4;

/**
 * Toasts at the top right of the body, newest on top: `✓` info, `✗` error,
 * at most 3 shown plus `+N more`. Expiry is the core's toast timers.
 */
export class ToastStack extends Renderable {
  private s: AppState | undefined;

  constructor(ctx: RenderContext) {
    super(ctx, { position: "absolute", left: 0, top: 1, zIndex: 40 });
  }

  update(s: AppState, _lc: LayoutClass): void {
    this.s = s;
    const cols = s.terminal.cols;
    const width = Math.min(40, Math.floor(cols / 2));
    this.width = width;
    this.left = Math.max(0, cols - width - 1);
    this.height = Math.max(0, s.terminal.rows - 3);
    this.visible = s.notifications.toasts.length > 0;
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    if (s === undefined) return;
    const theme = themeOf(s);
    const toasts = [...s.notifications.toasts].reverse();
    const bottom = this.y + this.height;
    let y = this.y;
    for (const t of toasts.slice(0, VISIBLE)) {
      const icon = t.level === "error" ? "✗" : "✓";
      const lines = wrap(`${icon} ${t.text}`, this.width - 4).slice(
        0,
        MAX_LINES,
      );
      const h = lines.length + 2;
      if (y + h > bottom) break;
      const token = t.level === "error" ? "toastError" : "toastInfo";
      drawFrame(
        buf,
        theme,
        { x: this.x, y, w: this.width, h },
        { border: token, fill: "float" },
      );
      lines.forEach((l, i) => {
        drawCells(
          buf,
          theme.style(i === 0 ? token : "float"),
          this.x + 2,
          y + 1 + i,
          l,
          this.width - 4,
        );
      });
      y += h;
    }
    const more = toasts.length - VISIBLE;
    if (more > 0 && y < bottom)
      drawCells(
        buf,
        theme.style("floatDim"),
        this.x,
        y,
        ` +${more} more`,
        this.width,
      );
  }
}
