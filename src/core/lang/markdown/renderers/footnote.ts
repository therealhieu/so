import { contentEnd, contentStart } from "../block-text";
import type { BlockRenderer } from "../live-preview";
import { lineStyle, markCols, replaceCols } from "./rows";

const DEFINITION = /^ {0,3}\[\^([^\]\s]+)\]:[ \t]*/;
const SUPERSCRIPT = "⁰¹²³⁴⁵⁶⁷⁸⁹";

/**
 * Footnote definitions dimmed, each `[^1]:` shown as its superscript label.
 * The text is marked too: the source grammar colours a definition as a link.
 */
export const footnoteRenderer: BlockRenderer = (block, v) => {
  const out = [];
  for (let l = contentStart(v.buf, block); l <= contentEnd(v.buf, block); l++) {
    out.push(lineStyle(l, "mdFootnote"));
    out.push(markCols(l, 0, v.buf.line(l).length, "mdFootnote"));
    const m = DEFINITION.exec(v.buf.line(l));
    if (m === null) continue;
    const label = m[1] ?? "";
    const shown = /^\d+$/.test(label)
      ? [...label].map((d) => SUPERSCRIPT[Number(d)]).join("")
      : `[${label}]`;
    out.push(
      replaceCols(l, 0, m[0].length, [
        { text: `${shown} `, style: "mdFootnote" },
      ]),
    );
  }
  return out;
};
