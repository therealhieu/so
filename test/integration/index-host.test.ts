import { afterEach, expect, test } from "bun:test";
import { appendFile, readFile, rm } from "node:fs/promises";
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
