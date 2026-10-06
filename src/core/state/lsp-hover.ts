import { createTextBuffer } from "../kernel/text/text-buffer";
import type { Highlighter, Span } from "../kernel/view/types";
import { lowlightHighlighter } from "../lang/code/highlight";

/** The style of a float line drawn as a rule across the float. */
export const FLOAT_RULE = "floatRule";

const highlighters = new Map<string, Highlighter>();

/** `body` highlighted with lowlight's grammar for `language`; undefined without one. */
function highlight(language: string, body: string[]): Span[][] | undefined {
  if (language === "" || body.length === 0) return undefined;
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
    return undefined;
  }
}

const OPEN = /^\s*(`{3,}|~{3,})\s*([^\s`]*)/;
const RULE = /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/;

/**
 * Hover Markdown as float lines, with styles for some: fenced code
 * highlighted in its language with its fences dropped, a thematic break as
 * a rule, and prose as it is. Runs of blank lines become one.
 */
export function hoverLines(md: string): {
  lines: string[];
  spans: (Span[] | undefined)[];
} {
  const lines: string[] = [];
  const spans: (Span[] | undefined)[] = [];
  const push = (text: string, styled?: Span[]) => {
    if (text.trim() === "" && styled === undefined) {
      const last = lines.length - 1;
      if (last < 0 || (lines[last] === "" && spans[last] === undefined)) return;
      text = "";
    }
    lines.push(text);
    spans.push(styled);
  };
  const src = md.split("\n");
  for (let i = 0; i < src.length; i++) {
    const line = src[i] as string;
    const open = OPEN.exec(line);
    if (open === null) {
      if (RULE.test(line)) push("", [{ text: "", style: FLOAT_RULE }]);
      else push(line.trimEnd());
      continue;
    }
    const fence = open[1] as string;
    const body: string[] = [];
    for (i++; i < src.length; i++) {
      const l = (src[i] as string).trim();
      if (
        l.length >= fence.length &&
        l === (fence[0] as string).repeat(l.length)
      )
        break;
      body.push(src[i] as string);
    }
    const styled = highlight((open[2] ?? "").toLowerCase(), body);
    body.forEach((text, k) => {
      lines.push(text);
      spans.push(styled?.[k]);
    });
  }
  while (
    lines.length > 0 &&
    lines[lines.length - 1] === "" &&
    spans[spans.length - 1] === undefined
  ) {
    lines.pop();
    spans.pop();
  }
  return { lines, spans };
}
