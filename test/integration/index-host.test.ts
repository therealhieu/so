import { afterEach, expect, test } from "bun:test";
import { appendFile, readFile, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { backlinksOf } from "../../src/core/features/links/note-index";
import { statusSegments } from "../../src/core/state/status";
import { type App, startApp, tmpWorkspace, waitFor } from "./helpers";

let app: App | undefined;
afterEach(async () => {
  app?.stop();
  if (app) await rm(app.root, { recursive: true, force: true });
  app = undefined;
});

/** A spawn wrapper that keeps every worker it starts, so a test can kill one. */
function spawner() {
  const workers: Worker[] = [];
  return {
    workers,
    spawn: () => {
      const w = new Worker(
        new URL("../../src/workspace/index-worker.ts", import.meta.url),
      );
      workers.push(w);
      return w;
    },
  };
}

const state = () => {
  if (app === undefined) throw new Error("no app");
  return app.store.get();
};
const status = () => state().index.status;
const sources = (path: string) =>
  backlinksOf(state().index.ix, path).map((b) => b.from);

test("one crash rescans to ready", async () => {
  const s = spawner();
  app = await startApp(
    await tmpWorkspace({ "a.md": "# A\n", "b.md": "[[a]]\n" }),
    { index: s },
  );
  await waitFor(() => status() === "ready");
  expect(sources("a.md")).toEqual(["b.md"]);
  const mark = app.actions.length;
  s.workers[0]?.terminate();
  await waitFor(
    () =>
      app?.actions.slice(mark).some((a) => a.type === "indexReady") === true,
  );
  expect(status()).toBe("ready");
  expect(s.workers.length).toBe(2);
  expect(
    app.actions.slice(mark).filter((a) => a.type === "indexFailed"),
  ).toEqual([{ type: "indexFailed", final: false, reason: "worker exited" }]);
  expect(sources("a.md")).toEqual(["b.md"]);
});

test("a second crash marks the index unavailable while editing works", async () => {
  const s = spawner();
  app = await startApp(await tmpWorkspace({ "a.md": "alpha\n" }), {
    index: s,
  });
  await waitFor(() => status() === "ready");
  s.workers[0]?.terminate();
  await waitFor(() => s.workers.length === 2 && status() === "ready");
  s.workers[1]?.terminate();
  await waitFor(() => status() === "unavailable");
  await Bun.sleep(200);
  expect(s.workers.length).toBe(2);
  expect(statusSegments(app.store.get()).index).toBe("unavailable");

  await app.open("a.md");
  app.keys("xi1<Esc>:w<CR>");
  await waitFor(() => app?.buffer("a.md")?.dirty === false);
  expect(await readFile(join(app.root, "a.md"), "utf8")).toBe("1lpha\n");
});

test("external edits and own saves reach backlinks", async () => {
  app = await startApp(
    await tmpWorkspace({ "a.md": "# A\n", "b.md": "bee\n", "c.md": "sea\n" }),
    { index: {} },
  );
  await waitFor(() => status() === "ready");
  expect(sources("a.md")).toEqual([]);

  await appendFile(join(app.root, "b.md"), "[[a]]\n");
  await waitFor(() => sources("a.md").includes("b.md"));

  await app.open("c.md");
  app.keys("A [[a]]<Esc>:w<CR>");
  await waitFor(() => sources("a.md").includes("c.md"));
  expect(sources("a.md")).toEqual(["b.md", "c.md"]);
});

test("grep through the picker reaches the worker and lists its hits", async () => {
  app = await startApp(
    await tmpWorkspace({
      "a.md": "# A\nthe needle here\n",
      "scripts/sync.ts": "const needle = 1;\n",
    }),
    { index: {} },
  );
  await waitFor(() => status() === "ready");
  await app.open("a.md");
  app.keys(" sgneedle");
  await waitFor(() => {
    const o = state().overlay;
    return o.kind === "picker" && o.picker.search?.pending === false;
  });
  const o = state().overlay;
  expect(o.kind === "picker" ? o.picker.items.map((i) => i.label) : []).toEqual(
    ["a.md:2  the needle here", "scripts/sync.ts:1  const needle = 1;"],
  );
});

test("a search in flight when the worker crashes is answered once", async () => {
  const s = spawner();
  const real = s.spawn;
  // The first worker never answers a search, so one is still in flight at the crash.
  s.spawn = () => {
    const w = real();
    if (s.workers.length === 1) {
      const post = w.postMessage.bind(w);
      w.postMessage = (m: { t: string }) => {
        if (m.t !== "search") post(m);
      };
    }
    return w;
  };
  app = await startApp(await tmpWorkspace({ "a.md": "the needle here\n" }), {
    index: s,
  });
  await waitFor(() => status() === "ready");
  await app.open("a.md");
  app.keys(" sgneedle");
  const posted = () =>
    app?.effects.find(
      (e): e is Extract<typeof e, { kind: "search" }> =>
        e.kind === "search" && e.query === "needle",
    );
  await waitFor(() => posted() !== undefined);
  const id = posted()?.id ?? -1;
  const o = state().overlay;
  expect(o.kind === "picker" && o.picker.search).toEqual({
    id,
    pending: true,
    capped: false,
  });

  s.workers[0]?.terminate();
  await waitFor(() => s.workers.length === 2 && status() === "ready");
  await Bun.sleep(100);
  const answers = app.actions.filter(
    (a) => a.type === "searchResults" && a.id === id,
  );
  expect(answers).toEqual([
    { type: "searchResults", id, hits: [], capped: false },
  ]);
  const after = state().overlay;
  expect(after.kind === "picker" && after.picker.search?.pending).toBe(false);
});

test("a file created in the explorer gets its size and times in the index", async () => {
  app = await startApp(await tmpWorkspace({ "a.md": "# A\n" }), {
    index: {},
  });
  await waitFor(() => status() === "ready");
  app.runner.run({ kind: "create", op: { kind: "create", from: "data.csv" } });
  await waitFor(() => (state().index.ix.facts.get("data.csv")?.mtime ?? 0) > 0);
  const st = await stat(join(app.root, "data.csv"));
  expect(state().index.ix.facts.get("data.csv")).toEqual({
    path: "data.csv",
    size: st.size,
    mtime: st.mtimeMs,
    ctime: st.birthtimeMs > 0 ? st.birthtimeMs : st.mtimeMs,
  });
  expect(
    app.actions.some(
      (a) =>
        a.type === "indexBatch" &&
        a.facts?.some((f) => f.path === "data.csv") === true,
    ),
  ).toBe(true);
});

test("dot entries join the index and search while shown, and leave once hidden", async () => {
  app = await startApp(
    await tmpWorkspace({
      "a.md": "# A\n",
      ".notes/todo.md": "the dot needle\n",
      ".obsidian/plugins/p/main.js": "const needle = 1;\n",
      ".trash/old.md": "a deleted needle\n",
    }),
    { index: {} },
  );
  await waitFor(() => status() === "ready");
  const files = () => state().index.ix.files;
  expect(files().has(".notes/todo.md")).toBe(false);

  app.keys("H");
  await waitFor(() => files().has(".notes/todo.md"));
  await waitFor(() => status() === "ready");
  await appendFile(join(app.root, ".notes/later.md"), "later\n");
  await appendFile(join(app.root, ".trash/gone.md"), "needle\n");
  await waitFor(() => files().has(".notes/later.md"));
  // Names in `[index] exclude` stay out even while dot entries are shown.
  expect(
    [...files()].filter(
      (f) => f.startsWith(".obsidian/") || f.startsWith(".trash/"),
    ),
  ).toEqual([]);

  app.keys(" sgneedle");
  await waitFor(() => {
    const o = state().overlay;
    return o.kind === "picker" && o.picker.search?.pending === false;
  });
  const o = state().overlay;
  expect(o.kind === "picker" ? o.picker.items.map((i) => i.label) : []).toEqual(
    [".notes/todo.md:1  the dot needle"],
  );
  app.keys("<Esc>");
  await waitFor(() => state().overlay.kind === "none");

  app.keys("H");
  await waitFor(
    () =>
      !files().has(".notes/todo.md") &&
      !files().has(".notes/later.md") &&
      status() === "ready",
  );
});
