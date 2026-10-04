import type { Pos, Range } from "../../kernel/text/pos";
import type { Decoration } from "../../kernel/view/decorations";
import type { Span, StyleToken, TextView } from "../../kernel/view/types";
import { nodeRange, rootOf } from "./block-text";
import type { Block } from "./doc";
import type { MarkdownViewInput } from "./live-preview";
import type { MdNode } from "./mdast";
import { mathText } from "./renderers/math";

/** Emphasis-like nodes: a style for the content and how many marker characters sit on each side. */
const WRAPPED: Readonly<
  Record<string, { style: StyleToken; marker: (src: string) => number }>
> = {
  strong: { style: "mdBold", marker: () => 2 },
  emphasis: { style: "mdItalic", marker: () => 1 },
  delete: { style: "mdStrike", marker: (s) => (s.startsWith("~~") ? 2 : 1) },
  highlight: { style: "mdHighlight", marker: () => 2 },
  inlineCode: {
    style: "mdCode",
    marker: (s) => /^`+/.exec(s)?.[0].length ?? 1,
  },
  inlineMath: {
    style: "mdCode",
    marker: (s) => /^\$+/.exec(s)?.[0].length ?? 1,
  },
};

const PROSE = new Set(["paragraph", "heading", "list"]);
const SUPERSCRIPT = "⁰¹²³⁴⁵⁶⁷⁸⁹";

const at = (p: Pos, by: number): Pos => ({ line: p.line, col: p.col + by });
const hide = (range: Range): Decoration => ({
  kind: "replace",
  range,
  block: false,
});
const show = (range: Range, spans: Span[]): Decoration => ({
  kind: "replace",
  range,
  block: false,
  spans,
});
const mark = (range: Range, style: StyleToken): Decoration => ({
  kind: "mark",
  range,
  style,
});
const isEmpty = (r: Range) =>
  r.start.line === r.end.line && r.start.col >= r.end.col;

const baseName = (path: string) => path.split("/").pop() ?? path;

/** A footnote label as superscript digits, or `[label]`. */
const footnoteLabel = (label: string) =>
  /^\d+$/.test(label)
    ? [...label].map((d) => SUPERSCRIPT[Number(d)]).join("")
    : `[${label}]`;

/**
 * Inline rendering of a prose block: emphasis markers, link syntax,
 * `%%comments%%`, and footnote markers are hidden or replaced, and the
 * content is styled. Nodes on `revealed` lines keep their source.
 */
export function inlineDecorations(
  block: Block,
  v: TextView,
  { doc, ctx }: MarkdownViewInput,
  revealed: ReadonlySet<number>,
): Decoration[] {
  if (!PROSE.has(block.kind)) return [];
  const out: Decoration[] = [];
  const touchesReveal = (r: Range) => {
    for (let l = r.start.line; l <= r.end.line; l++)
      if (revealed.has(l)) return true;
    return false;
  };
  const visit = (node: MdNode) => {
    const range = nodeRange(block, node);
    if (range !== undefined && !touchesReveal(range)) {
      const src = v.buf.line(range.start.line).slice(range.start.col);
      const wrapped = WRAPPED[node.type];
      const math =
        node.type === "inlineMath"
          ? mathText(String(node.value ?? ""))
          : undefined;
      if (math?.kind === "unicode")
        out.push(show(range, [{ text: math.text, style: "mdCode" }]));
      else if (wrapped !== undefined) {
        const n = wrapped.marker(src);
        const inner = { start: at(range.start, n), end: at(range.end, -n) };
        out.push(
          hide({ start: range.start, end: inner.start }),
          hide({ start: inner.end, end: range.end }),
          mark(inner, wrapped.style),
        );
      } else
        switch (node.type) {
          case "link": {
            const kids = node.children ?? [];
            const first = kids[0] && nodeRange(block, kids[0]);
            const last = kids.at(-1) && nodeRange(block, kids.at(-1) as MdNode);
            if (first === undefined || last === undefined) break;
            const head = { start: range.start, end: first.start };
            const tail = { start: last.end, end: range.end };
            if (!isEmpty(head)) out.push(hide(head));
            if (!isEmpty(tail)) out.push(hide(tail));
            out.push(mark({ start: first.start, end: last.end }, "mdLink"));
            break;
          }
          case "wikiLink":
          case "embed": {
            const target = String(node.target ?? "");
            const subpath = String(node.subpath ?? "");
            const alias = node.alias as string | undefined;
            const resolved = target === "" || ctx.isResolved(target);
            out.push(
              show(range, [
                {
                  text: alias ?? `${target}${subpath}`,
                  style: resolved ? "mdLink" : "linkUnresolved",
                  link: target,
                },
              ]),
            );
            break;
          }
          case "image": {
            const name = String(node.alt || baseName(String(node.url ?? "")));
            out.push(
              show(range, [
                { text: `[image: ${name}]`, style: "imagePlaceholder" },
              ]),
            );
            break;
          }
          case "comment":
            out.push(hide(range));
            break;
          case "tag":
            out.push(mark(range, "mdTag"));
            break;
          case "footnoteReference":
            out.push(
              show(range, [
                {
                  text: footnoteLabel(String(node.label ?? node.identifier)),
                  style: "mdFootnote",
                },
              ]),
            );
            break;
          case "inlineFootnote":
            out.push(mark(range, "mdFootnote"));
            break;
          case "blockId":
            out.push(mark(range, "mdMarker"));
            break;
        }
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(rootOf(doc, block, v.buf));
  return out;
}
