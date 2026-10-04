import type { Decoration } from "../../../kernel/view/decorations";
import type { Span } from "../../../kernel/view/types";

/** Rows of spans drawn by the `text` widget painter. */
export const textWidget = (rows: Span[][]) => ({
  type: "text",
  data: rows,
  rows: rows.length,
});

/** One dim row above `line` explaining why a block shows its source. */
export const labelAbove = (line: number, label: string): Decoration => ({
  kind: "widget",
  at: { line, col: 0 },
  block: true,
  widget: textWidget([[{ text: label, style: "mdMarker" }]]),
});
