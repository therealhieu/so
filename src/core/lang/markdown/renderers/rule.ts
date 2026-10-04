import { contentStart } from "../block-text";
import type { BlockRenderer } from "../live-preview";

/** A thematic break as a one-row `rule` widget. */
export const ruleRenderer: BlockRenderer = (block, v) => {
  const line = contentStart(v.buf, block);
  return [
    {
      kind: "replace",
      range: {
        start: { line, col: 0 },
        end: { line, col: v.buf.line(line).length },
      },
      block: true,
      widget: { type: "rule", data: null, rows: 1 },
    },
  ];
};
