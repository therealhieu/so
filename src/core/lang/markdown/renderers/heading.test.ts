import { expect, test } from "bun:test";
import { noteView, stubCtx } from "../../../../../test/support/markdown";
import type { Decoration } from "../../../kernel/view/decorations";
import type { SizedBlock } from "../../../kernel/view/types";
import { headingRenderer, headingScale } from "./heading";

const render = (text: string, width: number, sizedText: boolean) => {
  const { v, doc } = noteView(text, { width });
  const block = doc.blocks[0];
  if (block === undefined) throw new Error("no block");
  return headingRenderer(block, v, {
    doc,
    view: "reading",
    ctx: stubCtx({ sizedText }),
  });
};
const sized = (decos: Decoration[]) => {
  const d = decos[0];
  if (decos.length !== 1 || d?.kind !== "replace" || d.widget === undefined)
    throw new Error("not one sized widget");
  return { range: d.range, block: d.block, widget: d.widget };
};

test("an H1 becomes one sized block of two rows per wrapped row, without a glyph", () => {
  const one = sized(render("# Raft", 20, true));
  expect(one.block).toBe(true);
  expect(one.range).toEqual({
    start: { line: 0, col: 0 },
    end: { line: 0, col: 6 },
  });
  expect(one.widget).toEqual({
    type: "sizedText",
    rows: 2,
    data: {
      scale: { n: 7, d: 8, wordSpace: 1 },
      rows: [[{ text: "Raft", style: "mdHeading1", cells: 8 }]],
    },
  });
  expect(sized(render("# Leader leases", 20, true)).widget.rows).toBe(4);
  expect(sized(render("# Leader leases", 40, true)).widget.rows).toBe(2);
});

test("an H2 is sized at 1.6× with its inline styles as separate chunks", () => {
  const { widget } = sized(render("## A **bold** move", 40, true));
  const data = widget.data as SizedBlock;
  expect(widget.rows).toBe(2);
  expect(data.scale).toEqual({ n: 4, d: 5 });
  expect(data.rows[0]?.map((c) => c.text)).toEqual(["A ", "bold", " move"]);
  expect(data.rows[0]?.[1]).toMatchObject({
    style: "mdBold",
    under: "mdHeading2",
  });
});

test("a setext H1 or H2 is one sized block over its text lines and underline", () => {
  const h1 = sized(render("Raft\n====", 20, true));
  expect(h1.block).toBe(true);
  expect(h1.range).toEqual({
    start: { line: 0, col: 0 },
    end: { line: 1, col: 4 },
  });
  expect(h1.widget).toEqual({
    type: "sizedText",
    rows: 2,
    data: {
      scale: { n: 7, d: 8, wordSpace: 1 },
      rows: [[{ text: "Raft", style: "mdHeading1", cells: 8 }]],
    },
  });
  const h2 = sized(render("Raft\n  leases\n---", 40, true));
  expect(h2.range.end).toEqual({ line: 2, col: 3 });
  const data = h2.widget.data as SizedBlock;
  expect(data.scale).toEqual({ n: 4, d: 5 });
  expect(data.rows.map((r) => r.map((c) => c.text).join(""))).toEqual([
    "Raft leases",
  ]);
  const plain = render("Raft\n====", 20, false);
  expect(plain.some((d) => d.kind === "replace" && d.widget)).toBe(false);
});

test("an H3 is sized at 1.4×", () => {
  expect(sized(render("### Raft", 20, true)).widget).toEqual({
    type: "sizedText",
    rows: 2,
    data: {
      scale: { n: 7, d: 10, words: true },
      rows: [[{ text: "Raft", style: "mdHeading3", cells: 6, w: 4 }]],
    },
  });
});

test("H4 and sized text off keep the glyph decorations", () => {
  expect(render("#### Raft", 20, true)).toEqual(render("#### Raft", 20, false));
  expect(render("# Raft", 20, false)).toEqual([
    { kind: "line", line: 0, style: "mdHeading1" },
    {
      kind: "replace",
      range: { start: { line: 0, col: 0 }, end: { line: 0, col: 2 } },
      block: false,
      spans: [{ text: "█ ", style: "mdHeading1" }],
    },
  ]);
});

test("headings keep their sizes at 1× and keep about those factors of the zoomed body", () => {
  expect([1, 2, 3, 4].map((depth) => headingScale(depth, 1))).toEqual([
    { n: 7, d: 8, wordSpace: 1 },
    { n: 4, d: 5 },
    { n: 7, d: 10, words: true },
    undefined,
  ]);
  const size = (x: SizedBlock["scale"] | undefined) =>
    x === undefined ? 0 : ((x.s ?? 2) * x.n) / x.d;
  for (const zoom of [1.1, 1.3, 1.5, 1.7, 1.9, 2, 2.5, 3]) {
    const sizes = [1, 2, 3].map((depth) => size(headingScale(depth, zoom)));
    expect(sizes[2]).toBeGreaterThan(zoom);
    expect(sizes).toEqual([...sizes].sort((a, b) => b - a));
    [1.75, 1.6, 1.4].forEach((factor, i) => {
      expect(Math.abs((sizes[i] ?? 0) / zoom - factor)).toBeLessThan(0.2);
    });
  }
  expect([1, 2, 3].map((depth) => headingScale(depth, 1.5))).toEqual([
    { s: 3, n: 7, d: 8, words: true },
    { s: 3, n: 5, d: 6, words: true },
    { s: 2, n: 1, d: 1, words: true },
  ]);
});

test("in a zoomed reading view a heading is drawn larger, its rows that many screen rows", () => {
  const { v, doc } = noteView("# Raft", { width: 80 });
  const block = doc.blocks[0];
  if (block === undefined) throw new Error("no block");
  const [d] = headingRenderer(block, v, {
    doc,
    view: "reading",
    ctx: stubCtx({ sizedText: true, zoom: 2 }),
  });
  if (d?.kind !== "replace" || d.widget === undefined)
    throw new Error("not sized");
  expect(d.widget.rows).toBe(4);
  expect((d.widget.data as SizedBlock).scale.s).toBe(4);
});
