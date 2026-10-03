import type { Range } from "../../kernel/text/pos";

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

/** True when `r` overlaps [start, end) on `line`. */
const overlaps = (r: Range, line: number, start: number, end: number) => {
  const from = r.start.line < line ? 0 : r.start.col;
  const to = r.end.line > line ? Number.POSITIVE_INFINITY : r.end.col;
  return start < to && from < end;
};

/**
 * True when [start, end) on `line` overlaps an excluded range or a link already
 * found. Ranges are recorded in source order, so only the tail is checked.
 */
function taken(out: ScanOut, line: number, start: number, end: number) {
  for (let k = out.excluded.length - 1; k >= 0; k--) {
    const r = out.excluded[k];
    if (r === undefined || r.end.line < line) break;
    if (overlaps(r, line, start, end)) return true;
  }
  for (let k = out.links.length - 1; k >= 0; k--) {
    const r = out.links[k]?.range;
    if (r === undefined || r.end.line < line) break;
    if (overlaps(r, line, start, end)) return true;
  }
  return false;
}

/**
 * Code spans and inline math: a run of `ch` closed by the next run of the same
 * length. Runs are paired in one pass, so the scan stays linear.
 */
function scanRuns(
  ch: string,
  text: string,
  line: number,
  col0: number,
  out: ScanOut,
) {
  const runs: { start: number; length: number }[] = [];
  for (let i = 0; i < text.length; ) {
    if (text[i] !== ch) {
      i++;
      continue;
    }
    let j = i;
    while (text[j] === ch) j++;
    if (escaped(text, i)) {
      if (j - i > 1) runs.push({ start: i + 1, length: j - i - 1 });
    } else runs.push({ start: i, length: j - i });
    i = j;
  }
  const next = new Map<number, number[]>();
  runs.forEach((r, k) => {
    const list = next.get(r.length) ?? [];
    list.push(k);
    next.set(r.length, list);
  });
  const cursor = new Map<number, number>();
  let k = 0;
  while (k < runs.length) {
    const open = runs[k] as { start: number; length: number };
    const list = next.get(open.length) ?? [];
    let p = cursor.get(open.length) ?? 0;
    while ((list[p] ?? Number.POSITIVE_INFINITY) <= k) p++;
    cursor.set(open.length, p);
    const close = list[p];
    const closeRun = close === undefined ? undefined : runs[close];
    const startCol = col0 + open.start;
    if (
      closeRun === undefined ||
      close === undefined ||
      taken(out, line, startCol, startCol + 1)
    ) {
      k++;
      continue;
    }
    out.excluded.push(
      rangeOf(line, startCol, col0 + closeRun.start + closeRun.length),
    );
    k = close + 1;
  }
}

/** `%%…%%` and `<!-- … -->` closed on the same line. */
function scanComments(text: string, line: number, col0: number, out: ScanOut) {
  for (let i = 0; i < text.length; ) {
    const pct = text.indexOf("%%", i);
    const html = text.indexOf("<!--", i);
    const at = pct === -1 ? html : html === -1 ? pct : Math.min(pct, html);
    if (at === -1) return;
    const isHtml = at === html;
    const close = isHtml
      ? text.indexOf("-->", at + 4)
      : text.indexOf("%%", at + 2);
    if (close === -1) return;
    const end = close + (isHtml ? 3 : 2);
    if (escaped(text, at) || taken(out, line, col0 + at, col0 + at + 1)) {
      i = at + 1;
      continue;
    }
    out.excluded.push(rangeOf(line, col0 + at, col0 + end));
    i = end;
  }
}

/** The wikilink grammar shared by the scan and the mdast transform. */
export const EMBED_RE = /!\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g;
export const WIKILINK_RE = /(?<!!)\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g;

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
  re: RegExp,
  kind: "wiki" | "embed",
  text: string,
  line: number,
  col0: number,
  out: ScanOut,
) {
  for (const m of text.matchAll(re)) {
    const start = col0 + m.index;
    const end = start + m[0].length;
    if (escaped(text, m.index) || taken(out, line, start, end)) continue;
    const { target, subpath } = wikiTarget(m[1] ?? "");
    const alias = m[2];
    out.links.push({
      kind,
      target,
      ...(subpath === undefined ? {} : { subpath }),
      ...(alias === undefined ? {} : { alias }),
      raw: m[0],
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

/** `[text](dest "title")` starting at `i`: the end index and destination, or nothing. */
function parseMarkdownLink(
  text: string,
  i: number,
): { end: number; dest: string } | undefined {
  let depth = 0;
  let j = i;
  for (; j < text.length; j++) {
    const c = text[j];
    if (c === "\\") j++;
    else if (c === "[") depth++;
    else if (c === "]" && --depth === 0) break;
  }
  if (j >= text.length || text[j + 1] !== "(") return undefined;
  let k = j + 2;
  while (text[k] === " " || text[k] === "\t") k++;
  let dest: string;
  if (text[k] === "<") {
    const close = text.indexOf(">", k + 1);
    if (close === -1) return undefined;
    dest = text.slice(k + 1, close);
    if (dest.includes("<")) return undefined;
    k = close + 1;
  } else {
    const from = k;
    let parens = 0;
    for (; k < text.length; k++) {
      const c = text[k] ?? "";
      if (c === "\\") k++;
      else if (c === "(") parens++;
      else if (c === ")") {
        if (parens === 0) break;
        parens--;
      } else if (c === " " || c === "\t") break;
    }
    dest = text.slice(from, k);
  }
  while (text[k] === " " || text[k] === "\t") k++;
  const quote = text[k];
  if (quote === '"' || quote === "'" || quote === "(") {
    const closer = quote === "(" ? ")" : quote;
    const close = text.indexOf(closer, k + 1);
    if (close === -1) return undefined;
    k = close + 1;
    while (text[k] === " " || text[k] === "\t") k++;
  }
  if (text[k] !== ")") return undefined;
  return { end: k + 1, dest };
}

function scanMarkdownLinks(
  text: string,
  line: number,
  col0: number,
  out: ScanOut,
) {
  for (let i = text.indexOf("["); i !== -1; i = text.indexOf("[", i + 1)) {
    if (escaped(text, i) || text[i + 1] === "[") continue;
    const link = parseMarkdownLink(text, i);
    if (link === undefined || link.dest === "" || isExternal(link.dest))
      continue;
    const start = col0 + i;
    const end = col0 + link.end;
    if (taken(out, line, start, end)) continue;
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
    if (!isTag(tag) || taken(out, line, start, end)) continue;
    out.tags.push({ tag, range: rangeOf(line, start, end) });
  }
}

/** A block id at the end of a line: Latin letters, digits, and dashes. */
export const BLOCK_ID_RE = /(?:^|\s)\^([A-Za-z0-9-]+)[ \t]*$/;

function scanBlockId(text: string, line: number, col0: number, out: ScanOut) {
  const m = BLOCK_ID_RE.exec(text);
  if (m === null) return;
  const at = col0 + m.index + m[0].indexOf("^");
  if (!taken(out, line, at, at + 1))
    out.blockIds.push({ id: m[1] ?? "", line });
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

/**
 * Split every text node (outside `skip`) on `re`; `make` turns a match into an
 * Obsidian node, or keeps it as text by returning nothing.
 */
function replaceText(
  tree: MdNode,
  re: RegExp,
  make: (m: RegExpMatchArray) => MdNode | undefined,
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
      const value = child.value ?? "";
      if (child.type !== "text" || value.search(re) === -1) {
        out.push(child);
        continue;
      }
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
      for (const m of value.matchAll(re)) {
        const node = make(m);
        if (node === undefined) continue;
        const at = m.index;
        if (at > last)
          out.push(piece("text", last, at, { value: value.slice(last, at) }));
        out.push(piece(node.type, at, at + m[0].length, node));
        last = at + m[0].length;
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

const wikiNode = (type: "wikiLink" | "embed") => (m: RegExpMatchArray) => {
  const { target, subpath } = wikiTarget(m[1] ?? "");
  return {
    type,
    value: m[0],
    target,
    ...(subpath === undefined ? {} : { subpath }),
    ...(m[2] === undefined ? {} : { alias: m[2] }),
  };
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
  replaceText(tree, /(?:^|[ \t])\^([A-Za-z0-9-]+)[ \t]*(?=\n)/gm, (m) => ({
    type: "blockId",
    value: m[0].trim(),
    id: m[1] ?? "",
  }));
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
 * One definition per Obsidian syntax. Exclusions come first, so later scanners
 * skip code, math, and comments; links come before tags and block ids.
 * Highlight, footnote, and callout contribute mdast transforms only.
 */
export const syntaxExtensions: readonly SyntaxExtension[] = [
  { name: "code", scan: (t, l, c, o) => scanRuns("`", t, l, c, o) },
  { name: "math", scan: (t, l, c, o) => scanRuns("$", t, l, c, o) },
  {
    name: "comment",
    scan: scanComments,
    transform: (tree) =>
      replaceText(tree, /%%([^\n]*?)%%/g, (m) => ({
        type: "comment",
        value: m[1] ?? "",
      })),
  },
  {
    name: "highlight",
    transform: (tree) =>
      replaceText(tree, /==([^=\n]+)==/g, (m) => ({
        type: "highlight",
        children: [{ type: "text", value: m[1] ?? "" }],
      })),
  },
  {
    name: "embed",
    scan: (t, l, c, o) => scanWiki(EMBED_RE, "embed", t, l, c, o),
    transform: (tree) => replaceText(tree, EMBED_RE, wikiNode("embed")),
  },
  {
    name: "wikiLink",
    scan: (t, l, c, o) => scanWiki(WIKILINK_RE, "wiki", t, l, c, o),
    transform: (tree) => replaceText(tree, WIKILINK_RE, wikiNode("wikiLink")),
  },
  { name: "markdownLink", scan: scanMarkdownLinks },
  {
    name: "tag",
    scan: scanTags,
    transform: (tree) =>
      replaceText(
        tree,
        TAG_RE,
        (m) =>
          isTag(m[1] ?? "")
            ? { type: "tag", value: m[0], tag: m[1] }
            : undefined,
        LINKS,
      ),
  },
  { name: "blockId", scan: scanBlockId, transform: blockIdTransform },
  {
    name: "footnote",
    transform: (tree) =>
      replaceText(tree, /\^\[([^\]\n]+)\]/g, (m) => ({
        type: "inlineFootnote",
        value: m[1] ?? "",
      })),
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

/** Run every scanner over one line of a prose block; results stay in source order. */
export function scanLine(text: string, line: number, out: ScanOut): void {
  const links = out.links.length;
  const tags = out.tags.length;
  const excluded = out.excluded.length;
  for (const ext of syntaxExtensions) ext.scan?.(text, line, 0, out);
  sortTail(out.links, links, byStart);
  sortTail(out.tags, tags, byStart);
  sortTail(out.excluded, excluded, (a, b) => a.start.col - b.start.col);
}
