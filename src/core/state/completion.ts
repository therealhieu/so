import type { NoteIndex } from "../features/links/note-index";
import { linkText, resolvePath } from "../features/links/resolve";
import { rankBy } from "../kernel/text/fuzzy";
import type { Pos } from "../kernel/text/pos";
import type { Key } from "../kernel/vim/keys";
import { activeBuffer, activeWindow } from "./buffers";
import { acceptCode, codeCompletionStep } from "./code-completion";
import { typeKeys } from "./keys";
import { anchorsOf } from "./link-commands";
import { none } from "./result";
import type { AppState, CompletionState, Result } from "./types";
import type { Registries } from "./update";

/** Rows the popup shows at most. */
export const COMPLETION_ROWS = 8;
/** Candidates kept after ranking. */
const LIMIT = 50;

type Item = CompletionState["items"][number];
type Candidate = Item & { text: string };
/** A note or alias candidate with its place in the unranked list. */
type NoteCandidate = Candidate & { order: number };

/** The `[[…` the cursor is typing in: the position after "[[" and the text up to the cursor. */
function typedLink(s: AppState): { anchor: Pos; typed: string } | undefined {
  const b = activeBuffer(s);
  const w = activeWindow(s);
  if (
    b === undefined ||
    w === undefined ||
    b.fileType !== "markdown" ||
    s.vim.mode !== "insert" ||
    s.panels.explorer.focused
  )
    return undefined;
  const { line, col } = w.content.cursor;
  const before = b.text.line(line).slice(0, col);
  const at = before.lastIndexOf("[[");
  if (at < 0) return undefined;
  const typed = before.slice(at + 2);
  return /[[\]|]/.test(typed)
    ? undefined
    : { anchor: { line, col: at + 2 }, typed };
}

function ranked(cands: readonly Candidate[], query: string): Item[] {
  return rankBy(cands, query, (c) => c.text)
    .slice(0, LIMIT)
    .map(({ item: { text: _, ...item } }) => item);
}

/**
 * The note and alias candidates for one index and source note, and the
 * candidates the last query matched, in list order.
 */
type Pool = {
  from: string;
  all: readonly NoteCandidate[];
  query: string;
  matched: readonly NoteCandidate[];
};

/**
 * One pool per index: an index is never changed after it is built, so its
 * candidates stay valid until the next index replaces it. The pool is a
 * cache only; reusing it gives the same items as rebuilding it.
 */
const pools = new WeakMap<NoteIndex, Pool>();

/** Notes by their shortest link text from `from`, then aliases as "alias → link". */
function poolFor(ix: NoteIndex, from: string): Pool {
  const cached = pools.get(ix);
  if (cached?.from === from) return cached;
  const notes: Candidate[] = [];
  const aliases: Candidate[] = [];
  for (const [path, summary] of ix.summaries) {
    const text = linkText(ix, from, path);
    notes.push({ text, insert: text, label: text, detail: path });
    for (const alias of summary.aliases)
      aliases.push({
        text: alias,
        insert: `${text}|${alias}`,
        label: `${alias} → ${text}`,
        detail: path,
      });
  }
  const byText = (a: Candidate, b: Candidate) =>
    a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
  const all = [...notes.sort(byText), ...aliases.sort(byText)].map(
    (c, order) => ({ ...c, order }),
  );
  const pool = { from, all, query: "", matched: all };
  pools.set(ix, pool);
  return pool;
}

/**
 * The ranked notes and aliases for `query`. A query that extends the last
 * one can only match texts the last one matched, so only those are ranked.
 */
function noteItems(s: AppState, from: string, query: string): Item[] {
  const pool = poolFor(s.index.ix, from);
  const strip = ({ text: _, order: __, ...item }: NoteCandidate): Item => item;
  if (query === "") {
    pool.query = "";
    pool.matched = pool.all;
    return pool.all.slice(0, LIMIT).map(strip);
  }
  const hits = rankBy(
    query.startsWith(pool.query) ? pool.matched : pool.all,
    query,
    (c) => c.text,
  );
  pool.query = query;
  pool.matched = hits.map((h) => h.item).sort((a, b) => a.order - b.order);
  return hits.slice(0, LIMIT).map((h) => strip(h.item));
}

/** The completion for the text after "[[": notes, then headings after "#", blocks after "#^". */
function completionFor(
  s: AppState,
  anchor: Pos,
  typed: string,
  prev: CompletionState | undefined,
): CompletionState {
  const from = activeBuffer(s)?.path ?? "";
  const hash = typed.indexOf("#");
  const mode =
    hash < 0 ? "notes" : typed.startsWith("#^", hash) ? "blocks" : "headings";
  const query =
    mode === "notes"
      ? typed
      : mode === "blocks"
        ? typed.slice(hash + 2)
        : typed.slice(typed.lastIndexOf("#") + 1);
  let target: string | undefined;
  let items: Item[];
  if (mode === "notes") items = noteItems(s, from, query);
  else {
    target = resolvePath(s.index.ix, from, typed.slice(0, hash));
    const anchors = target === undefined ? undefined : anchorsOf(s, target);
    items =
      mode === "headings"
        ? ranked(
            (anchors?.headings ?? []).map((h) => ({
              text: h.text,
              insert: h.text,
              label: `${"#".repeat(h.level)} ${h.text}`,
            })),
            query,
          )
        : ranked(
            (anchors?.blocks ?? []).map((b) => ({
              text: b.id,
              insert: b.id,
              label: `^${b.id}`,
              detail: `:${b.line + 1}`,
            })),
            query,
          );
  }
  const same =
    prev !== undefined &&
    prev.mode === mode &&
    prev.target === target &&
    prev.query === query;
  return {
    anchor,
    mode,
    ...(target === undefined ? {} : { target }),
    query,
    items,
    selected: same ? Math.min(prev.selected, Math.max(0, items.length - 1)) : 0,
  };
}

/**
 * After an Insert-mode key in a Markdown buffer: "[[" just typed opens the
 * popup; while it is open it follows the text after "[[" (notes, "#"
 * headings, "#^" blocks of the resolved target). It closes when the cursor
 * leaves the `[[…` span or Insert mode ends.
 */
function linkCompletion(s: AppState): AppState {
  const open =
    s.overlay.kind === "completion" ? s.overlay.completion : undefined;
  if (open === undefined && s.overlay.kind !== "none") return s;
  const link = typedLink(s);
  if (link === undefined || (open === undefined && link.typed !== ""))
    return open === undefined ? s : { ...s, overlay: { kind: "none" } };
  return {
    ...s,
    overlay: {
      kind: "completion",
      completion: completionFor(s, link.anchor, link.typed, open),
    },
  };
}

/**
 * After a key that left the state in Insert mode, ended it, or met an open
 * popup: notes complete links; code buffers complete through their server.
 */
export function maybeCompletion(r: Result, key: Key): Result {
  return activeBuffer(r.state)?.fileType === "markdown"
    ? { ...r, state: linkCompletion(r.state) }
    : codeCompletionStep(r, key);
}

/** Replace the typed query with `text` through the Insert engine, so it stays one change. */
function insertItem(
  s: AppState,
  c: CompletionState,
  text: string,
  after: Key[],
  now: number,
  reg: Registries,
): Result {
  const keys: Key[] = [
    ...Array.from({ length: [...c.query].length }, () => "<BS>"),
    ...text,
    ...after,
  ];
  const r = typeKeys(s, keys, now, reg);
  return { ...r, state: linkCompletion(r.state) };
}

/** Whether "]]" already follows the cursor. */
function closed(s: AppState): boolean {
  const b = activeBuffer(s);
  const w = activeWindow(s);
  if (b === undefined || w === undefined) return false;
  const { line, col } = w.content.cursor;
  return b.text.line(line).startsWith("]]", col);
}

/**
 * List keys only; undefined for keys that should reach the Insert engine.
 * C-n/C-p and the arrows move; Enter/Tab insert the item and "]]"; "#" on
 * a note inserts its link text and continues with its headings.
 */
export function completionKey(
  s: AppState,
  a: { key: Key; now: number },
  reg: Registries,
): Result | undefined {
  if (s.overlay.kind !== "completion") return undefined;
  const c = s.overlay.completion;
  const n = c.items.length;
  const move = (delta: number) =>
    none({
      ...s,
      overlay: {
        kind: "completion",
        completion: {
          ...c,
          selected: n === 0 ? 0 : (c.selected + delta + n) % n,
        },
      },
    });
  const item = c.items[c.selected];
  switch (a.key) {
    case "<C-j>":
    case "<C-n>":
    case "<Down>":
      return move(1);
    case "<C-k>":
    case "<C-p>":
    case "<Up>":
      return move(-1);
    case "<CR>":
    case "<Tab>":
      if (item === undefined) return undefined;
      if (c.code !== undefined) {
        const chosen = c.code.items[item.source ?? -1];
        return chosen === undefined
          ? undefined
          : acceptCode(s, chosen, c.code.key, a.now, reg);
      }
      return insertItem(
        s,
        c,
        item.insert,
        closed(s) ? [] : [..."]]"],
        a.now,
        reg,
      );
    case "#": {
      if (c.mode !== "notes" || item === undefined) return undefined;
      const name = item.insert.split("|")[0] ?? item.insert;
      return insertItem(s, c, name, ["#"], a.now, reg);
    }
  }
  return undefined;
}
