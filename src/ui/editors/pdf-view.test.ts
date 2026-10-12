import { expect, test } from "bun:test";
import type { NativeImage } from "@opentui/core";
import { punch, slotted } from "./pdf-view";

/** A 10×10-cell piece showing a 100×200-pixel image. */
const piece = {
  image: {} as NativeImage,
  x: 0,
  y: 0,
  cols: 10,
  rows: 10,
  srcX: 0,
  srcY: 0,
  srcW: 100,
  srcH: 200,
};

const cellsOf = (ps: (typeof piece)[]) =>
  ps.reduce((n, p) => n + p.cols * p.rows, 0);

test("a piece away from the hole stays whole", () => {
  expect(punch([piece], { x: 20, y: 0, w: 3, h: 3 })).toEqual([piece]);
});

test("a hole inside a piece leaves four parts showing their own slices", () => {
  const parts = punch([piece], { x: 2, y: 3, w: 4, h: 2 });
  expect(parts.map(({ image: _, ...p }) => p)).toEqual([
    { x: 0, y: 0, cols: 10, rows: 3, srcX: 0, srcY: 0, srcW: 100, srcH: 60 },
    { x: 0, y: 3, cols: 2, rows: 2, srcX: 0, srcY: 60, srcW: 20, srcH: 40 },
    { x: 6, y: 3, cols: 4, rows: 2, srcX: 60, srcY: 60, srcW: 40, srcH: 40 },
    { x: 0, y: 5, cols: 10, rows: 5, srcX: 0, srcY: 100, srcW: 100, srcH: 100 },
  ]);
  expect(cellsOf(parts)).toBe(100 - 8);
});

test("a hole over an edge or the whole piece leaves only what is outside it", () => {
  const edge = punch([piece], { x: 8, y: 8, w: 5, h: 5 });
  expect(cellsOf(edge)).toBe(100 - 4);
  expect(punch([piece], { x: -1, y: -1, w: 20, h: 20 })).toEqual([]);
});

test("the page keeps four slots, whole without a hole and around one with it; tinted blocks come after", () => {
  const block = { ...piece, image: {} as NativeImage, y: 2, rows: 2, srcH: 40 };
  const whole = slotted([piece, block], undefined);
  expect(whole).toEqual([piece, piece, piece, piece, block]);
  const around = slotted([piece, block], { x: 2, y: 6, w: 4, h: 2 });
  expect(around.slice(0, 4).every((p) => p.image === piece.image)).toBe(true);
  expect(around[4]).toBe(block);
  const edge = slotted([piece], { x: 0, y: 0, w: 10, h: 3 });
  expect(edge).toHaveLength(4);
  expect(edge.every((p) => p.y >= 3)).toBe(true);
});
