import type { RenderLine, Span } from "./types";
import { cellWidth, wrapLine } from "./wrap";

/**
 * One screen row of text: the rendered line, the display column it starts
 * at, and, on a wrap row followed by another, the column the next row starts at.
 */
export type ScreenRow = { line: RenderLine; startCol: number; endCol?: number };

const isWidgetRow = (r: RenderLine) =>
  r.widget !== undefined && r.spans.length === 0;

/**
 * The rendered line and wrap-row bounds shown on text row `y` (0-based), or
 * the last row past the end. Rows are counted like the painter counts them:
 * a widget row takes its widget's rows, a wrapped line one row per wrap
 * start, and `skipRows` drops the first rows of the top line.
 */
export function rowAt(
  lines: readonly RenderLine[],
  y: number,
  o: { width: number; tabWidth: number; wrap: boolean; skipRows: number },
): ScreenRow | undefined {
  let last: ScreenRow | undefined;
  let row = 0;
  for (const line of lines) {
    if (isWidgetRow(line)) {
      last = { line, startCol: 0 };
      const height = Math.max(1, line.widget?.rows ?? 1);
      if (y < row + height) return last;
      row += height;
      continue;
    }
    const text = line.spans.map((sp) => sp.text).join("");
    const starts = o.wrap ? wrapLine(text, o.width, o.tabWidth) : [0];
    const skip = line.sourceLine === lines[0]?.sourceLine ? o.skipRows : 0;
    for (let k = skip; k < starts.length; k++, row++) {
      const startCol = starts[k] ?? 0;
      const endCol = starts[k + 1];
      last =
        endCol === undefined ? { line, startCol } : { line, startCol, endCol };
      if (y === row) return last;
    }
  }
  return last;
}

/**
 * Display column, from the line start, shown at cell `x` of `row`, with `x`
 * counted from the row's first text cell. A word-wrapped row can end before
 * the window edge, so a cell past its last character maps to that character.
 */
export function displayColAt(row: ScreenRow, x: number): number {
  const dc = row.startCol + x;
  return row.endCol === undefined ? dc : Math.min(dc, row.endCol - 1);
}

/** The span shown at display column `dc`, counted from the line start. */
export function spanAt(
  spans: readonly Span[],
  dc: number,
  tabWidth: number,
): Span | undefined {
  let v = 0;
  for (const span of spans)
    for (const ch of span.text) {
      v += cellWidth(ch, v, tabWidth);
      if (dc < v) return span;
    }
  return undefined;
}

/**
 * Source column shown at display column `dc`, counted from the line start.
 * Verbatim text maps cell by cell, replacement text maps to the start of the
 * range it hides, and cells after the last one map to `lineLength`, the
 * source line's length, even when the line ends in hidden text. A span
 * without `col` continues from the previous span.
 */
export function sourceColAt(
  spans: readonly Span[],
  dc: number,
  tabWidth: number,
  lineLength: number,
): number {
  let v = 0;
  let end = 0;
  for (const span of spans) {
    const col = span.col ?? end;
    let i = 0;
    for (const ch of span.text) {
      const w = cellWidth(ch, v, tabWidth);
      if (dc < v + w) return span.inserted ? col : col + i;
      v += w;
      i += ch.length;
    }
    end = span.inserted ? col : col + span.text.length;
  }
  return lineLength;
}
