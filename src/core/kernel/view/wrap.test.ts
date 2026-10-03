import { expect, test } from "bun:test";
import { cellWidth, displayWidth, rowOf, wrapLine } from "./wrap";

/** The text of each row, by display column, with tabs expanded. */
function rows(text: string, starts: number[], tabWidth: number): string[] {
  const out = starts.map(() => "");
  let v = 0;
  for (const ch of text) {
    const w = cellWidth(ch, v, tabWidth);
    const r = rowOf(starts, v);
    // A character never straddles two rows.
    expect(rowOf(starts, v + w - 1)).toBe(r);
    out[r] += ch;
    v += w;
  }
  return out;
}

const words = (n: number) =>
  Array.from({ length: n }, (_, i) => ["alpha", "be", "gamma", "delta"][i % 4])
    .join(" ")
    .slice(0, 300);

test("a line that fits takes one row", () => {
  expect(wrapLine("x".repeat(30), 80, 8)).toEqual([0]);
  expect(wrapLine("x".repeat(80), 80, 8)).toEqual([0]);
  expect(wrapLine("", 80, 8)).toEqual([0]);
});

test("rows break after whitespace and rejoin to the line", () => {
  const text = words(80);
  expect(text).toHaveLength(300);
  const starts = wrapLine(text, 80, 8);
  expect(starts.length).toBeGreaterThanOrEqual(4);
  const parts = rows(text, starts, 8);
  expect(parts.join("")).toBe(text);
  for (const p of parts.slice(0, -1)) {
    expect(p.length).toBeLessThanOrEqual(80);
    expect(p.endsWith(" ")).toBe(true);
  }
  for (const [i, s] of starts.entries()) {
    if (i > 0) expect(s).toBeGreaterThan(starts[i - 1] ?? -1);
  }
  expect(starts[0]).toBe(0);
});

test("a word longer than the width breaks at the width", () => {
  const word = "w".repeat(200);
  expect(wrapLine(word, 80, 8)).toEqual([0, 80, 160]);
  expect(rows(word, [0, 80, 160], 8).join("")).toBe(word);
});

test("a tab never straddles two rows", () => {
  // "a\tb" repeated: with tab width 4, each "a\t" is 4 cells and "b" 1.
  const text = "aaaaaaa\tb".repeat(4);
  for (const width of [8, 9, 10, 11]) {
    const starts = wrapLine(text, width, 4);
    const parts = rows(text, starts, 4);
    expect(parts.join("")).toBe(text);
    for (const [k, p] of parts.entries()) {
      const from = starts[k] ?? 0;
      let v = from;
      for (const ch of p) v += cellWidth(ch, v, 4);
      expect(v - from).toBeLessThanOrEqual(width);
    }
  }
});

test("a tab wider than the width takes a row alone", () => {
  const starts = wrapLine("a\tb", 3, 8);
  expect(starts).toEqual([0, 1, 8]);
  expect(rows("a\tb", starts, 8)).toEqual(["a", "\t", "b"]);
});

test("rowOf finds the row holding a display column", () => {
  const starts = [0, 80, 160];
  expect(rowOf(starts, 0)).toBe(0);
  expect(rowOf(starts, 79)).toBe(0);
  expect(rowOf(starts, 80)).toBe(1);
  expect(rowOf(starts, 159)).toBe(1);
  expect(rowOf(starts, 160)).toBe(2);
  expect(rowOf(starts, 199)).toBe(2);
});

test("display width expands tabs from the line start", () => {
  expect(displayWidth("\tx", 4)).toBe(5);
  expect(displayWidth("ab\tx", 8)).toBe(9);
  expect(displayWidth("", 8)).toBe(0);
});
