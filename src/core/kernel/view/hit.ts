import { cellWidth, clusters } from "../text/cells";
import { colAtCell, justifyRow } from "./justify";
import { zoomRowsOf, zoomStep } from "./sized";
import type { RenderLine, Span, ZoomRow } from "./types";
import { prefixCells, wrapLine, wrapText } from "./wrap";

/**
 * One screen row of text: the rendered line, the display column it starts
 * at, the cells its wrap prefix takes before the text, on a wrap row
 * followed by another, the column the next row starts at, and, when the row
 * is stretched, its `justifyRow` cells.
 */
export type ScreenRow = {
  line: RenderLine;
  startCol: number;
  indent: number;
  endCol?: number;
  shift?: number[];
  /** The zoomed row shown, on a line drawn larger. */
  zoom?: ZoomRow;
};

/**
 * Screen rows `line` takes: a widget's own, `zoom` per zoomed row,
 * else one per wrap row.
 */
export function lineRows(
  line: RenderLine,
  o: { width: number; tabWidth: number; wrap: boolean; zoom?: number },
): number {
  if (isWidgetRow(line)) return Math.max(1, line.widget?.rows ?? 1);
  if (line.zoom === true && o.zoom !== undefined)
    return (
      zoomStep(o.zoom) * zoomRowsOf(line, o.zoom, o.width, o.tabWidth).length
    );
  return o.wrap
    ? wrapLine(wrapText(line.spans), o.width, o.tabWidth, prefixCells(line))
        .length
    : 1;
}

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
  o: {
    width: number;
    tabWidth: number;
    wrap: boolean;
    skipRows: number;
    /** The text size zoomed lines are drawn at. */
    zoom?: number;
  },
): ScreenRow | undefined {
  let last: ScreenRow | undefined;
  let row = 0;
  for (const line of lines) {
    if (isWidgetRow(line)) {
      last = { line, startCol: 0, indent: 0 };
      const height = Math.max(1, line.widget?.rows ?? 1);
      if (y < row + height) return last;
      row += height;
      continue;
    }
    if (line.zoom === true && o.zoom !== undefined) {
      const step = zoomStep(o.zoom);
      const zoomed = zoomRowsOf(line, o.zoom, o.width, o.tabWidth);
      const skip = line.sourceLine === lines[0]?.sourceLine ? o.skipRows : 0;
      for (let k = Math.floor(skip / step); k < zoomed.length; k++) {
        const z = zoomed[k];
        if (z === undefined) break;
        last =
          z.endCol === undefined
            ? { line, startCol: z.startCol, indent: 0, zoom: z }
            : {
                line,
                startCol: z.startCol,
                indent: 0,
                endCol: z.endCol,
                zoom: z,
              };
        if (y < row + step) return last;
        row += step;
      }
      continue;
    }
    const prefix = prefixCells(line);
    const starts = o.wrap
      ? wrapLine(wrapText(line.spans), o.width, o.tabWidth, prefix)
      : [0];
    const skip = line.sourceLine === lines[0]?.sourceLine ? o.skipRows : 0;
    for (let k = skip; k < starts.length; k++, row++) {
      const startCol = starts[k] ?? 0;
      const endCol = starts[k + 1];
      const indent = k === 0 ? 0 : prefix;
      const shift =
        o.wrap && line.justify
          ? justifyRow(
              line.spans,
              startCol,
              endCol,
              Math.max(1, o.width - indent),
              o.tabWidth,
            )
          : undefined;
      last =
        endCol === undefined
          ? { line, startCol, indent }
          : shift === undefined
            ? { line, startCol, indent, endCol }
            : { line, startCol, indent, endCol, shift };
      if (y === row) return last;
    }
  }
  return last;
}

/**
 * Display column, from the line start, shown at cell `x` of `row`, with `x`
 * counted from the row's first cell. A cell on the wrap prefix maps to the
 * row's first character; a word-wrapped row can end before the window edge,
 * so a cell past its last character maps to that character; on a stretched
 * row, an extra cell maps to the space before it.
 */
export function displayColAt(row: ScreenRow, x: number): number {
  const tx = Math.max(0, x - row.indent);
  const dc =
    row.startCol + (row.shift === undefined ? tx : colAtCell(row.shift, tx));
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
    for (const ch of clusters(span.text)) {
      v += cellWidth(ch, v, tabWidth);
      if (dc < v) return span;
    }
  return undefined;
}

/**
 * Source column shown at display column `dc`, counted from the line start.
 * Verbatim text maps cell by cell, each cell of a wide character or tab to
 * the character's first column, replacement text maps to the start of the
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
    for (const ch of clusters(span.text)) {
      const w = cellWidth(ch, v, tabWidth);
      if (dc < v + w) return span.inserted ? col : col + i;
      v += w;
      i += ch.length;
    }
    end = span.inserted ? col : col + span.text.length;
  }
  return lineLength;
}

/**
 * Display column, from the line start, of source column `col` on a row with
 * virtual text: inline text at `col` comes before it, and end-of-line text
 * never counts. Like the cursor, a tab takes its last cell outside Insert
 * mode; `col` at the line's end maps just past the last source character.
 */
export function displayColOf(
  spans: readonly Span[],
  col: number,
  tabWidth: number,
  insert: boolean,
): number {
  let v = 0;
  for (const span of spans) {
    if (span.virtual === "eol") continue;
    const start = span.col ?? 0;
    let i = 0;
    for (const ch of clusters(span.text)) {
      const w = cellWidth(ch, v, tabWidth);
      // A column inside a character (a grapheme cluster) shows at its start.
      if (
        span.virtual === undefined &&
        col >= start + i &&
        col < start + i + ch.length
      )
        return ch === "\t" && !insert ? v + w - 1 : v;
      v += w;
      i += ch.length;
    }
  }
  return v;
}
