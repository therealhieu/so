import { expect, test } from "bun:test";
import type { TableModel } from "../../core/features/bases/table";
import { layoutBaseTable } from "./base";

const table = (widths: number[]): TableModel => ({
  columns: widths.map((width, i) => ({
    id: `note.c${i}`,
    label: `c${i}`,
    editable: true,
    type: "text",
    width,
  })),
  rows: [
    {
      path: "a.md",
      cells: widths.map(() => ({
        text: "x",
        value: { type: "string", value: "x" },
      })),
    },
  ],
  groups: [],
  summaries: [],
  total: 1,
  diagnostics: [],
});

const rect = (w: number) => ({ x: 0, y: 0, w, h: 20 });
const shown = (l: ReturnType<typeof layoutBaseTable>) =>
  l.cols.map((c) => c.index);

test("a table that fits shows every column with no markers", () => {
  const l = layoutBaseTable(rect(40), table([10, 10]));
  expect(l.cols).toEqual([
    { index: 0, x: 3, w: 10 },
    { index: 1, x: 16, w: 10 },
  ]);
  expect([l.left, l.right]).toEqual([0, 0]);
});

test("a wide table pins the first column and clips the next one into the room left", () => {
  const l = layoutBaseTable(rect(80), table([20, 30, 30, 30]));
  expect(l.cols).toEqual([
    { index: 0, x: 3, w: 20 },
    { index: 1, x: 26, w: 30 },
    { index: 2, x: 59, w: 10, clipped: true },
  ]);
  expect([l.left, l.right]).toEqual([0, 2]);
});

test("too little room left draws no clipped column", () => {
  const l = layoutBaseTable(rect(80), table([20, 36, 30, 30]));
  expect(shown(l)).toEqual([0, 1]);
  expect(l.right).toBe(2);
});

test("scrolled columns keep the first column pinned with a gutter for the left marker", () => {
  const l = layoutBaseTable(rect(80), table([20, 20, 20, 20, 20]), undefined, {
    top: 0,
    col: 1,
  });
  expect(l.cols).toEqual([
    { index: 0, x: 3, w: 20 },
    { index: 2, x: 32, w: 20 },
    { index: 3, x: 55, w: 14, clipped: true },
  ]);
  expect([l.left, l.right]).toEqual([1, 2]);
});

test("focus on the pinned column keeps the columns scrolled", () => {
  const l = layoutBaseTable(
    rect(80),
    table([20, 20, 20, 20, 20]),
    { row: 0, column: 0 },
    { top: 0, col: 1 },
  );
  expect(shown(l)).toEqual([0, 2, 3]);
  expect(l.cursor).toEqual({ x: 3, y: 2 });
});

test("focus on the clipped column scrolls until it shows whole", () => {
  const l = layoutBaseTable(rect(80), table([20, 30, 30, 30]), {
    row: 0,
    column: 2,
  });
  expect(l.cols).toEqual([
    { index: 0, x: 3, w: 20 },
    { index: 2, x: 32, w: 30 },
  ]);
  expect([l.left, l.right]).toEqual([1, 1]);
  expect(l.cursor).toEqual({ x: 32, y: 2 });
});

test("a wide first column is pinned at half the width", () => {
  const l = layoutBaseTable(rect(80), table([60, 20, 20]));
  expect(l.cols[0]).toEqual({ index: 0, x: 3, w: 38 });
  expect(shown(l)).toEqual([0, 1]);
});

test("a scrolled column wider than the room left is cut to it", () => {
  const l = layoutBaseTable(rect(80), table([20, 70, 20]));
  expect(l.cols).toEqual([
    { index: 0, x: 3, w: 20 },
    { index: 1, x: 26, w: 43 },
  ]);
  expect(l.right).toBe(1);
});
