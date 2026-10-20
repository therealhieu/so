import type { TextBuffer } from "../../../kernel/text/text-buffer";
import type { Decoration } from "../../../kernel/view/decorations";
import { zoomStep } from "../../../kernel/view/sized";
import type { Span } from "../../../kernel/view/types";

/** Rows of spans drawn by the `text` widget painter. */
export const textWidget = (rows: Span[][]) => ({
  type: "text",
  data: rows,
  rows: rows.length,
});

/**
 * Rows of spans the `zoomText` widget painter draws as a grid at text zoom
 * `size`, each a sized cell tall.
 */
export const zoomTextWidget = (rows: Span[][], size: number) => ({
  type: "zoomText",
  data: { rows, size },
  rows: zoomStep(size) * rows.length,
});

/** One dim row above `line` explaining why a block shows its source. */
export const labelAbove = (line: number, label: string): Decoration => ({
  kind: "widget",
  at: { line, col: 0 },
  block: true,
  widget: textWidget([[{ text: label, style: "mdMarker" }]]),
});

/** `line` shown as `spans`, or hidden when there are none. */
export const replaceLine = (
  text: TextBuffer,
  line: number,
  spans?: Span[],
): Decoration => ({
  kind: "replace",
  range: {
    start: { line, col: 0 },
    end: { line, col: text.line(line).length },
  },
  block: true,
  ...(spans === undefined ? {} : { spans }),
});

/** Columns `from…to` of `line` shown as `spans` (hidden when empty). */
export const replaceCols = (
  line: number,
  from: number,
  to: number,
  spans: Span[] = [],
): Decoration => ({
  kind: "replace",
  range: { start: { line, col: from }, end: { line, col: to } },
  block: false,
  ...(spans.length === 0 ? {} : { spans }),
});

/** Columns `from…to` of `line` styled `style`, over the source highlighting. */
export const markCols = (
  line: number,
  from: number,
  to: number,
  style: string,
): Decoration => ({
  kind: "mark",
  range: { start: { line, col: from }, end: { line, col: to } },
  style,
});

/** `spans` drawn at the start of each wrap row of `line` after the first. */
export const wrapPrefix = (line: number, spans: Span[]): Decoration => ({
  kind: "line",
  line,
  wrapPrefix: spans,
});

export const lineStyle = (line: number, style: string): Decoration => ({
  kind: "line",
  line,
  style,
});

/** Display width in terminal cells, counting each code point as one. */
export const cells = (s: string) => [...s].length;
