import {
  type Document,
  isMap,
  isNode,
  isScalar,
  isSeq,
  type Pair,
  parseDocument,
  type YAMLMap,
} from "yaml";
import type { SpanEdit } from "../../features/links/rename";
import type { Pos } from "../../kernel/text/pos";

export type FrontmatterValue =
  | string
  | number
  | boolean
  | null
  | FrontmatterValue[];

/** One key change. `date` writes a `YYYY-MM-DD` string as a date rather than quoted text. */
export type FrontmatterPatch =
  | { set: string; value: FrontmatterValue; date?: boolean }
  | { remove: string };

/**
 * `edits` apply to the text with "\n" line separators (a buffer); `text` is the
 * patched input with its own line endings (a file). `removed` and `added` are
 * the changed property lines.
 */
export type PatchResult =
  | {
      ok: true;
      edits: SpanEdit[];
      text: string;
      removed: string[];
      added: string[];
    }
  | { ok: false; reason: string };

type Change = { text: string; removed: string[]; added: string[] };
type Failure = { ok: false; reason: string };

/** Offsets of a frontmatter block: properties are `text.slice(start, close)`; the block ends at `end`. */
type Block = { start: number; close: number; end: number };

const lineStart = (text: string, offset: number) =>
  text.lastIndexOf("\n", offset - 1) + 1;
const lineEnd = (text: string, offset: number) => {
  const i = text.indexOf("\n", offset);
  return i < 0 ? text.length : i;
};
const nextLine = (text: string, offset: number) =>
  Math.min(text.length, lineEnd(text, offset) + 1);

/** The block that opens on the first line and closes at the next `---` line. */
function findBlock(text: string): Block | undefined {
  const first = lineEnd(text, 0);
  if (first === text.length || text.slice(0, first).trimEnd() !== "---")
    return undefined;
  for (let at = first + 1; at < text.length; at = nextLine(text, at)) {
    const end = lineEnd(text, at);
    if (text.slice(at, end).trimEnd() === "---")
      return { start: first + 1, close: at, end: nextLine(text, at) };
  }
  return undefined;
}

/** Whether every alias in `doc` has an anchor, so `toJS` does not throw. */
function resolves(doc: Document): boolean {
  try {
    doc.toJS();
    return true;
  } catch {
    return false;
  }
}

type Parsed = {
  doc: Document;
  map: YAMLMap<unknown, unknown> | undefined;
};

/** The block's top-level property map (`undefined` when empty), or why it cannot be patched. */
function parseBlock(text: string, block: Block): Parsed | Failure {
  const doc = parseDocument(text.slice(block.start, block.close));
  if (doc.errors.length > 0 || !resolves(doc))
    return { ok: false, reason: "invalid frontmatter" };
  if (doc.contents === null) return { doc, map: undefined };
  if (!isMap(doc.contents) || doc.contents.flow)
    return { ok: false, reason: "frontmatter is not a list of properties" };
  return { doc, map: doc.contents };
}

const keyText = (pair: Pair<unknown, unknown>) =>
  isScalar(pair.key) ? String(pair.key.value) : undefined;

/** The top-level pair named `key`, matched exactly first, then without regard to case. */
function findPair(
  map: YAMLMap<unknown, unknown> | undefined,
  key: string,
): Pair<unknown, unknown> | undefined {
  const items = map?.items ?? [];
  const lower = key.toLowerCase();
  return (
    items.find((p) => keyText(p) === key) ??
    items.find((p) => keyText(p)?.toLowerCase() === lower)
  );
}

type PairSpan = {
  /** Start of the key. */
  key: number;
  /** Just after the ":" that follows the key. */
  colon: number;
  /** The value's text, without trailing comments or blank lines; absent when empty. */
  value: { start: number; end: number } | undefined;
  /** The first item's indent when the value is a block list. */
  listIndent: string | undefined;
};

/** Where a pair sits in the block's property text. */
function pairSpan(
  src: string,
  pair: Pair<unknown, unknown>,
): PairSpan | Failure {
  const key = isScalar(pair.key) ? pair.key.range : undefined;
  if (key === undefined || key === null)
    return { ok: false, reason: "unsupported frontmatter key" };
  let colon = key[1];
  while (src[colon] === " " || src[colon] === "\t") colon++;
  if (src[colon] !== ":")
    return { ok: false, reason: "unsupported frontmatter key" };
  colon++;

  const v = pair.value;
  if (!isNode(v) || !v.range || v.range[1] <= v.range[0])
    return { key: key[0], colon, value: undefined, listIndent: undefined };
  const start = v.range[0];
  const blockList = isSeq(v) && !v.flow;
  const last = blockList ? v.items.at(-1) : undefined;
  let end = isNode(last) && last.range ? last.range[1] : v.range[1];
  while (end > start && /\s/.test(src[end - 1] ?? "")) end--;
  return {
    key: key[0],
    colon,
    value: { start, end },
    listIndent: blockList ? src.slice(lineStart(src, start), start) : undefined,
  };
}

/** `key:` followed by the rendered value: inline, on following lines for a list, or nothing for null. */
const afterColon = (rendered: string) =>
  rendered === "" || rendered.startsWith("\n") ? rendered : ` ${rendered}`;

const splice = (text: string, from: number, to: number, insert: string) =>
  text.slice(0, from) + insert + text.slice(to);

/** The lines from `from` to the end of the line holding `to`. */
const linesOf = (text: string, from: number, to: number) =>
  text.slice(lineStart(text, from), lineEnd(text, to)).split("\n");

/** A new `key: value` property, with a list on the lines that follow. */
const propertyLine = (patch: Extract<FrontmatterPatch, { set: string }>) =>
  `${yamlScalar(patch.set, "")}:${afterColon(yamlScalar(patch.value, "  ", patch.date))}`;

/** Applies one patch to text with "\n" separators. */
function patchLf(text: string, patch: FrontmatterPatch): Change | Failure {
  const block = findBlock(text);
  if (block === undefined) {
    if ("remove" in patch) return { text, removed: [], added: [] };
    const line = propertyLine(patch);
    return {
      text: `---\n${line}\n---\n${text}`,
      removed: [],
      added: line.split("\n"),
    };
  }
  const parsed = parseBlock(text, block);
  if ("ok" in parsed) return parsed;
  const name = "remove" in patch ? patch.remove : patch.set;
  const pair = findPair(parsed.map, name);
  const src = text.slice(block.start, block.close);

  if (pair === undefined) {
    if ("remove" in patch) return { text, removed: [], added: [] };
    const line = propertyLine(patch);
    return {
      text: splice(text, block.close, block.close, `${line}\n`),
      removed: [],
      added: line.split("\n"),
    };
  }

  const span = pairSpan(src, pair);
  if ("ok" in span) return span;
  const at = (offset: number) => block.start + offset;
  const keyAt = at(span.key);
  const valueEnd = at(span.value?.end ?? span.colon);
  const removed = linesOf(text, keyAt, valueEnd);

  if ("remove" in patch) {
    const last = (parsed.map?.items.length ?? 0) <= 1;
    const from = last ? 0 : lineStart(text, keyAt);
    const to = last ? block.end : nextLine(text, valueEnd);
    return { text: splice(text, from, to, ""), removed, added: [] };
  }

  const rendered = yamlScalar(patch.value, span.listIndent ?? "  ", patch.date);
  const value = span.value;
  const inline =
    value !== undefined &&
    rendered !== "" &&
    !rendered.includes("\n") &&
    !src.slice(span.colon, value.end).includes("\n");
  const [from, insert] = inline
    ? [at(value.start), rendered]
    : [at(span.colon), afterColon(rendered)];
  const next = splice(text, from, valueEnd, insert);
  return {
    text: next,
    removed,
    added: linesOf(next, keyAt, from + insert.length),
  };
}

const posAt = (text: string, offset: number): Pos => {
  let line = 0;
  for (
    let i = text.indexOf("\n");
    i >= 0 && i < offset;
    i = text.indexOf("\n", i + 1)
  )
    line++;
  return { line, col: offset - lineStart(text, offset) };
};

/** One span edit from `lf` to `next`, and `next` in `original`'s line endings. */
function result(
  original: string,
  lf: string,
  change: Change,
): PatchResult & { ok: true } {
  const { removed, added } = change;
  const next = change.text;
  if (next === lf)
    return { ok: true, edits: [], text: original, removed, added };
  let from = 0;
  const shorter = Math.min(lf.length, next.length);
  while (from < shorter && lf[from] === next[from]) from++;
  let tail = 0;
  while (
    tail < shorter - from &&
    lf[lf.length - 1 - tail] === next[next.length - 1 - tail]
  )
    tail++;
  const to = lf.length - tail;
  const insert = next.slice(from, next.length - tail);
  const start = posAt(lf, from);
  const end = posAt(lf, to);

  const rawStarts = [0];
  for (
    let i = original.indexOf("\n");
    i >= 0;
    i = original.indexOf("\n", i + 1)
  )
    rawStarts.push(i + 1);
  const raw = (p: Pos) => (rawStarts[p.line] ?? 0) + p.col;
  const eol = original.includes("\r\n") ? "\r\n" : "\n";
  return {
    ok: true,
    edits: [
      { range: { start, end }, expected: lf.slice(from, to), text: insert },
    ],
    text: splice(original, raw(start), raw(end), insert.replaceAll("\n", eol)),
    removed,
    added,
  };
}

/**
 * Sets or removes one property by splicing only its lines, so comments, key
 * order, quoting, line endings, and the body stay byte-identical. A note
 * without frontmatter gains a block; removing the last property drops it.
 */
export function patchFrontmatter(
  text: string,
  patch: FrontmatterPatch,
): PatchResult {
  const lf = text.replaceAll("\r\n", "\n");
  const change = patchLf(lf, patch);
  return "ok" in change ? change : result(text, lf, change);
}

function toValue(value: unknown): FrontmatterValue | undefined {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    typeof value === "number"
  )
    return value;
  if (!Array.isArray(value)) return undefined;
  const items = value.map(toValue);
  return items.every((v) => v !== undefined)
    ? (items as FrontmatterValue[])
    : undefined;
}

const pairValue = (parsed: Parsed, pair: Pair<unknown, unknown>) =>
  toValue(isNode(pair.value) ? pair.value.toJS(parsed.doc) : pair.value);

/** The parsed block of `text`: `undefined` without one, a failure when unreadable. */
function readBlock(text: string): Parsed | Failure | undefined {
  const block = findBlock(text);
  return block && parseBlock(text, block);
}

/** A property's value; `undefined` when absent, unreadable, or a map. */
export function frontmatterValue(
  text: string,
  key: string,
): FrontmatterValue | undefined {
  const parsed = readBlock(text);
  if (parsed === undefined || "ok" in parsed) return undefined;
  const pair = findPair(parsed.map, key);
  return pair && pairValue(parsed, pair);
}

/**
 * A template's properties (maps left out) and the text after its frontmatter;
 * unreadable frontmatter stays in the body.
 */
export function splitFrontmatter(text: string): {
  fm: Record<string, FrontmatterValue> | undefined;
  body: string;
} {
  const block = findBlock(text);
  const parsed = block && parseBlock(text, block);
  if (block === undefined || parsed === undefined || "ok" in parsed)
    return { fm: undefined, body: text };
  const fm: Record<string, FrontmatterValue> = {};
  for (const pair of parsed.map?.items ?? []) {
    const key = keyText(pair);
    const value = pairValue(parsed, pair);
    if (key !== undefined && value !== undefined) fm[key] = value;
  }
  return { fm, body: text.slice(block.end) };
}

const sameValue = (a: FrontmatterValue, b: FrontmatterValue) =>
  JSON.stringify(a) === JSON.stringify(b);

/**
 * Merges template properties into a note as Obsidian does: a missing property
 * is added, a list gains the template's missing items, and any other value the
 * note has is kept. All changes come back as one edit.
 */
export function mergeFrontmatter(
  noteText: string,
  props: Readonly<Record<string, FrontmatterValue>>,
): PatchResult {
  const lf = noteText.replaceAll("\r\n", "\n");
  let change: Change = { text: lf, removed: [], added: [] };
  for (const [key, value] of Object.entries(props)) {
    const parsed = readBlock(change.text);
    if (parsed !== undefined && "ok" in parsed) return parsed;
    const pair = parsed && findPair(parsed.map, key);
    const existing = parsed && pair && pairValue(parsed, pair);
    let next: FrontmatterValue | undefined;
    if (pair === undefined) next = value;
    else if (Array.isArray(existing)) {
      const extra = (Array.isArray(value) ? value : [value]).filter(
        (v) => !existing.some((e) => sameValue(e, v)),
      );
      if (extra.length > 0) next = [...existing, ...extra];
    }
    if (next === undefined) continue;
    const step = patchLf(change.text, { set: key, value: next, date: true });
    if ("ok" in step) return step;
    change = {
      text: step.text,
      removed: [...change.removed, ...step.removed],
      added: [...change.added, ...step.added],
    };
  }
  return result(noteText, lf, change);
}

const DATE = /^\d{4}-[01]\d-[0-3]\d$/;
const DATETIME = /^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d(:[0-5]\d)?$/;

/** Plain when YAML reads it back as the same text, else double-quoted. */
function yamlString(text: string, date: boolean): string {
  const dateLike = DATE.test(text) || DATETIME.test(text);
  if (dateLike) return date ? text : JSON.stringify(text);
  if (text.includes("\n")) return JSON.stringify(text);
  const doc = parseDocument(text);
  return doc.errors.length === 0 && resolves(doc) && doc.toJS() === text
    ? text
    : JSON.stringify(text);
}

/**
 * Obsidian-typed YAML: numbers, `true`/`false`, null as nothing, and lists as
 * block lines (each "\n" + `indent` + "- item"). Text is double-quoted when
 * its plain form would read as another type, including a date unless `date`.
 */
export function yamlScalar(
  value: FrontmatterValue,
  indent: string,
  date = false,
): string {
  if (value === null) return "";
  if (typeof value === "boolean") return String(value);
  if (typeof value === "number") {
    if (Number.isNaN(value)) return ".nan";
    if (!Number.isFinite(value)) return value > 0 ? ".inf" : "-.inf";
    return String(value);
  }
  if (typeof value === "string") return yamlString(value, date);
  if (value.length === 0) return "[]";
  return value
    .map((item) => {
      const rendered = Array.isArray(item)
        ? JSON.stringify(item)
        : yamlScalar(item, indent, date);
      return `\n${indent}-${rendered === "" ? "" : ` ${rendered}`}`;
    })
    .join("");
}
