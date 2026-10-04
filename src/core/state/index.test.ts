import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import { backlinksOf, buildIndex } from "../features/links/note-index";
import { summarize } from "../features/links/summarize";
import { splitKeys } from "../kernel/vim/keys";
import { scanDoc } from "../lang/markdown/scan";
import { runCommand } from "./commands";
import { sidePanelRows } from "./side-panel";
import type { Action, AppState, FsOp } from "./types";
import { createUpdate } from "./update";

const update = createUpdate(testRegistries());
const run = (s: AppState, ...actions: Action[]) =>
  actions.reduce((st, a) => update(st, a).state, s);

const note = (path: string, text: string) =>
  summarize(path, { mtime: 1, size: 0, ctime: 1 }, scanDoc(text));

/** A ready index over `notes` (path → text) and other `files`. */
function indexed(notes: Record<string, string>, files: string[] = []) {
  return run(
    fresh(),
    {
      type: "indexBatch",
      summaries: Object.entries(notes).map(([p, t]) => note(p, t)),
      files,
      done: Object.keys(notes).length,
      total: Object.keys(notes).length,
    },
    { type: "indexReady" },
  );
}

const sources = (s: AppState, path: string) =>
  backlinksOf(s.index.ix, path).map((b) => b.from);

test("status moves from indexing to ready to unavailable", () => {
  let s = fresh();
  expect(s.index.status).toBe("idle");
  s = run(s, {
    type: "indexBatch",
    summaries: [note("a.md", "[[b]]")],
    files: ["a.md", "b.md", "x.png"],
    done: 1,
    total: 2,
  });
  expect(s.index).toMatchObject({ status: "indexing", done: 1, total: 2 });
  expect(sources(s, "b.md")).toEqual(["a.md"]);
  const ready = update(s, { type: "indexReady" });
  expect(ready.state.index.status).toBe("ready");
  expect(ready.state.notifications.toasts.map((t) => t.text)).toEqual([
    "index ready",
  ]);
  s = run(ready.state, { type: "indexFailed", final: false, reason: "boom" });
  expect(s.index.status).toBe("indexing");
  expect(s.notifications.toasts.at(-1)).toMatchObject({
    level: "error",
    text: "index unavailable — restarting",
  });
  s = run(s, { type: "indexFailed", final: true, reason: "boom" });
  expect(s.index.status).toBe("unavailable");
  expect(s.notifications.toasts.at(-1)).toMatchObject({
    level: "error",
    text: "index unavailable",
  });
  // The last index stays usable.
  expect(sources(s, "b.md")).toEqual(["a.md"]);
});

test("an update batch after the scan keeps the status and progress", () => {
  let s = indexed({ "a.md": "", "b.md": "" });
  s = run(s, {
    type: "indexBatch",
    summaries: [note("c.md", "[[a]]")],
    files: [],
    done: 0,
    total: 0,
  });
  expect(s.index).toMatchObject({ status: "ready", done: 2, total: 2 });
  expect(sources(s, "a.md")).toEqual(["c.md"]);
});

test("a saved link reaches backlinks without the worker", () => {
  let s = indexed({ "a.md": "", "b.md": "" });
  s = run(s, { type: "fileLoaded", path: "a.md", file: textFile("") });
  s = run(s, { type: "key", key: "i", now: 0 });
  for (const key of ["[", "[", "b", "]", "]"])
    s = run(s, { type: "key", key, now: 0 });
  s = run(s, { type: "key", key: "<Esc>", now: 0 });
  // Unsaved text does not reach the index.
  expect(sources(s, "b.md")).toEqual([]);
  s = run(s, {
    type: "saved",
    path: "a.md",
    stamp: { mtimeMs: 9, size: 6, hash: "x" },
  });
  expect(sources(s, "b.md")).toEqual(["a.md"]);
  expect(s.index.ix.summaries.get("a.md")?.mtime).toBe(9);
});

test("a buffer typed in during its write is summarized at its next save", () => {
  let s = indexed({ "a.md": "", "b.md": "" });
  s = run(s, { type: "fileLoaded", path: "a.md", file: textFile("") });
  s = run(s, { type: "key", key: "i", now: 0 });
  for (const key of ["[", "[", "b", "]", "]"])
    s = run(s, { type: "key", key, now: 0 });
  s = run(s, { type: "key", key: "<Esc>", now: 0 }); // leaving Insert writes
  s = run(s, { type: "key", key: "x", now: 0 }); // typed during the write
  s = run(s, {
    type: "saved",
    path: "a.md",
    stamp: { mtimeMs: 9, size: 6, hash: "x" },
  });
  expect(s.buffers[1]?.dirty).toBe(true);
  expect(sources(s, "b.md")).toEqual([]);
});

test("file operations move, add, and remove index entries", () => {
  let s = indexed({ "a.md": "[[b]] [[pic.png]]", "b.md": "" }, [
    "a.md",
    "b.md",
    "pic.png",
  ]);
  const op = (o: FsOp) => run(s, { type: "fsResult", op: o, ok: true });

  s = op({ kind: "create", from: "notes/c.md" });
  expect(s.index.ix.files.has("notes/c.md")).toBe(true);
  expect(s.index.ix.summaries.get("notes/c.md")?.title).toBe("c");
  s = op({ kind: "create", from: "img/d.png" });
  expect(s.index.ix.files.has("img/d.png")).toBe(true);
  expect(s.index.ix.summaries.has("img/d.png")).toBe(false);
  s = op({ kind: "create", from: "folder", dir: true });
  expect(s.index.ix.files.has("folder")).toBe(false);

  s = op({ kind: "rename", from: "b.md", to: "bee.md" });
  expect(s.index.ix.files.has("b.md")).toBe(false);
  expect(s.index.ix.summaries.has("bee.md")).toBe(true);
  s = op({ kind: "move", from: "notes", to: "archive/notes" });
  expect(s.index.ix.summaries.has("archive/notes/c.md")).toBe(true);
  s = op({ kind: "trash", from: "pic.png" });
  expect(s.index.ix.files.has("pic.png")).toBe(false);
  expect(sources(s, "pic.png")).toEqual([]);

  const failed = run(s, {
    type: "fsResult",
    op: { kind: "trash", from: "a.md" },
    ok: false,
    reason: "EACCES",
  });
  expect(failed.index.ix).toBe(s.index.ix);
});

test("a removed file leaves the index; a changed non-note file joins it", () => {
  let s = indexed({ "a.md": "[[b]]", "b.md": "" }, ["a.md", "b.md"]);
  s = run(s, { type: "fileChanged", event: { kind: "removed", path: "b.md" } });
  expect(s.index.ix.files.has("b.md")).toBe(false);
  expect(sources(s, "b.md")).toEqual([]);
  s = run(s, {
    type: "fileChanged",
    event: { kind: "changed", path: "data.csv", isDir: false },
  });
  expect(s.index.ix.files.has("data.csv")).toBe(true);
  // Notes changed by other programs are summarized by the worker, not here.
  const before = s.index.ix;
  s = run(s, {
    type: "fileChanged",
    event: { kind: "changed", path: "new.md", isDir: false },
  });
  expect(s.index.ix).toBe(before);
});

test("the index derived maps equal a rebuild after main-thread updates", () => {
  let s = indexed({ "a.md": "[[b]]", "b.md": "[[a]]" }, [
    "a.md",
    "b.md",
    "x.png",
  ]);
  s = run(
    s,
    {
      type: "fsResult",
      op: { kind: "rename", from: "a.md", to: "z.md" },
      ok: true,
    },
    { type: "fileChanged", event: { kind: "removed", path: "x.png" } },
  );
  const rebuilt = buildIndex(
    [...s.index.ix.summaries.values()],
    [...s.index.ix.files],
  );
  expect(s.index.ix.backlinks).toEqual(rebuilt.backlinks);
  expect(s.index.ix.byBasename).toEqual(rebuilt.byBasename);
});

test("the outline shows a new heading before saving", () => {
  let s = run(fresh(), {
    type: "fileLoaded",
    path: "a.md",
    file: textFile("# A\n\ntext\n"),
  });
  s = runCommand(s, "view.outline", 0, testRegistries()).state;
  const titles = () =>
    sidePanelRows(s)
      .filter((r) => r.section === "outline")
      .map((r) => r.text.trim());
  expect(titles()).toEqual(["A"]);
  for (const key of splitKeys("<C-w>hGo## New<Esc>"))
    s = run(s, { type: "key", key, now: 0 });
  expect(s.buffers[1]?.dirty).toBe(true);
  expect(titles()).toEqual(["A", "New"]);
});

test("property types start empty and each load replaces them", () => {
  const s = fresh();
  expect(s.index.types).toEqual({});
  const a = update(s, {
    type: "propertyTypesLoaded",
    types: { status: "number" },
  });
  expect(a.effects).toEqual([]);
  expect(a.state.index.types).toEqual({ status: "number" });
  expect(
    update(a.state, { type: "propertyTypesLoaded", types: {} }).state.index
      .types,
  ).toEqual({});
});
