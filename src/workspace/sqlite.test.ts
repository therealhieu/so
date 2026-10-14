import { Database } from "bun:sqlite";
import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CELL_TEXT_MAX, PAGE_ROWS } from "../core/features/sqlite/types";
import {
  checkStatement,
  countRows,
  encodeCell,
  readPage,
  readSchema,
} from "./sqlite";

const dir = mkdtempSync(join(tmpdir(), "so-sqlite-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

let n = 0;
/** A new database file made by `setup`, closed before the test reads it. */
function db(setup: (d: Database) => void): string {
  const path = join(dir, `t${n++}.db`);
  const d = new Database(path);
  setup(d);
  d.close();
  return path;
}

const users = db((d) => {
  d.run(
    "CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL DEFAULT '', big INTEGER, data BLOB, note TEXT)",
  );
  d.run("CREATE UNIQUE INDEX users_email ON users (email)");
  d.run("CREATE VIEW emails AS SELECT email FROM users");
  d.run('CREATE TABLE "a""b" (x)');
  d.run("CREATE TABLE kv (k TEXT PRIMARY KEY, v) WITHOUT ROWID");
  d.run(
    "INSERT INTO users (email, big, data, note) VALUES ('a@x.dev', 9223372036854775807, x'00ff10', NULL), ('b@x.dev', 1, NULL, '')",
  );
  d.run(`INSERT INTO "a""b" VALUES (1)`);
  d.run("INSERT INTO kv VALUES ('k', 'v')");
});

test("the schema lists tables, then views, by name, with columns and indexes", () => {
  const r = readSchema(users);
  if (r.kind !== "ok") throw new Error(r.kind);
  expect(r.tables.map((t) => [t.kind, t.name])).toEqual([
    ["table", 'a"b'],
    ["table", "kv"],
    ["table", "users"],
    ["view", "emails"],
  ]);
  const u = r.tables.find((t) => t.name === "users");
  expect(u?.columns[0]).toEqual({
    name: "id",
    type: "INTEGER",
    notNull: false,
    default: null,
    pk: 1,
  });
  expect(u?.columns[1]).toMatchObject({ notNull: true, default: "''" });
  expect(u?.indexes).toEqual([
    { name: "users_email", unique: true, columns: ["email"] },
  ]);
  expect(u?.sql).toStartWith("CREATE TABLE users");
});

test("a file without SQLite's header is not a database", () => {
  const path = join(dir, "Thumbs.db");
  writeFileSync(path, "not a database at all, just bytes");
  expect(readSchema(path)).toEqual({ kind: "notSqlite" });
});

test("an empty file is an empty database", () => {
  const path = join(dir, "empty.db");
  writeFileSync(path, "");
  expect(readSchema(path)).toEqual({ kind: "ok", tables: [] });
});

test("a missing file fails with its reason", () => {
  const r = readSchema(join(dir, "missing.db"));
  expect(r.kind).toBe("failed");
});

test("a table page keeps 64-bit integers exact and encodes every type", () => {
  const r = readPage(users, { kind: "table", name: "users" }, 0);
  if (r.kind !== "ok") throw new Error(r.reason);
  expect(r.columns).toEqual(["id", "email", "big", "data", "note"]);
  expect(r.more).toBe(false);
  expect(r.rows[0]).toEqual([
    { t: "int", text: "1" },
    { t: "text", text: "a@x.dev", size: 7 },
    { t: "int", text: "9223372036854775807" },
    { t: "blob", size: 3, hex: "00ff10" },
    { t: "null" },
  ]);
  expect(r.rows[1]?.[4]).toEqual({ t: "text", text: "", size: 0 });
});

test("quoted names, views, and WITHOUT ROWID tables read like tables", () => {
  for (const name of ['a"b', "emails", "kv"]) {
    const r = readPage(users, { kind: "table", name }, 0);
    expect(r.kind).toBe("ok");
  }
  expect(countRows(users, 'a"b')).toEqual({ kind: "ok", count: 1 });
  expect(countRows(users, "emails")).toEqual({ kind: "ok", count: 2 });
});

test("pages hold PAGE_ROWS rows and say whether more follow", () => {
  const path = db((d) => {
    d.run("CREATE TABLE n (i INTEGER)");
    d.run(
      `WITH RECURSIVE c(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM c WHERE i < ${PAGE_ROWS + 50}) INSERT INTO n SELECT i FROM c`,
    );
  });
  const first = readPage(path, { kind: "table", name: "n" }, 0);
  const last = readPage(path, { kind: "table", name: "n" }, PAGE_ROWS);
  if (first.kind !== "ok" || last.kind !== "ok") throw new Error("failed");
  expect(first.rows.length).toBe(PAGE_ROWS);
  expect(first.more).toBe(true);
  expect(last.rows.length).toBe(50);
  expect(last.more).toBe(false);
  expect(last.rows[0]).toEqual([{ t: "int", text: String(PAGE_ROWS + 1) }]);
  expect(countRows(path, "n")).toEqual({ kind: "ok", count: PAGE_ROWS + 50 });
});

test("queries keep duplicate column names apart", () => {
  const r = readPage(
    users,
    {
      kind: "query",
      sql: "SELECT u.id, v.id FROM users u JOIN users v ON u.id = v.id;",
    },
    0,
  );
  if (r.kind !== "ok") throw new Error(r.reason);
  expect(r.columns.length).toBe(2);
  expect(new Set(r.columns).size).toBe(2);
  expect(r.rows.length).toBe(2);
});

test("a check compiles the query without running it", () => {
  expect(checkStatement(users, "select id, email from users")).toEqual({
    kind: "ok",
    columns: ["id", "email"],
  });
  expect(checkStatement(users, "select emial from users")).toEqual({
    kind: "failed",
    reason: "no such column: emial",
  });
  expect(checkStatement(users, "select * from nope").kind).toBe("failed");
  expect(checkStatement(users, "selec 1")).toMatchObject({ kind: "failed" });
  expect(checkStatement(users, "delete from users")).toEqual({
    kind: "failed",
    reason: "Returns no rows: only reading statements run here",
  });
  expect(checkStatement(users, "select * from users where id = ?")).toEqual({
    kind: "failed",
    reason: "Parameters (?, :name) are not supported",
  });
  expect(checkStatement(users, "select 1; select 2")).toEqual({
    kind: "failed",
    reason: "Run one statement at a time",
  });
  expect(checkStatement(users, "pragma table_info(users)").kind).toBe("ok");
  const after = readPage(users, { kind: "table", name: "users" }, 0);
  expect(after.kind === "ok" && after.rows.length).toBe(2);
});

test("a query may end in a comment", () => {
  const r = readPage(
    users,
    { kind: "query", sql: "select id from users -- every id" },
    0,
  );
  expect(r.kind === "ok" && r.rows.length).toBe(2);
});

test("PRAGMA and EXPLAIN run whole and are cut to a page", () => {
  const p = readPage(
    users,
    { kind: "query", sql: "pragma table_info(users)" },
    0,
  );
  if (p.kind !== "ok") throw new Error(p.reason);
  expect(p.columns).toContain("name");
  expect(p.rows.length).toBe(5);
  const e = readPage(
    users,
    { kind: "query", sql: "explain query plan select * from users" },
    0,
  );
  expect(e.kind).toBe("ok");
});

test("queries never write", () => {
  for (const sql of [
    "DELETE FROM users",
    "DROP TABLE users",
    "INSERT INTO users (email) VALUES ('c')",
    "UPDATE users SET email = 'x'",
    "CREATE TABLE t (x)",
    "PRAGMA user_version = 7",
    `ATTACH '${join(dir, "created.db")}' AS x`,
    "VACUUM",
  ]) {
    const r = readPage(users, { kind: "query", sql }, 0);
    expect(r.kind, sql).toBe("failed");
  }
  const after = readPage(users, { kind: "table", name: "users" }, 0);
  expect(after.kind === "ok" && after.rows.length).toBe(2);
  expect(Bun.file(join(dir, "created.db")).size).toBe(0);
});

test("a second statement is refused before it runs", () => {
  expect(
    readPage(users, { kind: "query", sql: "select 1; delete from users" }, 0),
  ).toEqual({ kind: "failed", reason: "Run one statement at a time" });
});

test("a query error comes back as its reason", () => {
  const r = readPage(
    users,
    { kind: "query", sql: "select nope from users" },
    0,
  );
  expect(r).toEqual({ kind: "failed", reason: "no such column: nope" });
});

test("rows committed to the WAL by another connection are seen", () => {
  const path = db((d) => {
    d.run("PRAGMA journal_mode = WAL");
    d.run("CREATE TABLE t (x)");
  });
  const writer = new Database(path);
  writer.run("PRAGMA wal_autocheckpoint = 0");
  writer.run("INSERT INTO t VALUES (1), (2)");
  expect(countRows(path, "t")).toEqual({ kind: "ok", count: 2 });
  writer.close();
});

test("a WAL database without its -wal and -shm files opens and its bytes stay as they are", async () => {
  const path = join(dir, "wal only?#.db");
  const w = new Database(path);
  w.run("PRAGMA journal_mode = WAL");
  w.run("CREATE TABLE t (x); INSERT INTO t VALUES (1)");
  w.run("PRAGMA wal_checkpoint(TRUNCATE)");
  w.close(true);
  rmSync(`${path}-wal`, { force: true });
  rmSync(`${path}-shm`, { force: true });
  const before = await Bun.file(path).bytes();
  expect(readSchema(path).kind).toBe("ok");
  expect(countRows(path, "t")).toEqual({ kind: "ok", count: 1 });
  expect(await Bun.file(path).bytes()).toEqual(before);
});

test("long text is cut and keeps its whole length", () => {
  const c = encodeCell("x".repeat(CELL_TEXT_MAX + 10));
  expect(c).toEqual({
    t: "text",
    text: "x".repeat(CELL_TEXT_MAX),
    size: CELL_TEXT_MAX + 10,
  });
  expect(encodeCell(1.5)).toEqual({ t: "real", text: "1.5" });
  expect(encodeCell(new Uint8Array(5000))).toMatchObject({
    t: "blob",
    size: 5000,
  });
});
