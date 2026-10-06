import { afterAll, expect, test } from "bun:test";
import { mkdtemp, readdir, realpath, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AppState } from "../../src/core/state/types";
import { statePath } from "../../src/workspace/state-file";
import { type App, startApp, tmpWorkspace, waitFor } from "./helpers";

const dirs: string[] = [];
afterAll(async () => {
  for (const d of dirs) await rm(d, { recursive: true, force: true });
});

const mkState = () => mkdtemp(join(tmpdir(), "so-it-state-"));

const sessionToasts = (s: AppState) =>
  s.notifications.toasts
    .map((t) => t.text)
    .filter((t) => t.includes("last session"));

const windows = (s: AppState) =>
  Object.values(s.windows.byId)
    .map((w) => ({
      id: w.id,
      path: s.buffers[w.content.bufferId]?.path,
      cursor: w.content.cursor,
    }))
    .sort((a, b) => a.id - b.id);

async function run(
  root: string,
  path: string,
  restore: boolean,
  body: (app: App) => Promise<void>,
  index?: Record<string, never>,
): Promise<AppState> {
  const app = await startApp(root, {
    state: { path, restore },
    ...(index === undefined ? {} : { index }),
  });
  try {
    await body(app);
    return app.store.get();
  } finally {
    app.stop();
  }
}

test("a folder start restores the last session and a file start does not", async () => {
  const root = await tmpWorkspace({
    "a.md": "# A\n\nSee [[b]].\nmore\n",
    "b.md": "# B\n\nb2 [[c]]\nb3\n",
    "c.md": "# C\n",
  });
  const state = await mkState();
  dirs.push(root, state);
  const path = statePath(
    { XDG_STATE_HOME: state },
    "/no-home",
    await realpath(root),
  );
  if (path === undefined) throw new Error("no state path");

  // Run 1: two files in splits, follow a link in the second, then shut down.
  await run(
    root,
    path,
    true,
    async (app) => {
      await waitFor(() => app.store.get().index.status === "ready");
      await app.open("a.md");
      app.keys("jjj:vs<CR>");
      await app.open("b.md");
      app.keys("Gkwgd");
      await waitFor(() => {
        const s = app.store.get();
        const w = s.windows.byId[s.windows.active];
        return (
          w !== undefined && s.buffers[w.content.bufferId]?.path === "c.md"
        );
      });
    },
    {},
  );
  expect((await stat(path)).mode & 0o777).toBe(0o600);
  expect((await readdir(root)).sort()).toEqual(["a.md", "b.md", "c.md"]);

  // Run 2 on the folder: both windows come back with their cursors.
  const restored = await run(root, path, true, async (app) => {
    await waitFor(() => app.store.get().windows.restore === undefined);
  });
  expect(windows(restored)).toEqual([
    { id: 1, path: "a.md", cursor: { line: 3, col: 0 } },
    { id: 2, path: "c.md", cursor: { line: 0, col: 0 } },
  ]);
  expect(restored.windows.active).toBe(2);
  expect(restored.recent).toEqual(["c.md", "b.md", "a.md"]);
  // The followed link's source, b.md:3 on "[[c]]", survives the round trip.
  expect(restored.jumps).toEqual({
    entries: [
      { path: "a.md", line: 3, col: 0 },
      { path: "b.md", line: 0, col: 0 },
      { path: "b.md", line: 2, col: 3 },
    ],
    at: 3,
  });
  expect(sessionToasts(restored)).toEqual([]);

  // Run 3 with a file argument: only that file, but recents and jumps load.
  const single = await run(root, path, false, async (app) => {
    await app.open("c.md");
  });
  expect(windows(single)).toEqual([
    { id: 1, path: "c.md", cursor: { line: 0, col: 0 } },
  ]);
  expect(single.recent.slice(0, 3)).toEqual(["c.md", "b.md", "a.md"]);
});

test("a file gone since the last session is reported once", async () => {
  const root = await tmpWorkspace({ "a.md": "a\n", "b.md": "b\n" });
  const state = await mkState();
  dirs.push(root, state);
  const path = statePath(
    { XDG_STATE_HOME: state },
    "/no-home",
    await realpath(root),
  );
  if (path === undefined) throw new Error("no state path");
  await run(root, path, true, async (app) => {
    await app.open("a.md");
    app.keys(":vs<CR>");
    await app.open("b.md");
  });
  await rm(join(root, "a.md"));

  const s = await run(root, path, true, async (app) => {
    await waitFor(() => app.store.get().windows.restore === undefined);
  });
  expect(windows(s)).toEqual([
    { id: 2, path: "b.md", cursor: { line: 0, col: 0 } },
  ]);
  expect(sessionToasts(s)).toEqual([
    "1 files from the last session were not found",
  ]);
});

test("every open buffer comes back in its bufferline order with its pin", async () => {
  const root = await tmpWorkspace({
    "a.md": "a\n",
    "b.md": "b\n",
    "c.md": "c\n",
    "d.md": "d\n",
  });
  const state = await mkState();
  dirs.push(root, state);
  const path = statePath(
    { XDG_STATE_HOME: state },
    "/no-home",
    await realpath(root),
  );
  if (path === undefined) throw new Error("no state path");
  const tabs = (s: AppState) =>
    s.bufferOrder.map((id) => {
      const b = s.buffers[id];
      return b?.pinned ? `${b.path} (pinned)` : b?.path;
    });

  const before = await run(root, path, true, async (app) => {
    for (const p of ["a.md", "b.md", "c.md", "d.md"]) await app.open(p);
    app.keys("<leader>bp");
    app.keys(":b b.md<CR>");
    app.keys("]B");
  });
  expect(tabs(before)).toEqual(["d.md (pinned)", "a.md", "c.md", "b.md"]);

  const after = await run(root, path, true, async (app) => {
    await waitFor(() => app.store.get().windows.restore === undefined);
  });
  expect(windows(after)).toEqual([
    { id: 1, path: "b.md", cursor: { line: 0, col: 0 } },
  ]);
  expect(tabs(after)).toEqual(["d.md (pinned)", "a.md", "c.md", "b.md"]);
  expect(sessionToasts(after)).toEqual([]);
});
