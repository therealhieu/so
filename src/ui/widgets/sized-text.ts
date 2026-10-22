import type { OptimizedBuffer } from "@opentui/core";
import { sizedCell } from "../../core/kernel/view/sized";
import type { SizedBlock, SizedChunk } from "../../core/kernel/view/types";
import { displayWidth } from "../../core/kernel/view/wrap";
import { blockBytes, type CellRect } from "../sized-text";
import { drawCells, type Style, type Theme } from "../theme";
import type { WidgetPainter } from "./registry";

/** The heading's own style: its first chunk's line style, else that chunk's. */
const headingOf = (block: SizedBlock) => {
  const first = block.rows[0]?.[0];
  return first?.under ?? first?.style ?? "text";
};

/**
 * A chunk's style on the plain background: a sized heading has no band, so
 * only text with a background of its own (code, a highlight) keeps it.
 */
function chunkStyle(theme: Theme, c: SizedChunk, heading: string): Style {
  const own = theme.style(c.style);
  return own.bg.equals(theme.style(c.under ?? heading).bg)
    ? { ...own, bg: theme.style("text").bg }
    : own;
}

/**
 * A sized heading: each row of chunks takes `sizedCell` screen rows, on the plain
 * background, with the text at normal size on the first of them. Given all
 * its rows, each chunk's text sits under its own sized cells and the
 * terminal draws the text at its size over them; a `plain` chunk's cell is
 * never drawn over, so it must hold its own blank. Cut at the window
 * bottom, the normal-size text stays, run together.
 */
export const paintSizedText: WidgetPainter = (t, w) => {
  const block = w.data as SizedBlock;
  const heading = headingOf(block);
  const plain = t.theme.style("text");
  const sizedOf = (row: readonly SizedChunk[]) =>
    row.reduce((n, c) => n + c.cells, 0);
  const whole =
    t.rows >= w.rows && block.rows.every((row) => sizedOf(row) <= t.width);
  const step = sizedCell(block.scale);
  const cellsAt = (i: number) =>
    Math.min(t.width, sizedOf(block.rows[Math.floor(i / step)] ?? []));
  /** The rows, each blank to the window's edge, or to its sized cells' edge. */
  const paint = (buf: OptimizedBuffer, toEdge: boolean) => {
    for (let i = 0; i < t.rows; i++) {
      let x = 0;
      if (i % step === 0)
        for (const c of block.rows[i / step] ?? []) {
          const text = c.text.replace(/\t/g, " ");
          const n = Math.min(
            t.width - x,
            whole ? c.cells : displayWidth(text, 1),
          );
          if (n <= 0) break;
          const style = chunkStyle(t.theme, c, heading);
          drawCells(buf, style, t.x + x, t.y + i, text, n);
          x += n;
        }
      const end = toEdge ? t.width : cellsAt(i);
      if (x < end) drawCells(buf, plain, t.x + x, t.y + i, "", end - x);
    }
  };
  paint(t.buf, true);
  if (!whole) return;
  const rects: CellRect[] = [];
  for (let i = 0; i < t.rows; i += step)
    rects.push({ x: t.x, y: t.y + i, w: cellsAt(i), h: step });
  t.deps.sizedText.draw(
    rects,
    blockBytes(block, t.x, t.y, (c) => chunkStyle(t.theme, c, heading)),
    (buf) => paint(buf, false),
  );
};
