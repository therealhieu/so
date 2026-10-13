import { cellWidth, clusters } from "../text/cells";
import type { Span } from "./types";

/** The most extra cells a gap between words takes before a row stays ragged. */
const MAX_PER_GAP = 3;

const blank = (ch: string) => ch === " " || ch === "\t";

/**
 * Extra cells drawn before each display column of the wrap row [start, end)
 * to stretch it to `width`, indexed by column − start, with one entry for
 * `end`. The cells go to the gaps between words, the leftmost gaps first;
 * only spaces of buffer text stretch, never leading indent or inserted and
 * virtual text. Undefined when the row stays as it is: the last row of a
 * line (`end` undefined), a row without gaps, or one needing more than
 * three extra cells per gap.
 */
export function justifyRow(
  spans: readonly Span[],
  start: number,
  end: number | undefined,
  width: number,
  tabWidth: number,
): number[] | undefined {
  if (end === undefined || end <= start) return undefined;
  const n = end - start;
  /** Per cell of the row: its character and whether it may stretch. */
  const chars: string[] = [];
  const own: boolean[] = [];
  let v = 0;
  for (const span of spans) {
    if (span.virtual === "eol") continue;
    const text = span.virtual === undefined && span.inserted !== true;
    for (const ch of clusters(span.text)) {
      const w = cellWidth(ch, v, tabWidth);
      for (let i = 0; i < w; i++, v++)
        if (v >= start && v < end) {
          chars.push(ch);
          own.push(text);
        }
    }
  }
  const stretch = (i: number) => own[i] === true && chars[i] === " ";
  let last = chars.length;
  while (last > 0 && blank(chars[last - 1] ?? "")) last--;
  // Gaps start after the first word of buffer text, past any indent or marker.
  let first = 0;
  while (first < last && !(own[first] && !blank(chars[first] ?? ""))) first++;
  /** Columns, from the row start, of the words that follow a gap. */
  const gaps: number[] = [];
  for (let i = first + 1; i < last; i++)
    if (stretch(i - 1) && !blank(chars[i] ?? "")) gaps.push(i);
  const extra = width - last;
  if (gaps.length === 0 || extra <= 0 || extra > MAX_PER_GAP * gaps.length)
    return undefined;
  const base = Math.floor(extra / gaps.length);
  const more = extra % gaps.length;
  const shift = new Array<number>(n + 1).fill(0);
  let added = 0;
  let g = 0;
  for (let i = 0; i <= n; i++) {
    if (gaps[g] === i) {
      added += base + (g < more ? 1 : 0);
      g++;
    }
    shift[i] = added;
  }
  return shift;
}

/**
 * The column, from the row start, a stretched row shows at cell `x`: an
 * extra cell belongs to the space before it.
 */
export function colAtCell(shift: readonly number[], x: number): number {
  let col = 0;
  for (let i = 0; i < shift.length - 1; i++)
    if (i + (shift[i] ?? 0) <= x) col = i;
    else break;
  return col;
}
