import { drawCells } from "../theme";
import type { WidgetPainter } from "./registry";

/** A horizontal rule across the target's width. */
export const paintRule: WidgetPainter = (t) => {
  for (let i = 0; i < t.rows; i++)
    drawCells(
      t.buf,
      t.theme.style(i === 0 ? "mdRule" : "text"),
      t.x,
      t.y + i,
      i === 0 ? "─".repeat(t.width) : "",
      t.width,
    );
};
