import type {
  SqliteCheckResult,
  SqliteCountResult,
  SqlitePageResult,
  SqliteSchemaResult,
  SqliteSource,
} from "../core/features/sqlite/types";
import { containedFile } from "../workspace/images";
import type { Logger } from "../workspace/log";
import type {
  FromSqliteWorker,
  ToSqliteWorker,
} from "../workspace/sqlite-worker";
import { workerUrl } from "./index-host";

/**
 * Reads workspace SQLite files in a worker, one request at a time, so a slow
 * query never holds up the main thread. Paths are workspace-relative and
 * must stay inside the workspace.
 */
export type SqliteHost = {
  schema(rel: string): Promise<SqliteSchemaResult>;
  /**
   * Rows of `source` from `offset`. A page asked for the same `slot` (a
   * window) replaces one still waiting, which answers `superseded`.
   */
  page(
    rel: string,
    source: SqliteSource,
    offset: number,
    slot: string,
  ): Promise<SqlitePageResult>;
  count(rel: string, table: string): Promise<SqliteCountResult>;
  /** Whether `sql` would run; a check still waiting is replaced, answering `superseded`. */
  check(rel: string, sql: string): Promise<SqliteCheckResult>;
  stop(): void;
};

/** How long one request may run before the worker is stopped and replaced. */
export const SQLITE_TIMEOUT_MS = 10_000;

export const SUPERSEDED = "superseded";

type Result = FromSqliteWorker["result"];
type Request = DistributiveOmit<ToSqliteWorker, "id" | "path">;
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

type Job = {
  rel: string;
  req: Request;
  slot?: string;
  done: (r: Result) => void;
};

const spawnWorker = () =>
  new Worker(workerUrl(import.meta.url, "sqlite-worker.ts"));

export function createSqliteHost(d: {
  root: string;
  logger: Logger;
  spawn?: () => Worker;
  timeoutMs?: number;
}): SqliteHost {
  const spawn = d.spawn ?? spawnWorker;
  const timeoutMs = d.timeoutMs ?? SQLITE_TIMEOUT_MS;
  const queue: Job[] = [];
  let running: { id: number; job: Job; timer: Timer } | undefined;
  let worker: Worker | undefined;
  let nextId = 1;
  let stopped = false;

  const failed = (reason: string) => ({ kind: "failed", reason }) as const;

  /** The running job ends with `r`, and the next one starts. */
  function finish(r: Result): void {
    const run = running;
    if (run === undefined) return;
    running = undefined;
    clearTimeout(run.timer);
    run.job.done(r);
    pump();
  }

  /** The worker is gone: the running job fails with `reason`; the next job starts a new one. */
  function lost(w: Worker, reason: string): void {
    if (worker !== w) return;
    worker = undefined;
    w.terminate();
    d.logger.error("sqlite.workerStopped", { reason });
    finish(failed(reason));
  }

  function ensureWorker(): Worker {
    if (worker !== undefined) return worker;
    const w = spawn();
    worker = w;
    w.onmessage = (e: MessageEvent<FromSqliteWorker>) => {
      if (worker === w && running?.id === e.data.id) finish(e.data.result);
    };
    w.addEventListener("error", (e) =>
      lost(w, `SQLite worker failed: ${e.message || "error"}`),
    );
    w.addEventListener("close", () => lost(w, "SQLite worker exited"));
    return w;
  }

  function pump(): void {
    if (stopped || running !== undefined) return;
    const job = queue.shift();
    if (job === undefined) return;
    const id = nextId++;
    const timer = setTimeout(() => {
      if (running?.id !== id || worker === undefined) return;
      const w = worker;
      worker = undefined;
      w.terminate();
      d.logger.error("sqlite.timeout", { path: job.rel, ms: timeoutMs });
      finish(failed(`Query took longer than ${timeoutMs / 1000} s`));
    }, timeoutMs);
    running = { id, job, timer };
    containedFile(d.root, job.rel).then(
      ({ path }) => {
        if (running?.id !== id) return;
        const msg = { ...job.req, id, path } as ToSqliteWorker;
        ensureWorker().postMessage(msg);
      },
      (e: unknown) => {
        if (running?.id === id)
          finish(failed(e instanceof Error ? e.message : String(e)));
      },
    );
  }

  function enqueue<R extends Result>(
    rel: string,
    req: Request,
    slot?: string,
  ): Promise<R> {
    if (stopped) return Promise.resolve(failed("stopped") as R);
    return new Promise<R>((resolve) => {
      if (slot !== undefined) {
        const i = queue.findIndex((j) => j.slot === slot);
        if (i >= 0) queue.splice(i, 1)[0]?.done(failed(SUPERSEDED));
      }
      queue.push({
        rel,
        req,
        ...(slot === undefined ? {} : { slot }),
        done: (r) => resolve(r as R),
      });
      pump();
    });
  }

  return {
    schema: (rel) => enqueue(rel, { t: "schema" }),
    page: (rel, source, offset, slot) =>
      enqueue(rel, { t: "page", source, offset }, slot),
    count: (rel, table) => enqueue(rel, { t: "count", table }),
    check: (rel, sql) => enqueue(rel, { t: "check", sql }, "check"),
    stop() {
      stopped = true;
      worker?.terminate();
      worker = undefined;
      if (running !== undefined) clearTimeout(running.timer);
      running?.job.done(failed("stopped"));
      running = undefined;
      for (const j of queue.splice(0)) j.done(failed("stopped"));
    },
  };
}
