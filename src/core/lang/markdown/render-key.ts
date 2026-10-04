import type { TextBuffer } from "../../kernel/text/text-buffer";
import { contentStart, rootOf } from "./block-text";
import type { Block, Doc } from "./doc";
import type { MdNode } from "./mdast";

export const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "svg",
]);

/** The render key of an embed-only paragraph: "embed" for notes, "image" for images, else the extension. */
export function embedOnly(target: string): string {
  const name = target.split(/[?#]/, 1)[0]?.split("/").pop() ?? "";
  const dot = name.lastIndexOf(".");
  const ext = dot <= 0 ? "" : name.slice(dot + 1).toLowerCase();
  if (ext === "" || ext === "md") return "embed";
  return IMAGE_EXTENSIONS.has(ext) ? "image" : ext;
}

const MERMAID_FENCE = /^ {0,3}(?:`{3,}|~{3,})\s*mermaid(?:\s|$)/i;

/** Inline children that carry content: not whitespace-only text or line breaks. */
const solid = (node: MdNode): MdNode[] =>
  (node.children ?? []).filter(
    (c) =>
      c.type !== "break" &&
      !(c.type === "text" && (c.value ?? "").trim() === ""),
  );

function paragraphKey(root: MdNode): string {
  const first = root.children?.[0];
  switch (first?.type) {
    case "table":
      return "table";
    case "callout":
      return "callout";
    case "blockquote":
      return "quote";
    case "thematicBreak":
      return "rule";
    case "footnoteDefinition":
      return "footnote";
    case "heading":
      return "heading";
    case "math":
      return "math";
    case "html":
      return "html";
    case "paragraph": {
      if ((root.children?.length ?? 0) !== 1) return "paragraph";
      const items = solid(first);
      const only = items.length === 1 ? items[0] : undefined;
      if (only?.type === "embed") return embedOnly(String(only.target ?? ""));
      if (only?.type === "image") return "image";
      if (items.length > 0 && items.every((n) => n.type === "comment"))
        return "comment";
      return "paragraph";
    }
    default:
      return "paragraph";
  }
}

/**
 * The key a block's renderer is registered under. Only paragraph-kind blocks
 * parse their (cached) mdast, to tell tables, callouts, quotes, rules,
 * footnotes, and embed-only lines apart.
 */
export function renderKey(block: Block, doc: Doc, text: TextBuffer): string {
  switch (block.kind) {
    case "fence":
      return MERMAID_FENCE.test(text.line(contentStart(text, block)))
        ? "mermaid"
        : "code";
    case "indentedCode":
      return "code";
    case "paragraph":
      return paragraphKey(rootOf(doc, block, text));
    default:
      return block.kind;
  }
}
