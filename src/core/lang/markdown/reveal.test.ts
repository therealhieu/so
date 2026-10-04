import { expect, test } from "bun:test";
import { noteView } from "../../../../test/support/markdown";
import { reveal } from "./reveal";

const NOTE = [
  "Intro line",
  "",
  "| a | b |",
  "|---|---|",
  "| 1 | 2 |",
  "",
  "After the table",
].join("\n");

const tableId = (doc: ReturnType<typeof noteView>["doc"]) =>
  doc.blocks.find((b) => b.startLine === 2)?.id;

test("a selection reveals every selected line and the table it touches", () => {
  const { v, doc } = noteView(NOTE);
  const shown = reveal(
    doc,
    "live",
    { line: 4, col: 0 },
    { start: { line: 3, col: 0 }, end: { line: 4, col: 3 } },
    v.buf,
  );
  expect([...shown.lines]).toEqual([3, 4]);
  expect([...shown.blocks]).toEqual([tableId(doc) as number]);
});

test("moving the cursor out of a table stops revealing it", () => {
  const { v, doc } = noteView(NOTE);
  const shown = reveal(doc, "live", { line: 6, col: 0 }, undefined, v.buf);
  expect([...shown.lines]).toEqual([6]);
  expect(shown.blocks.size).toBe(0);
});

test("reading view reveals nothing", () => {
  const { v, doc } = noteView(NOTE);
  const shown = reveal(
    doc,
    "reading",
    { line: 4, col: 0 },
    { start: { line: 3, col: 0 }, end: { line: 4, col: 3 } },
    v.buf,
  );
  expect(shown.lines.size).toBe(0);
  expect(shown.blocks.size).toBe(0);
});
