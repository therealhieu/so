import { cellWidth, clusters } from "../text/cells";
import type { SizedBlock, SizedChunk, Span, StyleToken } from "./types";

/** Normal-size cells one 1.5× chunk holds. */
const PART = 4;

type Unit = { ch: string; w: number; style: StyleToken; under?: StyleToken };

const sameLook = (a: Unit, b: Unit) =>
  a.style === b.style && a.under === b.under;

/** Columns a chunk of `w` normal-size cells takes at `scale`: whole 2× cells. */
const scaledCells = (w: number, scale: SizedBlock["scale"]) =>
  scale === 2 ? 2 * w : 2 * Math.ceil((1.5 * w) / 2);

/**
 * `units` as chunks: at 2× each same-look run is one chunk; at 1.5× a run is
 * cut every `PART` cells, so each chunk's width rounds up by at most one cell.
 */
function chunksOf(
  units: readonly Unit[],
  scale: SizedBlock["scale"],
): SizedChunk[] {
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
    if (
      first !== undefined &&
      sameLook(first, u) &&
      (scale === 2 || w + u.w <= PART)
    ) {
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

const cellsOf = (chunks: readonly SizedChunk[]) =>
  chunks.reduce((n, c) => n + c.cells, 0);

/**
 * A line's spans as rows of sized chunks within `width` columns. A row
 * breaks after its last space, else mid-word, like `wrapLine`; a tab counts
 * as one cell.
 */
export function wrapSized(
  spans: readonly Span[],
  scale: SizedBlock["scale"],
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
