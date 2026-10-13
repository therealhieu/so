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
  hunk: Hunk,
  index: IndexText,
  cur: Cur,
): string {
  const h = afterUnterminatedEnd(hunk, index);
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

/**
 * Lines added after an index whose last line has no final newline: a pure
 * add would join the first added line onto it, so the hunk also replaces
 * that last line, as `git diff` writes it.
 */
function afterUnterminatedEnd(h: Hunk, index: IndexText): Hunk {
  const last = index.lines.length - 1;
  if (h.old.count > 0 || h.old.start !== last + 1 || index.finalNewline)
    return h;
  const line = index.lines[last];
  if (line === undefined) return h;
  return {
    ...h,
    old: { start: last, count: 1 },
    new: { start: h.new.start - 1, count: h.new.count + 1 },
    oldLines: [line],
  };
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
