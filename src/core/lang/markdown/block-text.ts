import type { Range } from "../../kernel/text/pos";
import type { TextBuffer } from "../../kernel/text/text-buffer";
import { closesFence, openFence } from "./blocks";
import type { Block, Doc } from "./doc";
import { blockNode, type MdNode } from "./mdast";

/** Source lines `from…to` (inclusive) joined with "\n". */
export function sourceLines(text: TextBuffer, from: number, to: number) {
  const lines: string[] = [];
  for (let i = from; i <= to; i++) lines.push(text.line(i));
  return lines.join("\n");
}

const isBlank = (s: string) => s.trim() === "";

/** The block's first non-blank line (only the first block can start with blank lines). */
export function contentStart(text: TextBuffer, block: Block): number {
  let i = block.startLine;
  while (i < block.endLine && isBlank(text.line(i))) i++;
  return i;
}

/** The block's last non-blank line (trailing blank lines belong to the block before them). */
export function contentEnd(text: TextBuffer, block: Block): number {
  let i = block.endLine;
  while (i > block.startLine && isBlank(text.line(i))) i--;
  return i;
}

/** The block's content lines, without its trailing blank lines. */
export function wholeBlock(text: TextBuffer, block: Block): Range {
  const end = contentEnd(text, block);
  return {
    start: { line: contentStart(text, block), col: 0 },
    end: { line: end, col: text.line(end).length },
  };
}

/** The lines between a fence's opening and closing lines (to the block's end when unclosed). */
export function fenceBody(text: TextBuffer, block: Block): string[] {
  const first = contentStart(text, block);
  const last = contentEnd(text, block);
  const fence = openFence(text.line(first));
  const closed =
    fence !== undefined && last > first && closesFence(fence, text.line(last));
  const lines: string[] = [];
  for (let i = first + 1; i <= (closed ? last - 1 : last); i++)
    lines.push(text.line(i));
  return lines;
}

/** The block's cached mdast root. */
export const rootOf = (doc: Doc, block: Block, text: TextBuffer): MdNode =>
  blockNode(doc, block, (from, to) => sourceLines(text, from, to));

type Point = { line: number; column: number };

/** A node's start and end as buffer positions; mdast lines count from the block's first line. */
export function nodeRange(block: Block, node: MdNode): Range | undefined {
  const p = node.position as { start?: Point; end?: Point } | undefined;
  if (p?.start === undefined || p.end === undefined) return undefined;
  return {
    start: {
      line: block.startLine + p.start.line - 1,
      col: p.start.column - 1,
    },
    end: { line: block.startLine + p.end.line - 1, col: p.end.column - 1 },
  };
}

/** The target of an embed-only paragraph (`![[x#Section|alias]]` or `![alt](url)`). */
export function embedLink(
  doc: Doc,
  block: Block,
  text: TextBuffer,
): { target: string; section?: string; alt?: string } {
  const para = rootOf(doc, block, text).children?.[0];
  const node = para?.children?.find(
    (c) => c.type === "embed" || c.type === "image",
  );
  if (node?.type === "image") {
    const alt = String(node.alt ?? "");
    return { target: String(node.url ?? ""), ...(alt === "" ? {} : { alt }) };
  }
  const alias = node?.alias as string | undefined;
  return {
    target: String(node?.target ?? ""),
    ...(node?.subpath === undefined ? {} : { section: String(node.subpath) }),
    // A numeric alias on an image embed is a display size, not alt text.
    ...(alias === undefined || /^\d+(x\d+)?$/.test(alias)
      ? {}
      : { alt: alias }),
  };
}
