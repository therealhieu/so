import { Database } from "bun:sqlite";
import { closeSync, existsSync, openSync, readSync, statSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  oneStatement,
  pageable,
  quoteIdent,
} from "../core/features/sqlite/statement";
import {
  BLOB_HEX_MAX,
  CELL_TEXT_MAX,
  PAGE_ROWS,
  type SqliteCell,
  type SqliteColumn,
  type SqliteCountResult,
  type SqliteIndex,
  type SqlitePageResult,
  type SqliteSchemaResult,
  type SqliteSource,
  type SqliteTable,
} from "../core/features/sqlite/types";

/**
 * Reads SQLite databases for the viewer. Every call opens its own read-only
 * connection with `query_only` on and closes it, so nothing is ever written
 * and each answer sees the file as it is now, WAL commits included. The
 * calls are synchronous: they run in the SQLite worker, never on the main
 * thread.
 */

const HEADER = "SQLite format 3\0";

/** Whether the file starts with SQLite's header; an empty file is an empty database. */
function isSqliteFile(path: string): boolean {
  if (statSync(path).size === 0) return true;
  const fd = openSync(path, "r");
  try {
    const head = Buffer.alloc(HEADER.length);
    const n = readSync(fd, head, 0, head.length, 0);
    return n === head.length && head.toString("latin1") === HEADER;
  } finally {
    closeSync(fd);
  }
}

function openRun<T>(name: string, f: (db: Database) => T): T {
  const db = new Database(name, { readonly: true, safeIntegers: true });
  try {
    db.run("PRAGMA query_only = ON");
    return f(db);
  } finally {
    db.close();
  }
}

/**
 * Run `f` on a read-only connection to `path`. A WAL database whose `-wal`
 * and `-shm` files are gone cannot be opened read-only, as SQLite would have
 * to create them; with no `-wal` file the main file holds every commit, so it
 * is opened immutable instead, which creates nothing.
 */
function withDb<T>(path: string, f: (db: Database) => T): T {
  try {
    return openRun(path, f);
  } catch (e) {
    if ((e as { code?: string }).code !== "SQLITE_CANTOPEN") throw e;
    if (existsSync(`${path}-wal`)) throw e;
    return openRun(`${pathToFileURL(path).href}?immutable=1`, f);
  }
}

const reasonOf = (e: unknown) => (e instanceof Error ? e.message : String(e));

const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

/** A value as the viewer keeps it (see `SqliteCell`). */
export function encodeCell(v: unknown): SqliteCell {
  if (v === null || v === undefined) return { t: "null" };
  if (typeof v === "bigint") return { t: "int", text: v.toString() };
  if (typeof v === "number")
    return Number.isInteger(v)
      ? { t: "int", text: String(v) }
      : { t: "real", text: String(v) };
  if (v instanceof Uint8Array)
    return {
      t: "blob",
      size: v.byteLength,
      hex: hex(v.subarray(0, BLOB_HEX_MAX)),
    };
  const text = String(v);
  return { t: "text", text: text.slice(0, CELL_TEXT_MAX), size: text.length };
}

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

function columnsOf(db: Database, name: string): SqliteColumn[] {
  const rows = db
    .query(
      'SELECT name, type, "notnull", dflt_value, pk, hidden FROM pragma_table_xinfo(?)',
    )
    .values(name);
  const out: SqliteColumn[] = [];
  for (const [col, type, notNull, dflt, pk, hidden] of rows) {
    const h = Number(hidden);
    // 1: a virtual table's hidden column; 2 and 3: generated columns.
    if (h === 1) continue;
    out.push({
      name: str(col),
      type: str(type),
      notNull: Number(notNull) === 1,
      default: dflt === null ? null : str(dflt),
      pk: Number(pk),
      ...(h === 2 ? { generated: "virtual" as const } : {}),
      ...(h === 3 ? { generated: "stored" as const } : {}),
    });
  }
  return out;
}

function indexesOf(db: Database, name: string): SqliteIndex[] {
  const list = db
    .query('SELECT name, "unique" FROM pragma_index_list(?)')
    .values(name);
  return list.map(([index, unique]) => ({
    name: str(index),
    unique: Number(unique) === 1,
    columns: db
      .query("SELECT name FROM pragma_index_info(?) ORDER BY seqno")
      .values(str(index))
      .map(([c]) => (c === null ? "(expression)" : str(c))),
  }));
}

/** The tables, then the views, each by name; SQLite's own `sqlite_%` tables are left out. */
export function readSchema(path: string): SqliteSchemaResult {
  try {
    if (!isSqliteFile(path)) return { kind: "notSqlite" };
    return withDb(path, (db) => {
      const rows = db
        .query(
          "SELECT type, name, sql FROM sqlite_schema WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite\\_%' ESCAPE '\\' ORDER BY type, name",
        )
        .values();
      const tables: SqliteTable[] = rows.map(([type, name, sql]) => ({
        name: str(name),
        kind: type === "view" ? "view" : "table",
        sql: str(sql),
        columns: columnsOf(db, str(name)),
        indexes: type === "view" ? [] : indexesOf(db, str(name)),
      }));
      return { kind: "ok", tables };
    });
  } catch (e) {
    return { kind: "failed", reason: reasonOf(e) };
  }
}

/**
 * Up to `PAGE_ROWS` rows of `source` from `offset`. A table is read with
 * `LIMIT`/`OFFSET`; a query that returns rows is wrapped the same way; any
 * other statement (`PRAGMA`, `EXPLAIN`) runs whole and is cut.
 */
export function readPage(
  path: string,
  source: SqliteSource,
  offset: number,
): SqlitePageResult {
  try {
    return withDb(path, (db) => {
      let sql: string;
      let paged = true;
      if (source.kind === "table")
        sql = `SELECT * FROM ${quoteIdent(source.name)}`;
      else {
        const one = oneStatement(source.sql);
        if ("error" in one) return { kind: "failed", reason: one.error };
        sql = one.sql;
        paged = pageable(sql);
      }
      // The newline ends a trailing `--` comment before the wrap closes.
      const st = paged
        ? db.prepare(`SELECT * FROM (${sql}\n) LIMIT ? OFFSET ?`)
        : db.prepare(sql);
      try {
        const all = paged
          ? st.values(PAGE_ROWS + 1, offset)
          : st.values().slice(offset, offset + PAGE_ROWS + 1);
        return {
          kind: "ok",
          columns: [...st.columnNames],
          rows: all.slice(0, PAGE_ROWS).map((r) => r.map(encodeCell)),
          more: all.length > PAGE_ROWS,
        };
      } finally {
        st.finalize();
      }
    });
  } catch (e) {
    return { kind: "failed", reason: reasonOf(e) };
  }
}

/** How many rows the table or view `table` has. */
export function countRows(path: string, table: string): SqliteCountResult {
  try {
    return withDb(path, (db) => {
      const [row] = db
        .query(`SELECT count(*) FROM ${quoteIdent(table)}`)
        .values();
      return { kind: "ok", count: Number(row?.[0] ?? 0) };
    });
  } catch (e) {
    return { kind: "failed", reason: reasonOf(e) };
  }
}
