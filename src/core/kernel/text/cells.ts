/**
 * Terminal cell widths, following OpenTUI's `unicode` width method: text is
 * measured per grapheme cluster, a cluster takes the width of its base
 * character, and East Asian Wide and Fullwidth characters and emoji take two
 * cells.
 */

/**
 * Inclusive code point ranges that take two cells: East Asian Wide and
 * Fullwidth, and emoji with emoji presentation.
 */
const WIDE = [
  0x1100, 0x115f, 0x203c, 0x203c, 0x2049, 0x2049, 0x231a, 0x231b, 0x2329,
  0x232a, 0x23e9, 0x23ec, 0x23f0, 0x23f0, 0x23f3, 0x23f3, 0x25fd, 0x25fe,
  0x2614, 0x2615, 0x2622, 0x2623, 0x2630, 0x2637, 0x2648, 0x2653, 0x267f,
  0x267f, 0x268a, 0x268f, 0x2693, 0x2693, 0x269b, 0x269b, 0x26a1, 0x26a1,
  0x26aa, 0x26ab, 0x26bd, 0x26be, 0x26c4, 0x26c5, 0x26ce, 0x26ce, 0x26d1,
  0x26d1, 0x26d4, 0x26d4, 0x26ea, 0x26ea, 0x26f2, 0x26f3, 0x26f5, 0x26f5,
  0x26fa, 0x26fa, 0x26fd, 0x26fd, 0x2705, 0x2705, 0x270a, 0x270b, 0x2728,
  0x2728, 0x274c, 0x274c, 0x274e, 0x274e, 0x2753, 0x2755, 0x2757, 0x2757,
  0x2760, 0x2767, 0x2795, 0x2797, 0x27b0, 0x27b0, 0x27bf, 0x27bf, 0x2b1b,
  0x2b1c, 0x2b50, 0x2b50, 0x2b55, 0x2b55, 0x2e80, 0x2e99, 0x2e9b, 0x2ef3,
  0x2f00, 0x2fd5, 0x2ff0, 0x3029, 0x3030, 0x303e, 0x3041, 0x3096, 0x309b,
  0x30ff, 0x3105, 0x312f, 0x3131, 0x318e, 0x3190, 0x31e5, 0x31ef, 0x321e,
  0x3220, 0x3247, 0x3250, 0xa48c, 0xa490, 0xa4c6, 0xa960, 0xa97c, 0xac00,
  0xd7a3, 0xf900, 0xfaff, 0xfe10, 0xfe19, 0xfe30, 0xfe52, 0xfe54, 0xfe66,
  0xfe68, 0xfe6b, 0xff01, 0xff60, 0xffe0, 0xffe6, 0x16fe0, 0x16fe3, 0x16ff2,
  0x16ff6, 0x17000, 0x18cd5, 0x18cff, 0x18d1e, 0x18d80, 0x18df2, 0x1aff0,
  0x1aff3, 0x1aff5, 0x1affb, 0x1affd, 0x1affe, 0x1b000, 0x1b122, 0x1b132,
  0x1b132, 0x1b150, 0x1b152, 0x1b155, 0x1b155, 0x1b164, 0x1b167, 0x1b170,
  0x1b2fb, 0x1d300, 0x1d356, 0x1d360, 0x1d376, 0x1f000, 0x1f02b, 0x1f030,
  0x1f093, 0x1f0a0, 0x1f0ae, 0x1f0b1, 0x1f0bf, 0x1f0c1, 0x1f0cf, 0x1f0d1,
  0x1f0f5, 0x1f18e, 0x1f18e, 0x1f191, 0x1f19a, 0x1f200, 0x1f202, 0x1f210,
  0x1f23b, 0x1f240, 0x1f248, 0x1f250, 0x1f251, 0x1f260, 0x1f265, 0x1f300,
  0x1f320, 0x1f32d, 0x1f335, 0x1f337, 0x1f37c, 0x1f37e, 0x1f393, 0x1f3a0,
  0x1f3ca, 0x1f3cf, 0x1f3d3, 0x1f3e0, 0x1f3f0, 0x1f3f4, 0x1f3f4, 0x1f3f8,
  0x1f43e, 0x1f440, 0x1f440, 0x1f442, 0x1f4fc, 0x1f4ff, 0x1f6c5, 0x1f6cc,
  0x1f6cc, 0x1f6d0, 0x1f6d2, 0x1f6d5, 0x1f6d8, 0x1f6dc, 0x1f6df, 0x1f6eb,
  0x1f6ec, 0x1f6f4, 0x1f6fc, 0x1f700, 0x1f773, 0x1f780, 0x1f7d8, 0x1f7e0,
  0x1f7eb, 0x1f7f0, 0x1f7f0, 0x1f800, 0x1f80b, 0x1f810, 0x1f847, 0x1f850,
  0x1f859, 0x1f860, 0x1f887, 0x1f890, 0x1f8ad, 0x1f8b0, 0x1f8b1, 0x1f90c,
  0x1f93a, 0x1f93c, 0x1f945, 0x1f947, 0x1fa53, 0x1fa60, 0x1fa6d, 0x1fa70,
  0x1fa7c, 0x1fa80, 0x1fa8a, 0x1fa8e, 0x1fac6, 0x1fac8, 0x1fac8, 0x1facd,
  0x1fadc, 0x1fadf, 0x1faea, 0x1faef, 0x1faf8, 0x20000, 0x2fffd, 0x30000,
  0x3fffd,
];

const MARK = /^\p{M}$/u;
const NONSPACING = /^\p{Mn}$/u;

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

/** Below this code unit every character is one cell and a cluster of its own. */
const SIMPLE_BELOW = 0x300;

const isSimple = (text: string): boolean => {
  for (let i = 0; i < text.length; i++)
    if (text.charCodeAt(i) >= SIMPLE_BELOW) return false;
  return true;
};

/**
 * The grapheme clusters of `text`, in order. Text made only of characters
 * below U+0300 is returned as is, since each of its characters is a cluster.
 */
export function clusters(text: string): Iterable<string> {
  if (isSimple(text)) return text;
  return Array.from(segmenter.segment(text), (s) => s.segment);
}

function isWide(cp: number): boolean {
  let lo = 0;
  let hi = WIDE.length / 2 - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cp < (WIDE[2 * mid] ?? 0)) hi = mid - 1;
    else if (cp > (WIDE[2 * mid + 1] ?? 0)) lo = mid + 1;
    else return true;
  }
  return false;
}

/**
 * A character that adds no width to its cluster: a combining mark, a
 * zero-width space or joiner, a BOM, or a variation selector.
 */
const isZeroWidth = (ch: string, cp: number) =>
  MARK.test(ch) ||
  (cp >= 0x200b && cp <= 0x200d) ||
  cp === 0x2060 ||
  cp === 0xfeff ||
  (cp >= 0x180b && cp <= 0x180d) ||
  (cp >= 0xfe00 && cp <= 0xfe0f) ||
  (cp >= 0xe0100 && cp <= 0xe01ef);

function codePointWidth(ch: string, cp: number): number {
  if (cp < SIMPLE_BELOW) return 1;
  if (isZeroWidth(ch, cp)) return 0;
  return isWide(cp) ? 2 : 1;
}

const isRegionalIndicator = (cp: number) => cp >= 0x1f1e6 && cp <= 0x1f1ff;
const isDevanagariConsonant = (cp: number) =>
  (cp >= 0x915 && cp <= 0x939) || (cp >= 0x958 && cp <= 0x95f);

/**
 * Cells one cluster takes: its base character's width, two for a flag or a
 * character with VS16 (emoji presentation), never more for an emoji joined
 * by ZWJ, and at least one.
 */
function clusterWidth(cluster: string): number {
  let w = -1;
  let flag = false;
  let virama = false;
  for (const ch of cluster) {
    const cp = ch.codePointAt(0) ?? 0;
    const cw = codePointWidth(ch, cp);
    if (w < 0) {
      w = cw;
      flag = isRegionalIndicator(cp);
    } else if (cp === 0xfe0f) {
      if (w === 1) w = 2;
    } else if (NONSPACING.test(ch)) virama = true;
    else if (flag && isRegionalIndicator(cp)) w += cw;
    else if (w === 0) w = cw;
    // Thai SARA AM and Lao AM are spacing marks that draw a second cell.
    else if (cp === 0xe33 || cp === 0xeb3) w = Math.max(w, 2);
    else if (virama && isDevanagariConsonant(cp)) {
      // A conjunct draws its second consonant, except a following RA.
      if (cp !== 0x930) w += cw;
      virama = false;
    }
  }
  return Math.max(1, w);
}

/**
 * Cells grapheme cluster `ch` takes at display column `v`: a tab reaches the
 * next multiple of `tabWidth`.
 */
export function cellWidth(ch: string, v: number, tabWidth: number): number {
  if (ch === "\t") return tabWidth - (v % tabWidth);
  if (ch.length === 1 && ch.charCodeAt(0) < SIMPLE_BELOW) return 1;
  return clusterWidth(ch);
}

/**
 * `text` cut or padded with spaces to exactly `width` cells, a tab counting
 * as one. A wide character that would cross the edge is cut whole and its
 * cell padded.
 */
export function fitCells(text: string, width: number): string {
  if (isSimple(text))
    return text.length >= width
      ? text.slice(0, width)
      : text + " ".repeat(width - text.length);
  let out = "";
  let used = 0;
  for (const ch of clusters(text)) {
    const w = cellWidth(ch, used, 1);
    if (used + w > width) break;
    out += ch;
    used += w;
  }
  return out + " ".repeat(width - used);
}
