import { expect, test } from "bun:test";
import { createTextBuffer } from "../../kernel/text/text-buffer";
import type { TextView } from "../../kernel/view/types";
import type { Hunk, HunkKind } from "./diff";
import {
  GIT_SIGNS,
  hunkAt,
  hunkSigns,
  nextHunkLine,
  prevHunkLine,
} from "./signs";

const hunk = (
  kind: HunkKind,
  newStart: number,
  newCount: number,
  oldCount = newCount,
): Hunk => ({
  kind,
  old: { start: newStart, count: oldCount },
  new: { start: newStart, count: newCount },
  oldLines: Array.from({ length: oldCount }, () => "old"),
});

function view(from: number, to: number, lineCount = 30): TextView {
  return {
    buf: createTextBuffer(
      Array.from({ length: lineCount }, () => "x").join("\n"),
    ),
    width: 80,
    topRow: from,
    rows: to - from,
    cursor: { line: from, col: 0 },
    folds: new Set(),
    visible: { from, to },
  };
}

// Lines: 0 topdelete anchor, 2–3 add, 5 change, 7 delete anchor (gap before 8),
// 10–11 changedelete (3 old lines → 2 new lines).
const HUNKS: Hunk[] = [
  hunk("topdelete", 0, 0, 2),
  hunk("add", 2, 2, 0),
  hunk("change", 5, 1),
  hunk("delete", 8, 0, 1),
  hunk("changedelete", 10, 2, 3),
];

test("the sign glyphs and tokens are the accepted set", () => {
  expect(GIT_SIGNS).toEqual({
    add: { text: "+", style: "gitAdd" },
    change: { text: "~", style: "gitChange" },
    delete: { text: "_", style: "gitDelete" },
    topdelete: { text: "‾", style: "gitTopDelete" },
    changedelete: { text: "≃", style: "gitChangeDelete" },
    untracked: { text: "┆", style: "gitUntracked" },
  });
});

test("each hunk kind marks its anchor lines with its glyph", () => {
  expect(hunkSigns(HUNKS)(view(0, 30), undefined)).toEqual([
    { kind: "line", line: 0, changeSign: GIT_SIGNS.topdelete },
    { kind: "line", line: 2, changeSign: GIT_SIGNS.add },
    { kind: "line", line: 3, changeSign: GIT_SIGNS.add },
    { kind: "line", line: 5, changeSign: GIT_SIGNS.change },
    { kind: "line", line: 7, changeSign: GIT_SIGNS.delete },
    { kind: "line", line: 10, changeSign: GIT_SIGNS.change },
    { kind: "line", line: 11, changeSign: GIT_SIGNS.changedelete },
  ]);
});

test("signs cover visible lines only and never set the line sign", () => {
  const decos = hunkSigns(HUNKS)(view(3, 8), undefined);
  expect(decos).toEqual([
    { kind: "line", line: 3, changeSign: GIT_SIGNS.add },
    { kind: "line", line: 5, changeSign: GIT_SIGNS.change },
    { kind: "line", line: 7, changeSign: GIT_SIGNS.delete },
  ]);
  const untracked = hunkSigns([hunk("untracked", 0, 30, 0)])(
    view(12, 15),
    undefined,
  );
  expect(untracked.map((d) => d.kind === "line" && d.line)).toEqual([
    12, 13, 14,
  ]);
  expect(
    [...decos, ...untracked].some((d) => d.kind === "line" && d.sign),
  ).toBe(false);
});

test("a change sign wins over a delete anchor on the same line", () => {
  const hunks = [hunk("change", 4, 1), hunk("delete", 5, 0, 2)];
  expect(hunkSigns(hunks)(view(0, 10), undefined)).toEqual([
    { kind: "line", line: 4, changeSign: GIT_SIGNS.change },
  ]);
  expect(hunkAt(hunks, 4)).toBe(hunks[0]);
});

test("the hunk at a line includes delete anchors", () => {
  expect(hunkAt(HUNKS, 0)).toBe(HUNKS[0]);
  expect(hunkAt(HUNKS, 3)).toBe(HUNKS[1]);
  expect(hunkAt(HUNKS, 7)).toBe(HUNKS[3]);
  expect(hunkAt(HUNKS, 8)).toBeUndefined();
  expect(hunkAt(HUNKS, 11)).toBe(HUNKS[4]);
  expect(hunkAt(HUNKS, 12)).toBeUndefined();
  expect(hunkAt([], 0)).toBeUndefined();
});

test("next and previous hunk move between first lines and stop at the ends", () => {
  // First lines: 0, 2, 5, 7, 10.
  expect(nextHunkLine(HUNKS, 0)).toBe(2);
  expect(nextHunkLine(HUNKS, 3)).toBe(5);
  expect(nextHunkLine(HUNKS, 6)).toBe(7);
  expect(nextHunkLine(HUNKS, 10)).toBeUndefined();
  expect(nextHunkLine(HUNKS, 25)).toBeUndefined();
  expect(prevHunkLine(HUNKS, 25)).toBe(10);
  expect(prevHunkLine(HUNKS, 11)).toBe(10);
  expect(prevHunkLine(HUNKS, 10)).toBe(7);
  expect(prevHunkLine(HUNKS, 1)).toBe(0);
  expect(prevHunkLine(HUNKS, 0)).toBeUndefined();
  expect(nextHunkLine([], 0)).toBeUndefined();
  expect(prevHunkLine([], 5)).toBeUndefined();
});
