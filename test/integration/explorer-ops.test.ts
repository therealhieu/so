import { afterAll, beforeAll, expect, spyOn, test } from "bun:test";
import * as fsp from "node:fs/promises";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import type { Action } from "../../src/core/state/types";
import type { Trash } from "../../src/workspace/trash";
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
  await settle();
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
  await settle();
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

/** Holds the explorer's rename or move of `from` until `release()`; saves pass through. */
function holdMove(root: string, from: string) {
  const realRename = fsp.rename;
  let open = () => {};
  const gate = new Promise<void>((r) => {
    open = r;
  });
  let started = false;
  const spy = spyOn(fsp, "rename").mockImplementation(async (a, b) => {
    if (String(a) === join(root, from)) {
      started = true;
      await gate;
    }
    return realRename(a, b);
  });
  return {
    started: () => started,
    release: () => open(),
    restore: () => spy.mockRestore(),
  };
}

/** A trash that holds until `release()`, then moves the entry into `bin`. */
function holdTrash(bin: string): Trash & {
  started(): boolean;
  release(): void;
} {
  let open = () => {};
  const gate = new Promise<void>((r) => {
    open = r;
  });
  let started = false;
  return {
    available: true,
    async move(path) {
      started = true;
      await gate;
      await fsp.rename(path, join(bin, basename(path)));
    },
    started: () => started,
    release: () => open(),
  };
}

/** Save answers (`saved` or `saveFailed`) since `mark`. */
const answers = (a: App, mark: number) =>
  a.actions
    .slice(mark)
    .filter((x) => x.type === "saved" || x.type === "saveFailed");

const savedAt = (a: App, mark: number, path: string) =>
  answers(a, mark).some((x) => x.type === "saved" && x.path === path);

/** Two saves were issued against `from` while its move ran; both land at `to`. */
async function expectLandsAt(a: App, mark: number, from: string, to: string) {
  await waitFor(() => answers(a, mark).length === 2);
  expect(answers(a, mark).map((x) => [x.type, x.path])).toEqual([
    ["saved", from],
    ["saved", to],
  ]);
  const disk = (p: string) => readFile(join(a.root, p), "utf8");
  expect(await Bun.file(join(a.root, from)).exists()).toBe(false);
  expect(await disk(to)).toBe(`${a.text(to)}\n`);
  expect(a.buffer(to)).toMatchObject({ dirty: false, save: { kind: "idle" } });
  a.keys("<Esc>:q<CR>");
  expect(a.effects.at(-1)).toEqual({ kind: "exit", code: 0 });
}

test("a save issued while a rename runs lands at the new path, and :q exits", async () => {
  const own = await startApp(await tmpWorkspace({ "d.md": "delta\n" }));
  const hold = holdMove(own.root, "d.md");
  try {
    await own.open("d.md");
    const mark = own.actions.length;
    own.keys("x");
    own.select("d.md");
    own.keys("r<BS><BS><BS><BS>e.md<CR>");
    await waitFor(() => hold.started() && savedAt(own, mark, "d.md"));
    own.keys(" e");
    own.keys("x<Esc>:w<CR>");
    hold.release();
    await expectLandsAt(own, mark, "d.md", "e.md");
    expect(own.text("e.md")).toBe("lta");
  } finally {
    hold.restore();
    own.stop();
    await rm(own.root, { recursive: true, force: true });
  }
});

test("an autosave that fires during a slow rename lands at the new path", async () => {
  const own = await startApp(await tmpWorkspace({ "d.md": "delta\n" }));
  const hold = holdMove(own.root, "d.md");
  try {
    await own.open("d.md");
    const mark = own.actions.length;
    const marked = own.effects.length;
    own.keys("x");
    own.select("d.md");
    own.keys("r<BS><BS><BS><BS>e.md<CR>");
    await waitFor(() => hold.started() && savedAt(own, mark, "d.md"));
    own.keys(" e");
    own.keys("x");
    await waitFor(
      () =>
        own.effects.slice(marked).filter((e) => e.kind === "write").length ===
        2,
    );
    hold.release();
    await expectLandsAt(own, mark, "d.md", "e.md");
    expect(own.text("e.md")).toBe("lta");
  } finally {
    hold.restore();
    own.stop();
    await rm(own.root, { recursive: true, force: true });
  }
});

test("a save issued while its folder moves lands under the new folder", async () => {
  const own = await startApp(await tmpWorkspace({ "notes/one.md": "one\n" }));
  const hold = holdMove(own.root, "notes");
  try {
    await own.open("notes/one.md");
    const mark = own.actions.length;
    own.keys("x");
    own.select("notes");
    own.keys("m<BS><BS><BS><BS><BS>archive/notes<CR>");
    await waitFor(() => hold.started() && savedAt(own, mark, "notes/one.md"));
    own.keys(" e");
    own.keys("x<Esc>:w<CR>");
    hold.release();
    await expectLandsAt(own, mark, "notes/one.md", "archive/notes/one.md");
    expect(own.text("archive/notes/one.md")).toBe("e");
  } finally {
    hold.restore();
    own.stop();
    await rm(own.root, { recursive: true, force: true });
  }
});

test("a save queued behind two moves follows both", async () => {
  const own = await startApp(
    await tmpWorkspace({ "notes/one.md": "one\n", "box/keep.md": "keep\n" }),
  );
  const hold = holdMove(own.root, "notes");
  try {
    await own.open("notes/one.md");
    const mark = own.actions.length;
    own.keys("x");
    own.select("notes");
    own.keys("m<BS><BS><BS><BS><BS>box/notes<CR>");
    await waitFor(() => hold.started() && savedAt(own, mark, "notes/one.md"));
    own.select("box");
    own.keys("m<BS><BS><BS>shelf/box<CR>");
    own.keys(" e");
    own.keys("x<Esc>:w<CR>");
    hold.release();
    await expectLandsAt(own, mark, "notes/one.md", "shelf/box/notes/one.md");
    expect(own.text("shelf/box/notes/one.md")).toBe("e");
  } finally {
    hold.restore();
    own.stop();
    await rm(own.root, { recursive: true, force: true });
  }
});

test("a save issued while its file moves to Trash does not recreate it", async () => {
  const bin = await mkdtemp(join(tmpdir(), "so-bin-"));
  const held = holdTrash(bin);
  const own = await startApp(await tmpWorkspace({ "d.md": "delta\n" }), {
    trash: held,
  });
  try {
    own.store.dispatch({ type: "trashAvailable", available: true });
    await own.open("d.md");
    const mark = own.actions.length;
    own.keys("x");
    own.select("d.md");
    own.keys("dy");
    await waitFor(() => held.started() && savedAt(own, mark, "d.md"));
    own.keys(" e");
    own.keys("x<Esc>:w<CR>");
    held.release();
    await waitFor(() => answers(own, mark).length === 2);
    await settle();
    expect(await Bun.file(join(own.root, "d.md")).exists()).toBe(false);
    expect(await readFile(join(bin, "d.md"), "utf8")).toBe("elta\n");
    expect(own.buffer("d.md")).toMatchObject({ dirty: true, disk: "deleted" });
    expect(own.buffer("d.md")?.save.kind).not.toBe("writing");
    own.keys("<Esc>:q<CR>");
    expect(own.store.get().notifications.message?.text).toBe(
      "E37: No write since last change (d.md)",
    );
    own.keys(":w<CR>");
    await waitFor(
      () => savedAt(own, mark, "d.md") && answers(own, mark).length === 3,
    );
    expect(await readFile(join(own.root, "d.md"), "utf8")).toBe("lta\n");
  } finally {
    held.release();
    own.stop();
    await rm(own.root, { recursive: true, force: true });
    await rm(bin, { recursive: true, force: true });
  }
});
