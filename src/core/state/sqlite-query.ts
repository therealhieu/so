import { oneStatement, quoteIdent } from "../features/sqlite/statement";
import { editField, type LineField } from "./line-field";
import { windowBuffer } from "./pdf";
import { none } from "./result";
import { setSqliteWindow, sqliteWindow } from "./sqlite";
import type {
  Action,
  AppState,
  Effect,
  Result,
  SqliteQueryState,
  WindowId,
} from "./types";

/** How long typing must pause before the query is checked. */
const CHECK_MS = 150;
/** The most queries a window remembers. */
const HISTORY_MAX = 50;

const CANCEL_CHECK: Effect = { kind: "cancelTimer", id: "sqliteCheck" };

const queryOf = (s: AppState): SqliteQueryState | undefined =>
  s.overlay.kind === "sqliteQuery" ? s.overlay.query : undefined;

const withQuery = (s: AppState, query: SqliteQueryState): AppState => ({
  ...s,
  overlay: { kind: "sqliteQuery", query },
});

const insert = (f: LineField, text: string): LineField => ({
  value: f.value.slice(0, f.caret) + text + f.value.slice(f.caret),
  caret: f.caret + text.length,
});

type Extra = Partial<Pick<SqliteQueryState, "recall" | "draft" | "matches">>;

const keep = (q: SqliteQueryState): Extra => ({
  ...(q.recall === undefined ? {} : { recall: q.recall }),
  ...(q.draft === undefined ? {} : { draft: q.draft }),
});

/**
 * The dialog with `field`: a caret move keeps the check and the history
 * step; a new text is a new edit, checked once typing pauses.
 */
function edited(
  s: AppState,
  q: SqliteQueryState,
  field: LineField,
  extra: Extra = {},
): Result {
  const { recall: _, draft: __, matches: ___, ...base } = q;
  if (field.value === q.field.value)
    return none(withQuery(s, { ...base, ...keep(q), ...extra, field }));
  const blank = field.value.trim() === "";
  const next: SqliteQueryState = {
    ...base,
    ...extra,
    field,
    gen: q.gen + 1,
    check: { status: blank ? "idle" : "checking" },
  };
  return {
    state: withQuery(s, next),
    effects: [
      blank
        ? CANCEL_CHECK
        : { kind: "startTimer", id: "sqliteCheck", ms: CHECK_MS },
    ],
  };
}

/** Open the query dialog of SQLite window `id`, holding the query it shows, if any. */
export function openSqliteQuery(s: AppState, id: WindowId): Result {
  const ws = sqliteWindow(s, id);
  if (ws === undefined) return none(s);
  const text = ws.source?.kind === "query" ? ws.source.sql : "";
  const q: SqliteQueryState = {
    window: id,
    field: { value: "", caret: 0 },
    gen: 0,
    check: { status: "idle" },
  };
  return edited(withQuery(s, q), q, { value: text, caret: text.length });
}

/** Show what `sql` returns in window `id`; `Esc` there goes back to the table it ran from. */
export function showSqliteQuery(
  s: AppState,
  id: WindowId,
  sql: string,
): AppState {
  const ws = sqliteWindow(s, id);
  if (ws === undefined) return s;
  const src = ws.source;
  const back = src?.kind === "table" ? src.name : ws.back;
  const { widths: _, back: __, ...rest } = ws;
  const queries = [...(ws.queries ?? []).filter((x) => x !== sql), sql].slice(
    -HISTORY_MAX,
  );
  return setSqliteWindow(s, id, {
    ...rest,
    ...(back === undefined ? {} : { back }),
    pane: "rows",
    source: { kind: "query", sql },
    row: 0,
    column: 0,
    col: 0,
    paneTop: 0,
    queries,
  });
}

/** `<CR>`: run the query unless it is known not to run; the reason stays shown. */
function run(s: AppState, q: SqliteQueryState): Result {
  const one = oneStatement(q.field.value);
  if ("error" in one)
    return {
      state: withQuery(s, {
        ...q,
        check: { status: "failed", reason: one.error },
      }),
      effects: [CANCEL_CHECK],
    };
  if (q.check.status === "failed") return none(s);
  const closed: AppState = { ...s, overlay: { kind: "none" } };
  return {
    state: showSqliteQuery(closed, q.window, one.sql),
    effects: [CANCEL_CHECK],
  };
}

/** `↑`/`↓`: the caret's line above or below; from the first or last line, the history. */
function lineOrHistory(s: AppState, q: SqliteQueryState, dir: -1 | 1): Result {
  const { value, caret } = q.field;
  const start = value.lastIndexOf("\n", caret - 1) + 1;
  const column = caret - start;
  if (dir < 0 && start > 0) {
    const above = value.lastIndexOf("\n", start - 2) + 1;
    const to = above + Math.min(column, start - 1 - above);
    return edited(s, q, { value, caret: to });
  }
  const end = value.indexOf("\n", caret);
  if (dir > 0 && end >= 0) {
    const below = end + 1;
    const stop = value.indexOf("\n", below);
    const len = (stop < 0 ? value.length : stop) - below;
    return edited(s, q, { value, caret: below + Math.min(column, len) });
  }
  return recall(s, q, dir);
}

/** Step through the window's past queries; past the newest is the text typed before. */
function recall(s: AppState, q: SqliteQueryState, dir: -1 | 1): Result {
  const list = sqliteWindow(s, q.window)?.queries ?? [];
  const at = q.recall ?? list.length;
  const to = Math.max(0, Math.min(at + dir, list.length));
  if (to === at) return none(s);
  const draft = q.recall === undefined ? q.field.value : (q.draft ?? "");
  const text = to === list.length ? draft : (list[to] ?? "");
  const field = { value: text, caret: text.length };
  return edited(s, q, field, to === list.length ? {} : { recall: to, draft });
}

/** Words after which only a table or view can follow. */
const TABLE_AFTER = /\b(from|join|into|update|table)\s+$/i;

/**
 * The names window `id`'s database could complete to, each once: its
 * tables and views, then their columns unless only a table can follow.
 */
function namesOf(s: AppState, id: WindowId, tablesOnly: boolean): string[] {
  const info = windowBuffer(s, id)?.sqlite;
  if (info?.status !== "ready") return [];
  const names = new Set<string>();
  for (const t of info.tables) names.add(t.name);
  if (!tablesOnly)
    for (const t of info.tables) for (const c of t.columns) names.add(c.name);
  return [...names];
}

const PLAIN = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** The longest start every name in `names` shares, ignoring case; spelled as the first. */
function sharedStart(names: string[]): string {
  const [first = "", ...rest] = names;
  let n = first.length;
  for (const name of rest) {
    let i = 0;
    while (
      i < n &&
      i < name.length &&
      first[i]?.toLowerCase() === name[i]?.toLowerCase()
    )
      i++;
    n = i;
  }
  return first.slice(0, n);
}

/**
 * `<Tab>`: complete the word before the caret to a table, view, or column
 * name. One match is written whole (quoted when it must be); several are
 * listed, and the word grows to what they share.
 */
function complete(s: AppState, q: SqliteQueryState): Result {
  const { value, caret } = q.field;
  const word = /[A-Za-z_][A-Za-z0-9_]*$/.exec(value.slice(0, caret))?.[0] ?? "";
  if (word === "") return none(s);
  const lower = word.toLowerCase();
  const from = caret - word.length;
  const tablesOnly = TABLE_AFTER.test(value.slice(0, from));
  const hits = namesOf(s, q.window, tablesOnly).filter((n) =>
    n.toLowerCase().startsWith(lower),
  );
  if (hits.length === 0) return none(s);
  const one = hits.length === 1 ? hits[0] : undefined;
  const to =
    one === undefined
      ? sharedStart(hits)
      : PLAIN.test(one)
        ? one
        : quoteIdent(one);
  const field = insert(
    { value: value.slice(0, from) + value.slice(caret), caret: from },
    to,
  );
  return edited(s, q, field, one === undefined ? { matches: hits } : {});
}

/** A key while the query dialog is open. */
export function sqliteQueryKey(
  s: AppState,
  q: SqliteQueryState,
  key: string,
): Result {
  switch (key) {
    case "<Esc>":
      return {
        state: { ...s, overlay: { kind: "none" } },
        effects: [CANCEL_CHECK],
      };
    case "<CR>":
      return run(s, q);
    case "<C-j>":
      return edited(s, q, insert(q.field, "\n"));
    case "<Tab>":
      return complete(s, q);
    case "<Up>":
      return lineOrHistory(s, q, -1);
    case "<Down>":
      return lineOrHistory(s, q, 1);
    case "<Home>":
    case "<End>": {
      const { value, caret } = q.field;
      const start = value.lastIndexOf("\n", caret - 1) + 1;
      const end = value.indexOf("\n", caret);
      const to = key === "<Home>" ? start : end < 0 ? value.length : end;
      return edited(s, q, { value, caret: to });
    }
    case "<C-u>":
    case "<C-w>": {
      // Delete back to the line's start, or over the word before the caret.
      const { value, caret } = q.field;
      const head = value.slice(0, caret);
      const from =
        key === "<C-u>"
          ? head.lastIndexOf("\n") + 1
          : head.replace(/(\w+|[^\w\s]+)?[^\S\n]*$/, "").length;
      return edited(s, q, {
        value: value.slice(0, from) + value.slice(caret),
        caret: from,
      });
    }
  }
  const f = editField(q.field, key);
  return f === undefined ? none(s) : edited(s, q, f);
}

/** Pasted text goes into the query dialog, line breaks kept; elsewhere it is dropped. */
export function onPaste(s: AppState, text: string): Result {
  const q = queryOf(s);
  return q === undefined
    ? none(s)
    : edited(s, q, insert(q.field, text.replace(/\r\n?/g, "\n")));
}

/** Typing paused: check the query, or say at once why it cannot run. */
export function onSqliteCheckTimer(s: AppState): Result {
  const q = queryOf(s);
  if (q === undefined || q.check.status !== "checking") return none(s);
  const one = oneStatement(q.field.value);
  if ("error" in one)
    return none(
      withQuery(s, { ...q, check: { status: "failed", reason: one.error } }),
    );
  const b = windowBuffer(s, q.window);
  if (b === undefined) return none(s);
  return {
    state: s,
    effects: [{ kind: "sqliteCheck", path: b.path, gen: q.gen, sql: one.sql }],
  };
}

/** A check answered: kept when it is for the dialog's latest edit. */
export function onSqliteChecked(
  s: AppState,
  a: Extract<Action, { type: "sqliteChecked" }>,
): Result {
  const q = queryOf(s);
  if (q === undefined || q.gen !== a.gen) return none(s);
  const r = a.result;
  return none(
    withQuery(s, {
      ...q,
      check:
        r.kind === "ok"
          ? { status: "ok", columns: r.columns }
          : { status: "failed", reason: r.reason },
    }),
  );
}
