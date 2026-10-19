import type { Decoration } from "../../../kernel/view/decorations";
import { wrapSized } from "../../../kernel/view/sized";
import { layoutLine } from "../../../kernel/view/text-view";
import type { SizedBlock, TextView } from "../../../kernel/view/types";
import { contentEnd, contentStart, rootOf } from "../block-text";
import { inlineDecorations } from "../inline";
import type { BlockRenderer } from "../live-preview";
import { lineStyle, replaceCols, replaceLine } from "./rows";

/** Level glyphs: H1 █, H2 ▊, H3 ▌, H4 and deeper ▏. */
const GLYPHS = ["█", "▊", "▌", "▏"];
const ATX = /^( {0,3}#{1,6})([ \t]+|$)/;
const CLOSING = /[ \t]+#+[ \t]*$/;
/** Scales of the headings the terminal draws larger: H1 and H2. */
const SCALES: readonly SizedBlock["scale"][] = [2, 1.5];

/** `line` as one `sizedText` block widget of two rows per wrapped row. */
function sizedLine(
  v: TextView,
  line: number,
  scale: SizedBlock["scale"],
  decos: readonly Decoration[],
): Decoration {
  const rows = wrapSized(layoutLine(v, line, decos).spans, scale, v.width);
  const data: SizedBlock = { scale, rows };
  return {
    kind: "replace",
    range: {
      start: { line, col: 0 },
      end: { line, col: v.buf.line(line).length },
    },
    block: true,
    widget: { type: "sizedText", data, rows: 2 * rows.length },
  };
}

/**
 * A heading with its level glyph in place of the `#` markers (or above a
 * hidden setext underline), styled `mdHeading1`–`mdHeading4`. With sized
 * text, an ATX H1 or H2 line is drawn larger as a `sizedText` widget.
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
  const glyph = { text: `${GLYPHS[level - 1]} `, style };
  if (atx === null) {
    // Setext: the text lines, then an `===` or `---` underline.
    const last = contentEnd(v.buf, block);
    const out = [replaceCols(first, 0, 0, [glyph]), replaceLine(v.buf, last)];
    for (let l = first; l < last; l++) out.push(lineStyle(l, style));
    return out;
  }
  const closing = CLOSING.exec(text.slice(atx[0].length));
  const out = [
    lineStyle(first, style),
    replaceCols(first, 0, atx[0].length, [glyph]),
  ];
  if (closing)
    out.push(replaceCols(first, atx[0].length + closing.index, text.length));
  const scale = SCALES[depth - 1];
  if (!input.ctx.sizedText || scale === undefined) return out;
  // Scripts inside a sized heading keep their Unicode form: a chunk is drawn at one scale.
  const unsized = { ...input, ctx: { ...input.ctx, sizedText: false } };
  const inline = inlineDecorations(block, v, unsized, new Set());
  return [sizedLine(v, first, scale, [...out, ...inline])];
};
