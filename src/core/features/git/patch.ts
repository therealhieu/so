import type { Hunk } from "./diff";
import type { IndexText } from "./index-text";

/** The buffer side of a file, in the buffer's line model. */
type Cur = { lines: readonly string[]; finalNewline: boolean; bom: boolean };

const BOM = "﻿";
const NO_NEWLINE = "\\ No newline at end of file\n";

/**
 * A zero-context patch that applies one hunk to the index entry
 * (`git apply --cached --unidiff-zero`). Both sides are written in the
 * index's line ending; `repoPath` is relative to the repository top.
 */
export function hunkPatch(
  repoPath: string,
  mode: string,
  h: Hunk,
  index: IndexText,
  cur: Cur,
): string {
  const removed = h.oldLines.map((l, i) =>
    patchLine("-", h.old.start + i, l, index, index),
  );
  const added = cur.lines
    .slice(h.new.start, h.new.start + h.new.count)
    .map((l, i) => patchLine("+", h.new.start + i, l, cur, index));
  return (
    `diff --git a/${repoPath} b/${repoPath}\n` +
    `index 0000000..0000000 ${mode}\n` +
    `--- a/${repoPath}\n+++ b/${repoPath}\n` +
    `@@ -${range(h.old)} +${range(h.new)} @@\n` +
    removed.join("") +
    added.join("")
  );
}

/** Git-diff numbering: 1-based, and an empty side names the line before it. */
const range = (r: { start: number; count: number }) =>
  `${r.count === 0 ? r.start : r.start + 1},${r.count}`;

function patchLine(
  sign: "-" | "+",
  line: number,
  text: string,
  side: Cur,
  index: IndexText,
): string {
  const body = line === 0 && side.bom ? BOM + text : text;
  const last = line === side.lines.length - 1 && !side.finalNewline;
  return last ? `${sign}${body}\n${NO_NEWLINE}` : `${sign}${body}${index.eol}`;
}
