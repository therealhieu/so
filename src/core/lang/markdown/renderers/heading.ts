import type { Decoration } from "../../../kernel/view/decorations";
import { wrapSized } from "../../../kernel/view/sized";
import { layoutLine } from "../../../kernel/view/text-view";
import type { SizedBlock, Span, TextView } from "../../../kernel/view/types";
import { contentEnd, contentStart, rootOf } from "../block-text";
import { inlineDecorations } from "../inline";
import type { BlockRenderer } from "../live-preview";
import { lineStyle, replaceCols, replaceLine } from "./rows";

/** Level glyphs: H1 █, H2 ▊, H3 ▌, H4 and deeper ▏. */
const GLYPHS = ["█", "▊", "▌", "▏"];
const ATX = /^( {0,3}#{1,6})([ \t]+|$)/;
const CLOSING = /[ \t]+#+[ \t]*$/;
/**
 * Sizes of the headings the terminal draws larger: H1 1.75× with words in
 * their own chunks and one-cell spaces, H2 1.6×, H3 1.4×.
 */
const SCALES: readonly SizedBlock["scale"][] = [
  { n: 7, d: 8, wordSpace: 1 },
  { n: 4, d: 5 },
  { n: 7, d: 10 },
];

/**
 * The first of `lines` through `to` as one `sizedText` block widget of two
 * rows per wrapped row, drawing the text `lines` joined by a space in `style`.
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
    widget: { type: "sizedText", data, rows: 2 * rows.length },
  };
}

/**
 * A heading with its level glyph in place of the `#` markers (or above a
 * hidden setext underline), styled `mdHeading1`–`mdHeading4`. With sized
 * text, an H1–H3 is drawn larger, without a glyph, as one `sizedText`
 * widget covering its text lines and any setext underline.
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
  const scale = SCALES[depth - 1];
  const sized = input.ctx.sizedText && scale !== undefined;
  // A sized heading's size shows its level.
  const glyph = sized ? [] : [{ text: `${GLYPHS[level - 1]} `, style }];
  // Scripts inside a sized heading keep their Unicode form: a chunk is drawn at one scale.
  const unsized = { ...input, ctx: { ...input.ctx, sizedText: false } };
  if (atx === null) {
    // Setext: the text lines, then an `===` or `---` underline.
    const last = contentEnd(v.buf, block);
    const out = [replaceCols(first, 0, 0, glyph), replaceLine(v.buf, last)];
    const lines: number[] = [];
    for (let l = first; l < last; l++) {
      out.push(lineStyle(l, style));
      lines.push(l);
    }
    if (!sized) return out;
    const indents = lines.map((l) =>
      replaceCols(l, 0, /^[ \t]*/.exec(v.buf.line(l))?.[0].length ?? 0),
    );
    const inline = inlineDecorations(block, v, unsized, new Set());
    return [
      sizedBlock(v, lines, last, scale, style, [...out, ...indents, ...inline]),
    ];
  }
  const closing = CLOSING.exec(text.slice(atx[0].length));
  const out = [
    lineStyle(first, style),
    replaceCols(first, 0, atx[0].length, glyph),
  ];
  if (closing)
    out.push(replaceCols(first, atx[0].length + closing.index, text.length));
  if (!sized) return out;
  const inline = inlineDecorations(block, v, unsized, new Set());
  return [sizedBlock(v, [first], first, scale, style, [...out, ...inline])];
};
