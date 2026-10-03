import { expect, test } from "bun:test";
import {
  fresh,
  openBuffer,
  stamp,
  testRegistries,
} from "../../../test/support/state";
import { splitKeys } from "../kernel/vim/keys";
import { setBuffer } from "./buffers";
import { createTarget, explorerOp, toggleExplorer } from "./explorer";
import { scheduleAutosave } from "./save";
import type { Action, AppState, Effect, FsOp, Result } from "./types";
import { createUpdate } from "./update";

const reg = testRegistries();
const update = createUpdate(reg);

const dirtyA = (): AppState => {
  const s = openBuffer(fresh(), "a.md", "hello");
  const b = s.buffers[1];
  if (b === undefined) throw new Error("no buffer");
  const text = b.text.apply({
    range: { start: { line: 0, col: 0 }, end: { line: 0, col: 0 } },
    text: "x",
  }).buffer;
  return setBuffer(s, 1, { text, dirty: true }, reg);
};

/** Type "x" at the start of buffer 1 at time `now`, as an Insert key would. */
function typeX(s: AppState, now: number): Result {
  const b = s.buffers[1];
  if (b === undefined) throw new Error("no buffer");
  const text = b.text.apply({
    range: { start: { line: 0, col: 0 }, end: { line: 0, col: 0 } },
    text: "x",
  }).buffer;
  return scheduleAutosave(setBuffer(s, 1, { text, dirty: true }, reg), 1, now);
}

const ops = (effects: Effect[]) =>
  effects.filter((e) => e.kind !== "cancelTimer" && e.kind !== "listDir");

test("rename flushes a dirty buffer first, then follows it to the new path", () => {
  const op: FsOp = { kind: "rename", from: "a.md", to: "c.md" };
  const r = explorerOp(dirtyA(), op, 0);
  expect(ops(r.effects)).toEqual([
    { kind: "write", path: "a.md", text: "xhello\n", expected: stamp(1) },
    { kind: "rename", op },
  ]);
  const undoBefore = r.state.buffers[1]?.undo;
  const done = update(r.state, { type: "fsResult", op, ok: true });
  expect(done.state.buffers[1]).toMatchObject({ path: "c.md", dirty: true });
  expect(done.state.buffers[1]?.undo).toBe(undoBefore);
  expect(done.effects).toEqual([{ kind: "listDir", dir: "" }]);
});

test("a rename during a write, after typing during it, autosaves the newest text to the new path", () => {
  const disk: Effect[] = [];
  const step = (r: Result): AppState => {
    disk.push(
      ...r.effects.filter((e) => e.kind === "write" || e.kind === "rename"),
    );
    return r.state;
  };
  const act = (s: AppState, a: Action) => step(update(s, a));
  const keys = (s: AppState, seq: string, now: number) =>
    splitKeys(seq).reduce((st, key) => act(st, { type: "key", key, now }), s);

  let s = openBuffer(fresh(), "a.md", "hello");
  s = act(s, {
    type: "dirListed",
    dir: "",
    entries: [{ name: "a.md", kind: "file" }],
  });
  expect(s.panels.explorer).toMatchObject({ focused: true, cursor: "a.md" });
  s = step(typeX(s, 0));
  s = act(s, { type: "timer", id: "autosave:1", now: 1000 });
  expect(s.buffers[1]?.save.kind).toBe("writing");
  s = step(typeX(s, 1100));

  s = keys(s, "r<BS><BS><BS><BS>c.md<CR>", 1200);
  const op: FsOp = { kind: "rename", from: "a.md", to: "c.md" };
  s = act(s, { type: "saved", path: "a.md", stamp: stamp(2) });
  expect(s.buffers[1]).toMatchObject({
    dirty: true,
    save: { kind: "scheduled" },
  });

  s = act(s, { type: "fsResult", op, ok: true });
  expect(s.buffers[1]).toMatchObject({ path: "c.md", dirty: true });
  expect(s.buffers[1]?.save.kind).not.toBe("writing");

  s = act(s, { type: "timer", id: "autosave:1", now: 2200 });
  s = keys(s, ":q<CR>", 2300);
  expect(s.terminal.quit).toEqual({ code: 0, waiting: [1] });
  const exit = update(s, { type: "saved", path: "c.md", stamp: stamp(3) });
  expect(exit.effects).toEqual([{ kind: "exit", code: 0 }]);
  expect(exit.state.buffers[1]).toMatchObject({ dirty: false });

  expect(disk).toEqual([
    { kind: "write", path: "a.md", text: "xhello\n", expected: stamp(1) },
    { kind: "rename", op },
    { kind: "write", path: "c.md", text: "xxhello\n", expected: stamp(2) },
  ]);
});

test("moving a folder re-paths every buffer below it", () => {
  let s = openBuffer(fresh(), "notes/a.md", "a");
  s = openBuffer(s, "notes/sub/b.md", "b");
  s = openBuffer(s, "notesx.md", "c");
  s = {
    ...s,
    panels: {
      explorer: { ...s.panels.explorer, expanded: ["notes", "archive"] },
    },
  };
  const op: FsOp = { kind: "move", from: "notes", to: "archive/notes" };
  const done = update(s, { type: "fsResult", op, ok: true });
  expect(Object.values(done.state.buffers).map((b) => b.path)).toEqual([
    "archive/notes/a.md",
    "archive/notes/sub/b.md",
    "notesx.md",
  ]);
  expect(done.state.panels.explorer.expanded).toEqual([
    "archive/notes",
    "archive",
  ]);
  expect(done.effects).toEqual([
    { kind: "listDir", dir: "" },
    { kind: "listDir", dir: "archive" },
    { kind: "listDir", dir: "archive/notes" },
  ]);
});

test("trash flushes a dirty buffer, then closes it or keeps it if the flush failed", () => {
  const op: FsOp = { kind: "trash", from: "a.md" };
  const r = explorerOp(dirtyA(), op, 0);
  expect(ops(r.effects).map((e) => e.kind)).toEqual(["write", "trash"]);

  const saved = update(r.state, {
    type: "saved",
    path: "a.md",
    stamp: stamp(2),
  });
  const closed = update(saved.state, { type: "fsResult", op, ok: true });
  expect(closed.state.buffers[1]).toBeUndefined();

  const failed = update(r.state, {
    type: "saveFailed",
    path: "a.md",
    reason: "EACCES",
  });
  const kept = update(failed.state, { type: "fsResult", op, ok: true });
  expect(kept.state.buffers[1]).toMatchObject({ dirty: true, disk: "deleted" });
  expect(
    update(kept.state, { type: "timer", id: "retry:1", now: 9e9 }).effects,
  ).toEqual([]);
});

test("create adds .md only without an extension; a trailing slash makes a folder", () => {
  expect(createTarget("draft")).toEqual({ path: "draft.md", dir: false });
  expect(createTarget("sync.ts")).toEqual({ path: "sync.ts", dir: false });
  expect(createTarget("ideas/")).toEqual({ path: "ideas", dir: true });
  expect(createTarget("projects/new/idea")).toEqual({
    path: "projects/new/idea.md",
    dir: false,
  });
  expect(createTarget("v1.2/notes")).toEqual({
    path: "v1.2/notes.md",
    dir: false,
  });

  const op: FsOp = { kind: "create", from: "projects/new/idea.md", dir: false };
  expect(explorerOp(fresh(), op, 0).effects).toEqual([{ kind: "create", op }]);
  const created = update(fresh(), { type: "fsResult", op, ok: true });
  expect(created.effects).toEqual([
    { kind: "listDir", dir: "" },
    { kind: "read", path: "projects/new/idea.md" },
  ]);
  const folder: FsOp = { kind: "create", from: "ideas", dir: true };
  expect(
    update(fresh(), { type: "fsResult", op: folder, ok: true }).effects,
  ).toEqual([{ kind: "listDir", dir: "" }]);
});

test("a failed operation reports its reason; a failed trash turns trash off", () => {
  const exists = update(fresh(), {
    type: "fsResult",
    op: { kind: "rename", from: "a.md", to: "b.md" },
    ok: false,
    reason: "E13: File exists (b.md)",
  });
  expect(exists.state.notifications.message).toEqual({
    text: "E13: File exists (b.md)",
    level: "error",
  });

  const s = update(fresh(), { type: "trashAvailable", available: true }).state;
  expect(s.panels.explorer.trash).toBe("available");
  const trash = update(s, {
    type: "fsResult",
    op: { kind: "trash", from: "a.md" },
    ok: false,
    reason: "EXDEV",
  });
  expect(trash.state.panels.explorer.trash).toBe("unavailable");
  expect(trash.state.notifications.toasts).toEqual([
    { id: 1, level: "error", text: "Move to Trash failed: EXDEV" },
  ]);
});

test("listings fill the tree; a failed listing says why", () => {
  const entries = [
    { name: "notes", kind: "dir" as const },
    { name: "a.md", kind: "file" as const },
  ];
  const listed = update(fresh(), { type: "dirListed", dir: "", entries });
  expect(listed.state.panels.explorer.entries[""]).toEqual(entries);
  expect(listed.state.panels.explorer.cursor).toBe("notes");

  const failed = update(fresh(), {
    type: "dirListed",
    dir: "notes",
    entries: null,
    reason: "EACCES",
  });
  expect(failed.state.notifications.message).toEqual({
    text: "cannot list notes: EACCES",
    level: "error",
  });
});

test("toggle opens and focuses the explorer, then closes it", () => {
  const closed = toggleExplorer(fresh()).state.panels.explorer;
  expect(closed).toMatchObject({ open: false, focused: false });
  const reopened = toggleExplorer({
    ...fresh(),
    panels: { explorer: closed },
  });
  expect(reopened.state.panels.explorer).toMatchObject({
    open: true,
    focused: true,
  });
  expect(reopened.effects).toEqual([{ kind: "listDir", dir: "" }]);
});
