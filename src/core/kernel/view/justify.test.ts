import { expect, test } from "bun:test";
import { colAtCell, justifyRow } from "./justify";
import type { Span } from "./types";

const plain = (text: string): Span[] => [{ text, style: "text", col: 0 }];

/** The row [start, end) of `spans` as painted with `shift`. */
function painted(spans: Span[], start: number, end: number, shift: number[]) {
  const text = spans.map((s) => s.text).join("");
  let out = "";
  for (let i = 0; i < end - start; i++) {
    out += text[start + i];
    out += " ".repeat((shift[i + 1] ?? 0) - (shift[i] ?? 0));
  }
  return out.trimEnd();
}

test("extra cells go to the gaps between words, leftmost first", () => {
  const spans = plain("aa bb cc dd next");
  // The row "aa bb cc dd " is 11 cells and a blank; stretched to 13, two of three gaps grow.
  const shift = justifyRow(spans, 0, 12, 13, 8);
  expect(painted(spans, 0, 12, shift ?? [])).toBe("aa  bb  cc dd");
});

test("the last row of a line, a row without gaps, and a sparse row stay ragged", () => {
  expect(justifyRow(plain("aa bb"), 0, undefined, 20, 8)).toBeUndefined();
  expect(justifyRow(plain("aaaaaa next"), 0, 7, 10, 8)).toBeUndefined();
  // One gap would take 6 extra cells.
  expect(justifyRow(plain("aa bb next"), 0, 6, 11, 8)).toBeUndefined();
});

test("leading indent and inserted text never stretch", () => {
  const spans: Span[] = [
    { text: "• ", style: "mdMarker", col: 0, inserted: true },
    { text: "  aa bb cc next", style: "text", col: 2 },
  ];
  // "•   aa bb cc " is 12 cells and a blank: 3 extra cells over two gaps.
  const shift = justifyRow(spans, 0, 13, 15, 8);
  expect(painted(spans, 0, 13, shift ?? [])).toBe("•   aa   bb  cc");
});

test("a later row counts its columns from the row start", () => {
  const spans = plain("aaaa bb cc dd");
  // Second row "bb cc dd" starts at column 5; it is the last row, so ragged.
  expect(justifyRow(spans, 5, undefined, 10, 8)).toBeUndefined();
  const mid = plain("aaaa bb cc dd ee");
  const shift = justifyRow(mid, 5, 14, 11, 8);
  expect(painted(mid, 5, 14, shift ?? [])).toBe("bb   cc  dd");
});

test("a cell of a stretched gap maps to the space before it", () => {
  const shift = justifyRow(plain("aa bb cc dd next"), 0, 12, 13, 8) ?? [];
  // Painted "aa  bb  cc dd": cells 2 and 3 are the first gap.
  expect(colAtCell(shift, 0)).toBe(0);
  expect(colAtCell(shift, 2)).toBe(2);
  expect(colAtCell(shift, 3)).toBe(2);
  expect(colAtCell(shift, 4)).toBe(3);
  expect(colAtCell(shift, 8)).toBe(6);
  expect(colAtCell(shift, 12)).toBe(10);
});

test("a wide character counts as two cells of its word", () => {
  const spans = plain("中文 bb cc next");
  // "中文 bb cc " is 10 cells and a blank; stretched to 12, both gaps grow.
  const shift = justifyRow(spans, 0, 11, 12, 8) ?? [];
  expect(shift).toEqual([0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 2]);
  // "cc" starts at column 8 and is painted at cell 10.
  expect(colAtCell(shift, 10)).toBe(8);
  expect(colAtCell(shift, 5)).toBe(4);
});
