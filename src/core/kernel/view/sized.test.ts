import { expect, test } from "bun:test";
import {
  sizeScale,
  underText,
  wrapSized,
  zoomCellOf,
  zoomColAt,
  zoomRowOf,
  zoomRows,
} from "./sized";
import type { RenderLine, SizedScale, Span, ZoomRow } from "./types";

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

const zoomLine = (
  spans: Span[],
  over: Partial<RenderLine> = {},
): RenderLine => ({
  sourceLine: 0,
  spans,
  zoom: true,
  ...over,
});
const rowTexts = (rows: ZoomRow[]) =>
  rows.map((r) => r.chunks.map((c) => c.text).join(""));
const rowCells = (r: ZoomRow) => r.chunks.reduce((n, c) => n + c.cells, 0);

test("a heading chunk keeps its cells, and a whole size chunks seven at a time", () => {
  expect(wrapSized(heading("Markdown"), H1, 80)[0]?.[0]?.cells).toBe(14);
  const twice = wrapSized(heading("Consensus"), { s: 2, n: 1, d: 1 }, 80)[0];
  expect(twice?.map((c) => [c.text, c.cells])).toEqual([
    ["Consens", 14],
    ["us", 4],
  ]);
  const four = wrapSized(heading("Raft"), { s: 4, n: 1, d: 1 }, 80)[0];
  expect(four?.[0]?.cells).toBe(16);
});

test("a zoomed line wraps like the line in width / size columns, a cell taking size columns", () => {
  const rows = zoomRows(
    zoomLine([{ text: "leader leases expire", style: "text", col: 0 }]),
    2,
    30,
    8,
  );
  expect(rowTexts(rows)).toEqual(["leader leases ", "expire"]);
  expect(rows.map((r) => [r.startCol, r.endCol])).toEqual([
    [0, 14],
    [14, undefined],
  ]);
  expect(rows[0]?.chunks.map((c) => [c.text, c.col, c.w, c.cells])).toEqual([
    ["leader", 0, 6, 12],
    [" ", 6, 1, 2],
    ["leases", 7, 6, 12],
    [" ", 13, 1, 2],
  ]);
  for (const r of rows) expect(rowCells(r)).toBeLessThanOrEqual(30);
});

test("a word wider than a zoomed row breaks inside it, like wrapLine", () => {
  const rows = zoomRows(
    zoomLine([{ text: "consensusconsensus", style: "text" }]),
    3,
    20,
    8,
  );
  expect(rowTexts(rows)).toEqual(["consen", "suscon", "sensus"]);
  for (const r of rows) expect(rowCells(r)).toBe(18);
});

test("styles and spaces cut chunks, and rows after the first start with the wrap prefix", () => {
  const rows = zoomRows(
    zoomLine(
      [
        { text: "▎ ", style: "mdQuote", col: 0, inserted: true },
        { text: "see ", style: "text", col: 2 },
        { text: "link", style: "mdLink", col: 6 },
        { text: " now and later", style: "text", col: 10 },
      ],
      { wrapPrefix: [{ text: "▎ ", style: "mdQuote" }] },
    ),
    2,
    24,
    8,
  );
  expect(rows.length).toBeGreaterThan(1);
  expect(rows[0]?.chunks.map((c) => [c.text, c.style])).toEqual([
    ["▎", "mdQuote"],
    [" ", "mdQuote"],
    ["see", "text"],
    [" ", "text"],
    ["link", "mdLink"],
    [" ", "text"],
  ]);
  for (const r of rows.slice(1)) {
    expect(r.chunks.slice(0, 2).map((c) => [c.text, c.col])).toEqual([
      ["▎", undefined],
      [" ", undefined],
    ]);
    expect(r.chunks[2]?.col).toBe(r.startCol);
  }
});

test("justified zoomed rows take their extra cells as blanks after the gaps", () => {
  const line = zoomLine([{ text: "aa bb cc dd ee ff", style: "text" }], {
    justify: true,
  });
  const rows = zoomRows(line, 2, 20, 8);
  expect(rows.length).toBeGreaterThan(1);
  const first = rows[0];
  if (first === undefined) throw new Error("no row");
  const lastText = first.chunks.findLastIndex((c) => c.plain !== true);
  const used = first.chunks
    .slice(0, lastText + 1)
    .reduce((n, c) => n + c.cells, 0);
  expect(used).toBe(20);
  // The last row keeps one space width, two columns at 2×, per gap.
  const last = rows.at(-1)?.chunks.filter((c) => c.plain === true) ?? [];
  expect(last.map((c) => c.cells)).toEqual(last.map(() => 2));
});

/** Each row's gaps between word texts, and where a word's chunks meet, in columns. */
function gapsOf(rows: ZoomRow[], scale: SizedScale) {
  const adv = ((scale.s ?? 2) * scale.n) / scale.d;
  const spaces: number[] = [];
  const joins: number[] = [];
  for (const r of rows) {
    let x = 0;
    let end: number | undefined;
    let blank = false;
    for (const c of r.chunks) {
      if (c.plain === true) {
        x += c.cells;
        blank = true;
        continue;
      }
      const slack = c.cells - (c.w ?? 0) * adv;
      const lead =
        c.align === "right" ? slack : c.align === "center" ? slack / 2 : 0;
      const start = x + lead;
      if (end !== undefined)
        (blank || start - end > 1e-9 ? spaces : joins).push(start - end);
      end = start + (c.w ?? 0) * adv;
      blank = false;
      x += c.cells;
    }
  }
  return { spaces, joins };
}

const PROSE: Span[] = [
  { text: "Text can be ", style: "text", col: 0 },
  { text: "bold", style: "mdBold", col: 12 },
  { text: ", ", style: "text", col: 16 },
  { text: "italic", style: "mdItalic", col: 18 },
  { text: ", or ", style: "text", col: 24 },
  { text: "inline code", style: "mdCode", col: 29 },
  {
    text: ". Consensus needs linearizability, and leader leases expire.",
    style: "text",
    col: 40,
  },
];

test("at every text size each space between words is within half a column of a space at that size, and a word's chunks meet", () => {
  for (const size of [1.25, 1.5, 1.75, 2, 2.5, 3]) {
    const scale = sizeScale(size);
    const rows = zoomRows(zoomLine(PROSE), size, 72, 8);
    const { spaces, joins } = gapsOf(rows, scale);
    expect(spaces.length).toBeGreaterThan(5);
    for (const g of spaces) expect(Math.abs(g - size)).toBeLessThanOrEqual(0.5);
    for (const j of joins) expect(j).toBeCloseTo(0);
    for (const r of rows) expect(rowCells(r)).toBeLessThanOrEqual(72);
  }
  // At a whole size every space is exactly one.
  for (const size of [2, 3]) {
    const { spaces } = gapsOf(
      zoomRows(zoomLine(PROSE), size, 72, 8),
      sizeScale(size),
    );
    for (const g of spaces) expect(g).toBeCloseTo(size);
  }
});

test("a text size is kitty's whole cells of the size rounded up, the text taking n/d of them", () => {
  expect([1.25, 1.5, 1.75, 2, 2.5, 3].map(sizeScale)).toEqual([
    { s: 2, n: 5, d: 8 },
    { s: 2, n: 3, d: 4 },
    { s: 2, n: 7, d: 8 },
    { s: 2, n: 1, d: 1 },
    { s: 3, n: 5, d: 6 },
    { s: 3, n: 1, d: 1 },
  ]);
});

test("a word longer than a chunk splits evenly, its chunks meeting in the middle", () => {
  const [row] = zoomRows(
    zoomLine([{ text: "linearizability", style: "text", col: 0 }]),
    1.5,
    80,
    8,
  );
  expect(row?.chunks.map((c) => [c.text, c.align])).toEqual([
    ["lineariz", "right"],
    ["ability", undefined],
  ]);
});

test("normal-size text under a fractional chunk sits where each sized glyph starts", () => {
  const scale = sizeScale(1.5);
  expect(underText({ text: "See", style: "text", cells: 6, w: 3 }, scale)).toBe(
    "Se e",
  );
  expect(
    underText(
      { text: "See", style: "text", cells: 6, w: 3, align: "right" },
      scale,
    ),
  ).toBe(" S ee");
});

test("a cell of a zoomed row maps to the column it draws, and back", () => {
  const [row] = zoomRows(
    zoomLine([{ text: "abc 漢g", style: "text" }]),
    2,
    80,
    8,
  );
  if (row === undefined) throw new Error("no row");
  for (const dc of [0, 1, 2, 3, 4, 6])
    expect(zoomColAt(row, zoomCellOf(row, dc))).toBe(dc);
  // The wide character's second sized cell maps to its second column.
  expect(zoomColAt(row, 10)).toBe(5);
  expect(zoomColAt(row, 79)).toBe(7);
  expect(zoomRowOf([row], 4)).toBe(0);
});
