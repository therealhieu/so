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
  type InlineLine,
  inlineSpans,
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
const LIST_ITEM = /^[ \t]*(?:[-+*]|\d{1,9}[.)])(?:[ \t]|$)/;
const TABLE_DELIMITER =
  /^[ \t]*\|?[ \t]*:?-+:?[ \t]*(?:\|[ \t]*:?-+:?[ \t]*)*\|?[ \t]*$/;

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

/** The blockquote depth of a line and the text after its markers. */
function unquote(text: string): { depth: number; rest: string } {
  let rest = text;
  let depth = 0;
  for (let m = QUOTE.exec(rest); m !== null; m = QUOTE.exec(rest)) {
    rest = rest.slice(m[0].length);
    depth++;
  }
  return { depth, rest };
}

/** The text after any blockquote markers (and, in a list, the item marker). */
const contentOf = (rest: string, inList: boolean): string =>
  inList ? rest.trimStart().replace(LIST_MARKER, "") : rest;

const isTableDelimiter = (text: string) =>
  text.includes("|") &&
  text.includes("-") &&
  TABLE_DELIMITER.test(unquote(text).rest);

/**
 * Scan the lines of one paragraph. Inline code and math are paired across the
 * whole paragraph, so a span that wraps onto later lines hides their syntax.
 */
function scanParagraph(lines: readonly InlineLine[], out: ScanOut) {
  const spans = inlineSpans(lines);
  let first = 0;
  const open: Range[] = [];
  for (const { text, line } of lines) {
    for (let k = open.length - 1; k >= 0; k--)
      if ((open[k] as Range).end.line < line) open.splice(k, 1);
    while (first < spans.length && (spans[first] as Range).start.line === line)
      open.push(spans[first++] as Range);
    scanLine(text, line, out, open);
  }
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
  /** The current paragraph's lines, scanned together when it ends. */
  let lines: InlineLine[] = [];
  let depth = 0;
  let inTable = false;
  const flush = () => {
    if (lines.length > 0) scanParagraph(lines, out);
    lines = [];
  };
  for (let i = span.startLine; i <= span.endLine; i++) {
    const text = src.line(i);
    const quote = unquote(text);
    const content = contentOf(quote.rest, inList).trimStart();
    if (fence !== undefined) {
      if (closesFence(fence, content)) {
        out.excluded.push(lineRange(src, fenceStart, i));
        fence = undefined;
      }
      continue;
    }
    fence = openFence(content);
    if (fence !== undefined) {
      flush();
      fenceStart = i;
      paragraphStart = undefined;
      continue;
    }
    if (text.trim() === "") {
      flush();
      inTable = false;
      paragraphStart = undefined;
      continue;
    }
    const setext = span.kind === "paragraph" && SETEXT.exec(text);
    if (setext && paragraphStart !== undefined) {
      const heading: string[] = [];
      for (let j = paragraphStart; j < i; j++) heading.push(src.line(j).trim());
      out.headings.push({
        text: heading.join("\n"),
        level: setext[1]?.[0] === "=" ? 1 : 2,
        line: paragraphStart,
      });
      flush();
      paragraphStart = undefined;
      continue;
    }
    const heading = atxHeading(contentOf(quote.rest, inList));
    // A heading, a quote-only line, a new list item, a deeper quote, or a
    // table row starts a new run of inline content.
    const alone =
      heading !== undefined ||
      quote.rest.trim() === "" ||
      inTable ||
      (i < span.endLine && isTableDelimiter(src.line(i + 1)));
    if (alone || LIST_ITEM.test(quote.rest) || quote.depth > depth) flush();
    depth = quote.depth;
    if (isTableDelimiter(text)) inTable = true;
    if (heading !== undefined) {
      out.headings.push({ ...heading, line: i });
      paragraphStart = undefined;
    } else paragraphStart ??= i;
    lines.push({ text, line: i });
    if (alone) flush();
  }
  flush();
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
