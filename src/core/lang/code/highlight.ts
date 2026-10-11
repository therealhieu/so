import { common, createLowlight } from "lowlight";
import type { TextBuffer } from "../../kernel/text/text-buffer";
import type { Highlighter, Span, StyleToken } from "../../kernel/view/types";

const low = createLowlight(common);

/** Lines above the window that are highlighted too, so open comments and strings carry over. */
const LOOK_BACK = 200;

/** highlight.js scopes → theme tokens. Unlisted scopes take their parent's token. */
const HLJS_TOKENS: Readonly<Record<string, StyleToken>> = {
  keyword: "codeKeyword",
  built_in: "codeBuiltin",
  type: "codeType",
  literal: "codeLiteral",
  number: "codeNumber",
  string: "codeString",
  regexp: "codeString",
  symbol: "codeString",
  comment: "codeComment",
  doc: "codeComment",
  meta: "codeMeta",
  title: "codeTitle",
  section: "codeTitle",
  attr: "codeAttribute",
  attribute: "codeAttribute",
  variable: "codeVariable",
  "template-variable": "codeVariable",
  property: "codeProperty",
  params: "codeParams",
  tag: "codeTag",
  name: "codeTag",
  "selector-tag": "codeTag",
  "selector-class": "codeTag",
  "selector-id": "codeTag",
  bullet: "codeBullet",
  link: "codeLink",
  quote: "codeComment",
  addition: "codeAddition",
  deletion: "codeDeletion",
  emphasis: "codeEmphasis",
  strong: "codeStrong",
  operator: "codeOperator",
  punctuation: "codePunctuation",
};

type HastNode = {
  type: string;
  value?: string;
  properties?: { className?: unknown };
  children?: HastNode[];
};

/**
 * Walk the tree and split its text on newlines into one span list per line.
 * A scope in `plain` gives its whole subtree the enclosing token.
 */
function lineSpans(tree: HastNode, plain: ReadonlySet<string>): Span[][] {
  const lines: Span[][] = [[]];
  const add = (text: string, style: StyleToken) => {
    const line = lines[lines.length - 1] as Span[];
    const prev = line[line.length - 1];
    if (prev?.style === style) prev.text += text;
    else line.push({ text, style });
  };
  const walk = (node: HastNode, style: StyleToken, locked: boolean) => {
    if (node.type === "text") {
      (node.value ?? "").split("\n").forEach((part, i) => {
        if (i > 0) lines.push([]);
        if (part !== "") add(part, style);
      });
      return;
    }
    const classes = node.properties?.className;
    const scope = Array.isArray(classes) ? String(classes[0]) : undefined;
    const inherit = locked || (scope !== undefined && plain.has(scope));
    const own = inherit || scope === undefined ? undefined : HLJS_TOKENS[scope];
    for (const child of node.children ?? []) walk(child, own ?? style, inherit);
  };
  walk(tree, "text", false);
  return lines;
}

function joinLines(buf: TextBuffer, from: number, to: number): string {
  const lines: string[] = [];
  for (let i = from; i < to; i++) lines.push(buf.line(i));
  return lines.join("\n");
}

type Highlighted = { from: number; to: number; spans: Span[][] };

/**
 * Highlight a line range with lowlight's grammar for `language`. Each buffer
 * version is immutable, so results are cached per buffer object. A miss
 * highlights one more window below the range, so the shifted ranges a frame
 * tries while fitting the cursor, and the next scroll steps, reuse it; the
 * same range twice gets the same spans.
 */
export function lowlightHighlighter(
  language: string,
  plain: ReadonlySet<string> = new Set(),
): Highlighter {
  const cache = new WeakMap<
    TextBuffer,
    { whole: Highlighted; last: Highlighted }
  >();
  return {
    language,
    highlight(buf, lines) {
      const to = Math.min(lines.to, buf.lineCount);
      const hit = cache.get(buf);
      if (hit?.last.from === lines.from && hit.last.to === to)
        return hit.last.spans;
      const reuse =
        hit !== undefined && hit.whole.from <= lines.from && hit.whole.to >= to;
      let whole = hit?.whole;
      if (!reuse || whole === undefined) {
        const end = Math.min(buf.lineCount, to + (to - lines.from));
        const from = Math.max(0, lines.from - LOOK_BACK);
        const tree = low.highlight(language, joinLines(buf, from, end), {
          prefix: "",
        });
        whole = {
          from: lines.from,
          to: end,
          spans: lineSpans(tree as HastNode, plain).slice(
            lines.from - from,
            end - from,
          ),
        };
      }
      const spans = whole.spans.slice(lines.from - whole.from, to - whole.from);
      cache.set(buf, { whole, last: { from: lines.from, to, spans } });
      return spans;
    },
  };
}
