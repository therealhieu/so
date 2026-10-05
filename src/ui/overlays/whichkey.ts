import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import type { AppState, MouseTarget } from "../../core/state/types";
import { seqLabel, whichKeyRows } from "../../core/state/whichkey";
import type { LayoutClass, ViewDeps } from "../shell";
import { drawCells, themeOf } from "../theme";
import { drawFrame } from "./host";

/** Cells per column: key (3), " → ", and the label. */
const COLUMN = 24;

/**
 * The which-key popup: a full-width float above the statusline listing the
 * pending prefix's continuations in columns, direct actions before `+groups`.
 * It paints the core's rows; keys go to the core.
 */
export class WhichKeyView extends Renderable {
  private s: AppState | undefined;
  /** The painted float and its layout; `undefined` while nothing is shown. */
  private shown:
    | {
        rows: ReturnType<typeof whichKeyRows>;
        box: { x: number; y: number; w: number; h: number };
        ncol: number;
        nrow: number;
      }
    | undefined;

  constructor(
    ctx: RenderContext,
    private readonly deps: ViewDeps,
  ) {
    super(ctx, { position: "absolute", left: 0, top: 0 });
  }

  update(s: AppState, _lc: LayoutClass): void {
    this.s = s;
    this.width = s.terminal.cols;
    this.height = s.terminal.rows;
    this.visible = s.overlay.kind === "whichKey";
    this.shown = this.visible
      ? layout(s, whichKeyRows(s, this.deps.reg))
      : undefined;
  }

  /** Any cell of the float, which takes no click. */
  itemAt(x: number, y: number): MouseTarget | undefined {
    const b = this.shown?.box;
    return b !== undefined &&
      x >= b.x &&
      x < b.x + b.w &&
      y >= b.y &&
      y < b.y + b.h
      ? { kind: "overlay" }
      : undefined;
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    const shown = this.shown;
    if (s === undefined || s.overlay.kind !== "whichKey" || shown === undefined)
      return;
    const { rows, box, ncol, nrow } = shown;
    const theme = themeOf(s);
    drawFrame(buf, theme, box, {
      border: "floatBorder",
      fill: "float",
      title: seqLabel(s.overlay.whichKey.prefix, s.config.leader),
      footer: "⌫ back · esc close",
    });
    const colW = Math.floor((box.w - 2) / ncol);
    rows.forEach((r, i) => {
      const c = Math.floor(i / nrow);
      const line = i % nrow;
      if (c >= ncol) return;
      const x = box.x + 2 + c * colW;
      const y = box.y + 1 + line;
      const key = r.key === " " ? "␣" : r.key;
      drawCells(buf, theme.style("floatKey"), x, y, key.padStart(3), 3);
      drawCells(buf, theme.style("floatDim"), x + 3, y, " → ", 3);
      drawCells(
        buf,
        theme.style(r.group ? "floatGroup" : "float"),
        x + 6,
        y,
        r.label,
        Math.max(0, colW - 7),
      );
    });
  }
}

/** The float for `rows`: full width, just above the statusline, in columns. */
function layout(s: AppState, rows: ReturnType<typeof whichKeyRows>) {
  if (rows.length === 0) return undefined;
  const { cols, rows: height } = s.terminal;
  const ncol = Math.max(1, Math.floor((cols - 4) / COLUMN));
  const maxRows = Math.max(1, height - 4 - 2);
  const nrow = Math.min(maxRows, Math.ceil(rows.length / ncol));
  const h = nrow + 2;
  const box = { x: 0, y: Math.max(0, height - 2 - h), w: cols, h };
  return { rows, box, ncol, nrow };
}
