import type { TextBuffer } from "../../kernel/text/text-buffer";
import type { Highlighter, Span } from "../../kernel/view/types";
import { lowlightHighlighter } from "../code/highlight";

const ATX = /^ {0,3}(#{1,6})(?:[ \t]|$)/;
const SETEXT = /^ {0,3}(=+|-+)[ \t]*$/;

/** The heading level of `line`, capped at 4 like the rendered views, or undefined. */
function headingLevel(buf: TextBuffer, line: number): number | undefined {
  const atx = ATX.exec(buf.line(line));
  if (atx) return Math.min(atx[1]?.length ?? 1, 4);
  // A setext heading's text lines and underline: the underline sets the level.
  for (let l = line; l < buf.lineCount && buf.line(l).trim() !== ""; l++) {
    const underline = SETEXT.exec(buf.line(l));
    if (underline) return underline[1]?.startsWith("=") ? 1 : 2;
  }
  return undefined;
}

/**
 * Markdown source colours: lowlight's grammar, with heading text styled by
 * level (`mdHeading1`–`mdHeading4`) instead of one title colour, and raw HTML
 * in the colour around it instead of the HTML grammar's tag and attribute colours.
 */
export function markdownHighlighter(): Highlighter {
  const inner = lowlightHighlighter("markdown", new Set(["xml"]));
  const leveled = new WeakMap<Span[][], Span[][]>();
  return {
    language: inner.language,
    highlight(buf, lines) {
      const spans = inner.highlight(buf, lines);
      const hit = leveled.get(spans);
      if (hit !== undefined) return hit;
      const out = spans.map((line, i) => {
        if (!line.some((s) => s.style === "codeTitle")) return line;
        const level = headingLevel(buf, lines.from + i);
        if (level === undefined) return line;
        return line.map((s) =>
          s.style === "codeTitle" ? { ...s, style: `mdHeading${level}` } : s,
        );
      });
      leveled.set(spans, out);
      return out;
    },
  };
}
