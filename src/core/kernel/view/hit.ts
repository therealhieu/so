import type { RenderLine, Span } from "./types";
import { cellWidth, wrapLine } from "./wrap";

/** One screen row of text: the rendered line and the display column it starts at. */
export type ScreenRow = { line: RenderLine; startCol: number };

const isWidgetRow = (r: RenderLine) =>
  r.widget !== undefined && r.spans.length === 0;

/**
 * The rendered line and wrap-row start shown on text row `y` (0-based), or
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
      last = { line, startCol: starts[k] ?? 0 };
      if (y === row) return last;
    }
  }
  return last;
}

/**
 * Source column shown at display column `dc`, counted from the line start.
 * Verbatim text maps cell by cell, replacement text maps to the start of the
 * range it hides, and cells after the last character map to the source
 * column after it. A span without `col` continues from the previous span.
 */
export function sourceColAt(
  spans: readonly Span[],
  dc: number,
  tabWidth: number,
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
  return end;
}
