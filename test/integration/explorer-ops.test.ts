import { afterAll, beforeAll, expect, test } from "bun:test";
import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import type { Action } from "../../src/core/state/types";
import {
  type App,
  gatedTrash,
  settle,
  startApp,
  tmpWorkspace,
  waitFor,
} from "./helpers";

let app: App;
const trash = gatedTrash();
const disk = (path: string) => readFile(join(app.root, path), "utf8");
const exists = (path: string) => Bun.file(join(app.root, path)).exists();
const since = (mark: number) => app.actions.slice(mark);
const fsResult = (mark: number) =>
  since(mark).find(
    (a): a is Extract<Action, { type: "fsResult" }> => a.type === "fsResult",
  );
const under = (path: string, dir: string) =>
  path === dir || path.startsWith(`${dir}/`);

beforeAll(async () => {
  const root = await tmpWorkspace({
    "a.md": "alpha\n",
    "b.md": "bravo\n",
    "d.md": "delta\n",
    "notes/one.md": "one\n",
    "notes/two.md": "two\n",
  });
  app = await startApp(root, { trash });
});

afterAll(async () => {
  app.stop();
  await rm(app.root, { recursive: true, force: true });
});

test("rename onto an existing file and create of an existing name refuse with E13", async () => {
  const before = [await disk("a.md"), await disk("b.md")];
  app.select("a.md");
  let mark = app.actions.length;
  app.keys("r<BS><BS><BS><BS>b.md<CR>");
  await waitFor(() => fsResult(mark) !== undefined);
  expect(fsResult(mark)).toMatchObject({
    ok: false,
    reason: "E13: File exists (b.md)",
  });
  expect(app.store.get().notifications.message?.text).toBe(
    "E13: File exists (b.md)",
  );

  mark = app.actions.length;
  app.keys("ab.md<CR>");
  await waitFor(() => fsResult(mark) !== undefined);
  expect(fsResult(mark)).toMatchObject({
    op: { kind: "create", from: "b.md" },
    ok: false,
    reason: "E13: File exists (b.md)",
  });
  expect([await disk("a.md"), await disk("b.md")]).toEqual(before);
});

test("renaming a dirty open file moves it, then autosave writes only the new path", async () => {
  const b = await app.open("a.md");
  const mark = app.actions.length;
  const marked = app.effects.length;
  app.keys("x");
  expect(app.buffer("a.md")?.dirty).toBe(true);
  app.select("a.md");
  app.keys("r<BS><BS><BS><BS>c.md<CR>");
  await waitFor(() => fsResult(mark) !== undefined);
  expect(app.store.get().buffers[b.id]?.path).toBe("c.md");

  app.keys(" e");
  app.keys("x");
  await waitFor(() =>
    since(mark).some((a) => a.type === "saved" && a.path === "c.md"),
  );
  await Bun.sleep(1000);
  expect(await disk("c.md")).toBe("pha\n");
  expect(await exists("a.md")).toBe(false);
  const diskOps = app.effects
    .slice(marked)
    .filter((e) => e.kind === "write" || e.kind === "rename")
    .map((e) => (e.kind === "write" ? `write ${e.path}` : "rename"));
  expect(diskOps).toEqual(["write a.md", "rename", "write c.md"]);
  expect(since(mark).filter((a) => a.type === "fileChanged")).toEqual([]);
  expect(app.store.get().overlay.kind).toBe("none");
  expect(app.store.get().buffers[b.id]).toMatchObject({
    dirty: false,
    disk: "present",
  });
});

test("typing during a queued write, then renaming, never writes to the old path", async () => {
  const b = await app.open("d.md");
  const mark = app.actions.length;
  const marked = app.effects.length;
  app.runner.run({ kind: "trash", op: { kind: "trash", from: "elsewhere" } });
  app.keys("x");
  app.keys("<Esc>:w<CR>");
  expect(app.store.get().buffers[b.id]?.save.kind).toBe("writing");
  app.keys("x");
  app.select("d.md");
  app.keys("r<BS><BS><BS><BS>e.md<CR>");
  trash.release();
  await waitFor(() =>
    since(mark).some((a) => a.type === "saved" && a.path === "e.md"),
  );
  await Bun.sleep(500);
  const writes = app.effects
    .slice(marked)
    .filter((e) => e.kind === "write" || e.kind === "rename")
    .map((e) => (e.kind === "write" ? `write ${e.path}` : "rename"));
  expect(writes).toEqual(["write d.md", "rename", "write e.md"]);
  expect(await exists("d.md")).toBe(false);
  expect(await disk("e.md")).toBe("lta\n");
  expect(app.store.get().buffers[b.id]).toMatchObject({
    path: "e.md",
    dirty: false,
  });
  expect(since(mark).filter((a) => a.type === "fileChanged")).toEqual([]);
});

test("moving a folder with open files re-paths them and reports no own changes", async () => {
  const one = await app.open("notes/one.md");
  const two = await app.open("notes/two.md");
  const mark = app.actions.length;
  app.select("notes");
  app.keys("m<BS><BS><BS><BS><BS>archive/notes<CR>");
  await waitFor(() => fsResult(mark) !== undefined);
  expect(fsResult(mark)?.ok).toBe(true);
  expect(app.store.get().buffers[one.id]?.path).toBe("archive/notes/one.md");
  expect(app.store.get().buffers[two.id]?.path).toBe("archive/notes/two.md");
  await settle();
  const own = since(mark).filter(
    (a) =>
      a.type === "fileChanged" &&
      (under(a.event.path, "notes") || under(a.event.path, "archive")),
  );
  expect(own).toEqual([]);
  expect(await disk("archive/notes/one.md")).toBe("one\n");
});
