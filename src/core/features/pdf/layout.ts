import { decodeXml } from "./outline";

/** One word on a page and its box, in PDF points from the page's top left. */
export type PdfWord = {
  text: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
};

/** A page's size in points and its words, line by line in reading order. */
export type PdfPageLayout = {
  width: number;
  height: number;
  lines: PdfWord[][];
};

/** A point on a page as fractions of its width and height. */
export type PdfPoint = { x: number; y: number };

/**
 * Text selected on `page`, from the character at `anchor` to the one at
 * `head` in reading order. A press alone selects nothing until the pointer
 * moves; `by` selects from a double click (`word`) or a triple click
 * (`line`) even before it does, taking whole words or lines.
 */
export type PdfSelection = {
  page: number;
  anchor: PdfPoint;
  head: PdfPoint;
  by?: "word" | "line";
};

const num = (attrs: string, name: string): number =>
  Number(new RegExp(`\\b${name}="([^"]*)"`).exec(attrs)?.[1]);

const LINE = /<line\b[^>]*>([\s\S]*?)<\/line>/g;
const WORD = /<word\b([^>]*)>([\s\S]*?)<\/word>/g;

/**
 * The first page of `pdftotext -bbox-layout` output: `<page width height>`
 * holding `<line>`s of `<word xMin yMin xMax yMax>`. Words with no text or
 * no box are left out.
 */
export function parsePdfLayout(xml: string): PdfPageLayout {
  const page = /<page\b([^>]*)>([\s\S]*?)<\/page>/.exec(xml);
  const width = num(page?.[1] ?? "", "width");
  const height = num(page?.[1] ?? "", "height");
  const lines: PdfWord[][] = [];
  for (const l of (page?.[2] ?? "").matchAll(LINE)) {
    const words: PdfWord[] = [];
    for (const w of (l[1] ?? "").matchAll(WORD)) {
      const a = w[1] ?? "";
      const word = {
        text: decodeXml(w[2] ?? "").trim(),
        x0: num(a, "xMin"),
        y0: num(a, "yMin"),
        x1: num(a, "xMax"),
        y1: num(a, "yMax"),
      };
      if (
        word.text !== "" &&
        [word.x0, word.y0, word.x1, word.y1].every(Number.isFinite)
      )
        words.push(word);
    }
    if (words.length > 0) lines.push(words);
  }
  return {
    width: Number.isFinite(width) && width > 0 ? width : 1,
    height: Number.isFinite(height) && height > 0 ? height : 1,
    lines,
  };
}

/** Distance from `v` to the span `lo`..`hi`; 0 inside it. */
const gap = (v: number, lo: number, hi: number) =>
  v < lo ? lo - v : v > hi ? v - hi : 0;

type At = { line: number; word: number };

/**
 * The word at `p`: the nearest line (vertically, then across, so columns
 * side by side stay apart), then the nearest word in it. Undefined on a
 * page without text.
 */
export function wordAt(layout: PdfPageLayout, p: PdfPoint): At | undefined {
  const x = p.x * layout.width;
  const y = p.y * layout.height;
  let best: { at: At; dy: number; dx: number } | undefined;
  layout.lines.forEach((words, line) => {
    const first = words[0];
    const last = words.at(-1);
    if (first === undefined || last === undefined) return;
    const y0 = Math.min(...words.map((w) => w.y0));
    const y1 = Math.max(...words.map((w) => w.y1));
    const dy = gap(y, y0, y1);
    const dx = gap(x, first.x0, last.x1);
    if (
      best !== undefined &&
      (dy > best.dy || (dy === best.dy && dx >= best.dx))
    )
      return;
    let word = 0;
    let near = Number.POSITIVE_INFINITY;
    words.forEach((w, i) => {
      const d = gap(x, w.x0, w.x1);
      if (d < near) {
        near = d;
        word = i;
      }
    });
    best = { at: { line, word }, dy, dx };
  });
  return best?.at;
}

// Helvetica's advance widths (per 1000 em) for printable ASCII from the space.
const HELVETICA = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278,
  278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584,
  584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556,
  833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278,
  278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222,
  500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500,
  500, 334, 260, 334, 584,
];

/** A character's share of a word's width: Helvetica's, a full em for CJK. */
function advance(ch: string): number {
  const c = ch.codePointAt(0) ?? 0;
  if (c >= 0x2e80) return 1000;
  return HELVETICA[c - 32] ?? 556;
}

/**
 * Where each character of `w` starts, and where the last ends: Poppler
 * gives only word boxes, so the word's width is shared out by the
 * characters' widths in Helvetica, close for most fonts and finer than a
 * terminal cell.
 */
export function charEdges(w: PdfWord): number[] {
  const widths = [...w.text].map(advance);
  const total = widths.reduce((a, b) => a + b, 0) || 1;
  const edges = [w.x0];
  let at = 0;
  for (const width of widths) {
    at += width;
    edges.push(w.x0 + ((w.x1 - w.x0) * at) / total);
  }
  return edges;
}

/** A place between characters: before character `char` of a word (its length is after the last). */
type Caret = At & { char: number };

/** The caret nearest `p`, in the word `wordAt` finds. */
function caretAt(layout: PdfPageLayout, p: PdfPoint): Caret | undefined {
  const at = wordAt(layout, p);
  const w = at === undefined ? undefined : layout.lines[at.line]?.[at.word];
  if (at === undefined || w === undefined) return undefined;
  const x = p.x * layout.width;
  const edges = charEdges(w);
  let char = 0;
  edges.forEach((e, i) => {
    if (Math.abs(x - e) < Math.abs(x - (edges[char] ?? e))) char = i;
  });
  return { ...at, char };
}

const order = (a: Caret, b: Caret) =>
  a.line - b.line || a.word - b.word || a.char - b.char;

/**
 * The selected text, one run per line in reading order, each piece a word
 * or the part of one inside the selection with its box. A drag selects the
 * characters between the carets at its two ends, a double click whole
 * words, and a triple click whole lines.
 */
export function selectedWords(
  layout: PdfPageLayout,
  sel: PdfSelection,
): PdfWord[][] {
  const a = caretAt(layout, sel.anchor);
  const h = caretAt(layout, sel.head);
  if (a === undefined || h === undefined) return [];
  if (sel.by === undefined && order(a, h) === 0) return [];
  let [from, to] = order(a, h) <= 0 ? [a, h] : [h, a];
  if (sel.by !== undefined) {
    const last = layout.lines[to.line] ?? [];
    from =
      sel.by === "line" ? { ...from, word: 0, char: 0 } : { ...from, char: 0 };
    const word = sel.by === "line" ? last.length - 1 : to.word;
    to = { ...to, word, char: [...(last[word]?.text ?? "")].length };
  }
  const out: PdfWord[][] = [];
  for (let l = from.line; l <= to.line; l++) {
    const run: PdfWord[] = [];
    (layout.lines[l] ?? []).forEach((w, i) => {
      if ((l === from.line && i < from.word) || (l === to.line && i > to.word))
        return;
      const chars = [...w.text];
      const c0 = l === from.line && i === from.word ? from.char : 0;
      const c1 = l === to.line && i === to.word ? to.char : chars.length;
      if (c0 >= c1) return;
      const edges = charEdges(w);
      run.push({
        ...w,
        text: chars.slice(c0, c1).join(""),
        x0: edges[c0] ?? w.x0,
        x1: edges[c1] ?? w.x1,
      });
    });
    if (run.length > 0) out.push(run);
  }
  return out;
}

/** Selected text: spaces between words, a line break between lines. */
export const selectionText = (runs: readonly PdfWord[][]): string =>
  runs.map((r) => r.map((w) => w.text).join(" ")).join("\n");
