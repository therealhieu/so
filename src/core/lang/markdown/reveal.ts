import type { Pos, Range } from "../../kernel/text/pos";
import type { TextBuffer } from "../../kernel/text/text-buffer";
import type { Doc } from "./doc";
import { blocksIn } from "./live-preview";
import { renderKey } from "./render-key";

/** Lines that show their own inline source, and blocks that show source on every row. */
export type RevealSet = {
  lines: ReadonlySet<number>;
  blocks: ReadonlySet<number>;
};

/** Block kinds and render keys revealed whole while the cursor or selection is inside. */
export const MULTILINE_KEYS = new Set([
  "table",
  "callout",
  "fence",
  "math",
  "mermaid",
  "frontmatter",
  "html",
]);

const NOTHING: RevealSet = { lines: new Set(), blocks: new Set() };

/**
 * The cursor line, or every selected line, shows its inline source; a
 * multi-line block touching those lines shows its whole source. Reading view
 * reveals nothing.
 */
export function reveal(
  doc: Doc,
  view: "live" | "reading",
  cursor: Pos,
  selection: Range | undefined,
  text: TextBuffer,
): RevealSet {
  if (view === "reading") return NOTHING;
  const ends =
    selection === undefined ? [cursor] : [selection.start, selection.end];
  const from = Math.min(...ends.map((p) => p.line));
  const to = Math.max(...ends.map((p) => p.line));
  const lines = new Set<number>();
  for (let l = from; l <= to; l++) lines.add(l);
  const blocks = new Set<number>();
  for (const block of blocksIn(doc, { from, to: to + 1 }))
    if (
      MULTILINE_KEYS.has(block.kind) ||
      MULTILINE_KEYS.has(renderKey(block, doc, text))
    )
      blocks.add(block.id);
  return { lines, blocks };
}
