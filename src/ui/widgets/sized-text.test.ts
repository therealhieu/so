import { afterEach, beforeEach, expect, test } from "bun:test";
import { OptimizedBuffer, ResourceContext } from "@opentui/core";
import { wrapSized } from "../../core/kernel/view/sized";
import type { SizedBlock } from "../../core/kernel/view/types";
import type { CellRect } from "../sized-text";
import { themes } from "../theme";
import type { PaintTarget } from "./registry";
import { paintSizedText } from "./sized-text";

const H1 = { n: 7, d: 8, wordSpace: 1 };
const WIDTH = 60;

let owner: ResourceContext;
beforeEach(() => {
  owner = new ResourceContext({
    objectCapacity: 16,
    renderCellsMax: 4 * WIDTH,
  });
});
afterEach(() => owner.destroy());

/** The heading painted in `rows` rows: its first row's text and the draws sent. */
function paint(text: string, rows: number) {
  const block: SizedBlock = {
    scale: H1,
    rows: wrapSized([{ text, style: "mdHeading1" }], H1, WIDTH),
  };
  const buf = OptimizedBuffer.create(WIDTH, rows, "unicode", { owner });
  const draws: CellRect[][] = [];
  try {
    const t = {
      buf,
      theme: themes.dark,
      x: 0,
      y: 0,
      width: WIDTH,
      rows,
      deps: {
        sizedText: { draw: (_: unknown, r: CellRect[]) => draws.push(r) },
      },
    } as unknown as PaintTarget;
    paintSizedText(t, {
      type: "sizedText",
      data: block,
      rows: 2 * block.rows.length,
    });
    const line = buf.withBuffers((cells) =>
      String.fromCharCode(...cells.char.slice(0, WIDTH)),
    );
    return { line: line.trimEnd(), draws };
  } finally {
    buf.destroy();
  }
}

test("a whole sized heading leaves the cells between its words blank", () => {
  const { line, draws } = paint("Chapter 12. Concurrency in Go", 2);
  expect(draws).toHaveLength(1);
  // Chapter takes 14 cells, a blank, 12. takes 6, a blank, then Concurre.
  expect(line.slice(0, 23)).toBe(
    `${"Chapter".padEnd(14)} ${"12.".padEnd(6)} C`,
  );
});

test("a sized heading cut at the window bottom keeps its text run together", () => {
  const { line, draws } = paint("Chapter 12. Concurrency in Go", 1);
  expect(draws).toHaveLength(0);
  expect(line).toBe("Chapter 12. Concurrency in Go");
});
