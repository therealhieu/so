import { expect, test } from "bun:test";
import { wrapSized } from "./sized";
import type { Span } from "./types";

const h1 = (text: string): Span[] => [
  { text: "█ ", style: "mdHeading1", col: 0, inserted: true },
  { text, style: "mdHeading1", col: 2 },
];
const h2 = (text: string): Span[] => [
  { text: "▊ ", style: "mdHeading2", col: 0, inserted: true },
  { text, style: "mdHeading2", col: 3 },
];
const texts = (rows: { text: string }[][]) =>
  rows.map((r) => r.map((c) => c.text));
const widest = (rows: { cells: number }[][]) =>
  Math.max(...rows.map((r) => r.reduce((n, c) => n + c.cells, 0)));

test("at 2× a same-style run is one chunk twice its width", () => {
  expect(wrapSized(h1("Raft"), 2, 20)).toEqual([
    [{ text: "█ Raft", style: "mdHeading1", cells: 12 }],
  ]);
});

test("at 2× a heading wider than half the window wraps after a space", () => {
  const rows = wrapSized(h1("Leader leases"), 2, 20);
  expect(texts(rows)).toEqual([["█ Leader "], ["leases"]]);
  expect(rows.map((r) => r.map((c) => c.cells))).toEqual([[18], [12]]);
});

test("at 1.5× runs split into chunks of at most 4 cells, each an even cell count", () => {
  expect(wrapSized(h2("Guarantees"), 1.5, 20)).toEqual([
    [
      { text: "▊ Gu", style: "mdHeading2", cells: 6 },
      { text: "aran", style: "mdHeading2", cells: 6 },
      { text: "tees", style: "mdHeading2", cells: 6 },
    ],
  ]);
  const rows = wrapSized(h2("Consensus guarantees for leaders"), 1.5, 20);
  expect(rows.length).toBeGreaterThan(1);
  expect(widest(rows)).toBeLessThanOrEqual(20);
  expect(texts(rows).flat().join("")).toBe(
    "▊ Consensus guarantees for leaders",
  );
  for (const c of rows.flat()) expect(c.cells % 2).toBe(0);
});

test("a styled run is its own chunk and keeps the line style under it", () => {
  const spans: Span[] = [
    { text: "▊ ", style: "mdHeading2", inserted: true },
    { text: "A ", style: "mdHeading2", col: 3 },
    { text: "bold", style: "mdBold", under: "mdHeading2", col: 7 },
    { text: " move", style: "mdHeading2", col: 13 },
  ];
  expect(wrapSized(spans, 1.5, 40)).toEqual([
    [
      { text: "▊ A ", style: "mdHeading2", cells: 6 },
      { text: "bold", style: "mdBold", under: "mdHeading2", cells: 6 },
      { text: " mov", style: "mdHeading2", cells: 6 },
      { text: "e", style: "mdHeading2", cells: 2 },
    ],
  ]);
});

test("a word longer than a row breaks mid-word", () => {
  const rows = wrapSized(h1("Linearizability"), 2, 20);
  expect(texts(rows)).toEqual([["█ "], ["Linearizab"], ["ility"]]);
  expect(widest(rows)).toBeLessThanOrEqual(20);
});
