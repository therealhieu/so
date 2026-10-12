import { readFileSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import type { FileFacts } from "../core/features/links/note-index";
import { type NoteSummary, summarize } from "../core/features/links/summarize";
import type { Pos, Range } from "../core/kernel/text/pos";
import { splitBlocks } from "../core/lang/markdown/blocks";
import { linesOf, scanDoc } from "../core/lang/markdown/scan";
import type { SearchHit } from "../core/state/types";
import { readTextFile } from "./fs";
import { createExclusionMatcher, hasNamedSegment } from "./ignore";

/** Messages to the index worker. Paths are workspace-relative. */
export type ToWorker =
  /**
   * `dotfiles` takes in dot entries other than `.git`, as the explorer lists
   * them; `exclude` names entries skipped at any depth.
   */
  | { t: "scan"; root: string; dotfiles: boolean; exclude: string[] }
  | { t: "changed"; paths: string[] }
  | { t: "removed"; paths: string[] }
  | { t: "moved"; from: string; to: string }
  | {
      t: "search";
      id: number;
      query: string;
      limit: number;
      mode?: "text" | "mentions";
      names?: string[];
      exclude?: string;
    };

/** Messages from the index worker. A batch with `done = total = 0` is an update after the scan. */
export type FromWorker =
  | {
      t: "batch";
      summaries: NoteSummary[];
      done: number;
      total: number;
      files?: string[];
      /** Size and times of files that are not notes. */
      facts?: FileFacts[];
      /** Files a rescan no longer finds, such as dot entries once hidden. */
      removed?: string[];
    }
  | { t: "ready" }
  | { t: "results"; id: number; hits: SearchHit[]; capped?: boolean }
  | { t: "error"; message: string };

declare const self: Worker;

const BATCH = 500;
const READ_CONCURRENCY = 32;
const CACHE_MAX_CHARS = 1024 * 1024;

const isNote = (path: string) => /\.md$/i.test(path);

let root = "";
let dotfiles = false;
let exclude: readonly string[] = [];
/** Every non-excluded file, notes included. */
const files = new Set<string>();
/** Note texts up to 1 MiB, so searches do not read every note again. */
const cache = new Map<string, string>();

const post = (m: FromWorker) => self.postMessage(m);

const readOrNull = (p: string): string | null => {
  try {
    return readFileSync(p, "utf8");
  } catch {
    return null;
  }
};

/** The facts of a file that is not a note; `undefined` when it cannot be stat-ed. */
async function factsOf(path: string): Promise<FileFacts | undefined> {
  const st = await stat(join(root, path)).catch(() => null);
  if (st === null) return undefined;
  return {
    path,
    size: st.size,
    mtime: st.mtimeMs,
    ctime: st.birthtimeMs > 0 ? st.birthtimeMs : st.mtimeMs,
  };
}

/**
 * Every file below `from` (the workspace root by default) the explorer would
 * show, and the facts of those that are not notes; symlinked folders are not
 * entered.
 */
async function walk(
  from = "",
): Promise<{ paths: string[]; facts: FileFacts[] }> {
  const matcher = createExclusionMatcher(root, readOrNull);
  const skipped = (rel: string, isDir: boolean) =>
    matcher.isExcluded(rel, isDir, { dotfiles }) ||
    hasNamedSegment(rel, exclude);
  const out: string[] = [];
  const facts: FileFacts[] = [];
  const visit = async (dir: string) => {
    const entries = await readdir(join(root, dir), {
      withFileTypes: true,
    }).catch(() => []);
    for (const d of entries) {
      const rel = dir === "" ? d.name : `${dir}/${d.name}`;
      if (d.isDirectory()) {
        if (!skipped(rel, true)) await visit(rel);
        continue;
      }
      const isFile =
        d.isFile() ||
        (d.isSymbolicLink() &&
          (await stat(join(root, rel)).catch(() => null))?.isFile() === true);
      if (!isFile || skipped(rel, false)) continue;
      out.push(rel);
      if (isNote(rel)) continue;
      const f = await factsOf(rel);
      if (f !== undefined) facts.push(f);
    }
  };
  await visit(from);
  return { paths: out.sort(), facts };
}

/** The text of a readable text file; `undefined` for binary, large, or missing files. */
async function textOf(path: string): Promise<string | undefined> {
  const cached = cache.get(path);
  if (cached !== undefined) return cached;
  const r = await readTextFile(join(root, path));
  return "refused" in r ? undefined : r.text;
}

/** Read and summarize one note, refreshing the text cache. */
async function summarizeFile(path: string): Promise<NoteSummary | undefined> {
  const r = await readTextFile(join(root, path));
  if ("refused" in r) {
    cache.delete(path);
    return undefined;
  }
  if (r.text.length <= CACHE_MAX_CHARS) cache.set(path, r.text);
  else cache.delete(path);
  return summarize(
    path,
    {
      mtime: r.stamp.mtimeMs,
      size: r.stamp.size,
      ctime: r.createdMs ?? r.stamp.mtimeMs,
    },
    scanDoc(r.text),
    linesOf(r.text),
  );
}

async function scan(): Promise<void> {
  const { paths: listed, facts } = await walk();
  const found = new Set(listed);
  const removed = [...files].filter((f) => !found.has(f));
  files.clear();
  cache.clear();
  for (const f of listed) files.add(f);
  const notes = listed.filter(isNote);
  let pending: NoteSummary[] = [];
  let filesSent = false;
  let done = 0;
  const flush = () => {
    post({
      t: "batch",
      summaries: pending,
      done,
      total: notes.length,
      ...(filesSent
        ? {}
        : { files: listed, facts, ...(removed.length > 0 ? { removed } : {}) }),
    });
    filesSent = true;
    pending = [];
  };
  let next = 0;
  const lane = async () => {
    while (next < notes.length) {
      const path = notes[next++] as string;
      const s = await summarizeFile(path);
      done++;
      if (s !== undefined) pending.push(s);
      if (pending.length >= BATCH) flush();
    }
  };
  await Promise.all(Array.from({ length: READ_CONCURRENCY }, lane));
  if (pending.length > 0 || !filesSent) flush();
  post({ t: "ready" });
}

const knownUnder = (dir: string) => {
  for (const f of files) if (f.startsWith(`${dir}/`)) return true;
  return false;
};

/**
 * Summarize changed notes and refresh other files' facts. A folder the index
 * holds nothing under, such as one renamed by another program, is walked and
 * its files join the index; any other folder event is ignored.
 */
async function changed(paths: string[]): Promise<void> {
  const summaries: NoteSummary[] = [];
  const facts: FileFacts[] = [];
  const added: string[] = [];
  for (const path of paths) {
    const st = await stat(join(root, path)).catch(() => null);
    if (st?.isDirectory() === true) {
      if (knownUnder(path)) continue;
      const found = await walk(path);
      for (const f of found.paths) files.add(f);
      added.push(...found.paths);
      facts.push(...found.facts);
      for (const note of found.paths.filter(isNote)) {
        const s = await summarizeFile(note);
        if (s !== undefined) summaries.push(s);
      }
      continue;
    }
    files.add(path);
    if (isNote(path)) {
      const s = await summarizeFile(path);
      if (s !== undefined) summaries.push(s);
    } else {
      const f = await factsOf(path);
      if (f !== undefined) facts.push(f);
    }
  }
  if (summaries.length > 0 || facts.length > 0 || added.length > 0)
    post({
      t: "batch",
      summaries,
      done: 0,
      total: 0,
      ...(added.length > 0 ? { files: added } : {}),
      ...(facts.length > 0 ? { facts } : {}),
    });
}

function removed(paths: string[]): void {
  for (const p of paths)
    for (const f of [...files])
      if (f === p || f.startsWith(`${p}/`)) {
        files.delete(f);
        cache.delete(f);
      }
}

/** A file or folder `so` renamed or moved: its paths, and cached texts, follow it. */
function moved(from: string, to: string): void {
  for (const f of [...files])
    if (f === from || f.startsWith(`${from}/`)) {
      const next = to + f.slice(from.length);
      files.delete(f);
      files.add(next);
      const text = cache.get(f);
      cache.delete(f);
      if (text !== undefined) cache.set(next, text);
    }
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const before = (a: Pos, b: Pos) =>
  a.line < b.line || (a.line === b.line && a.col < b.col);
const overlaps = (r: Range, line: number, from: number, to: number) =>
  before({ line, col: from }, r.end) && before(r.start, { line, col: to });

/** Literal, smart-case, one hit per matching line. */
function searchText(path: string, text: string, query: string): SearchHit[] {
  const exact = query !== query.toLowerCase();
  const needle = exact ? query : query.toLowerCase();
  const hits: SearchHit[] = [];
  const lines = text.split("\n");
  for (let line = 0; line < lines.length; line++) {
    const raw = lines[line] as string;
    const t = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
    const col = (exact ? t : t.toLowerCase()).indexOf(needle);
    if (col >= 0) hits.push({ path, line, col, len: query.length, text: t });
  }
  return hits;
}

/** Whole-word, case-insensitive occurrences of `names` in prose: not in links, tags, code, math, comments, or frontmatter. */
function searchMentions(
  path: string,
  text: string,
  names: readonly string[],
): SearchHit[] {
  const lower = text.toLowerCase();
  const wanted = names.filter(
    (n) => n !== "" && lower.includes(n.toLowerCase()),
  );
  if (wanted.length === 0) return [];
  const re = new RegExp(
    `(?<![\\p{L}\\p{N}_])(?:${wanted.map(escapeRegExp).join("|")})(?![\\p{L}\\p{N}_])`,
    "giu",
  );
  const src = linesOf(text);
  const scan = scanDoc(text);
  const first = splitBlocks(src)[0];
  const skip: Range[] = [
    ...scan.links.map((l) => l.range),
    ...scan.tags.map((t) => t.range),
    ...scan.excluded,
  ];
  const hits: SearchHit[] = [];
  for (let line = 0; line < src.lineCount; line++) {
    if (
      first?.kind === "frontmatter" &&
      line >= first.startLine &&
      line <= first.endLine
    )
      continue;
    const t = src.line(line);
    for (const m of t.matchAll(re)) {
      const col = m.index;
      const len = m[0].length;
      if (skip.some((r) => overlaps(r, line, col, col + len))) continue;
      hits.push({ path, line, col, len, text: t });
    }
  }
  return hits;
}

/** Answer one search with exactly one `results` message. */
async function searchFile(
  m: Extract<ToWorker, { t: "search" }>,
): Promise<void> {
  const hits: SearchHit[] = [];
  let capped = false;
  const mentions = m.mode === "mentions";
  if (mentions ? (m.names ?? []).length > 0 : m.query !== "")
    for (const path of [...files].sort()) {
      if (mentions && (!isNote(path) || path === m.exclude)) continue;
      const text = await textOf(path).catch(() => undefined);
      if (text === undefined) continue;
      const found = mentions
        ? searchMentions(path, text, m.names ?? [])
        : searchText(path, text, m.query);
      for (const h of found) {
        if (hits.length >= m.limit) {
          capped = true;
          break;
        }
        hits.push(h);
      }
      if (capped) break;
    }
  post({ t: "results", id: m.id, hits, ...(capped ? { capped } : {}) });
}

/** Scans and updates run one after another; searches answer at once. */
let queue: Promise<void> = Promise.resolve();
const fail = (x: unknown) =>
  post({ t: "error", message: x instanceof Error ? x.message : String(x) });

self.onmessage = (e: MessageEvent<ToWorker>) => {
  const m = e.data;
  if (m.t === "search") {
    void searchFile(m).catch(fail);
    return;
  }
  queue = queue
    .then(async () => {
      if (m.t === "scan") {
        root = m.root;
        dotfiles = m.dotfiles;
        exclude = m.exclude;
        await scan();
      } else if (m.t === "changed") await changed(m.paths);
      else if (m.t === "moved") moved(m.from, m.to);
      else removed(m.paths);
    })
    .catch(fail);
};
