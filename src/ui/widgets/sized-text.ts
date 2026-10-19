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
 * A sized heading: each row of chunks takes two screen rows, on the plain
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
  const rects: CellRect[] = [];
  const sizedOf = (row: readonly SizedChunk[]) =>
    row.reduce((n, c) => n + c.cells, 0);
  const whole =
    t.rows >= w.rows && block.rows.every((row) => sizedOf(row) <= t.width);
  for (let i = 0; i < t.rows; i++) {
    const row = block.rows[Math.floor(i / 2)] ?? [];
    const cells = Math.min(t.width, sizedOf(row));
    let x = 0;
    if (i % 2 === 0) {
      rects.push({ x: t.x, y: t.y + i, w: cells, h: 2 });
      for (const c of row) {
        const text = c.text.replace(/\t/g, " ");
        const n = Math.min(
          t.width - x,
          whole ? c.cells : displayWidth(text, 1),
        );
        if (n <= 0) break;
        const style = chunkStyle(t.theme, c, heading);
        drawCells(t.buf, style, t.x + x, t.y + i, text, n);
        x += n;
      }
    }
    if (x < t.width) drawCells(t.buf, plain, t.x + x, t.y + i, "", t.width - x);
  }
  if (!whole) return;
  t.deps.sizedText.draw(
    t.buf,
    rects,
    blockBytes(block, t.x, t.y, (c) => chunkStyle(t.theme, c, heading)),
  );
};
