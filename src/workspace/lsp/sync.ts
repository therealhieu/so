import type { Range } from "../../core/kernel/text/pos";
import type { TextBuffer } from "../../core/kernel/text/text-buffer";

/** One incremental change: replace `range` of the old text with `text`. */
export type LineChange = { range: Range; text: string };

/**
 * The single change from `prev` to `next`: lines equal at both ends are
 * skipped and the differing middle is replaced; undefined when equal.
 */
export function lineChange(
  prev: TextBuffer,
  next: TextBuffer,
): LineChange | undefined {
  const n = prev.lineCount;
  const m = next.lineCount;
  let head = 0;
  while (head < n && head < m && prev.line(head) === next.line(head)) head++;
  if (head === n && head === m) return undefined;
  let tail = 0;
  while (
    tail < n - head &&
    tail < m - head &&
    prev.line(n - 1 - tail) === next.line(m - 1 - tail)
  )
    tail++;
  const middle: string[] = [];
  for (let i = head; i < m - tail; i++) middle.push(next.line(i));
  if (tail > 0)
    // Whole lines up to the first equal line at the end.
    return {
      range: { start: { line: head, col: 0 }, end: { line: n - tail, col: 0 } },
      text: middle.map((l) => `${l}\n`).join(""),
    };
  const end = { line: n - 1, col: prev.line(n - 1).length };
  if (head === 0)
    return {
      range: { start: { line: 0, col: 0 }, end },
      text: middle.join("\n"),
    };
  // The middle runs to the end: replace from the end of the last equal line.
  return {
    range: {
      start: { line: head - 1, col: prev.line(head - 1).length },
      end,
    },
    text: middle.map((l) => `\n${l}`).join(""),
  };
}
