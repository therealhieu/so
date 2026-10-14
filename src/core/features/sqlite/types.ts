/**
 * One value read from a SQLite database, made safe to post and to keep:
 * integers as exact decimal text, text cut to `CELL_TEXT_MAX` characters
 * (`size` is the whole length), a BLOB as its size and the hex of its first
 * `BLOB_HEX_MAX` bytes.
 */
export type SqliteCell =
  | { t: "null" }
  | { t: "int" | "real"; text: string }
  | { t: "text"; text: string; size: number }
  | { t: "blob"; size: number; hex: string };

/** The most characters of a text value read. */
export const CELL_TEXT_MAX = 16 * 1024;
/** The most bytes of a BLOB shown as hex. */
export const BLOB_HEX_MAX = 4 * 1024;

/** A column as `pragma_table_xinfo` describes it. */
export type SqliteColumn = {
  name: string;
  type: string;
  notNull: boolean;
  default: string | null;
  /** Its place in the primary key, from 1; 0 when it is not part of it. */
  pk: number;
  /** Generated: `virtual` or `stored`. */
  generated?: "virtual" | "stored";
};

export type SqliteIndex = {
  name: string;
  unique: boolean;
  columns: string[];
};

/** A table or view of the database. */
export type SqliteTable = {
  name: string;
  kind: "table" | "view";
  /** The `CREATE` statement SQLite keeps for it. */
  sql: string;
  columns: SqliteColumn[];
  indexes: SqliteIndex[];
};

/** What reading a database's schema answered. */
export type SqliteSchemaResult =
  | { kind: "ok"; tables: SqliteTable[] }
  | { kind: "notSqlite" }
  | { kind: "failed"; reason: string };

/** What a window shows rows of: a table or view by name, or a query. */
export type SqliteSource =
  | { kind: "table"; name: string }
  | { kind: "query"; sql: string };

/** What reading rows from `offset` answered; `more` when rows follow them. */
export type SqlitePageResult =
  | { kind: "ok"; columns: string[]; rows: SqliteCell[][]; more: boolean }
  | { kind: "failed"; reason: string };

/** Whether a query compiles into one statement that returns rows, and its columns. */
export type SqliteCheckResult =
  | { kind: "ok"; columns: string[] }
  | { kind: "failed"; reason: string };

export type SqliteCountResult =
  | { kind: "ok"; count: number }
  | { kind: "failed"; reason: string };

/** The rows a page holds; one more is read to know whether rows follow. */
export const PAGE_ROWS = 200;

export const sameSource = (
  a: SqliteSource | undefined,
  b: SqliteSource | undefined,
): boolean =>
  a !== undefined &&
  b !== undefined &&
  (a.kind === "table"
    ? b.kind === "table" && a.name === b.name
    : b.kind === "query" && a.sql === b.sql);
