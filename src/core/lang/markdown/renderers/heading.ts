import type { Decoration } from "../../../kernel/view/decorations";
import {
  sizedCell,
  sizeScale,
  withAdvance,
  wrapSized,
} from "../../../kernel/view/sized";
import { layoutLine } from "../../../kernel/view/text-view";
import type { SizedBlock, Span, TextView } from "../../../kernel/view/types";
import { wrapLine } from "../../../kernel/view/wrap";
import { contentEnd, contentStart, rootOf } from "../block-text";
import { inlineDecorations } from "../inline";
import { type BlockRenderer, type PreviewCtx, zoomOf } from "../live-preview";
import { lineStyle, replaceCols, replaceLine, textWidget } from "./rows";

/** Level glyphs: H1 █, H2 ▊, H3 ▌, H4 and deeper ▏. */
const GLYPHS = ["█", "▊", "▌", "▏"];
const ATX = /^( {0,3}#{1,6})([ \t]+|$)/;
const CLOSING = /[ \t]+#+[ \t]*$/;
/**
 * Sizes of the headings the terminal draws larger: H1 1.75× with words in
 * their own chunks and one-cell spaces, H2 1.6×, H3 1.4× with each word
 * placed on its own so spaces keep about their width.
 */
const SCALES: readonly SizedBlock["scale"][] = [
  { n: 7, d: 8, wordSpace: 1 },
  { n: 4, d: 5 },
  { n: 7, d: 10, words: true },
];
/** How much larger than the body H1–H3 draw, as at 1×. */
const FACTORS = [1.75, 1.6, 1.4];
/**
 * Heading sizes under a text zoom: whole sizes and those whose text fills
 * at least 3/4 of its sized cells and fits kitty's fractions.
 */
const SIZES = [1.5, 1.75, 2, 2.25, 2.5, 2.625, 3, 3.5, 4, 4.375, 5, 5.25, 6, 7];

/**
 * The size of an H1–H3 under text `zoom`: its own at 1, else the size
 * nearest its factor times the body's, each word placed on its own, where
 * its characters take the width kitty gives them in a cell `cellPx` wide.
 */
export function headingScale(
  depth: number,
  zoom: number,
  cellPx?: number,
): SizedBlock["scale"] | undefined {
  const factor = FACTORS[depth - 1];
  if (factor === undefined) return undefined;
  const own = SCALES[depth - 1];
  if (zoom === 1) return own?.words === true ? withAdvance(own, cellPx) : own;
  const want = zoom * factor;
  const size = SIZES.reduce((best, z) =>
    Math.abs(z - want) < Math.abs(best - want) ? z : best,
  );
  return withAdvance({ ...sizeScale(size), words: true }, cellPx);
}

/**
 * The first of `lines` through `to` as one `sizedText` block widget of
 * `sizedCell(scale)` rows per wrapped row, drawing the text `lines` joined by a space in `style`.
 */
function sizedBlock(
  v: TextView,
  lines: readonly number[],
  to: number,
  scale: SizedBlock["scale"],
  style: string,
  decos: readonly Decoration[],
): Decoration {
  const spans = lines.flatMap((l, i): Span[] => {
    const own = layoutLine(v, l, decos).spans;
    return i === 0 ? own : [{ text: " ", style }, ...own];
  });
  const rows = wrapSized(spans, scale, v.width);
  const data: SizedBlock = { scale, rows };
  const from = lines[0] ?? to;
  return {
    kind: "replace",
    range: {
      start: { line: from, col: 0 },
      end: { line: to, col: v.buf.line(to).length },
    },
    block: true,
    widget: { type: "sizedText", data, rows: sizedCell(scale) * rows.length },
  };
}

/**
 * Whether the cursor or a selection is on lines `from`–`to`. kitty draws a
 * sized chunk as one character, so the cursor and a selection there would
 * cover whole chunks.
 */
const touches = (v: TextView, from: number, to: number) =>
  v.selection === undefined
    ? v.cursor.line >= from && v.cursor.line <= to
    : v.selection.start.line <= to && v.selection.end.line >= from;

/**
 * Blank rows under `lines` drawn at normal size with `decos`, up to the rows
 * their `sized` block takes, so the lines below keep their place.
 */
function keepRows(
  sized: Decoration,
  lines: readonly number[],
  last: number,
  v: TextView,
  ctx: PreviewCtx,
  decos: readonly Decoration[],
): Decoration[] {
  let shown = 0;
  for (const l of lines) {
    const text = layoutLine(v, l, decos)
      .spans.map((sp) => sp.text)
      .join("");
    shown += ctx.wrap ? wrapLine(text, v.width, ctx.tabWidth).length : 1;
  }
  const blank =
    (sized.kind === "replace" ? (sized.widget?.rows ?? 0) : 0) - shown;
  if (blank < 1) return [];
  return [
    {
      kind: "widget",
      at: { line: last, col: 1 },
      block: true,
      widget: textWidget(Array.from({ length: blank }, () => [])),
    },
  ];
}

/**
 * A heading with its level glyph in place of the `#` markers (or above a
 * hidden setext underline), styled `mdHeading1`–`mdHeading4`. With sized
 * text, an H1–H3 is drawn larger, without a glyph, as one `sizedText`
 * widget covering its text lines and any setext underline; in the reading
 * view, while the cursor or a selection is on it, it is drawn at normal size
 * in the rows it takes sized, so each character can be reached.
 */
export const headingRenderer: BlockRenderer = (block, v, input) => {
  const { doc } = input;
  const first = contentStart(v.buf, block);
  const text = v.buf.line(first);
  const atx = ATX.exec(text);
  const depth = atx
    ? (atx[1]?.trim().length ?? 1)
    : Number(rootOf(doc, block, v.buf).children?.[0]?.depth ?? 1);
  const level = Math.min(depth, 4);
  const style = `mdHeading${level}`;
  const scale = headingScale(depth, zoomOf(input), input.ctx.cellPx);
  // Setext: the text lines, then an `===` or `---` underline.
  const last = atx === null ? contentEnd(v.buf, block) : first;
  const lines: number[] = [];
  for (let l = first; l < (atx === null ? last : first + 1); l++) lines.push(l);
  const sized = input.ctx.sizedText && scale !== undefined;
  const reached = sized && input.view === "reading" && touches(v, first, last);
  const decos = (glyph: Span[]): Decoration[] => {
    if (atx === null)
      return [
        replaceCols(first, 0, 0, glyph),
        replaceLine(v.buf, last),
        ...lines.map((l) => lineStyle(l, style)),
      ];
    const closing = CLOSING.exec(text.slice(atx[0].length));
    return [
      lineStyle(first, style),
      replaceCols(first, 0, atx[0].length, glyph),
      ...(closing
        ? [replaceCols(first, atx[0].length + closing.index, text.length)]
        : []),
    ];
  };
  const glyph = [{ text: `${GLYPHS[level - 1]} `, style }];
  if (!sized) return decos(glyph);
  // A sized heading's size shows its level.
  const out = decos([]);
  const indents =
    atx === null
      ? lines.map((l) =>
          replaceCols(l, 0, /^[ \t]*/.exec(v.buf.line(l))?.[0].length ?? 0),
        )
      : [];
  // Scripts inside a sized heading keep their Unicode form: a chunk is drawn at one scale.
  const unsized = { ...input, ctx: { ...input.ctx, sizedText: false } };
  const inline = inlineDecorations(block, v, unsized, new Set());
  const whole = sizedBlock(v, lines, last, scale, style, [
    ...out,
    ...indents,
    ...inline,
  ]);
  if (!reached) return [whole];
  const plain = decos(glyph);
  const shown = [...plain, ...inlineDecorations(block, v, input, new Set())];
  return [...plain, ...keepRows(whole, lines, last, v, input.ctx, shown)];
};
