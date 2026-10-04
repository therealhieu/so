import { createTextBuffer } from "../../../kernel/text/text-buffer";
import type { Decoration } from "../../../kernel/view/decorations";
import type { Highlighter, Span } from "../../../kernel/view/types";
import { lowlightHighlighter } from "../../code/highlight";
import { contentEnd, contentStart, fenceBody } from "../block-text";
import { closesFence, openFence } from "../blocks";
import type { BlockRenderer } from "../live-preview";
import { RenderCache } from "../render-cache";
import { lineStyle, replaceLine } from "./rows";

const highlighters = new Map<string, Highlighter>();
const spans = new RenderCache<Span[][]>();

/** Body lines highlighted with lowlight's grammar for `language`; none when it has no grammar. */
function highlight(language: string, body: string[]): Span[][] {
  if (language === "" || body.length === 0) return [];
  let h = highlighters.get(language);
  if (h === undefined) {
    h = lowlightHighlighter(language);
    highlighters.set(language, h);
  }
  try {
    return h.highlight(createTextBuffer(body.join("\n")), {
      from: 0,
      to: body.length,
    });
  } catch {
    return [];
  }
}

/** Fenced code with its fences hidden and its body highlighted in the fence's language; indented code banded only. */
export const codeRenderer: BlockRenderer = (block, v) => {
  const first = contentStart(v.buf, block);
  const last = contentEnd(v.buf, block);
  const out: Decoration[] = [];
  if (block.kind !== "fence") {
    for (let l = first; l <= last; l++) out.push(lineStyle(l, "mdCode"));
    return out;
  }
  const open = v.buf.line(first);
  const fence = openFence(open);
  const closed =
    fence !== undefined && last > first && closesFence(fence, v.buf.line(last));
  const language =
    open
      .trim()
      .replace(/^[`~]+/, "")
      .trim()
      .split(/\s/)[0] ?? "";
  const body = fenceBody(v.buf, block);
  const rows = spans.get(`${block.hash}|${language}`, () =>
    highlight(language.toLowerCase(), body),
  );
  out.push(replaceLine(v.buf, first));
  if (closed) out.push(replaceLine(v.buf, last));
  body.forEach((_, i) => {
    const line = first + 1 + i;
    out.push(lineStyle(line, "mdCode"));
    let col = 0;
    for (const s of rows[i] ?? []) {
      if (s.style !== "text" && s.text !== "")
        out.push({
          kind: "mark",
          range: {
            start: { line, col },
            end: { line, col: col + s.text.length },
          },
          style: s.style,
        });
      col += s.text.length;
    }
  });
  return out;
};
