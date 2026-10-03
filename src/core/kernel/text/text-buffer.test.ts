import { expect, test } from "bun:test";
import type { Edit, Range } from "./pos";
import { createTextBuffer, type TextBuffer } from "./text-buffer";

const whole = (b: TextBuffer): Range => {
  const last = b.lineCount - 1;
  return {
    start: { line: 0, col: 0 },
    end: { line: last, col: b.line(last).length },
  };
};
const textOf = (b: TextBuffer) => b.slice(whole(b));

const roundTrips: [string, string, Edit][] = [
  [
    "multi-line join",
    "a\nbc\nd",
    {
      range: { start: { line: 0, col: 1 }, end: { line: 2, col: 0 } },
      text: "X\nY",
    },
  ],
  [
    "empty",
    "",
    {
      range: { start: { line: 0, col: 0 }, end: { line: 0, col: 0 } },
      text: "",
    },
  ],
  [
    "empty insert",
    "",
    {
      range: { start: { line: 0, col: 0 }, end: { line: 0, col: 0 } },
      text: "one\ntwo\n",
    },
  ],
  [
    "surrogate pair",
    "x😀y\nz",
    {
      range: { start: { line: 0, col: 1 }, end: { line: 1, col: 0 } },
      text: "🎉",
    },
  ],
];

test.each(roundTrips)("%s round-trip", (_, text, edit) => {
  const b0 = createTextBuffer(text);
  const { buffer: b1, inverse } = b0.apply(edit);
  const { buffer: b2 } = b1.apply(inverse);
  expect(textOf(b2)).toBe(text);
  expect(b2.version).toBe(b0.version + 2);
  for (const b of [b0, b1, b2]) expect(b.lineCount).toBeGreaterThanOrEqual(1);
});

test("apply replaces the range and keeps the original buffer", () => {
  const b0 = createTextBuffer("one\ntwo\nthree");
  const { buffer, inverse } = b0.apply({
    range: { start: { line: 0, col: 2 }, end: { line: 1, col: 1 } },
    text: "!",
  });
  expect(textOf(buffer)).toBe("on!wo\nthree");
  expect(inverse).toEqual({
    range: { start: { line: 0, col: 2 }, end: { line: 0, col: 3 } },
    text: "e\nt",
  });
  expect(textOf(b0)).toBe("one\ntwo\nthree");
});

test("apply rejects a range outside the buffer", () => {
  const b = createTextBuffer("ab");
  expect(() =>
    b.apply({
      range: { start: { line: 0, col: 0 }, end: { line: 0, col: 3 } },
      text: "",
    }),
  ).toThrow(RangeError);
});
