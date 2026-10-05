import type {
  Decoration,
  DecorationProvider,
} from "../../kernel/view/decorations";
import type { Sign } from "../../kernel/view/types";
import type { Hunk, HunkKind } from "./diff";

/** One distinct glyph per kind, so kinds read apart without colour. */
export const GIT_SIGNS: Record<HunkKind, Sign> = {
  add: { text: "+", style: "gitAdd" },
  change: { text: "~", style: "gitChange" },
  delete: { text: "_", style: "gitDelete" },
  topdelete: { text: "‾", style: "gitTopDelete" },
  changedelete: { text: "≃", style: "gitChangeDelete" },
  untracked: { text: "┆", style: "gitUntracked" },
};

const isDelete = (h: Hunk) => h.kind === "delete" || h.kind === "topdelete";

/**
 * The buffer lines a hunk marks, as [first, end): a deletion marks the line
 * before its gap (line 0 at the top), every other kind its new lines.
 */
function linesOf(h: Hunk): [number, number] {
  if (!isDelete(h)) return [h.new.start, h.new.start + h.new.count];
  const anchor = Math.max(h.new.start - 1, 0);
  return [anchor, anchor + 1];
}

/**
 * Change-column signs for the visible hunk lines. The last line of a change
 * that also removed lines shows the change-delete glyph; a change line wins
 * over a deletion anchored on it.
 */
export const hunkSigns =
  (hunks: readonly Hunk[]): DecorationProvider =>
  (v) => {
    const signs = new Map<number, Sign>();
    for (const h of hunks) {
      const [first, end] = linesOf(h);
      if (end <= v.visible.from) continue;
      if (first >= v.visible.to) break;
      for (
        let line = Math.max(first, v.visible.from);
        line < Math.min(end, v.visible.to);
        line++
      ) {
        if (isDelete(h) && signs.has(line)) continue;
        const kind =
          h.kind === "changedelete" && line < end - 1 ? "change" : h.kind;
        signs.set(line, GIT_SIGNS[kind]);
      }
    }
    return [...signs]
      .sort(([a], [b]) => a - b)
      .map(
        ([line, changeSign]): Decoration => ({
          kind: "line",
          line,
          changeSign,
        }),
      );
  };

/** The hunk marking `line`, preferring changed lines over delete anchors. */
export function hunkAt(hunks: readonly Hunk[], line: number): Hunk | undefined {
  const marks = (h: Hunk) => {
    const [first, end] = linesOf(h);
    return line >= first && line < end;
  };
  return (
    hunks.find((h) => !isDelete(h) && marks(h)) ??
    hunks.find((h) => isDelete(h) && marks(h))
  );
}

/** The first line of the nearest hunk starting below `line`. */
export function nextHunkLine(
  hunks: readonly Hunk[],
  line: number,
): number | undefined {
  for (const h of hunks) {
    const [first] = linesOf(h);
    if (first > line) return first;
  }
  return undefined;
}

/** The first line of the nearest hunk starting above `line`. */
export function prevHunkLine(
  hunks: readonly Hunk[],
  line: number,
): number | undefined {
  for (let i = hunks.length - 1; i >= 0; i--) {
    const h = hunks[i];
    if (h === undefined) continue;
    const [first] = linesOf(h);
    if (first < line) return first;
  }
  return undefined;
}
