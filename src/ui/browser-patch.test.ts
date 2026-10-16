import { expect, test } from "bun:test";
import {
  cellPixels,
  changedBoxes,
  copyBox,
  type Pixels,
  union,
  within,
} from "./browser-patch";

/** A `width` × `height` frame of one grey, with room for `pad` bytes after each row. */
const frame = (width: number, height: number, pad = 0): Pixels => {
  const stride = width * 4 + pad;
  return {
    data: new Uint8Array(stride * height).fill(128),
    width,
    height,
    stride,
  };
};
const paint = (p: Pixels, x: number, y: number) => {
  p.data[y * p.stride + x * 4] = 0;
};

// A 160 × 80 frame over 10 × 5 cells: 16 × 16 pixels a cell.
test("frames that match have no changed cells", () => {
  expect(changedBoxes(frame(160, 80), frame(160, 80), 10, 5)).toEqual([]);
});

test("a changed pixel marks its cell and one on each side", () => {
  const b = frame(160, 80);
  paint(b, 40, 40);
  expect(changedBoxes(frame(160, 80), b, 10, 5)).toEqual([
    { col: 1, row: 1, cols: 3, rows: 3 },
  ]);
});

test("changes in rows close together share a box, kept inside the frame", () => {
  const b = frame(160, 80);
  paint(b, 0, 0);
  paint(b, 159, 40);
  expect(changedBoxes(frame(160, 80), b, 10, 5)).toEqual([
    { col: 0, row: 0, cols: 10, rows: 4 },
  ]);
});

test("changes in rows far apart get a box each, top to bottom", () => {
  // 10 × 10 cells of 16 pixels: a clock in row 0, an animation in row 8.
  const a = frame(160, 160);
  const b = frame(160, 160);
  paint(b, 150, 2);
  paint(b, 40, 135);
  expect(changedBoxes(a, b, 10, 10)).toEqual([
    { col: 8, row: 0, cols: 2, rows: 2 },
    { col: 1, row: 7, cols: 3, rows: 3 },
  ]);
});

test("a change past the limit stops the comparison", () => {
  // 10 × 5 cells: every row changed is 50 cells, one changed pixel is 1.
  const a = frame(160, 80);
  const scrolled = frame(160, 80);
  scrolled.data.fill(0);
  expect(changedBoxes(a, scrolled, 10, 5, 12)).toBeUndefined();
  const caret = frame(160, 80);
  paint(caret, 40, 40);
  expect(changedBoxes(a, caret, 10, 5, 12)).toEqual([
    { col: 1, row: 1, cols: 3, rows: 3 },
  ]);
});

test("padding after a row is not compared", () => {
  const a = frame(160, 80, 8);
  const b = frame(160, 80, 8);
  b.data[a.width * 4 + 3] = 0;
  expect(changedBoxes(a, b, 10, 5)).toEqual([]);
});

test("a cell box covers the pixels the frame draws in those cells", () => {
  expect(
    cellPixels({ col: 1, row: 1, cols: 3, rows: 3 }, 160, 80, 10, 5),
  ).toEqual({ x: 16, y: 16, width: 48, height: 48 });
  // 100 pixels over 3 cells: edges at 0, 33, 67, 100.
  expect(
    cellPixels({ col: 1, row: 0, cols: 1, rows: 1 }, 100, 10, 3, 1),
  ).toEqual({ x: 33, y: 0, width: 34, height: 10 });
});

test("copying a box changes only that box", () => {
  const from = frame(160, 80);
  const to = frame(160, 80, 4);
  from.data.fill(7);
  copyBox(from, to, { x: 16, y: 16, width: 16, height: 16 });
  expect(changedBoxes(frame(160, 80, 4), to, 10, 5)).toEqual([
    { col: 0, row: 0, cols: 3, rows: 3 },
  ]);
  expect(to.data[16 * to.stride + 16 * 4]).toBe(7);
  expect(to.data[16 * to.stride + 15 * 4]).toBe(128);
  expect(to.data[32 * to.stride + 16 * 4]).toBe(128);
});

test("a box lies within another only when no edge sticks out", () => {
  const outer = { col: 1, row: 1, cols: 4, rows: 4 };
  expect(within({ col: 2, row: 2, cols: 2, rows: 2 }, outer)).toBe(true);
  expect(within(outer, outer)).toBe(true);
  expect(within({ col: 2, row: 2, cols: 4, rows: 2 }, outer)).toBe(false);
});

test("the union of two boxes spans both", () => {
  expect(
    union(
      { col: 10, row: 5, cols: 6, rows: 2 },
      { col: 40, row: 1, cols: 3, rows: 1 },
    ),
  ).toEqual({ col: 10, row: 1, cols: 33, rows: 6 });
});
