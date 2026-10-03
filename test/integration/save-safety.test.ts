import { afterAll, beforeAll, expect, spyOn, test } from "bun:test";
import * as fsp from "node:fs/promises";
import {
  chmod,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import {
  type App,
  clock,
  gatedTrash,
  settle,
  startApp,
  tmpWorkspace,
  waitFor,
} from "./helpers";

let app: App;
const trash = gatedTrash();
const disk = (path: string) => readFile(join(app.root, path), "utf8");
const since = (mark: number) => app.actions.slice(mark);

beforeAll(async () => {
  const root = await tmpWorkspace({
    "crash.md": "original\n",
    "clean.md": "clean\n",
    "dirty.md": "dirty\n",
    "own.md": "own\n",
    "queued.md": "queued\n",
    "timer.md": "timer\n",
  });
  await chmod(join(root, "own.md"), 0o640);
  app = await startApp(root, { trash });
});

afterAll(async () => {
  app.stop();
  await rm(app.root, { recursive: true, force: true });
});

test("a save that fails after fsync keeps the original bytes and leaves no temp file", async () => {
  await app.open("crash.md");
  const realRename = fsp.rename;
  const spy = spyOn(fsp, "rename").mockImplementation((from, to) =>
    String(from).includes(".so-tmp-")
      ? Promise.reject(
          Object.assign(new Error("EIO: i/o error"), { code: "EIO" }),
        )
      : realRename(from, to),
  );
  try {
    app.keys("ix<Esc>");
    await waitFor(() =>
      app.actions.some((a) => a.type === "saveFailed" && a.path === "crash.md"),
    );
  } finally {
    spy.mockRestore();
  }
  expect(app.actions).toContainEqual({
    type: "saveFailed",
    path: "crash.md",
    reason: "EIO: i/o error",
  });
  expect(await disk("crash.md")).toBe("original\n");
  expect(
    (await readdir(app.root)).filter((n) => n.includes(".so-tmp-")),
  ).toEqual([]);
});

test("an external edit reloads a clean open file and u restores it", async () => {
  await app.open("clean.md");
  await writeFile(join(app.root, "clean.md"), "changed\n");
  await waitFor(() => app.text("clean.md") === "changed");
  expect(app.store.get().notifications.message?.text).toBe(
    "Reloaded from disk — u to undo",
  );
  app.keys("u");
  expect(app.text("clean.md")).toBe("clean");
});

test("an external edit of a dirty open file opens a conflict and writes nothing", async () => {
  const b = await app.open("dirty.md");
  app.keys("ix");
  await writeFile(join(app.root, "dirty.md"), "external\n");
  await waitFor(() => app.store.get().overlay.kind === "conflict");
  expect(app.store.get().overlay).toMatchObject({ bufferId: b.id });
  await Bun.sleep(app.store.get().config.autosave.delayMs + 200);
  expect(await disk("dirty.md")).toBe("external\n");
  expect(app.text("dirty.md")).toBe("xdirty");
  app.keys("t<Esc>");
  expect(app.store.get().overlay.kind).toBe("none");
  expect(app.text("dirty.md")).toBe("external");
});

test("an own save is silent and keeps the file's permissions", async () => {
  await app.open("own.md");
  const mark = app.actions.length;
  app.keys("ix<Esc>");
  await waitFor(() =>
    since(mark).some((a) => a.type === "saved" && a.path === "own.md"),
  );
  await Bun.sleep(500);
  expect(since(mark).filter((a) => a.type === "fileChanged")).toEqual([]);
  expect(await disk("own.md")).toBe("xown\n");
  expect((await stat(join(app.root, "own.md"))).mode & 0o777).toBe(0o640);
});

test("a queued save over an unseen external edit fails as a conflict and keeps the external text", async () => {
  const b = await app.open("queued.md");
  app.keys("ix");
  app.runner.run({ kind: "trash", op: { kind: "trash", from: "elsewhere" } });
  app.keys("<Esc>");
  await writeFile(join(app.root, "queued.md"), "external\n");
  trash.release();
  await waitFor(() =>
    app.actions.some((a) => a.type === "saveFailed" && a.path === "queued.md"),
  );
  expect(app.actions).toContainEqual({
    type: "saveFailed",
    path: "queued.md",
    reason: "conflict",
  });
  await waitFor(() => app.store.get().overlay.kind === "conflict");
  expect(app.store.get().overlay).toMatchObject({ bufferId: b.id });
  expect(await disk("queued.md")).toBe("external\n");
  app.keys("t");
  expect(app.store.get().overlay.kind).toBe("none");
});

test("autosave writes once after its delay on the runner's clock", async () => {
  const b = await app.open("timer.md");
  const mark = app.actions.length;
  const marked = app.effects.length;
  app.keys("ix");
  const typedAt = clock();
  await waitFor(() =>
    since(mark).some((a) => a.type === "saved" && a.path === "timer.md"),
  );
  const fired = since(mark).find(
    (a) => a.type === "timer" && a.id === `autosave:${b.id}`,
  );
  expect(fired?.type === "timer" && fired.now).toBeGreaterThanOrEqual(
    typedAt + app.store.get().config.autosave.delayMs,
  );
  await settle();
  const writes = app.effects
    .slice(marked)
    .filter((e) => e.kind === "write" && e.path === "timer.md");
  expect(writes).toHaveLength(1);
  expect(await disk("timer.md")).toBe("xtimer\n");
  app.keys("<Esc>");
});
