import { expect, test } from "bun:test";
import { lineRemoved, lineShift, shiftPos, shiftRange } from "./line-shift";
import { createTextBuffer } from "./text-buffer";

const shift = (a: string, b: string) =>
  lineShift(createTextBuffer(a), createTextBuffer(b));

test("lines below an added line move down, lines above stay", () => {
  const s = shift("a\nb\nc\n", "a\nnew\nb\nc\n");
  expect(s).toEqual({ from: 1, delta: 1, removed: 1 });
  if (s === undefined) return;
  expect(shiftPos({ line: 0, col: 1 }, s)).toEqual({ line: 0, col: 1 });
  expect(shiftPos({ line: 2, col: 1 }, s)).toEqual({ line: 3, col: 1 });
});

test("splitting a line keeps it in place and moves the lines after", () => {
  expect(shift("let y = z;\nend\n", "let y\n= z;\nend\n")).toEqual({
    from: 1,
    delta: 1,
    removed: 1,
  });
  // Enter at the start of a line moves that line too.
  expect(shift("a\nlet y\n", "a\n\nlet y\n")).toEqual({
    from: 1,
    delta: 1,
    removed: 1,
  });
});

test("removed lines are gone and the ones below move up", () => {
  const s = shift("a\nb\nc\nd\n", "a\nd\n");
  expect(s).toEqual({ from: 3, delta: -2, removed: 1 });
  if (s === undefined) return;
  expect([0, 1, 2, 3].map((l) => lineRemoved(l, s))).toEqual([
    false,
    true,
    true,
    false,
  ]);
  // Joining two lines removes the second.
  const joined = shift("ab\ncd\nx\n", "abcd\nx\n");
  expect(joined).toEqual({ from: 2, delta: -1, removed: 1 });
});

test("an edit within a line moves nothing", () => {
  expect(shift("a\nb\n", "a\nbb\n")).toBeUndefined();
});

test("a range moves when its end is below the edit", () => {
  const s = { from: 2, delta: 1, removed: 2 };
  const r = { start: { line: 0, col: 0 }, end: { line: 1, col: 3 } };
  expect(shiftRange(r, s)).toBe(r);
  expect(
    shiftRange({ start: { line: 1, col: 0 }, end: { line: 3, col: 1 } }, s),
  ).toEqual({ start: { line: 1, col: 0 }, end: { line: 4, col: 1 } });
});
