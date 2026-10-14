import type {
  SqliteCheckResult,
  SqliteCountResult,
  SqlitePageResult,
  SqliteSchemaResult,
  SqliteSource,
} from "../core/features/sqlite/types";
import { checkStatement, countRows, readPage, readSchema } from "./sqlite";

/** Requests to the SQLite worker; `path` is a real, absolute path. */
export type ToSqliteWorker =
  | { id: number; t: "schema"; path: string }
  | {
      id: number;
      t: "page";
      path: string;
      source: SqliteSource;
      offset: number;
    }
  | { id: number; t: "count"; path: string; table: string }
  | { id: number; t: "check"; path: string; sql: string };

/** The answer to request `id`. */
export type FromSqliteWorker = {
  id: number;
  result:
    | SqliteSchemaResult
    | SqlitePageResult
    | SqliteCountResult
    | SqliteCheckResult;
};

declare const self: Worker;

function answer(m: ToSqliteWorker): FromSqliteWorker["result"] {
  switch (m.t) {
    case "schema":
      return readSchema(m.path);
    case "page":
      return readPage(m.path, m.source, m.offset);
    case "count":
      return countRows(m.path, m.table);
    case "check":
      return checkStatement(m.path, m.sql);
  }
}

self.onmessage = (e: MessageEvent<ToSqliteWorker>) => {
  const m = e.data;
  const reply: FromSqliteWorker = { id: m.id, result: answer(m) };
  self.postMessage(reply);
};
