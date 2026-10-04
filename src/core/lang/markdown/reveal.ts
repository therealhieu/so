import type { Pos, Range } from "../../kernel/text/pos";
import type { TextBuffer } from "../../kernel/text/text-buffer";
import type { LineRange } from "../../kernel/view/types";
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
  "comment",
]);

const NOTHING: RevealSet = { lines: new Set(), blocks: new Set() };

/**
 * The cursor line, or every selected line, shows its inline source; a
 * multi-line block touching those lines shows its whole source. Reading view
 * reveals nothing. Only lines and blocks that can reach the `visible` rows
 * are considered (the visible lines plus the blocks intersecting them), so a
 * long selection costs no more than a short one.
 */
export function reveal(
  doc: Doc,
  view: "live" | "reading",
  cursor: Pos,
  selection: Range | undefined,
  text: TextBuffer,
  visible: LineRange,
): RevealSet {
  if (view === "reading") return NOTHING;
  const ends =
    selection === undefined ? [cursor] : [selection.start, selection.end];
  const from = Math.min(...ends.map((p) => p.line));
  const to = Math.max(...ends.map((p) => p.line));
  const near = blocksIn(doc, visible);
  const first = Math.min(visible.from, near[0]?.startLine ?? visible.from);
  const last = Math.max(visible.to - 1, near.at(-1)?.endLine ?? 0);
  const lines = new Set<number>();
  for (let l = Math.max(from, first); l <= Math.min(to, last); l++)
    lines.add(l);
  const blocks = new Set<number>();
  for (const block of near)
    if (
      block.endLine >= from &&
      block.startLine <= to &&
      (MULTILINE_KEYS.has(block.kind) ||
        MULTILINE_KEYS.has(renderKey(block, doc, text)))
    )
      blocks.add(block.id);
  return { lines, blocks };
}
