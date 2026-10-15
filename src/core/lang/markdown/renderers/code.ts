import type { TextBuffer } from "../../../kernel/text/text-buffer";
import { createTextBuffer } from "../../../kernel/text/text-buffer";
import type { Decoration } from "../../../kernel/view/decorations";
import type { Highlighter, Span } from "../../../kernel/view/types";
import { lowlightHighlighter } from "../../code/highlight";
import { contentEnd, contentStart } from "../block-text";
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

/** The language named after a fence opener's marker, lowercased. */
const languageOf = (opener: string) =>
  (
    opener
      .trim()
      .replace(/^[`~]+/, "")
      .trim()
      .split(/\s/)[0] ?? ""
  ).toLowerCase();

/** Columns of a line before its content: a container's indent or `>` prefix. */
type Prefix = (text: string) => number;

/**
 * A fenced block's decorations: its fence lines hidden and its body lines,
 * read after `prefix` columns, banded and highlighted in the opener's language.
 */
function fence(
  buf: TextBuffer,
  open: number,
  last: number,
  prefix: Prefix,
): Decoration[] {
  const from = (l: number) => prefix(buf.line(l));
  const opener = buf.line(open).slice(from(open));
  const marker = openFence(opener);
  const closed =
    marker !== undefined &&
    last > open &&
    closesFence(marker, buf.line(last).slice(from(last)));
  const end = closed ? last - 1 : last;
  const body: string[] = [];
  for (let l = open + 1; l <= end; l++) body.push(buf.line(l).slice(from(l)));
  const language = languageOf(opener);
  const rows = spans.get(`${language}\n${body.join("\n")}`, () =>
    highlight(language, body),
  );
  const out: Decoration[] = [replaceLine(buf, open)];
  if (closed) out.push(replaceLine(buf, last));
  body.forEach((_, i) => {
    const line = open + 1 + i;
    out.push(lineStyle(line, "mdCode"));
    let col = from(line);
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
}

/**
 * Fences inside a list or callout from `first` to `last`, each line read
 * after its `prefix` columns but no more than its opener's: their
 * decorations and the prefix columns of every line they cover. An unclosed
 * fence runs to `last`.
 */
export function nestedFences(
  buf: TextBuffer,
  first: number,
  last: number,
  prefix: Prefix,
): { decorations: Decoration[]; lines: Map<number, number> } {
  const decorations: Decoration[] = [];
  const lines = new Map<number, number>();
  for (let l = first; l <= last; l++) {
    const text = buf.line(l);
    const at = prefix(text);
    const marker = openFence(text.slice(at));
    if (marker === undefined || marker.char === "$") continue;
    const inner: Prefix = (t) => Math.min(prefix(t), at);
    const closes = (j: number) =>
      closesFence(marker, buf.line(j).slice(inner(buf.line(j))));
    let end = Math.min(l + 1, last);
    while (end < last && !closes(end)) end++;
    decorations.push(...fence(buf, l, end, inner));
    for (let j = l; j <= end; j++) lines.set(j, inner(buf.line(j)));
    l = end;
  }
  return { decorations, lines };
}

/** Fenced code with its fences hidden and its body highlighted in the fence's language; indented code banded only. */
export const codeRenderer: BlockRenderer = (block, v) => {
  const first = contentStart(v.buf, block);
  const last = contentEnd(v.buf, block);
  if (block.kind !== "fence") {
    const out: Decoration[] = [];
    for (let l = first; l <= last; l++) out.push(lineStyle(l, "mdCode"));
    return out;
  }
  return fence(v.buf, first, last, () => 0);
};
