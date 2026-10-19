import { expect, test } from "bun:test";
import { wrapSized } from "./sized";
import type { SizedScale, Span } from "./types";

const H1: SizedScale = { n: 7, d: 8 };
const H2: SizedScale = { n: 4, d: 5 };
const H3: SizedScale = { n: 7, d: 10 };

const heading = (text: string, style = "mdHeading1"): Span[] => [
  { text, style, col: 2 },
];
const texts = (rows: { text: string }[][]) =>
  rows.map((r) => r.map((c) => c.text));
const widest = (rows: { cells: number }[][]) =>
  Math.max(...rows.map((r) => r.reduce((n, c) => n + c.cells, 0)));

test("a chunk takes whole double cells at its scale", () => {
  expect(wrapSized(heading("Raft"), H1, 20)).toEqual([
    [{ text: "Raft", style: "mdHeading1", cells: 8 }],
  ]);
});

test("a run is cut where its chunks fill double cells exactly", () => {
  const cut = (text: string, scale: SizedScale) =>
    texts(wrapSized(heading(text), scale, 80))[0];
  expect(cut("Markdown tour guide", H1)).toEqual([
    "Markdown",
    " tour gu",
    "ide",
  ]);
  expect(cut("Guarantees", H2)).toEqual(["Guara", "ntees"]);
  expect(cut("Table of contents", H3)).toEqual(["Table of c", "ontents"]);
  // Full chunks: 8 at 7/8 → 14 cells, 5 at 4/5 → 8 cells, 10 at 7/10 → 14 cells.
  expect(wrapSized(heading("Markdown tour guide"), H1, 80)[0]?.[0]?.cells).toBe(
    14,
  );
  expect(wrapSized(heading("Guarantees"), H2, 80)[0]?.[0]?.cells).toBe(8);
  expect(wrapSized(heading("Table of contents"), H3, 80)[0]?.[0]?.cells).toBe(
    14,
  );
});

test("a heading wider than the window wraps after a space", () => {
  const rows = wrapSized(heading("Leader leases"), H1, 20);
  expect(texts(rows)).toEqual([["Leader "], ["leases"]]);
  expect(rows.map((r) => r.map((c) => c.cells))).toEqual([[14], [12]]);
  const long = wrapSized(heading("Consensus guarantees for leaders"), H2, 20);
  expect(long.length).toBeGreaterThan(1);
  expect(widest(long)).toBeLessThanOrEqual(20);
  expect(texts(long).flat().join("")).toBe("Consensus guarantees for leaders");
  for (const c of long.flat()) expect(c.cells % 2).toBe(0);
});

test("a styled run is its own chunk and keeps the line style under it", () => {
  const spans: Span[] = [
    { text: "A ", style: "mdHeading2", col: 3 },
    { text: "bold", style: "mdBold", under: "mdHeading2", col: 7 },
    { text: " move", style: "mdHeading2", col: 13 },
  ];
  expect(wrapSized(spans, H2, 40)).toEqual([
    [
      { text: "A ", style: "mdHeading2", cells: 4 },
      { text: "bold", style: "mdBold", under: "mdHeading2", cells: 8 },
      { text: " move", style: "mdHeading2", cells: 8 },
    ],
  ]);
});

test("with a word space, words start their own chunks and spaces are plain cells", () => {
  const words: SizedScale = { n: 7, d: 8, wordSpace: 1 };
  expect(wrapSized(heading("Markdown tour"), words, 80)).toEqual([
    [
      { text: "Markdown", style: "mdHeading1", cells: 14 },
      { text: " ", style: "mdHeading1", cells: 1, plain: true },
      { text: "tour", style: "mdHeading1", cells: 8 },
    ],
  ]);
  // A word longer than a chunk still splits; a row still breaks after a space.
  expect(texts(wrapSized(heading("Consensus guide"), words, 80))).toEqual([
    ["Consensu", "s", " ", "guide"],
  ]);
  expect(texts(wrapSized(heading("Markdown tour guide"), words, 20))).toEqual([
    ["Markdown", " "],
    ["tour", " ", "guide"],
  ]);
});

test("a word longer than a row breaks mid-word", () => {
  const rows = wrapSized(heading("Linearizability"), H1, 20);
  expect(texts(rows)).toEqual([["Lineariz", "abi"], ["lity"]]);
  expect(widest(rows)).toBeLessThanOrEqual(20);
});
