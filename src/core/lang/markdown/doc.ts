import type { Range } from "../../kernel/text/pos";
import type { TextBuffer } from "../../kernel/text/text-buffer";
import { type BlockKind, type BlockSpan, splitBlocks } from "./blocks";
import {
  type BlockScan,
  type DocScan,
  mergeScans,
  scanBlock,
  scanFrontmatter,
} from "./scan";

export type Block = {
  id: number;
  kind: BlockKind;
  startLine: number;
  endLine: number;
  hash: string;
  scan: BlockScan;
};
export type Doc = {
  version: number;
  frontmatter?: DocScan["frontmatter"];
  blocks: Block[];
  scan: DocScan;
};

/** 32-bit FNV-1a over UTF-16 code units. */
function fnv1a(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** A second, independent 32-bit hash, so equal hashes mean equal text in practice. */
function djb2(text: string): number {
  let h = 5381;
  for (let i = 0; i < text.length; i++)
    h = (Math.imul(h, 33) ^ text.charCodeAt(i)) >>> 0;
  return h;
}

function blockText(buf: TextBuffer, span: BlockSpan): string {
  const lines: string[] = [];
  for (let i = span.startLine; i <= span.endLine; i++) lines.push(buf.line(i));
  return lines.join("\n");
}

function hashOf(kind: BlockKind, text: string): string {
  return `${kind}:${text.length}:${fnv1a(text).toString(36)}:${djb2(text).toString(36)}`;
}

const shiftRange = (r: Range, by: number): Range => ({
  start: { line: r.start.line + by, col: r.start.col },
  end: { line: r.end.line + by, col: r.end.col },
});

/** The scan of a block whose text moved by `by` lines. */
function shiftScan(scan: BlockScan, by: number): BlockScan {
  if (by === 0) return scan;
  return {
    headings: scan.headings.map((h) => ({ ...h, line: h.line + by })),
    links: scan.links.map((l) => ({ ...l, range: shiftRange(l.range, by) })),
    tags: scan.tags.map((t) => ({ ...t, range: shiftRange(t.range, by) })),
    blockIds: scan.blockIds.map((b) => ({ ...b, line: b.line + by })),
    excluded: scan.excluded.map((r) => shiftRange(r, by)),
  };
}

/** The buffer each document was parsed from. */
const sources = new WeakMap<Doc, TextBuffer>();

/**
 * Hashes of `prev`'s blocks that `buf` still holds unchanged, keyed by their
 * start line in `buf`: blocks wholly inside the run of equal lines at the
 * start of both buffers, or inside the run of equal lines at their end.
 */
function unchangedHashes(buf: TextBuffer, prev: Doc): Map<number, Block> {
  const reused = new Map<number, Block>();
  const old = sources.get(prev);
  if (old === undefined) return reused;
  const n = buf.lineCount;
  const m = old.lineCount;
  const shortest = Math.min(n, m);
  let head = 0;
  while (head < shortest && buf.line(head) === old.line(head)) head++;
  let tail = 0;
  while (
    tail < shortest - head &&
    buf.line(n - 1 - tail) === old.line(m - 1 - tail)
  )
    tail++;
  const shift = n - m;
  for (const b of prev.blocks) {
    if (b.endLine < head) reused.set(b.startLine, b);
    else if (b.startLine >= m - tail) reused.set(b.startLine + shift, b);
  }
  return reused;
}

/**
 * Reuse every block of `prev` whose text hash is unchanged; scan only the others.
 * A block's id is the FNV-1a value of its hash, made unique in document order by
 * taking the next free value, so ids depend only on the document.
 */
export function parseDoc(buf: TextBuffer, prev?: Doc): Doc {
  const reusable = new Map<string, Block[]>();
  for (const b of prev?.blocks ?? []) {
    const same = reusable.get(b.hash);
    if (same === undefined) reusable.set(b.hash, [b]);
    else same.push(b);
  }
  const unchanged = prev === undefined ? undefined : unchangedHashes(buf, prev);
  const taken = new Set<number>();
  const blocks: Block[] = [];
  for (const span of splitBlocks(buf)) {
    const same = unchanged?.get(span.startLine);
    const hash =
      same !== undefined &&
      same.kind === span.kind &&
      same.endLine - same.startLine === span.endLine - span.startLine
        ? same.hash
        : hashOf(span.kind, blockText(buf, span));
    let id = fnv1a(hash);
    while (taken.has(id)) id = (id + 1) >>> 0;
    taken.add(id);
    const old = reusable.get(hash)?.shift();
    if (old !== undefined && old.startLine === span.startLine && old.id === id)
      blocks.push(old);
    else
      blocks.push({
        id,
        kind: span.kind,
        startLine: span.startLine,
        endLine: span.endLine,
        hash,
        scan:
          old === undefined
            ? scanBlock(buf, span)
            : shiftScan(old.scan, span.startLine - old.startLine),
      });
  }
  const first = blocks[0];
  let frontmatter: DocScan["frontmatter"];
  if (first?.kind === "frontmatter") {
    const reused =
      prev?.blocks[0]?.hash === first.hash ? prev.frontmatter : undefined;
    if (reused !== undefined) frontmatter = reused;
    else {
      const { data, tags, aliases } = scanFrontmatter(buf, first);
      frontmatter = { data, tags, aliases };
    }
  }
  const scan = mergeScans(
    blocks.map((b) => b.scan),
    frontmatter,
  );
  const doc: Doc =
    frontmatter === undefined
      ? { version: buf.version, blocks, scan }
      : { version: buf.version, frontmatter, blocks, scan };
  sources.set(doc, buf);
  return doc;
}
