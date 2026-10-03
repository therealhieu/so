import type { Pos, Range } from "../../kernel/text/pos";

export type LinkSpan = {
  kind: "wiki" | "embed" | "md";
  /** Decoded target without subpath (md links URL-decoded). */
  target: string;
  /** "#H1#H2" or "#^block". */
  subpath?: string;
  alias?: string;
  /** Exact source text of the whole link. */
  raw: string;
  /** Source range of `raw`. */
  range: Range;
  inFrontmatter?: true;
};
export type TagSpan = { tag: string; range: Range };

export type ScanOut = {
  /** wiki, embed, md */
  links: LinkSpan[];
  tags: TagSpan[];
  blockIds: { id: string; line: number }[];
  /** inline code, inline math, %%…%% comments, <!-- --> inside the block */
  excluded: Range[];
};

/** An mdast node, typed structurally so the registry needs no Markdown package. */
export type MdNode = {
  type: string;
  children?: MdNode[];
  value?: string;
  position?: unknown;
  [k: string]: unknown;
};

export type SyntaxExtension = {
  name:
    | "wikiLink"
    | "embed"
    | "tag"
    | "highlight"
    | "comment"
    | "callout"
    | "blockId"
    | "footnote"
    | "math"
    | (string & {});
  /** Record matches in `text` (one line of a non-code block) starting at source column `col0` of `line`. */
  scan?(text: string, line: number, col0: number, out: ScanOut): void;
  /** Rewrite mdast text nodes into Obsidian nodes for this syntax. */
  transform?(tree: MdNode): void;
};

const rangeOf = (line: number, start: number, end: number): Range => ({
  start: { line, col: start },
  end: { line, col: end },
});

/** True when the character at `i` is escaped by an odd run of backslashes. */
const escaped = (text: string, i: number): boolean => {
  let n = 0;
  for (let j = i - 1; j >= 0 && text[j] === "\\"; j--) n++;
  return n % 2 === 1;
};

/**
 * `text.indexOf(needle, from)` for calls with non-decreasing `from`. Each call
 * resumes where the last one stopped, so all calls together read `text` once.
 */
function finder(text: string, needle: string) {
  let at = -2;
  return (from: number): number => {
    if (at !== -1 && at < from) at = text.indexOf(needle, from);
    return at;
  };
}

/**
 * Columns of one line already claimed by an exclusion or a link, as sorted,
 * merged `[from, to)` pairs. Queries with non-decreasing starts advance one
 * cursor, so a scanner's queries cost linear time in total.
 */
class Claims {
  private spans: number[] = [];
  private k = 0;
  private last = Number.NEGATIVE_INFINITY;

  constructor(line: number, ranges: readonly Range[]) {
    const raw: [number, number][] = [];
    for (const r of ranges) {
      if (r.start.line > line || r.end.line < line) continue;
      raw.push([
        r.start.line < line ? 0 : r.start.col,
        r.end.line > line ? Number.POSITIVE_INFINITY : r.end.col,
      ]);
    }
    raw.sort((a, b) => a[0] - b[0]);
    for (const [from, to] of raw) {
      const top = this.spans.length - 1;
      if (top > 0 && from <= (this.spans[top] as number))
        this.spans[top] = Math.max(this.spans[top] as number, to);
      else this.spans.push(from, to);
    }
  }

  /** Start a new scanner's queries from the line start. */
  rewind() {
    this.k = 0;
    this.last = Number.NEGATIVE_INFINITY;
  }

  has(start: number, end: number): boolean {
    const spans = this.spans;
    if (start < this.last) this.k = 0;
    this.last = start;
    while (this.k < spans.length && (spans[this.k + 1] as number) <= start)
      this.k += 2;
    return this.k < spans.length && (spans[this.k] as number) < end;
  }
}

/** The claims of the line `scanLine` is scanning; unset outside it, where nothing is claimed. */
let claimed: Claims | undefined;

/** True when [start, end) on the line being scanned overlaps an exclusion or a link found before this scanner ran. */
const taken = (start: number, end: number) => claimed?.has(start, end) ?? false;

/** One line of a paragraph's inline content. */
export type InlineLine = { text: string; line: number };

type Run = { line: number; col: number; length: number };

const isBefore = (a: Pos, b: Pos) =>
  a.line < b.line || (a.line === b.line && a.col < b.col);

/** Unescaped runs of `ch` on each line; a backslash makes only the run's first character literal. */
function runsOf(ch: string, lines: readonly InlineLine[]): Run[] {
  const runs: Run[] = [];
  for (const { text, line } of lines) {
    for (let i = text.indexOf(ch); i !== -1; ) {
      let j = i;
      while (text[j] === ch) j++;
      if (!escaped(text, i)) runs.push({ line, col: i, length: j - i });
      else if (j - i > 1) runs.push({ line, col: i + 1, length: j - i - 1 });
      i = text.indexOf(ch, j);
    }
  }
  return runs;
}

/**
 * Each opening run is closed by the next run of the same length, which may be
 * on a later line; `skip` rejects an opener. Runs are paired in one pass.
 */
function pairRuns(runs: readonly Run[], skip: (open: Run) => boolean): Range[] {
  if (runs.length < 2) return [];
  const byLength = new Map<number, number[]>();
  runs.forEach((r, k) => {
    const list = byLength.get(r.length) ?? [];
    list.push(k);
    byLength.set(r.length, list);
  });
  const cursor = new Map<number, number>();
  const spans: Range[] = [];
  let k = 0;
  while (k < runs.length) {
    const open = runs[k] as Run;
    const list = byLength.get(open.length) ?? [];
    let p = cursor.get(open.length) ?? 0;
    while ((list[p] ?? Number.POSITIVE_INFINITY) <= k) p++;
    cursor.set(open.length, p);
    const close = list[p];
    const closeRun = close === undefined ? undefined : runs[close];
    if (close === undefined || closeRun === undefined || skip(open)) {
      k++;
      continue;
    }
    spans.push({
      start: { line: open.line, col: open.col },
      end: { line: closeRun.line, col: closeRun.col + closeRun.length },
    });
    k = close + 1;
  }
  return spans;
}

/**
 * Inline code and math spans of one paragraph, in source order. A span may wrap
 * across the paragraph's lines, as in CommonMark; math cannot open inside code.
 */
export function inlineSpans(lines: readonly InlineLine[]): Range[] {
  const code = pairRuns(runsOf("`", lines), () => false);
  let c = 0;
  const inCode = (open: Run) => {
    const at = { line: open.line, col: open.col };
    while (c < code.length && !isBefore(at, (code[c] as Range).end)) c++;
    const span = code[c];
    return span !== undefined && !isBefore(at, span.start);
  };
  const math = pairRuns(runsOf("$", lines), inCode);
  if (math.length === 0) return code;
  if (code.length === 0) return math;
  return [...code, ...math].sort((a, b) =>
    isBefore(a.start, b.start) ? -1 : isBefore(b.start, a.start) ? 1 : 0,
  );
}

/** `%%…%%` and `<!-- … -->` closed on the same line. */
function scanComments(text: string, line: number, col0: number, out: ScanOut) {
  if (!text.includes("%%") && !text.includes("<!--")) return;
  const pct = finder(text, "%%");
  const html = finder(text, "<!--");
  const pctClose = finder(text, "%%");
  const htmlClose = finder(text, "-->");
  for (let i = 0; ; ) {
    const p = pct(i);
    const h = html(i);
    const at = p === -1 ? h : h === -1 ? p : Math.min(p, h);
    if (at === -1) return;
    const isHtml = at === h;
    const close = isHtml ? htmlClose(at + 4) : pctClose(at + 2);
    if (close === -1) return;
    const end = close + (isHtml ? 3 : 2);
    if (escaped(text, at) || taken(col0 + at, col0 + at + 1)) {
      i = at + 1;
      continue;
    }
    out.excluded.push(rangeOf(line, col0 + at, col0 + end));
    i = end;
  }
}

/** A wikilink or embed found by `wikiMatches`. */
type WikiMatch = {
  index: number;
  raw: string;
  /** Target and subpath: the text before the first `|` or `]`. */
  inner: string;
  alias?: string;
};

/**
 * The wikilink grammar shared by the scan and the mdast transform: `[[inner]]`
 * or `[[inner|alias]]` (with `!` for an embed), where `inner` is non-empty and
 * has no `]` or `|`, and the alias has no `]`. A wikilink is not preceded by
 * `!`. Matches are found left to right in time linear in `text`'s length.
 */
function* wikiMatches(text: string, embed: boolean): Generator<WikiMatch> {
  const open = embed ? "![[" : "[[";
  let s = text.indexOf(open);
  if (s === -1) return;
  const bracket = finder(text, "]");
  const pipe = finder(text, "|");
  while (s !== -1) {
    let next = s + 1;
    if (embed || text[s - 1] !== "!") {
      const from = s + open.length;
      const b = bracket(from);
      const p = pipe(from);
      const stop = p === -1 || (b !== -1 && b < p) ? b : p;
      if (stop > from && text[stop] === "|") {
        if (b !== -1 && text[b + 1] === "]") {
          yield {
            index: s,
            raw: text.slice(s, b + 2),
            inner: text.slice(from, stop),
            alias: text.slice(stop + 1, b),
          };
          next = b + 2;
        }
      } else if (stop > from && text[stop + 1] === "]") {
        yield {
          index: s,
          raw: text.slice(s, stop + 2),
          inner: text.slice(from, stop),
        };
        next = stop + 2;
      }
    }
    s = text.indexOf(open, next);
  }
}

/** Target and subpath of a wikilink's inner text; a table-escaped pipe (`\|`) separates the alias. */
export function wikiTarget(inner: string): {
  target: string;
  subpath?: string;
} {
  const unescaped = inner.endsWith("\\") ? inner.slice(0, -1) : inner;
  const hash = unescaped.indexOf("#");
  if (hash === -1) return { target: unescaped.trim() };
  return {
    target: unescaped.slice(0, hash).trim(),
    subpath: unescaped.slice(hash).trim(),
  };
}

function scanWiki(
  kind: "wiki" | "embed",
  text: string,
  line: number,
  col0: number,
  out: ScanOut,
) {
  for (const m of wikiMatches(text, kind === "embed")) {
    const start = col0 + m.index;
    const end = start + m.raw.length;
    if (escaped(text, m.index) || taken(start, end)) continue;
    const { target, subpath } = wikiTarget(m.inner);
    out.links.push({
      kind,
      target,
      ...(subpath === undefined ? {} : { subpath }),
      ...(m.alias === undefined ? {} : { alias: m.alias }),
      raw: m.raw,
      range: rangeOf(line, start, end),
    });
  }
}

/** Unescaped, URL-decoded path and subpath of a Markdown link destination. */
export function markdownTarget(dest: string): {
  target: string;
  subpath?: string;
} {
  const unescaped = dest.replace(/\\([!-/:-@[-`{-~])/g, "$1");
  const decode = (s: string) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };
  const hash = unescaped.indexOf("#");
  if (hash === -1) return { target: decode(unescaped) };
  return {
    target: decode(unescaped.slice(0, hash)),
    subpath: decode(unescaped.slice(hash)),
  };
}

/** A destination with a URL scheme (`https:`, `mailto:`, `obsidian:`) is not a link to a workspace file. */
export const isExternal = (dest: string) =>
  /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(dest);

type MarkdownLink = {
  end: number;
  dest: string;
  /** The destination as written: inside `<…>` when `angle`. */
  destStart: number;
  destEnd: number;
  angle: boolean;
};

/** Lookups over one line that make each `[text](dest "title")` attempt constant time. */
type LinkIndex = {
  /** The index of the `]` matching the `[` at `i`, or -1. */
  close(i: number): number;
  /** Where a bare destination starting at `k` ends: at an unescaped space or tab, or an unbalanced `)`. */
  bareEnd(k: number): number;
  /** The first index at or after `k` that is not a space or tab. */
  solid(k: number): number;
  /** The first index of `ch` at or after `from`, or -1. */
  next(ch: string, from: number): number;
};

const BACKSLASH = 92;
const OPEN_BRACKET = 91;
const CLOSE_BRACKET = 93;
const OPEN_PAREN = 40;
const CLOSE_PAREN = 41;
const SPACE = 32;
const TAB = 9;

/**
 * Build a `LinkIndex` over `text`: bracket pairs in one forward pass, and the
 * destination tables in one backward pass the first time they are needed.
 */
function linkIndex(text: string): LinkIndex {
  const n = text.length;
  const literal = new Uint8Array(n);
  const close = new Int32Array(n);
  const depth = new Int32Array(n + 1);
  const opens: number[] = [];
  let parens = 0;
  for (let p = 0, skip = false; p < n; p++) {
    depth[p] = parens;
    close[p] = -1;
    const c = text.charCodeAt(p);
    if (skip) {
      literal[p] = 1;
      skip = false;
      continue;
    }
    if (c === BACKSLASH) skip = true;
    else if (c === OPEN_BRACKET) opens.push(p);
    else if (c === CLOSE_BRACKET) {
      const o = opens.pop();
      if (o !== undefined) close[o] = p;
    } else if (c === OPEN_PAREN) parens++;
    else if (c === CLOSE_PAREN) parens--;
  }
  depth[n] = parens;
  let bare: Int32Array | undefined;
  let solid: Int32Array | undefined;
  const destinations = () => {
    bare = new Int32Array(n + 1);
    solid = new Int32Array(n + 1);
    bare[n] = n;
    solid[n] = n;
    /** The nearest unescaped `)` at each paren depth, scanning backwards. */
    const closer = new Map<number, number>();
    let blank = n;
    for (let p = n - 1; p >= 0; p--) {
      const c = text.charCodeAt(p);
      const isBlank = c === SPACE || c === TAB;
      solid[p] = isBlank ? (solid[p + 1] as number) : p;
      if (literal[p] === 0) {
        if (c === CLOSE_PAREN) closer.set(depth[p] as number, p);
        else if (isBlank) blank = p;
      }
      bare[p] = Math.min(blank, closer.get(depth[p] as number) ?? n);
    }
    return { bare, solid };
  };
  const nextOf = new Map<string, Int32Array>();
  return {
    close: (i) => close[i] ?? -1,
    bareEnd: (k) => (bare ?? destinations().bare)[k] as number,
    solid: (k) => (solid ?? destinations().solid)[k] as number,
    next(ch, from) {
      if (from >= n) return -1;
      let at = nextOf.get(ch);
      if (at === undefined) {
        at = new Int32Array(n + 1);
        at[n] = -1;
        for (let p = n - 1; p >= 0; p--)
          at[p] = text[p] === ch ? p : (at[p + 1] as number);
        nextOf.set(ch, at);
      }
      return at[from] as number;
    },
  };
}

/** `[text](dest "title")` starting at `i`: the end index and the destination with its span, or nothing. */
export function parseMarkdownLink(
  text: string,
  i: number,
  ix: LinkIndex = linkIndex(text),
): MarkdownLink | undefined {
  const j = ix.close(i);
  if (j === -1 || text[j + 1] !== "(") return undefined;
  let k = ix.solid(j + 2);
  let dest: string;
  const angle = text[k] === "<";
  const destStart = angle ? k + 1 : k;
  let destEnd: number;
  if (angle) {
    const close = ix.next(">", k + 1);
    if (close === -1) return undefined;
    const lt = ix.next("<", k + 1);
    if (lt !== -1 && lt < close) return undefined;
    dest = text.slice(k + 1, close);
    destEnd = close;
    k = close + 1;
  } else {
    destEnd = ix.bareEnd(k);
    dest = text.slice(k, destEnd);
    k = destEnd;
  }
  k = ix.solid(k);
  const quote = text[k];
  if (quote === '"' || quote === "'" || quote === "(") {
    const close = ix.next(quote === "(" ? ")" : quote, k + 1);
    if (close === -1) return undefined;
    k = ix.solid(close + 1);
  }
  if (text[k] !== ")") return undefined;
  return { end: k + 1, dest, destStart, destEnd, angle };
}

function scanMarkdownLinks(
  text: string,
  line: number,
  col0: number,
  out: ScanOut,
) {
  if (!text.includes("](")) return;
  let ix: LinkIndex | undefined;
  for (let i = text.indexOf("["); i !== -1; i = text.indexOf("[", i + 1)) {
    if (escaped(text, i) || text[i + 1] === "[") continue;
    ix ??= linkIndex(text);
    const link = parseMarkdownLink(text, i, ix);
    if (link === undefined || link.dest === "" || isExternal(link.dest))
      continue;
    const start = col0 + i;
    const end = col0 + link.end;
    if (taken(start, end)) continue;
    const { target, subpath } = markdownTarget(link.dest);
    out.links.push({
      kind: "md",
      target,
      ...(subpath === undefined ? {} : { subpath }),
      raw: text.slice(i, link.end),
      range: rangeOf(line, start, end),
    });
    i = link.end - 1;
  }
}

/** Obsidian tags: letters, digits, `_`, `-`, and `/` after whitespace or the line start; not all digits. */
export const TAG_RE = /(?<=^|\s)#([\p{L}\p{N}_/-]+)/gu;
export const isTag = (name: string) => !/^\d+$/.test(name);

function scanTags(text: string, line: number, col0: number, out: ScanOut) {
  for (const m of text.matchAll(TAG_RE)) {
    const tag = m[1] ?? "";
    const start = col0 + m.index;
    const end = start + m[0].length;
    if (!isTag(tag) || taken(start, end)) continue;
    out.tags.push({ tag, range: rangeOf(line, start, end) });
  }
}

/** A block id at the end of a line: Latin letters, digits, and dashes. */
export const BLOCK_ID_RE = /(?:^|\s)\^([A-Za-z0-9-]+)[ \t]*$/;

function scanBlockId(text: string, line: number, col0: number, out: ScanOut) {
  const m = BLOCK_ID_RE.exec(text);
  if (m === null) return;
  const at = col0 + m.index + m[0].indexOf("^");
  if (!taken(at, at + 1)) out.blockIds.push({ id: m[1] ?? "", line });
}

type Point = { line: number; column: number };
type Position = { start: Point; end: Point };

/** The point `k` code units into `value`, a text node starting at `base`. */
function pointAt(base: Point, value: string, k: number): Point {
  const before = value.slice(0, k);
  const nl = before.lastIndexOf("\n");
  if (nl === -1) return { line: base.line, column: base.column + k };
  let lines = 0;
  for (const ch of before) if (ch === "\n") lines++;
  return { line: base.line + lines, column: k - nl };
}

const startOf = (node: MdNode): Point =>
  (node.position as Position | undefined)?.start ?? { line: 1, column: 1 };

/** Visit every node with its parent, children before siblings. */
function walk(
  node: MdNode,
  visit: (node: MdNode, parent: MdNode, index: number) => void,
  skip: ReadonlySet<string>,
) {
  const children = node.children;
  if (children === undefined || skip.has(node.type)) return;
  for (let i = 0; i < children.length; i++) {
    const child = children[i] as MdNode;
    visit(child, node, i);
    walk(child, visit, skip);
  }
}

const NONE: ReadonlySet<string> = new Set();
const LINKS: ReadonlySet<string> = new Set(["link", "linkReference"]);

/** An Obsidian node replacing `length` code units of a text node at `index`. */
type Found = { index: number; length: number; node: MdNode };

/** Matches of `re` that `make` turns into nodes; a match it rejects stays text. */
const matching = (
  re: RegExp,
  make: (m: RegExpMatchArray) => MdNode | undefined,
) =>
  function* (value: string): Generator<Found> {
    for (const m of value.matchAll(re)) {
      const node = make(m);
      if (node !== undefined)
        yield { index: m.index, length: m[0].length, node };
    }
  };

/** Split every text node (outside `skip`) at the nodes `find` returns for its value. */
function replaceText(
  tree: MdNode,
  find: (value: string) => Iterable<Found>,
  skip: ReadonlySet<string> = NONE,
) {
  const parents = new Set<MdNode>();
  walk(
    tree,
    (node, parent) => {
      if (node.type === "text") parents.add(parent);
    },
    skip,
  );
  for (const parent of parents) {
    const out: MdNode[] = [];
    for (const child of parent.children ?? []) {
      if (child.type !== "text") {
        out.push(child);
        continue;
      }
      const value = child.value ?? "";
      const base = startOf(child);
      const piece = (
        type: string,
        from: number,
        to: number,
        extra: object,
      ) => ({
        type,
        ...extra,
        position: {
          start: pointAt(base, value, from),
          end: pointAt(base, value, to),
        },
      });
      let last = 0;
      for (const { index, length, node } of find(value)) {
        if (index > last)
          out.push(
            piece("text", last, index, { value: value.slice(last, index) }),
          );
        out.push(piece(node.type, index, index + length, node));
        last = index + length;
      }
      if (last === 0) out.push(child);
      else if (last < value.length)
        out.push(
          piece("text", last, value.length, { value: value.slice(last) }),
        );
    }
    parent.children = out;
  }
}

const wikiNodes = (type: "wikiLink" | "embed") =>
  function* (value: string): Generator<Found> {
    for (const m of wikiMatches(value, type === "embed")) {
      const { target, subpath } = wikiTarget(m.inner);
      yield {
        index: m.index,
        length: m.raw.length,
        node: {
          type,
          value: m.raw,
          target,
          ...(subpath === undefined ? {} : { subpath }),
          ...(m.alias === undefined ? {} : { alias: m.alias }),
        },
      };
    }
  };

/** Block ids end a source line: a text node's inner line, or its end before a break or the parent's end. */
function blockIdTransform(tree: MdNode) {
  const ends: { parent: MdNode; index: number }[] = [];
  walk(
    tree,
    (node, parent, index) => {
      if (node.type !== "text" || parent.type === "tableCell") return;
      const next = parent.children?.[index + 1];
      if (next === undefined || next.type === "break")
        ends.push({ parent, index });
    },
    NONE,
  );
  for (const { parent, index } of ends.reverse()) {
    const node = parent.children?.[index] as MdNode;
    const value = node.value ?? "";
    const lineStart = value.lastIndexOf("\n") + 1;
    const m = BLOCK_ID_RE.exec(value.slice(lineStart));
    if (m === null) continue;
    const at = lineStart + m.index + m[0].indexOf("^");
    const base = startOf(node);
    const id: MdNode = {
      type: "blockId",
      value: m[0].trim(),
      id: m[1] ?? "",
      position: {
        start: pointAt(base, value, at),
        end: pointAt(base, value, value.length),
      },
    };
    const text = { ...node, value: value.slice(0, at).trimEnd() };
    parent.children?.splice(index, 1, ...(text.value === "" ? [] : [text]), id);
  }
  // Inner lines of a text node: every line but the last ends at a soft line break.
  replaceText(
    tree,
    matching(/(?:^|[ \t])\^([A-Za-z0-9-]+)[ \t]*(?=\n)/gm, (m) => ({
      type: "blockId",
      value: m[0].trim(),
      id: m[1] ?? "",
    })),
  );
}

/** `> [!type] title` blockquotes become callouts. */
function calloutTransform(tree: MdNode) {
  const visit = (node: MdNode) => {
    if (node.type === "blockquote") {
      const first = node.children?.[0]?.children?.[0];
      const m = /^\[!([\w-]+)\]/.exec(
        first?.type === "text" ? (first.value ?? "") : "",
      );
      if (m !== null) {
        node.type = "callout";
        node.kind = (m[1] ?? "").toLowerCase();
      }
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(tree);
}

/**
 * One definition per Obsidian syntax. Inline code and math are paired per
 * paragraph by `inlineSpans` before these scanners run, and comments come
 * first, so later scanners skip all three; links come before tags and block
 * ids. Highlight, footnote, and callout contribute mdast transforms only.
 */
export const syntaxExtensions: readonly SyntaxExtension[] = [
  {
    name: "comment",
    scan: scanComments,
    transform: (tree) =>
      replaceText(
        tree,
        matching(/%%([^\n]*?)%%/g, (m) => ({
          type: "comment",
          value: m[1] ?? "",
        })),
      ),
  },
  {
    name: "highlight",
    transform: (tree) =>
      replaceText(
        tree,
        matching(/==([^=\n]+)==/g, (m) => ({
          type: "highlight",
          children: [{ type: "text", value: m[1] ?? "" }],
        })),
      ),
  },
  {
    name: "embed",
    scan: (t, l, c, o) => scanWiki("embed", t, l, c, o),
    transform: (tree) => replaceText(tree, wikiNodes("embed")),
  },
  {
    name: "wikiLink",
    scan: (t, l, c, o) => scanWiki("wiki", t, l, c, o),
    transform: (tree) => replaceText(tree, wikiNodes("wikiLink")),
  },
  { name: "markdownLink", scan: scanMarkdownLinks },
  {
    name: "tag",
    scan: scanTags,
    transform: (tree) =>
      replaceText(
        tree,
        matching(TAG_RE, (m) =>
          isTag(m[1] ?? "")
            ? { type: "tag", value: m[0], tag: m[1] }
            : undefined,
        ),
        LINKS,
      ),
  },
  { name: "blockId", scan: scanBlockId, transform: blockIdTransform },
  {
    name: "footnote",
    transform: (tree) =>
      replaceText(
        tree,
        matching(/\^\[([^\]\n]+)\]/g, (m) => ({
          type: "inlineFootnote",
          value: m[1] ?? "",
        })),
      ),
  },
  { name: "callout", transform: calloutTransform },
];

const byStart = (a: { range: Range }, b: { range: Range }) =>
  a.range.start.col - b.range.start.col;

/** Sort the entries added since `from` by column, so each line's facts are in source order. */
function sortTail<T>(list: T[], from: number, compare: (a: T, b: T) => number) {
  if (list.length - from > 1)
    list.splice(from, list.length - from, ...list.slice(from).sort(compare));
}

/**
 * Run every scanner over one line of a prose block; results stay in source
 * order. `spans` are the paragraph's inline code and math spans that touch
 * this line (by default, the line's own); those starting here are recorded in
 * `out.excluded`.
 */
export function scanLine(
  text: string,
  line: number,
  out: ScanOut,
  spans: readonly Range[] = inlineSpans([{ text, line }]),
): void {
  const links = out.links.length;
  const tags = out.tags.length;
  const excluded = out.excluded.length;
  for (const r of spans) if (r.start.line === line) out.excluded.push(r);
  /** Claims are rebuilt only after a scanner adds an exclusion or a link. */
  let seen = -1;
  let claims: Claims | undefined;
  try {
    for (const ext of syntaxExtensions) {
      if (ext.scan === undefined) continue;
      const count = out.excluded.length - excluded + out.links.length - links;
      if (count === 0 && spans.length === 0) claims = undefined;
      else if (claims === undefined || count !== seen) {
        const ranges: Range[] = [...spans];
        for (let k = excluded; k < out.excluded.length; k++)
          ranges.push(out.excluded[k] as Range);
        for (let k = links; k < out.links.length; k++)
          ranges.push((out.links[k] as LinkSpan).range);
        claims = new Claims(line, ranges);
      } else claims.rewind();
      seen = count;
      claimed = claims;
      ext.scan(text, line, 0, out);
    }
  } finally {
    claimed = undefined;
  }
  sortTail(out.links, links, byStart);
  sortTail(out.tags, tags, byStart);
  sortTail(out.excluded, excluded, (a, b) => a.start.col - b.start.col);
}
