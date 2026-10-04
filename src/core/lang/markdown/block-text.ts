import type { Range } from "../../kernel/text/pos";
import type { TextBuffer } from "../../kernel/text/text-buffer";
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
