import type { Pos, Range } from "./pos";
import type { TextBuffer } from "./text-buffer";

/**
 * Lines from `from` on (numbered in the old text) moved by `delta`; when
 * lines were removed, the old lines from `removed` up to `from` are gone.
 */
export type LineShift = { from: number; delta: number; removed: number };

/**
 * How an edit from `prev` to `next` moved the lines below it: lines equal at
 * both ends are matched, and the ones after the differing middle moved by
 * the change in line count. Undefined when the line count is the same.
 */
export function lineShift(
  prev: TextBuffer,
  next: TextBuffer,
): LineShift | undefined {
  const n = prev.lineCount;
  const m = next.lineCount;
  if (n === m) return undefined;
  let head = 0;
  while (head < n && head < m && prev.line(head) === next.line(head)) head++;
  let tail = 0;
  while (
    tail < n - head &&
    tail < m - head &&
    prev.line(n - 1 - tail) === next.line(m - 1 - tail)
  )
    tail++;
  const from = n - tail;
  const delta = m - n;
  return {
    from,
    delta,
    removed: delta < 0 ? Math.max(head, from + delta) : from,
  };
}

/** Whether `line` (in the old text) was removed by the edit. */
export const lineRemoved = (line: number, s: LineShift): boolean =>
  line >= s.removed && line < s.from;

export const shiftPos = (p: Pos, s: LineShift): Pos =>
  p.line >= s.from ? { line: p.line + s.delta, col: p.col } : p;

export const shiftRange = (r: Range, s: LineShift): Range =>
  r.end.line < s.from
    ? r
    : { start: shiftPos(r.start, s), end: shiftPos(r.end, s) };
