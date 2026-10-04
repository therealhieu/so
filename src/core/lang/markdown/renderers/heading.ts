import { contentEnd, contentStart, rootOf } from "../block-text";
import type { BlockRenderer } from "../live-preview";
import { lineStyle, replaceCols, replaceLine } from "./rows";

/** Level glyphs: H1 █, H2 ▊, H3 ▌, H4 and deeper ▏. */
const GLYPHS = ["█", "▊", "▌", "▏"];
const ATX = /^( {0,3}#{1,6})([ \t]+|$)/;
const CLOSING = /[ \t]+#+[ \t]*$/;

/**
 * A heading with its level glyph in place of the `#` markers (or above a
 * hidden setext underline), styled `mdHeading1`–`mdHeading4`.
 */
export const headingRenderer: BlockRenderer = (block, v, { doc }) => {
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
  return out;
};
