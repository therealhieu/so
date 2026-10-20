import { gridRow, sizedCell, zoomScale } from "../../core/kernel/view/sized";
import type { Span } from "../../core/kernel/view/types";
import { lookOf, paintZoomRow } from "../zoom-row";
import type { WidgetPainter } from "./registry";

/**
 * Rows of spans at a text zoom, drawn as a grid (a zoomed table): each row
 * a sized cell tall, its box-drawing characters at normal size in the
 * columns the zoom keeps for them and its text sized between them.
 */
export const paintZoomText: WidgetPainter = (t, w) => {
  const { rows, size } = w.data as { rows: Span[][]; size: number };
  const cellPx = t.deps.images.cellPixels()?.width;
  const zoom = cellPx === undefined ? { size } : { size, cellPx };
  const scale = zoomScale(zoom);
  const step = sizedCell(scale);
  const fill = t.theme.style("text");
  const look = (c: { style: string; under?: string }) =>
    lookOf(t.theme, c, false);
  rows.forEach((spans, i) => {
    const y = i * step;
    if (y >= t.rows) return;
    paintZoomRow({
      buf: t.buf,
      sizedText: t.deps.sizedText,
      x: t.x,
      y: t.y + y,
      width: t.width,
      rows: t.rows - y,
      scale,
      chunks: gridRow(spans, zoom),
      look,
      fill,
    });
  });
};
