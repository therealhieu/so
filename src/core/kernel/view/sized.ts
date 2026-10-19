import { cellWidth, clusters } from "../text/cells";
import type { SizedChunk, SizedScale, Span, StyleToken } from "./types";

type Unit = { ch: string; w: number; style: StyleToken; under?: StyleToken };

const sameLook = (a: Unit, b: Unit) =>
  a.style === b.style && a.under === b.under;

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/**
 * Normal-size cells one chunk holds: the fewest that fill whole double
 * cells at `scale` (8 at 7/8, 5 at 4/5, 10 at 7/10). kitty draws a chunk in
 * at most 7 double cells, so `n / gcd(n, d)` must not pass 7.
 */
const chunkPart = ({ n, d }: SizedScale) => d / gcd(n, d);

/** Columns a chunk of `w` normal-size cells takes at `scale`: whole double cells. */
const scaledCells = (w: number, { n, d }: SizedScale) =>
  2 * Math.ceil((n * w) / d);

/**
 * `units` as chunks: a same-look run is cut every `chunkPart` cells, so only
 * a run's last chunk leaves part of a double cell empty.
 */
function chunksOf(units: readonly Unit[], scale: SizedScale): SizedChunk[] {
  const part = chunkPart(scale);
  const out: SizedChunk[] = [];
  let first: Unit | undefined;
  let text = "";
  let w = 0;
  const flush = () => {
    if (first === undefined) return;
    const { style, under } = first;
    const cells = scaledCells(w, scale);
    out.push(
      under === undefined
        ? { text, style, cells }
        : { text, style, under, cells },
    );
  };
  for (const u of units) {
    if (first !== undefined && sameLook(first, u) && w + u.w <= part) {
      text += u.ch;
      w += u.w;
      continue;
    }
    flush();
    first = u;
    text = u.ch;
    w = u.w;
  }
  flush();
  return out;
}

/**
 * `text` as half-size script spans, two characters to a cell, or undefined
 * when a character is not one cell wide.
 */
export function scriptSpans(
  text: string,
  place: "sup" | "sub",
  style: StyleToken,
): Span[] | undefined {
  const chars = [...clusters(text)];
  if (chars.length === 0 || chars.some((ch) => cellWidth(ch, 0, 1) !== 1))
    return undefined;
  const out: Span[] = [];
  for (let i = 0; i < chars.length; i += 2) {
    const first = chars[i] ?? "";
    const pair = first + (chars[i + 1] ?? "");
    out.push({ text: first, style, script: { text: pair, place } });
  }
  return out;
}

const cellsOf = (chunks: readonly SizedChunk[]) =>
  chunks.reduce((n, c) => n + c.cells, 0);

/**
 * A line's spans as rows of sized chunks within `width` columns. A row
 * breaks after its last space, else mid-word, like `wrapLine`; a tab counts
 * as one cell.
 */
export function wrapSized(
  spans: readonly Span[],
  scale: SizedScale,
  width: number,
): SizedChunk[][] {
  const units: Unit[] = [];
  for (const sp of spans) {
    if (sp.virtual === "eol") continue;
    for (const ch of clusters(sp.text))
      units.push({
        ch,
        w: cellWidth(ch, 0, 1),
        style: sp.style,
        ...(sp.under === undefined ? {} : { under: sp.under }),
      });
  }
  const fits = (from: number, to: number) =>
    cellsOf(chunksOf(units.slice(from, to), scale)) <= width;
  const starts = [0];
  let rowStart = 0;
  let afterBlank = 0;
  for (let i = 0; i < units.length; i++) {
    while (!fits(rowStart, i + 1) && i > rowStart) {
      rowStart = afterBlank > rowStart ? afterBlank : i;
      afterBlank = rowStart;
      starts.push(rowStart);
    }
    const ch = units[i]?.ch;
    if (ch === " " || ch === "\t") afterBlank = i + 1;
  }
  return starts.map((from, r) =>
    chunksOf(units.slice(from, starts[r + 1] ?? units.length), scale),
  );
}
