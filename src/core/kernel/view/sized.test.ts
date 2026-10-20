import { expect, test } from "bun:test";
import {
  gridRow,
  sizeScale,
  underText,
  wrapSized,
  zoomCellOf,
  zoomColAt,
  zoomRowOf,
  zoomRows,
  zoomScale,
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
    { size: 2 },
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
    { size: 3 },
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
    { size: 2 },
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
  const rows = zoomRows(line, { size: 2 }, 20, 8);
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

/**
 * How far each gap between chunk texts in `rows` is from the blank columns
 * of the line under it at `scale`: spaces after a blank, joins inside a word.
 */
function gapsOf(rows: ZoomRow[], scale: SizedScale) {
  const adv = scale.adv ?? ((scale.s ?? 2) * scale.n) / scale.d;
  const spaces: number[] = [];
  const joins: number[] = [];
  for (const r of rows) {
    let x = 0;
    let end: number | undefined;
    let next = 0;
    for (const c of r.chunks) {
      if (c.plain === true || c.col === undefined) {
        x += c.cells;
        continue;
      }
      const slack = c.cells - (c.w ?? 0) * adv;
      const lead =
        c.align === "right" ? slack : c.align === "center" ? slack / 2 : 0;
      const start = x + lead;
      if (end !== undefined) {
        const blanks = c.col - next;
        (blanks > 0 ? spaces : joins).push(start - end - blanks * adv);
      }
      end = start + (c.w ?? 0) * adv;
      next = c.col + (c.w ?? 0);
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

test("at every text size each space between words is within four fifths of a column of a space at that size, and a word's chunks meet", () => {
  for (const zoom of [
    { size: 1.2 },
    { size: 1.3 },
    { size: 1.5 },
    { size: 1.7 },
    { size: 1.9 },
    { size: 1.3, cellPx: 18 },
    { size: 1.7, cellPx: 18 },
    { size: 2 },
    { size: 2.5 },
    { size: 3 },
  ]) {
    const rows = zoomRows(zoomLine(PROSE), zoom, 72, 8);
    const { spaces, joins } = gapsOf(rows, zoomScale(zoom));
    expect(spaces.length).toBeGreaterThan(5);
    for (const g of spaces) expect(Math.abs(g)).toBeLessThanOrEqual(0.8 + 1e-9);
    // A word over two chunks long leaves part of a column between them; a
    // long word starting a row keeps its first chunk's slack, up to a column,
    // there instead of before the row.
    for (const j of joins) expect(Math.abs(j)).toBeLessThanOrEqual(1);
    for (const r of rows) expect(rowCells(r)).toBeLessThanOrEqual(72);
  }
  // At 1.1×, a block holds the most room past its text: a space is within one and a half columns.
  const { spaces } = gapsOf(
    zoomRows(zoomLine(PROSE), { size: 1.1 }, 72, 8),
    zoomScale({ size: 1.1 }),
  );
  for (const g of spaces) expect(Math.abs(g)).toBeLessThanOrEqual(1.5);
  // At a whole size every space is exact.
  for (const size of [2, 3]) {
    const zoom = { size };
    const { spaces } = gapsOf(
      zoomRows(zoomLine(PROSE), zoom, 72, 8),
      zoomScale(zoom),
    );
    for (const g of spaces) expect(g).toBeCloseTo(0);
  }
});

test("neighbouring words of one look share a chunk, so the terminal spaces them itself", () => {
  const [row] = zoomRows(
    zoomLine([{ text: "see the log now", style: "text", col: 0 }]),
    { size: 1.5 },
    80,
    8,
  );
  expect(
    row?.chunks.some((c) => c.plain !== true && c.text.includes(" ")),
  ).toBe(true);
});

test("a quote bar is a normal-size bar of its own, never in a chunk with the text after it", () => {
  const rows = zoomRows(
    zoomLine(
      [
        { text: "▎ ", style: "mdQuote", col: 0, inserted: true },
        {
          text: "Simplicity is prerequisite for reliability.",
          style: "mdQuote",
          col: 2,
        },
      ],
      { wrapPrefix: [{ text: "▎ ", style: "mdQuote" }] },
    ),
    { size: 1.1 },
    30,
    8,
  );
  expect(rows.length).toBeGreaterThan(1);
  for (const r of rows) {
    expect(r.chunks[0]).toMatchObject({ text: "▎", bar: true, cells: 1 });
    for (const c of r.chunks.slice(1)) expect(c.text).not.toContain("▎");
  }
});

test("a row's first word starts at its left edge", () => {
  for (const size of [1.1, 1.2, 1.3, 1.5, 1.7, 1.9]) {
    const scale = zoomScale({ size });
    const adv = ((scale.s ?? 2) * scale.n) / scale.d;
    for (const r of zoomRows(zoomLine(PROSE), { size }, 72, 8)) {
      const first = r.chunks[0];
      if (first === undefined) throw new Error("empty row");
      expect(first.plain).toBeUndefined();
      const slack = first.cells - (first.w ?? 0) * adv;
      if (first.align !== undefined) expect(slack).toBeCloseTo(0);
    }
  }
});

test("with the cell's pixels a character takes kitty's whole-pixel width", () => {
  expect(zoomScale({ size: 1.5, cellPx: 18 }).adv).toBeCloseTo(1.5);
  expect(zoomScale({ size: 1.3, cellPx: 18 }).adv).toBeCloseTo(24 / 18);
  expect(zoomScale({ size: 2, cellPx: 18 }).adv).toBeUndefined();
});

test("a text size is kitty's whole cells of the size rounded up, the text taking the n/d of them nearest it", () => {
  expect([1.1, 1.3, 1.5, 1.7, 1.9, 2, 2.5, 3].map(sizeScale)).toEqual([
    { s: 2, n: 6, d: 11 },
    { s: 2, n: 9, d: 14 },
    { s: 2, n: 3, d: 4 },
    { s: 2, n: 11, d: 13 },
    { s: 2, n: 14, d: 15 },
    { s: 2, n: 1, d: 1 },
    { s: 3, n: 5, d: 6 },
    { s: 3, n: 1, d: 1 },
  ]);
  for (let z = 1.1; z < 2; z += 0.1) {
    const { s = 2, n, d } = sizeScale(z);
    expect(Math.abs((s * n) / d - z)).toBeLessThan(0.035);
  }
});

test("a word longer than a chunk splits evenly, its chunks meeting in the middle", () => {
  const [row] = zoomRows(
    zoomLine([{ text: "linearizability", style: "text", col: 0 }]),
    { size: 1.5 },
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
    { size: 2 },
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

test("a zoomed grid row keeps each box-drawing character at its column times the size, so rows line up", () => {
  const rows: Span[][] = [
    [{ text: "│ Key │ Action      │", style: "mdTable", col: 0 }],
    [{ text: "├─────┼─────────────┤", style: "mdTable", col: 0 }],
    [
      { text: "│ ", style: "mdTable", col: 0 },
      { text: "gd", style: "text", col: 2 },
      { text: "  │ ", style: "mdTable", col: 4 },
      { text: "Follow link", style: "text", col: 8 },
      { text: " │", style: "mdTable", col: 19 },
    ],
  ];
  for (const zoom of [{ size: 1.5 }, { size: 1.3, cellPx: 18 }, { size: 2 }]) {
    const adv = zoomScale(zoom).adv ?? zoom.size;
    const borders = rows.map((spans) => {
      const at: number[] = [];
      let x = 0;
      for (const c of gridRow(spans, zoom)) {
        if (c.bar === true && /[│├┼┤]/.test(c.text[0] ?? "")) at.push(x);
        x += c.cells;
      }
      return at;
    });
    const want = [0, 6, 20].map((col) => Math.round(col * adv));
    for (const b of borders) expect(b).toEqual(want);
  }
});

test("a zoomed rule runs on between its corners, and its vertical lines run down", () => {
  const row = gridRow([{ text: "├──┼──┤", style: "mdTable", col: 0 }], {
    size: 1.5,
  });
  expect(row.map((c) => [c.text, c.down])).toEqual([
    ["├─", "│ "],
    ["─", " "],
    ["──", "  "],
    ["┼", "│"],
    ["──", "  "],
    ["─", " "],
    ["┤ ", "│ "],
  ]);
});
