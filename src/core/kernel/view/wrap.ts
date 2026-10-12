import type { RenderLine, Span } from "./types";

/** Cells `ch` takes at display column `v`: a tab reaches the next multiple of `tabWidth`. */
export const cellWidth = (ch: string, v: number, tabWidth: number): number =>
  ch === "\t" ? tabWidth - (v % tabWidth) : 1;

/** Cells `text` takes from column 0. */
export function displayWidth(text: string, tabWidth: number): number {
  let v = 0;
  for (const ch of text) v += cellWidth(ch, v, tabWidth);
  return v;
}

/**
 * Display columns where each screen row of `text` starts, for a first row of
 * at most `width` cells and later rows of `width - indent` (at least one). A
 * row breaks after the last space or tab that fits, or at the width when
 * none fits. A character never straddles two rows, so a tab wider than the
 * row takes a row alone. Returns [0] when the text fits.
 */
export function wrapLine(
  text: string,
  width: number,
  tabWidth: number,
  indent = 0,
): number[] {
  const starts = [0];
  let rowStart = 0;
  let rowWidth = width;
  /** Display column just after the row's last space or tab. */
  let afterBlank = 0;
  let v = 0;
  for (const ch of text) {
    const w = cellWidth(ch, v, tabWidth);
    while (v + w - rowStart > rowWidth && v > rowStart) {
      rowWidth = Math.max(1, width - indent);
      rowStart = afterBlank > rowStart ? afterBlank : v;
      afterBlank = rowStart;
      starts.push(rowStart);
    }
    v += w;
    if (ch === " " || ch === "\t") afterBlank = v;
  }
  return starts;
}

/** Index of the row whose start is the greatest one ≤ `col`. */
export function rowOf(starts: readonly number[], col: number): number {
  let row = 0;
  while (row + 1 < starts.length && (starts[row + 1] ?? 0) <= col) row++;
  return row;
}

/** Cells a line's wrap prefix takes on each wrap row after the first. */
export const prefixCells = (line: RenderLine): number =>
  line.wrapPrefix === undefined ? 0 : [...wrapText(line.wrapPrefix)].length;

/** The text a row wraps on: every span but end-of-line virtual text. */
export const wrapText = (spans: readonly Span[]): string =>
  spans
    .filter((sp) => sp.virtual !== "eol")
    .map((sp) => sp.text)
    .join("");
