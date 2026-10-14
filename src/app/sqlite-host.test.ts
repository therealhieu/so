import { Database } from "bun:sqlite";
import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { SqlitePageResult } from "../core/features/sqlite/types";
import type {
  FromSqliteWorker,
  ToSqliteWorker,
} from "../workspace/sqlite-worker";
import { createSqliteHost, SUPERSEDED } from "./sqlite-host";

const root = mkdtempSync(join(tmpdir(), "so-sqlite-host-"));
afterAll(() => rmSync(root, { recursive: true, force: true }));
writeFileSync(join(root, "a.db"), "");
const logger = { info() {}, error() {} };

/** A stand-in worker: requests are kept, and the test answers or fails them. */
function fakeWorker() {
  const sent: ToSqliteWorker[] = [];
  const listeners: Record<string, ((e: { message?: string }) => void)[]> = {};
  let terminated = false;
  const w = {
    onmessage: undefined as
      | ((e: MessageEvent<FromSqliteWorker>) => void)
      | undefined,
    postMessage: (m: ToSqliteWorker) => sent.push(m),
    addEventListener: (k: string, f: (e: { message?: string }) => void) => {
      listeners[k] = [...(listeners[k] ?? []), f];
    },
    terminate: () => {
      terminated = true;
    },
  };
  return {
    worker: w as unknown as Worker,
    sent,
    terminated: () => terminated,
    reply(id: number, result: FromSqliteWorker["result"]) {
      w.onmessage?.({ data: { id, result } } as MessageEvent<FromSqliteWorker>);
    },
    fail(message: string) {
      for (const f of listeners.error ?? []) f({ message });
    },
  };
}

const tick = () => new Promise((r) => setTimeout(r, 5));

test("requests run one at a time, in order", async () => {
  const f = fakeWorker();
  const host = createSqliteHost({ root, logger, spawn: () => f.worker });
  const a = host.schema("a.db");
  const b = host.count("a.db", "t");
  await tick();
  expect(f.sent.map((m) => m.t)).toEqual(["schema"]);
  f.reply(f.sent[0]?.id ?? 0, { kind: "ok", tables: [] });
  expect(await a).toEqual({ kind: "ok", tables: [] });
  await tick();
  expect(f.sent.map((m) => m.t)).toEqual(["schema", "count"]);
  expect(f.sent[1]).toMatchObject({
    table: "t",
    path: join(realpathSync(root), "a.db"),
  });
  f.reply(f.sent[1]?.id ?? 0, { kind: "ok", count: 3 });
  expect(await b).toEqual({ kind: "ok", count: 3 });
  host.stop();
});

test("a waiting page is replaced by the next page for the same window", async () => {
  const f = fakeWorker();
  const host = createSqliteHost({ root, logger, spawn: () => f.worker });
  const first = host.schema("a.db");
  const t = { kind: "table", name: "t" } as const;
  const old = host.page("a.db", t, 0, "1");
  const other = host.page("a.db", t, 0, "2");
  const next = host.page("a.db", t, 200, "1");
  expect(await old).toEqual({ kind: "failed", reason: SUPERSEDED });
  await tick();
  f.reply(f.sent[0]?.id ?? 0, { kind: "ok", tables: [] });
  await first;
  await tick();
  const page: SqlitePageResult = {
    kind: "ok",
    columns: [],
    rows: [],
    more: false,
  };
  f.reply(f.sent[1]?.id ?? 0, page);
  await other;
  await tick();
  expect(f.sent.map((m) => (m.t === "page" ? m.offset : m.t))).toEqual([
    "schema",
    0,
    200,
  ]);
  f.reply(f.sent[2]?.id ?? 0, page);
  expect(await next).toEqual(page);
  host.stop();
});

test("a request past the timeout stops the worker; the next one starts a new worker", async () => {
  const workers = [fakeWorker(), fakeWorker()];
  let spawned = 0;
  const host = createSqliteHost({
    root,
    logger,
    timeoutMs: 20,
    spawn: () => {
      const w = workers[spawned++];
      if (w === undefined) throw new Error("too many workers");
      return w.worker;
    },
  });
  expect(await host.count("a.db", "huge")).toEqual({
    kind: "failed",
    reason: "Query took longer than 0.02 s",
  });
  expect(workers[0]?.terminated()).toBe(true);
  const again = host.schema("a.db");
  await tick();
  const w1 = workers[1];
  w1?.reply(w1.sent[0]?.id ?? 0, { kind: "ok", tables: [] });
  expect(await again).toEqual({ kind: "ok", tables: [] });
  expect(spawned).toBe(2);
  host.stop();
});

test("a worker crash fails the running request and the next starts over", async () => {
  const workers = [fakeWorker(), fakeWorker()];
  let spawned = 0;
  const host = createSqliteHost({
    root,
    logger,
    spawn: () => workers[spawned++]?.worker as Worker,
  });
  const a = host.schema("a.db");
  const b = host.schema("a.db");
  await tick();
  workers[0]?.fail("boom");
  expect(await a).toEqual({
    kind: "failed",
    reason: "SQLite worker failed: boom",
  });
  await tick();
  const w1 = workers[1];
  w1?.reply(w1.sent[0]?.id ?? 0, { kind: "ok", tables: [] });
  expect(await b).toEqual({ kind: "ok", tables: [] });
  host.stop();
});

test("a path outside the workspace never reaches the worker", async () => {
  const f = fakeWorker();
  const host = createSqliteHost({ root, logger, spawn: () => f.worker });
  const r = await host.schema("../outside.db");
  expect(r.kind).toBe("failed");
  expect(f.sent).toEqual([]);
  host.stop();
});

test("stopping answers every request still waiting", async () => {
  const f = fakeWorker();
  const host = createSqliteHost({ root, logger, spawn: () => f.worker });
  const a = host.schema("a.db");
  const b = host.count("a.db", "t");
  await tick();
  host.stop();
  expect(await a).toEqual({ kind: "failed", reason: "stopped" });
  expect(await b).toEqual({ kind: "failed", reason: "stopped" });
  expect(f.terminated()).toBe(true);
});

test("the real worker reads a database", async () => {
  const d = new Database(join(root, "real.db"));
  d.run("CREATE TABLE t (x); INSERT INTO t VALUES (1), (2)");
  d.close();
  const host = createSqliteHost({ root, logger });
  const schema = await host.schema("real.db");
  expect(schema.kind === "ok" && schema.tables.map((t) => t.name)).toEqual([
    "t",
  ]);
  expect(await host.count("real.db", "t")).toEqual({ kind: "ok", count: 2 });
  const page = await host.page("real.db", { kind: "table", name: "t" }, 1, "1");
  expect(page).toEqual({
    kind: "ok",
    columns: ["x"],
    rows: [[{ t: "int", text: "2" }]],
    more: false,
  });
  host.stop();
});
