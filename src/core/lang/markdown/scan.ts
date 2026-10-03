import { parse } from "yaml";
import type { Range } from "../../kernel/text/pos";
import {
  type BlockSpan,
  closesFence,
  type LineSource,
  openFence,
  splitBlocks,
} from "./blocks";
import {
  type LinkSpan,
  type ScanOut,
  scanLine,
  syntaxExtensions,
  type TagSpan,
} from "./syntax";

export type { LinkSpan } from "./syntax";

export type BlockScan = {
  headings: { text: string; level: number; line: number }[];
  links: LinkSpan[];
  tags: TagSpan[];
  blockIds: { id: string; line: number }[];
  /** fenced/indented code, $$ math, %% and <!-- --> comments, inline code and math */
  excluded: Range[];
};

export type Frontmatter = {
  data: Record<string, unknown>;
  tags: string[];
  aliases: string[];
};
export type DocScan = BlockScan & { frontmatter?: Frontmatter };

const ATX = /^ {0,3}(#{1,6})(?:[ \t]+|$)(.*)$/;
const SETEXT = /^ {0,3}(=+|-+)[ \t]*$/;
const QUOTE = /^ {0,3}>[ \t]?/;
const LIST_MARKER = /^(?:[-+*]|\d{1,9}[.)])[ \t]+/;

const lineRange = (src: LineSource, from: number, to: number): Range => ({
  start: { line: from, col: 0 },
  end: { line: to, col: src.line(to).length },
});

const emptyScan = (): BlockScan => ({
  headings: [],
  links: [],
  tags: [],
  blockIds: [],
  excluded: [],
});

/** The text after any blockquote markers (and, in a list, the item marker). */
function contentOf(text: string, inList: boolean): string {
  let rest = text;
  for (let m = QUOTE.exec(rest); m !== null; m = QUOTE.exec(rest))
    rest = rest.slice(m[0].length);
  return inList ? rest.trimStart().replace(LIST_MARKER, "") : rest;
}

function atxHeading(content: string) {
  const m = ATX.exec(content);
  if (m === null) return undefined;
  const text = (m[2] ?? "").replace(/(?:^|[ \t]+)#+[ \t]*$/, "").trim();
  return { text, level: (m[1] ?? "").length };
}

/** The wikilinks of frontmatter lines, marked as frontmatter links. */
function frontmatterLinks(src: LineSource, span: BlockSpan): LinkSpan[] {
  const out: ScanOut = { links: [], tags: [], blockIds: [], excluded: [] };
  const wiki = syntaxExtensions.find((e) => e.name === "wikiLink");
  for (let i = span.startLine + 1; i <= span.endLine; i++)
    wiki?.scan?.(src.line(i), i, 0, out);
  return out.links.map((l) => ({ ...l, inFrontmatter: true }));
}

/** Code, math, comment, and HTML blocks contribute only an `excluded` range. */
export function scanBlock(src: LineSource, span: BlockSpan): BlockScan {
  const out = emptyScan();
  const whole = lineRange(src, span.startLine, span.endLine);
  switch (span.kind) {
    case "frontmatter":
      out.links = frontmatterLinks(src, span);
      out.excluded.push(whole);
      return out;
    case "fence":
    case "math":
    case "indentedCode":
    case "comment":
    case "html":
      out.excluded.push(whole);
      return out;
  }
  const inList = span.kind === "list";
  let fence: ReturnType<typeof openFence>;
  let fenceStart = 0;
  let paragraphStart: number | undefined;
  for (let i = span.startLine; i <= span.endLine; i++) {
    const text = src.line(i);
    const content = contentOf(text, inList).trimStart();
    if (fence !== undefined) {
      if (closesFence(fence, content)) {
        out.excluded.push(lineRange(src, fenceStart, i));
        fence = undefined;
      }
      continue;
    }
    fence = openFence(content);
    if (fence !== undefined) {
      fenceStart = i;
      paragraphStart = undefined;
      continue;
    }
    if (text.trim() === "") {
      paragraphStart = undefined;
      continue;
    }
    const setext = span.kind === "paragraph" && SETEXT.exec(text);
    if (setext && paragraphStart !== undefined) {
      const lines: string[] = [];
      for (let j = paragraphStart; j < i; j++) lines.push(src.line(j).trim());
      out.headings.push({
        text: lines.join("\n"),
        level: setext[1]?.[0] === "=" ? 1 : 2,
        line: paragraphStart,
      });
      paragraphStart = undefined;
      continue;
    }
    const heading = atxHeading(contentOf(text, inList));
    if (heading !== undefined) {
      out.headings.push({ ...heading, line: i });
      paragraphStart = undefined;
    } else paragraphStart ??= i;
    scanLine(text, i, out);
  }
  if (fence !== undefined)
    out.excluded.push(lineRange(src, fenceStart, span.endLine));
  return out;
}

const tagList = (value: unknown): string[] => {
  const items =
    typeof value === "string"
      ? value.split(/[,\s]+/)
      : Array.isArray(value)
        ? value.filter((v) => typeof v === "string" || typeof v === "number")
        : [];
  return items
    .map((v) => String(v).trim().replace(/^#/, ""))
    .filter((v) => v !== "");
};

const aliasList = (value: unknown): string[] =>
  (typeof value === "string"
    ? [value]
    : Array.isArray(value)
      ? value.filter((v) => typeof v === "string" || typeof v === "number")
      : []
  )
    .map((v) => String(v).trim())
    .filter((v) => v !== "");

/** YAML values (`tags` and `aliases` as a string or a list) and the frontmatter's wikilinks. */
export function scanFrontmatter(
  src: LineSource,
  span: BlockSpan,
): Frontmatter & { links: LinkSpan[] } {
  let close = span.endLine;
  while (close > span.startLine && src.line(close).trimEnd() !== "---") close--;
  const yamlLines: string[] = [];
  for (let i = span.startLine + 1; i < close; i++) yamlLines.push(src.line(i));
  let data: Record<string, unknown> = {};
  try {
    const parsed: unknown = parse(yamlLines.join("\n"), { logLevel: "error" });
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed))
      data = parsed as Record<string, unknown>;
  } catch {
    data = {};
  }
  return {
    data,
    tags: tagList(data.tags),
    aliases: aliasList(data.aliases),
    links: frontmatterLinks(src, span),
  };
}

/** Block results concatenated in document order. */
export function mergeScans(
  blocks: readonly BlockScan[],
  fm?: Frontmatter,
): DocScan {
  const scan: DocScan = emptyScan();
  for (const b of blocks) {
    scan.headings.push(...b.headings);
    scan.links.push(...b.links);
    scan.tags.push(...b.tags);
    scan.blockIds.push(...b.blockIds);
    scan.excluded.push(...b.excluded);
  }
  if (fm !== undefined)
    scan.frontmatter = { data: fm.data, tags: fm.tags, aliases: fm.aliases };
  return scan;
}

/** Text lines with "\n" separators; a trailing "\r" is dropped so columns match the buffer. */
export function linesOf(text: string): LineSource {
  const lines = text
    .split("\n")
    .map((l) => (l.endsWith("\r") ? l.slice(0, -1) : l));
  return { line: (i) => lines[i] ?? "", lineCount: lines.length };
}

/** Whole-text scan for the worker and written files. */
export function scanDoc(text: string): DocScan {
  const src = linesOf(text);
  const spans = splitBlocks(src);
  const first = spans[0];
  const fm =
    first?.kind === "frontmatter" ? scanFrontmatter(src, first) : undefined;
  return mergeScans(
    spans.map((s) => scanBlock(src, s)),
    fm,
  );
}
