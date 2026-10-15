/** RGBA pixels: `stride` bytes per row. */
export type Pixels = {
  data: Uint8Array;
  width: number;
  height: number;
  stride: number;
};

/** A box of whole cells in a frame drawn over `cols` × `rows` cells. */
export type CellBox = { col: number; row: number; cols: number; rows: number };

/** A box of pixels. */
export type PixelBox = { x: number; y: number; width: number; height: number };

/** The pixel edge of cell `n` of `cells` across `size` pixels, as a frame drawn over them splits it. */
const edge = (n: number, size: number, cells: number) =>
  Math.round((n * size) / cells);

/** The pixels of cell box `b` in a `width` × `height` frame drawn over `cols` × `rows` cells. */
export function cellPixels(
  b: CellBox,
  width: number,
  height: number,
  cols: number,
  rows: number,
): PixelBox {
  const x = edge(b.col, width, cols);
  const y = edge(b.row, height, rows);
  return {
    x,
    y,
    width: edge(b.col + b.cols, width, cols) - x,
    height: edge(b.row + b.rows, height, rows) - y,
  };
}

/** The first and last differing bytes of two rows, or undefined when they are the same. */
function rowSpan(a: Uint8Array, b: Uint8Array): [number, number] | undefined {
  // Most rows match: a native compare clears them before the byte scan.
  if (Buffer.compare(a, b) === 0) return undefined;
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  if (i === a.length) return undefined;
  let j = a.length - 1;
  while (a[j] === b[j]) j--;
  return [i, j];
}

/**
 * The cells whose pixels differ between two frames of the same size drawn
 * over `cols` × `rows` cells, top to bottom: one box per band of changed
 * rows, so a clock in a header and an animation below it stay apart. Empty
 * when the frames match.
 */
export function changedBoxes(
  a: Pixels,
  b: Pixels,
  cols: number,
  rows: number,
): CellBox[] {
  // Per cell row, the leftmost and rightmost changed pixel.
  const left = new Array<number>(rows).fill(Number.POSITIVE_INFINITY);
  const right = new Array<number>(rows).fill(-1);
  const rowBytes = a.width * 4;
  for (let y = 0; y < a.height; y++) {
    const span = rowSpan(
      a.data.subarray(y * a.stride, y * a.stride + rowBytes),
      b.data.subarray(y * b.stride, y * b.stride + rowBytes),
    );
    if (span === undefined) continue;
    const r = Math.floor((y * rows) / a.height);
    left[r] = Math.min(left[r] ?? 0, Math.floor(span[0] / 4));
    right[r] = Math.max(right[r] ?? 0, Math.floor(span[1] / 4));
  }
  // A cell more on each side: cell edges are rounded, so a pixel near one
  // may belong to the cell beside the one it divides into. Bands that then
  // touch become one.
  const boxes: CellBox[] = [];
  for (let r = 0; r < rows; r++) {
    const l = left[r] ?? 0;
    const rt = right[r] ?? -1;
    if (rt < 0) continue;
    const col = Math.max(0, Math.floor((l * cols) / a.width) - 1);
    const colEnd = Math.min(cols, Math.floor((rt * cols) / a.width) + 2);
    const box = {
      col,
      row: Math.max(0, r - 1),
      cols: colEnd - col,
      rows: Math.min(rows, r + 2) - Math.max(0, r - 1),
    };
    const last = boxes.at(-1);
    if (last !== undefined && box.row <= last.row + last.rows)
      boxes[boxes.length - 1] = union(last, box);
    else boxes.push(box);
  }
  return boxes;
}

/** Copy box `p` of `from` into `to`, both frames of the same size. */
export function copyBox(from: Pixels, to: Pixels, p: PixelBox): void {
  for (let y = p.y; y < p.y + p.height; y++) {
    const at = (s: Pixels) => y * s.stride + p.x * 4;
    to.data.set(from.data.subarray(at(from), at(from) + p.width * 4), at(to));
  }
}

/** Whether box `inner` lies inside box `outer`. */
export const within = (inner: CellBox, outer: CellBox) =>
  inner.col >= outer.col &&
  inner.row >= outer.row &&
  inner.col + inner.cols <= outer.col + outer.cols &&
  inner.row + inner.rows <= outer.row + outer.rows;

/** The smallest box holding both. */
export function union(a: CellBox, b: CellBox): CellBox {
  const col = Math.min(a.col, b.col);
  const row = Math.min(a.row, b.row);
  return {
    col,
    row,
    cols: Math.max(a.col + a.cols, b.col + b.cols) - col,
    rows: Math.max(a.row + a.rows, b.row + b.rows) - row,
  };
}
