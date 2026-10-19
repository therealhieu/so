import { expect, test } from "bun:test";
import { noteView, stubCtx } from "../../../../../test/support/markdown";
import type { Decoration } from "../../../kernel/view/decorations";
import type { SizedBlock } from "../../../kernel/view/types";
import { headingRenderer } from "./heading";

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

test("an H1 becomes one sized block of two rows per wrapped row", () => {
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
      scale: 2,
      rows: [[{ text: "█ Raft", style: "mdHeading1", cells: 12 }]],
    },
  });
  expect(sized(render("# Leader leases", 20, true)).widget.rows).toBe(4);
  expect(sized(render("# Leader leases", 40, true)).widget.rows).toBe(2);
});

test("an H2 is sized at 1.5× with its inline styles as separate chunks", () => {
  const { widget } = sized(render("## A **bold** move", 40, true));
  const data = widget.data as SizedBlock;
  expect(widget.rows).toBe(2);
  expect(data.scale).toBe(1.5);
  expect(data.rows[0]?.map((c) => c.text)).toEqual([
    "▊ A ",
    "bold",
    " mov",
    "e",
  ]);
  expect(data.rows[0]?.[1]).toMatchObject({
    style: "mdBold",
    under: "mdHeading2",
  });
});

test("H3 and sized text off keep the glyph decorations", () => {
  expect(render("### Raft", 20, true)).toEqual(render("### Raft", 20, false));
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
