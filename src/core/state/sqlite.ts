import { resizedWidth } from "../features/bases/table";
import {
  isSqliteWindowState,
  type SqlitePage,
  type SqliteWindowState,
} from "../features/sqlite/file-type";
import { sqliteTableModel } from "../features/sqlite/table";
import {
  PAGE_ROWS,
  type SqliteCell,
  type SqliteSource,
  type SqliteTable,
  sameSource,
} from "../features/sqlite/types";
import { copyText } from "../features/sqlite/value";
import type { Binding } from "../kernel/commands/defaults";
import type { Command } from "../kernel/commands/registry";
import { setWindow } from "./buffers";
import type { CommandContext, CommandResult } from "./commands";
import { sameStamp, windowBuffer } from "./pdf";
import { openPicker } from "./picker";
import { message, none } from "./result";
import { openSqliteQuery } from "./sqlite-query";
import type {
  Action,
  AppState,
  BufferState,
  Effect,
  Result,
  SqliteInfo,
  WindowId,
} from "./types";

export function sqliteWindow(
  s: AppState,
  id: WindowId,
): SqliteWindowState | undefined {
  const ws = s.windows.byId[id]?.content.kindState;
  return isSqliteWindowState(ws) ? ws : undefined;
}

export function setSqliteWindow(
  s: AppState,
  id: WindowId,
  ws: SqliteWindowState,
): AppState {
  const w = s.windows.byId[id];
  if (w === undefined || w.content.kindState === ws) return s;
  return setWindow(s, { ...w, content: { ...w.content, kindState: ws } });
}

type Ready = Extract<SqliteInfo, { status: "ready" }>;

const readyInfo = (b: BufferState | undefined): Ready | undefined =>
  b?.sqlite?.status === "ready" ? b.sqlite : undefined;

/** The table or view window `ws` shows, once the schema is read. */
export function shownTable(
  b: BufferState | undefined,
  ws: SqliteWindowState,
): SqliteTable | undefined {
  const src = ws.source;
  if (src?.kind !== "table") return undefined;
  return readyInfo(b)?.tables.find((t) => t.name === src.name);
}

/** The rows window `ws` holds for the source it shows. */
export function shownPage(ws: SqliteWindowState): SqlitePage | undefined {
  const p = ws.page;
  return p !== undefined && sameSource(p.source, ws.source) ? p : undefined;
}

/** How many rows window `ws`'s source has, when known. */
export function rowCount(
  b: BufferState | undefined,
  ws: SqliteWindowState,
): number | undefined {
  const src = ws.source;
  const counted =
    src?.kind === "table" ? readyInfo(b)?.counts[src.name] : undefined;
  if (counted?.status === "ready") return counted.count;
  const p = shownPage(ws);
  return p?.status === "ok" && !p.more ? p.offset + p.rows.length : undefined;
}

/** The focused cell, when its row is loaded. */
export function focusedCell(ws: SqliteWindowState): SqliteCell | undefined {
  const p = shownPage(ws);
  return p?.status === "ok"
    ? p.rows[ws.row - p.offset]?.[ws.column]
    : undefined;
}

const columnsOf = (ws: SqliteWindowState) => {
  const p = shownPage(ws);
  return p?.status === "ok" ? p.columns : [];
};

/** The page that keeps `row` well inside it: about half a page above and below. */
const offsetFor = (row: number) =>
  Math.max(0, Math.floor((row - PAGE_ROWS / 2) / 50) * 50);

function covers(
  p: SqlitePage | undefined,
  gen: number,
  source: SqliteSource,
  row: number,
): boolean {
  if (p === undefined || p.gen !== gen || !sameSource(p.source, source))
    return false;
  if (p.status === "failed") return true;
  if (row < p.offset) return false;
  return row < p.offset + p.rows.length || !p.more;
}

/** Ask for the schema again: a new read of the buffer, answered under `gen`. */
function readSchema(b: BufferState): { b: BufferState; effect: Effect } {
  const gen = (b.sqlite?.gen ?? 0) + 1;
  return {
    b: { ...b, sqlite: { stamp: b.stamp, gen, status: "loading" } },
    effect: { kind: "sqliteSchema", path: b.path, stamp: b.stamp, gen },
  };
}

/**
 * Every SQLite buffer on disk has its schema read for its current bytes, and
 * every SQLite window has the rows around its focus and its table's row
 * count asked for, once per read of the buffer.
 */
export function syncSqlite(prev: AppState, r: Result): Result {
  if (prev.buffers === r.state.buffers && prev.windows === r.state.windows)
    return r;
  let s = r.state;
  const effects: Effect[] = [];
  for (const b of Object.values(s.buffers)) {
    if (b.fileType !== "sqlite" || b.disk !== "present") continue;
    if (sameStamp(b.sqlite?.stamp, b.stamp)) continue;
    const read = readSchema(b);
    s = { ...s, buffers: { ...s.buffers, [b.id]: read.b } };
    effects.push(read.effect);
  }
  for (const w of Object.values(s.windows.byId)) {
    let ws = sqliteWindow(s, w.id);
    const b = s.buffers[w.content.bufferId];
    const info = readyInfo(b);
    if (ws === undefined || b === undefined || info === undefined) continue;
    const src = ws.source;
    if (
      src === undefined ||
      (src.kind === "table" && !info.tables.some((t) => t.name === src.name))
    ) {
      const first =
        info.tables.find((t) => t.name === ws?.start) ?? info.tables[0];
      if (first === undefined) continue;
      const { start: _, ...rest } = ws;
      ws = {
        ...rest,
        source: { kind: "table", name: first.name },
        row: 0,
        column: 0,
        col: 0,
      };
    }
    const source = ws.source as SqliteSource;
    if (!covers(ws.page, info.gen, source, ws.row)) {
      const offset = offsetFor(ws.row);
      const want = ws.want;
      if (
        want === undefined ||
        want.gen !== info.gen ||
        want.offset !== offset ||
        !sameSource(want.source, source)
      ) {
        ws = { ...ws, want: { gen: info.gen, source, offset } };
        effects.push({
          kind: "sqlitePage",
          path: b.path,
          gen: info.gen,
          window: w.id,
          source,
          offset,
        });
      }
    }
    if (source.kind === "table" && info.counts[source.name] === undefined) {
      const counts = {
        ...info.counts,
        [source.name]: { status: "loading" as const },
      };
      s = {
        ...s,
        buffers: {
          ...s.buffers,
          [b.id]: { ...b, sqlite: { ...info, counts } },
        },
      };
      effects.push({
        kind: "sqliteCount",
        path: b.path,
        gen: info.gen,
        table: source.name,
      });
    }
    s = setSqliteWindow(s, w.id, ws);
  }
  return effects.length === 0 && s === r.state
    ? r
    : { state: s, effects: [...r.effects, ...effects] };
}

const bufferAt = (s: AppState, path: string) =>
  Object.values(s.buffers).find((b) => b.path === path);

/** A schema read answered: kept when it answers the buffer's latest read. */
export function onSqliteSchema(
  s: AppState,
  a: Extract<Action, { type: "sqliteSchema" }>,
): Result {
  const b = bufferAt(s, a.path);
  if (
    b?.sqlite === undefined ||
    b.sqlite.gen !== a.gen ||
    !sameStamp(b.stamp, a.stamp)
  )
    return none(s);
  const r = a.result;
  const base = { stamp: a.stamp, gen: a.gen };
  const sqlite: SqliteInfo =
    r.kind === "ok"
      ? { ...base, status: "ready", tables: r.tables, counts: {} }
      : r.kind === "notSqlite"
        ? { ...base, status: "notSqlite" }
        : { ...base, status: "failed", reason: r.reason };
  return none({ ...s, buffers: { ...s.buffers, [b.id]: { ...b, sqlite } } });
}

/** Rows answered: kept when they answer the window's latest ask, with the focus kept on a row. */
export function onSqlitePage(
  s: AppState,
  a: Extract<Action, { type: "sqlitePage" }>,
): Result {
  const ws = sqliteWindow(s, a.window);
  const want = ws?.want;
  if (
    ws === undefined ||
    want === undefined ||
    want.gen !== a.gen ||
    want.offset !== a.offset ||
    !sameSource(want.source, a.source) ||
    windowBuffer(s, a.window)?.path !== a.path
  )
    return none(s);
  const r = a.result;
  const page: SqlitePage =
    r.kind === "ok"
      ? { gen: a.gen, source: a.source, offset: a.offset, status: "ok", ...r }
      : {
          gen: a.gen,
          source: a.source,
          offset: a.offset,
          status: "failed",
          reason: r.reason,
        };
  const { want: _, ...rest } = ws;
  let next: SqliteWindowState = { ...rest, page };
  if (page.status === "ok") {
    const last = page.offset + page.rows.length - 1;
    const row = !page.more && ws.row > last ? Math.max(0, last) : ws.row;
    const column = Math.max(0, Math.min(ws.column, page.columns.length - 1));
    next = { ...next, row, column };
  }
  return none(setSqliteWindow(s, a.window, next));
}

/** A row count answered for the buffer's latest read. */
export function onSqliteCount(
  s: AppState,
  a: Extract<Action, { type: "sqliteCount" }>,
): Result {
  const b = bufferAt(s, a.path);
  const info = readyInfo(b);
  if (b === undefined || info === undefined || info.gen !== a.gen)
    return none(s);
  const count =
    a.result.kind === "ok"
      ? { status: "ready" as const, count: a.result.count }
      : { status: "failed" as const };
  const sqlite = { ...info, counts: { ...info.counts, [a.table]: count } };
  return none({ ...s, buffers: { ...s.buffers, [b.id]: { ...b, sqlite } } });
}

/** The view drew window `window`: keep the columns it scrolled and the rows it showed. */
export function onSqliteLaidOut(
  s: AppState,
  a: Extract<Action, { type: "sqliteLaidOut" }>,
): Result {
  const ws = sqliteWindow(s, a.window);
  if (
    ws === undefined ||
    (ws.col === a.col && ws.bodyRows === a.rows && ws.paneLines === a.lines)
  )
    return none(s);
  return none(
    setSqliteWindow(s, a.window, {
      ...ws,
      col: a.col,
      bodyRows: a.rows,
      paneLines: a.lines,
    }),
  );
}

type Active = {
  s: AppState;
  id: WindowId;
  ws: SqliteWindowState;
  b: BufferState | undefined;
};

const withActive =
  (f: (a: Active) => Result) =>
  (c: CommandContext): Result => {
    const id = c.state.windows.active;
    const ws = sqliteWindow(c.state, id);
    return ws === undefined
      ? none(c.state)
      : f({ s: c.state, id, ws, b: windowBuffer(c.state, id) });
  };

const set = (a: Active, ws: SqliteWindowState): Result =>
  none(setSqliteWindow(a.s, a.id, ws));

/** The row `row` asks for, kept from 0 to the last row when that is known. */
function clampRow(a: Active, row: number): number {
  const count = rowCount(a.b, a.ws);
  const last = count === undefined ? row : Math.max(0, count - 1);
  return Math.max(0, Math.min(row, last));
}

/** Move the focus `dr` rows and `dc` columns; in the schema and cell panes, scroll `dr` lines. */
function move(a: Active, dr: number, dc: number): Result {
  if (a.ws.pane !== "rows") {
    const max = Math.max(0, (a.ws.paneLines ?? 0) - (a.ws.bodyRows ?? 1));
    const paneTop = Math.max(0, Math.min(a.ws.paneTop + dr, max));
    return set(a, { ...a.ws, paneTop });
  }
  const cols = columnsOf(a.ws).length;
  const column = Math.max(0, Math.min(a.ws.column + dc, cols - 1));
  return set(a, { ...a.ws, row: clampRow(a, a.ws.row + dr), column });
}

const half = (ws: SqliteWindowState) =>
  Math.max(1, Math.floor((ws.bodyRows ?? 20) / 2));

function toTop(a: Active): Result {
  return a.ws.pane === "rows"
    ? set(a, { ...a.ws, row: 0 })
    : set(a, { ...a.ws, paneTop: 0 });
}

function toBottom(a: Active): Result {
  if (a.ws.pane !== "rows") return move(a, Number.MAX_SAFE_INTEGER, 0);
  const count = rowCount(a.b, a.ws);
  if (count !== undefined)
    return set(a, { ...a.ws, row: Math.max(0, count - 1) });
  const src = a.ws.source;
  if (src?.kind === "table")
    return readyInfo(a.b)?.counts[src.name]?.status === "failed"
      ? message(a.s, "could not count the rows; R tries again", "error")
      : message(a.s, "row count not known yet");
  const p = shownPage(a.ws);
  return p?.status === "ok"
    ? set(a, { ...a.ws, row: p.offset + p.rows.length - 1 })
    : none(a.s);
}

/**
 * `H`/`L`: scroll the columns after the pinned first one; unless it is on
 * the pinned column, the focus goes along so it never holds them in place.
 */
function scrollCols(a: Active, step: -1 | 1): Result {
  const cols = columnsOf(a.ws).length;
  const col = Math.max(0, Math.min(a.ws.col + step, Math.max(0, cols - 2)));
  const c = a.ws.column;
  const column =
    c === 0 ? 0 : step > 0 ? Math.max(c, col + 1) : Math.min(c, col + 1);
  return set(a, { ...a.ws, col, column });
}

/** Columns one `>` or `<` adds or takes away. */
const WIDTH_STEP = 4;

/** Give column `column` `width` cells (at least 3); `undefined` returns it to its content's width. */
export function resizeSqliteColumn(
  s: AppState,
  id: WindowId,
  column: number,
  width: number | undefined,
): Result {
  const ws = sqliteWindow(s, id);
  const name = ws && columnsOf(ws)[column];
  if (ws === undefined || name === undefined) return none(s);
  const { [name]: was, ...rest } = ws.widths ?? {};
  if (width === undefined) {
    if (was === undefined) return none(s);
    const { widths: _, ...plain } = ws;
    return none(
      setSqliteWindow(
        s,
        id,
        Object.keys(rest).length > 0 ? { ...plain, widths: rest } : plain,
      ),
    );
  }
  const next = resizedWidth(width);
  return next === was
    ? none(s)
    : none(
        setSqliteWindow(s, id, { ...ws, widths: { ...rest, [name]: next } }),
      );
}

function stepWidth(a: Active, step: -1 | 1): Result {
  const p = shownPage(a.ws);
  if (p?.status !== "ok") return none(a.s);
  const m = sqliteTableModel(p.columns, p.rows, a.ws.widths);
  const w = m.columns[a.ws.column]?.width;
  return w === undefined
    ? none(a.s)
    : resizeSqliteColumn(a.s, a.id, a.ws.column, w + step * WIDTH_STEP);
}

/** Focus cell `row`, `column` of window `id`'s rows. */
export function focusSqliteCell(
  s: AppState,
  id: WindowId,
  row: number,
  column: number,
): AppState {
  const ws = sqliteWindow(s, id);
  return ws === undefined
    ? s
    : setSqliteWindow(s, id, { ...ws, pane: "rows", row, column });
}

/** Show table or view `name` from its first row. */
export function showSqliteTable(
  s: AppState,
  id: WindowId,
  name: string,
): AppState {
  const ws = sqliteWindow(s, id);
  if (ws === undefined) return s;
  const { back: _, widths: __, ...rest } = ws;
  return setSqliteWindow(s, id, {
    ...rest,
    pane: "rows",
    source: { kind: "table", name },
    row: 0,
    column: 0,
    col: 0,
    paneTop: 0,
  });
}

/** The tables and views of the active SQLite window's database, for the picker. */
export function sqliteTableCandidates(
  s: AppState,
): { key: string; text: string; detail: string }[] {
  const id = s.windows.active;
  const ws = sqliteWindow(s, id);
  const b = windowBuffer(s, id);
  const info = readyInfo(b);
  if (ws === undefined || info === undefined) return [];
  return info.tables.map((t) => {
    const n = info.counts[t.name];
    const rows =
      n?.status === "ready" ? ` · ${n.count.toLocaleString("en-US")} rows` : "";
    const shown = ws.source?.kind === "table" && ws.source.name === t.name;
    return {
      key: t.name,
      text: t.name,
      detail: `${t.kind}${rows}${shown ? " · shown" : ""}`,
    };
  });
}

function toggleSchema(a: Active): Result {
  if (a.ws.pane === "schema") return set(a, { ...a.ws, pane: "rows" });
  if (a.ws.source?.kind !== "table")
    return message(a.s, "a query has no schema");
  return set(a, { ...a.ws, pane: "schema", paneTop: 0 });
}

function openCell(a: Active): Result {
  if (a.ws.pane !== "rows" || focusedCell(a.ws) === undefined) return none(a.s);
  return set(a, { ...a.ws, pane: "cell", paneTop: 0 });
}

/** `q`/`Esc`: from the schema or a cell back to the rows; from a query back to its table. */
function goBack(a: Active): Result {
  if (a.ws.pane !== "rows") return set(a, { ...a.ws, pane: "rows" });
  if (a.ws.source?.kind === "query" && a.ws.back !== undefined)
    return none(showSqliteTable(a.s, a.id, a.ws.back));
  return none(a.s);
}

function copyCell(a: Active): Result {
  const c = focusedCell(a.ws);
  if (c === undefined) return none(a.s);
  const r = message(a.s, c.t === "blob" ? "copied the BLOB as hex" : "copied");
  return { ...r, effects: [{ kind: "clipboardWrite", text: copyText(c) }] };
}

/** `R`: read the database again, schema, counts, and rows, as it is on disk now. */
function reload(a: Active): Result {
  const b = a.b;
  if (b === undefined || b.fileType !== "sqlite") return none(a.s);
  const read = readSchema(b);
  const s: AppState = { ...a.s, buffers: { ...a.s.buffers, [b.id]: read.b } };
  return { state: s, effects: [read.effect] };
}

const SQLITE = ["sqlite"] as const;
const cmd = (
  id: string,
  title: string,
  f: (c: CommandContext) => Result,
): Command<CommandContext, CommandResult> => ({
  id,
  title,
  filetypes: SQLITE,
  run: f,
});

export const sqliteCommands = [
  cmd(
    "sqlite.left",
    "Focus the cell to the left",
    withActive((a) => move(a, 0, -1)),
  ),
  cmd(
    "sqlite.right",
    "Focus the cell to the right",
    withActive((a) => move(a, 0, 1)),
  ),
  cmd(
    "sqlite.up",
    "Focus the row above",
    withActive((a) => move(a, -1, 0)),
  ),
  cmd(
    "sqlite.down",
    "Focus the row below",
    withActive((a) => move(a, 1, 0)),
  ),
  cmd(
    "sqlite.halfDown",
    "Move down half a window",
    withActive((a) => move(a, half(a.ws), 0)),
  ),
  cmd(
    "sqlite.halfUp",
    "Move up half a window",
    withActive((a) => move(a, -half(a.ws), 0)),
  ),
  cmd("sqlite.first", "Focus the first row", withActive(toTop)),
  cmd("sqlite.last", "Focus the last row", withActive(toBottom)),
  cmd(
    "sqlite.scrollLeft",
    "Scroll the columns left",
    withActive((a) => scrollCols(a, -1)),
  ),
  cmd(
    "sqlite.scrollRight",
    "Scroll the columns right",
    withActive((a) => scrollCols(a, 1)),
  ),
  cmd(
    "sqlite.wider",
    "Widen the focused column",
    withActive((a) => stepWidth(a, 1)),
  ),
  cmd(
    "sqlite.narrower",
    "Narrow the focused column",
    withActive((a) => stepWidth(a, -1)),
  ),
  cmd(
    "sqlite.resetWidth",
    "Return the focused column to its width",
    withActive((a) => resizeSqliteColumn(a.s, a.id, a.ws.column, undefined)),
  ),
  cmd("sqlite.tables", "List the tables and views", (c) =>
    withActive((a) => openPicker({ ...c, state: a.s }, "sqliteTables"))(c),
  ),
  cmd("sqlite.schema", "Toggle the table's schema", withActive(toggleSchema)),
  cmd("sqlite.cell", "Show the focused value whole", withActive(openCell)),
  cmd(
    "sqlite.back",
    "Back to the rows, or from a query to its table",
    withActive(goBack),
  ),
  cmd("sqlite.copy", "Copy the focused value", withActive(copyCell)),
  cmd("sqlite.reload", "Read the database again", withActive(reload)),
  cmd(
    "sqlite.query",
    "Write a read-only SQL query",
    withActive((a) => openSqliteQuery(a.s, a.id)),
  ),
];

const KEYS: readonly (readonly [string, string])[] = [
  ["h", "sqlite.left"],
  ["<Left>", "sqlite.left"],
  ["l", "sqlite.right"],
  ["<Right>", "sqlite.right"],
  ["k", "sqlite.up"],
  ["<Up>", "sqlite.up"],
  ["j", "sqlite.down"],
  ["<Down>", "sqlite.down"],
  ["<C-d>", "sqlite.halfDown"],
  ["<C-u>", "sqlite.halfUp"],
  ["gg", "sqlite.first"],
  ["G", "sqlite.last"],
  ["H", "sqlite.scrollLeft"],
  ["L", "sqlite.scrollRight"],
  [">", "sqlite.wider"],
  ["<lt>", "sqlite.narrower"],
  ["=", "sqlite.resetWidth"],
  ["t", "sqlite.tables"],
  ["<Tab>", "sqlite.schema"],
  ["<CR>", "sqlite.cell"],
  ["q", "sqlite.back"],
  ["<Esc>", "sqlite.back"],
  ["y", "sqlite.copy"],
  ["R", "sqlite.reload"],
  ["s", "sqlite.query"],
];

export const sqliteBindings: readonly Binding[] = KEYS.map(([seq, id]) => ({
  scope: { mode: "normal", filetype: "sqlite" },
  seq,
  id,
}));
