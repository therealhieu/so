import { expect, test } from "bun:test";
import {
  fresh,
  stamp,
  testRegistries,
  textFile,
} from "../../../test/support/state";
import { sqliteEditorKind } from "../features/sqlite/file-type";
import type {
  SqliteCell,
  SqlitePageResult,
  SqliteSource,
  SqliteTable,
} from "../features/sqlite/types";
import { splitKeys } from "../kernel/vim/keys";
import { activeBuffer, activeWindow } from "./buffers";
import { SQL_USAGE, sqliteWindow } from "./sqlite";
import type {
  Action,
  AppState,
  Effect,
  MouseTarget,
  Result,
  WindowSpot,
} from "./types";
import { createUpdate } from "./update";

const update = createUpdate(testRegistries());
const PATH = "data/app.db";

function run(s: AppState, ...actions: Action[]): Result {
  const effects: Effect[] = [];
  for (const a of actions) {
    const r = update(s, a);
    s = r.state;
    effects.push(...r.effects);
  }
  return { state: s, effects };
}

const keys = (seq: string): Action[] =>
  splitKeys(seq).map((key) => ({ type: "key", key, now: 0 }));
const ex = (line: string): Action[] => keys(`:${line}<CR>`);
const loaded = (n = 1): Action => ({
  type: "fileLoaded",
  path: PATH,
  file: textFile("", n),
});

const table = (
  name: string,
  kind: "table" | "view" = "table",
): SqliteTable => ({
  name,
  kind,
  sql: `CREATE TABLE ${name} (id INTEGER PRIMARY KEY, email TEXT)`,
  columns: [
    { name: "id", type: "INTEGER", notNull: false, default: null, pk: 1 },
    { name: "email", type: "TEXT", notNull: false, default: null, pk: 0 },
  ],
  indexes: [],
});
const schema = (gen = 1, n = 1): Action => ({
  type: "sqliteSchema",
  path: PATH,
  stamp: stamp(n),
  gen,
  result: {
    kind: "ok",
    tables: [table("kv"), table("users"), table("v", "view")],
  },
});

const int = (i: number): SqliteCell => ({ t: "int", text: String(i) });
const text = (t: string): SqliteCell => ({
  t: "text",
  text: t,
  size: t.length,
});
/** Rows `from`…`to - 1`, each an id and an email. */
const rows = (from: number, to: number): SqliteCell[][] =>
  Array.from({ length: to - from }, (_, i) => [
    int(from + i),
    text(`u${from + i}@x.dev`),
  ]);
const ok = (from: number, to: number, more: boolean): SqlitePageResult => ({
  kind: "ok",
  columns: ["id", "email"],
  rows: rows(from, to),
  more,
});
const page = (
  s: AppState,
  offset: number,
  result: SqlitePageResult,
  source: SqliteSource = { kind: "table", name: "kv" },
  gen = 1,
): Action => ({
  type: "sqlitePage",
  path: PATH,
  gen,
  window: s.windows.active,
  source,
  offset,
  result,
});

const ws = (s: AppState) => sqliteWindow(s, s.windows.active);
const asks = (r: Result) =>
  r.effects.filter((e) => e.kind === "sqlitePage" || e.kind === "sqliteCount");

/** `app.db` open with its schema read and the first 200 of 1000 rows of `kv` shown. */
function opened(): AppState {
  const a = run(fresh(), loaded(), schema());
  return run(a.state, page(a.state, 0, ok(0, 200, true))).state;
}

test("a database opens read-only in the sqlite editor kind and asks for its schema", () => {
  const r = run(fresh(), loaded());
  const b = activeBuffer(r.state);
  expect(b).toMatchObject({ fileType: "sqlite", readOnly: true, binary: true });
  expect(b?.sqlite).toEqual({ stamp: stamp(1), gen: 1, status: "loading" });
  expect(activeWindow(r.state)?.content.editor).toBe("sqlite");
  expect(r.effects).toContainEqual({
    kind: "sqliteSchema",
    path: PATH,
    stamp: stamp(1),
    gen: 1,
  });
});

test("once the schema is read the first table shows and its rows and count are asked for", () => {
  const a = run(fresh(), loaded());
  const r = run(a.state, schema());
  expect(ws(r.state)?.source).toEqual({ kind: "table", name: "kv" });
  expect(asks(r)).toEqual([
    {
      kind: "sqlitePage",
      path: PATH,
      gen: 1,
      window: r.state.windows.active,
      source: { kind: "table", name: "kv" },
      offset: 0,
    },
    { kind: "sqliteCount", path: PATH, gen: 1, table: "kv" },
  ]);
});

test("a subpath names the table shown first", () => {
  const start = sqliteEditorKind.open(PATH, "", "#users");
  expect(start.start).toBe("users");
  const s = run(fresh(), loaded()).state;
  const w = activeWindow(s);
  if (w === undefined) throw new Error("no window");
  const withStart: AppState = {
    ...s,
    windows: {
      ...s.windows,
      byId: {
        ...s.windows.byId,
        [w.id]: { ...w, content: { ...w.content, kindState: start } },
      },
    },
  };
  expect(ws(run(withStart, schema()).state)?.source).toEqual({
    kind: "table",
    name: "users",
  });
});

test("not a database, and a failed read, are kept for the view", () => {
  const a = run(fresh(), loaded());
  const not = run(a.state, {
    ...schema(),
    result: { kind: "notSqlite" },
  } as Action);
  expect(activeBuffer(not.state)?.sqlite?.status).toBe("notSqlite");
  expect(asks(not)).toEqual([]);
  const failed = run(a.state, {
    ...schema(),
    result: { kind: "failed", reason: "file is not a database" },
  } as Action);
  expect(activeBuffer(failed.state)?.sqlite).toMatchObject({
    status: "failed",
    reason: "file is not a database",
  });
});

test("moving past the loaded rows asks once for the page around the focus", () => {
  const s = opened();
  const first = run(s, ...keys("j".repeat(199)));
  expect(ws(first.state)?.row).toBe(199);
  expect(asks(first)).toEqual([]);
  const past = run(first.state, ...keys("j"));
  expect(ws(past.state)?.row).toBe(200);
  expect(asks(past)).toEqual([
    expect.objectContaining({ kind: "sqlitePage", offset: 100 }),
  ]);
  const again = run(past.state, ...keys("j"));
  expect(asks(again)).toEqual([]);
  const answered = run(again.state, page(again.state, 100, ok(100, 300, true)));
  expect(ws(answered.state)?.page).toMatchObject({ offset: 100, status: "ok" });
  expect(ws(answered.state)?.want).toBeUndefined();
});

test("an answer to an ask that was replaced is dropped", () => {
  const s = opened();
  const moved = run(s, ...keys("j".repeat(250))).state;
  const stale = run(moved, page(moved, 0, ok(0, 200, true)));
  expect(ws(stale.state)?.want).toMatchObject({ offset: 150 });
  const otherGen = run(
    moved,
    page(moved, 150, ok(150, 350, true), undefined, 2),
  );
  expect(ws(otherGen.state)?.want).toMatchObject({ offset: 150 });
});

test("the last page keeps the focus on its last row", () => {
  const s = opened();
  const moved = run(s, ...keys("j".repeat(500))).state;
  const r = run(moved, page(moved, 400, ok(400, 470, false)));
  expect(ws(r.state)?.row).toBe(469);
});

test("G waits for the row count, then goes to the last row", () => {
  const s = opened();
  const early = run(s, ...keys("G"));
  expect(early.state.notifications.message?.text).toBe(
    "row count not known yet",
  );
  const counted = run(s, {
    type: "sqliteCount",
    path: PATH,
    gen: 1,
    table: "kv",
    result: { kind: "ok", count: 1000 },
  });
  const r = run(counted.state, ...keys("G"));
  expect(ws(r.state)?.row).toBe(999);
  expect(asks(r)).toEqual([expect.objectContaining({ offset: 850 })]);
  expect(ws(run(r.state, ...keys("gg")).state)?.row).toBe(0);
  const failed = run(s, {
    type: "sqliteCount",
    path: PATH,
    gen: 1,
    table: "kv",
    result: { kind: "failed", reason: "Query took longer than 10 s" },
  });
  expect(
    run(failed.state, ...keys("G")).state.notifications.message?.text,
  ).toBe("could not count the rows; R tries again");
});

test("a change on disk reads the schema again and then the rows", () => {
  const s = opened();
  const changed = run(s, loaded(2));
  expect(changed.effects).toContainEqual({
    kind: "sqliteSchema",
    path: PATH,
    stamp: stamp(2),
    gen: 2,
  });
  const late = run(changed.state, schema(1, 1));
  expect(activeBuffer(late.state)?.sqlite?.status).toBe("loading");
  const r = run(changed.state, schema(2, 2));
  expect(asks(r)).toEqual([
    expect.objectContaining({ kind: "sqlitePage", gen: 2, offset: 0 }),
    expect.objectContaining({ kind: "sqliteCount", gen: 2 }),
  ]);
  // The old rows stay drawn until the new ones come.
  expect(ws(r.state)?.page).toMatchObject({ gen: 1 });
});

test("R reads the same bytes again under a new read", () => {
  const s = opened();
  const r = run(s, ...keys("R"));
  expect(r.effects).toContainEqual({
    kind: "sqliteSchema",
    path: PATH,
    stamp: stamp(1),
    gen: 2,
  });
});

test(":Sql shows a query's rows; Esc goes back to the table", () => {
  const s = opened();
  const q = run(s, ...ex("Sql select * from users where id > 3"));
  const source = {
    kind: "query",
    sql: "select * from users where id > 3",
  } as const;
  expect(ws(q.state)).toMatchObject({ source, back: "kv", row: 0 });
  expect(asks(q)).toEqual([
    expect.objectContaining({ kind: "sqlitePage", source, offset: 0 }),
  ]);
  const shown = run(q.state, page(q.state, 0, ok(0, 3, false), source));
  expect(ws(shown.state)?.page).toMatchObject({ status: "ok", source });
  const back = run(shown.state, ...keys("<Esc>"));
  expect(ws(back.state)?.source).toEqual({ kind: "table", name: "kv" });
});

test(":Sql without a query says how to use it, and refuses two statements", () => {
  const s = opened();
  expect(run(s, ...ex("Sql")).state.notifications.message?.text).toBe(
    SQL_USAGE,
  );
  const two = run(s, ...ex("Sql select 1; delete from kv"));
  expect(two.state.notifications.message).toEqual({
    text: "Run one statement at a time",
    level: "error",
  });
  expect(ws(two.state)?.source).toEqual({ kind: "table", name: "kv" });
});

test("a failed query is kept and not asked again", () => {
  const s = opened();
  const q = run(s, ...ex("Sql select nope")).state;
  const source = { kind: "query", sql: "select nope" } as const;
  const failed = run(
    q,
    page(q, 0, { kind: "failed", reason: "no such column: nope" }, source),
  );
  expect(ws(failed.state)?.page).toMatchObject({ status: "failed" });
  expect(asks(run(failed.state, ...keys("j")))).toEqual([]);
});

test("Enter shows the focused value whole; q goes back; y copies it", () => {
  const s = opened();
  const cell = run(s, ...keys("l<CR>"));
  expect(ws(cell.state)?.pane).toBe("cell");
  expect(ws(run(cell.state, ...keys("q")).state)?.pane).toBe("rows");
  const copied = run(s, ...keys("jly"));
  expect(copied.effects).toContainEqual({
    kind: "clipboardWrite",
    text: "u1@x.dev",
  });
});

test("Tab toggles the schema, which a query does not have", () => {
  const s = opened();
  const shown = run(s, ...keys("<Tab>"));
  expect(ws(shown.state)?.pane).toBe("schema");
  expect(ws(run(shown.state, ...keys("<Tab>")).state)?.pane).toBe("rows");
  const q = run(s, ...ex("Sql select 1"), ...keys("<Tab>"));
  expect(q.state.notifications.message?.text).toBe("a query has no schema");
});

test("t lists the tables and views; picking one shows it from its first row", () => {
  const s = run(opened(), ...keys("j".repeat(5))).state;
  const picker = run(s, ...keys("t"));
  expect(picker.state.overlay.kind).toBe("picker");
  const labels =
    picker.state.overlay.kind === "picker"
      ? picker.state.overlay.picker.items.map((i) => i.label)
      : [];
  expect(labels).toEqual(["kv", "users", "v"]);
  const chosen = run(picker.state, ...keys("<Down><CR>"));
  expect(ws(chosen.state)).toMatchObject({
    source: { kind: "table", name: "users" },
    row: 0,
    pane: "rows",
  });
});

test("> and < resize the focused column by name; = returns it", () => {
  const s = opened();
  const wider = run(s, ...keys("l>"));
  const w = ws(wider.state)?.widths?.email;
  expect(w).toBeGreaterThan(3);
  expect(ws(run(wider.state, ...keys("<lt>")).state)?.widths?.email).toBe(
    (w ?? 0) - 4,
  );
  expect(ws(run(wider.state, ...keys("=")).state)?.widths).toBeUndefined();
});

test("h and l stay within the columns", () => {
  const s = opened();
  expect(ws(run(s, ...keys("h")).state)?.column).toBe(0);
  expect(ws(run(s, ...keys("lll")).state)?.column).toBe(1);
});

test("a wheel notch moves the focus three rows; a click focuses a cell", () => {
  const s = opened();
  const at = (spot: WindowSpot): MouseTarget => ({
    kind: "window",
    window: s.windows.active,
    spot,
  });
  const down = run(s, {
    type: "mouse",
    event: { kind: "wheel", target: at({ kind: "sqlite" }), dx: 0, dy: 1 },
    now: 0,
  });
  expect(ws(down.state)?.row).toBe(3);
  const click = run(s, {
    type: "mouse",
    event: {
      kind: "press",
      target: at({ kind: "sqliteCell", row: 7, column: 1 }),
      clicks: 1,
      ctrl: false,
    },
    now: 0,
  });
  expect(ws(click.state)).toMatchObject({ row: 7, column: 1 });
});
