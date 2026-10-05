import { rankBy } from "../kernel/text/fuzzy";
import type { Pos } from "../kernel/text/pos";
import type { Key } from "../kernel/vim/keys";
import { activeBuffer, activeWindow } from "./buffers";
import { pickServer, request } from "./lsp";
import type {
  CodeCompletionItem,
  LspResult,
  PendingRequest,
  ServerKey,
} from "./lsp-types";
import { chain, message, none } from "./result";
import type { AppState, CompletionState, Effect, Result } from "./types";

/** The pause after an identifier character before completion is asked for. */
const PAUSE_MS = 150;
/** Rows kept after ranking. */
const LIMIT = 50;

const IDENT = /[\p{L}\p{N}_$]/u;
const identKey = (key: Key) => [...key].length === 1 && IDENT.test(key);

/** Where the identifier ending at `col` starts. */
function wordStart(line: string, col: number): number {
  let start = col;
  while (start > 0 && IDENT.test(line[start - 1] ?? "")) start--;
  return start;
}

/**
 * Typing in Insert mode in a code buffer whose server completes: the line,
 * the cursor, the start of the word before it, and that server.
 */
function typing(
  s: AppState,
):
  | { path: string; line: string; cursor: Pos; start: number; key: ServerKey }
  | undefined {
  const b = activeBuffer(s);
  const w = activeWindow(s);
  if (
    b === undefined ||
    w === undefined ||
    s.vim.mode !== "insert" ||
    s.panels.explorer.focused
  )
    return undefined;
  const key = pickServer(s, b.path, "completion");
  if (key === undefined) return undefined;
  const cursor = w.content.cursor;
  const line = b.text.line(cursor.line);
  return {
    path: b.path,
    line,
    cursor,
    start: wordStart(line, cursor.col),
    key,
  };
}

/** The open code popup, if any. */
const codePopup = (s: AppState): CompletionState | undefined =>
  s.overlay.kind === "completion" && s.overlay.completion.mode === "code"
    ? s.overlay.completion
    : undefined;

/** Server items as popup rows: by `sortText` with no query, else by match on `filterText`. */
function rankCode(
  items: readonly CodeCompletionItem[],
  query: string,
): CompletionState["items"] {
  const ordered = items
    .map((item, source) => ({ item, source }))
    .sort(
      (a, b) =>
        (a.item.sortText < b.item.sortText
          ? -1
          : a.item.sortText > b.item.sortText
            ? 1
            : 0) || a.source - b.source,
    );
  return rankBy(ordered, query, (x) => x.item.filterText)
    .slice(0, LIMIT)
    .map(({ item: { item, source } }) => ({
      insert: item.insertText ?? item.label,
      label: item.label,
      ...(item.detail === undefined ? {} : { detail: item.detail }),
      source,
    }));
}

/** The popup over `items` for the word from `start` to the cursor. */
function shown(
  s: AppState,
  at: { line: number; start: number; query: string },
  code: NonNullable<CompletionState["code"]>,
): AppState {
  return {
    ...s,
    overlay: {
      kind: "completion",
      completion: {
        anchor: { line: at.line, col: at.start },
        mode: "code",
        query: at.query,
        items: rankCode(code.items, at.query),
        selected: 0,
        code,
      },
    },
  };
}

const CANCEL_PAUSE: Effect = { kind: "cancelTimer", id: "completion" };

/** Close the code popup and forget a pause still running. */
function closed(r: Result): Result {
  const state: AppState =
    codePopup(r.state) === undefined
      ? r.state
      : { ...r.state, overlay: { kind: "none" } };
  return { state, effects: [...r.effects, CANCEL_PAUSE] };
}

/** Ask the completing server at `pos`; automatic requests replace older ones. */
const ask = (s: AppState, pos: Pos, trigger?: string): Result =>
  request(
    s,
    "completion",
    {
      kind: "completion",
      pos,
      ...(trigger === undefined ? {} : { trigger }),
    },
    { auto: true, replace: true },
  );

/**
 * After a key in a code buffer: a trigger character asks at once; an
 * identifier character re-ranks the open popup locally, asks again when its
 * list is incomplete, or waits for a pause; anything that leaves the word
 * or Insert mode closes the popup.
 */
export function codeCompletionStep(r: Result, key: Key): Result {
  const s = r.state;
  const open = codePopup(s);
  if (s.overlay.kind !== "none" && open === undefined) return r;
  const t = typing(s);
  if (t === undefined) {
    const b = activeBuffer(s);
    const completes =
      b !== undefined && pickServer(s, b.path, "completion") !== undefined;
    return open !== undefined || completes ? closed(r) : r;
  }
  const { line, cursor, start } = t;
  if (s.lsp.servers[t.key]?.completionTriggers.includes(key) === true)
    return chain(closed(r), (st) => ask(st, cursor, key));
  const query = line.slice(start, cursor.col);
  if (
    open?.code !== undefined &&
    open.anchor.line === cursor.line &&
    open.anchor.col === start
  ) {
    const ranked: Result = {
      state: shown(s, { line: cursor.line, start, query }, open.code),
      effects: r.effects,
    };
    return open.code.incomplete && identKey(key)
      ? chain(ranked, (st) => ask(st, { line: cursor.line, col: start }))
      : ranked;
  }
  if (!identKey(key) || query === "") return closed(r);
  const waiting = open === undefined ? r : closed(r);
  return {
    state: waiting.state,
    effects: [
      ...waiting.effects,
      { kind: "startTimer", id: "completion", ms: PAUSE_MS },
    ],
  };
}

/** The pause ended: ask for completion at the start of the word being typed. */
export function onCompletionTimer(s: AppState): Result {
  const t = typing(s);
  return t === undefined || t.start === t.cursor.col
    ? none(s)
    : ask(s, { line: t.cursor.line, col: t.start });
}

/**
 * A completion answer. It opens the popup only while the cursor is still in
 * the word the request was made for; the version was checked already.
 */
export function onCompletionResult(
  s: AppState,
  p: PendingRequest,
  r: Extract<LspResult, { kind: "completion" }>,
): Result {
  const t = typing(s);
  const b = activeBuffer(s);
  if (
    t === undefined ||
    b === undefined ||
    p.pos === undefined ||
    t.path !== p.path ||
    s.windows.active !== p.window ||
    t.cursor.line !== p.pos.line ||
    t.start !== wordStart(t.line, p.pos.col) ||
    (s.overlay.kind !== "none" && codePopup(s) === undefined)
  )
    return none(s);
  const query = t.line.slice(t.start, t.cursor.col);
  const next = shown(
    s,
    { line: t.cursor.line, start: t.start, query },
    {
      key: p.key,
      items: r.items,
      incomplete: r.incomplete,
      version: b.text.version,
    },
  );
  if (codePopup(next)?.items.length !== 0) return none(next);
  const nothing: AppState = { ...s, overlay: { kind: "none" } };
  return p.auto ? none(nothing) : message(nothing, "completion: nothing found");
}
