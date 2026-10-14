import type { EditorKindSpec, FileType } from "../../filetypes/registry";
import type { SqliteCell, SqliteSource } from "./types";

/** Rows read for a window, for the database load `gen`. */
export type SqlitePage = {
  gen: number;
  source: SqliteSource;
  offset: number;
} & (
  | { status: "ok"; columns: string[]; rows: SqliteCell[][]; more: boolean }
  | { status: "failed"; reason: string }
);

/**
 * What one SQLite window remembers. `source` is the table or query shown,
 * unset until the schema is read (then `start`, the table the subpath named,
 * or the first table). `row` and `column` are the focused cell, `row`
 * counted from the first row of the source; `col` is how many columns after
 * the pinned first one are scrolled off. `page` is the rows last read and
 * `want` the read under way. `widths` are resized columns by name. `paneTop`
 * is the line the schema or cell pane is scrolled to; `bodyRows` the rows
 * the view last drew and `paneLines` the lines that pane holds.
 */
export type SqliteWindowState = {
  pane: "rows" | "schema" | "cell";
  source?: SqliteSource;
  /** The table a query was run from, shown again when the query is left. */
  back?: string;
  start?: string;
  row: number;
  column: number;
  col: number;
  widths?: Record<string, number>;
  page?: SqlitePage;
  want?: { gen: number; source: SqliteSource; offset: number };
  paneTop: number;
  bodyRows?: number;
  paneLines?: number;
};

export function isSqliteWindowState(v: unknown): v is SqliteWindowState {
  if (typeof v !== "object" || v === null) return false;
  const w = v as Partial<SqliteWindowState>;
  return (
    (w.pane === "rows" || w.pane === "schema" || w.pane === "cell") &&
    typeof w.row === "number" &&
    typeof w.column === "number" &&
    typeof w.col === "number"
  );
}

/** SQLite databases: read in a worker and shown by the sqlite editor kind, never as text. */
export const sqliteFileType: FileType = {
  id: "sqlite",
  match: { extensions: [".sqlite", ".sqlite3", ".db", ".db3"] },
  editor: "sqlite",
  readOnly: true,
  binary: true,
  views: [{ id: "sqlite", readOnly: true, decorations: [] }],
};

/** A SQLite window opens at the table its subpath names (`#users`), else the first table. */
export const sqliteEditorKind: EditorKindSpec<SqliteWindowState> = {
  id: "sqlite",
  open: (_path, _text, subpath) => {
    const start = subpath?.replace(/^#/, "").trim();
    return {
      pane: "rows",
      row: 0,
      column: 0,
      col: 0,
      paneTop: 0,
      ...(start ? { start } : {}),
    };
  },
};
