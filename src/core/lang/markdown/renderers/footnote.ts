import { contentEnd, contentStart } from "../block-text";
import { footnoteRef } from "../inline";
import type { BlockRenderer } from "../live-preview";
import { lineStyle, markCols, replaceCols } from "./rows";

const DEFINITION = /^ {0,3}\[\^([^\]\s]+)\]:[ \t]*/;

/**
 * Footnote definitions dimmed, each `[^1]:` shown as the same label its
 * references show. The text is marked too: the source grammar colours a
 * definition as a link.
 */
export const footnoteRenderer: BlockRenderer = (block, v, { ctx }) => {
  const out = [];
  for (let l = contentStart(v.buf, block); l <= contentEnd(v.buf, block); l++) {
    out.push(lineStyle(l, "mdFootnote"));
    out.push(markCols(l, 0, v.buf.line(l).length, "mdFootnote"));
    const m = DEFINITION.exec(v.buf.line(l));
    if (m === null) continue;
    out.push(
      replaceCols(
        l,
        0,
        m[0].length,
        footnoteRef(m[1] ?? "", ctx.sizedText, " "),
      ),
    );
  }
  return out;
};
