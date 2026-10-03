import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import type { AppState } from "../../core/state/types";
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
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    if (s === undefined || s.overlay.kind !== "whichKey") return;
    const rows = whichKeyRows(s, this.deps.reg);
    if (rows.length === 0) return;
    const theme = themeOf(s);
    const { cols, rows: height } = s.terminal;
    const ncol = Math.max(1, Math.floor((cols - 4) / COLUMN));
    const maxRows = Math.max(1, height - 4 - 2);
    const nrow = Math.min(maxRows, Math.ceil(rows.length / ncol));
    const h = nrow + 2;
    const box = { x: 0, y: Math.max(0, height - 2 - h), w: cols, h };
    drawFrame(buf, theme, box, {
      border: "floatBorder",
      fill: "float",
      title: seqLabel(s.overlay.whichKey.prefix, s.config.leader),
      footer: "⌫ back · esc close",
    });
    const colW = Math.floor((cols - 2) / ncol);
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
