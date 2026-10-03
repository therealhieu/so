import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import { splitKeys } from "../kernel/vim/keys";
import { jumpBack } from "./jumps";
import { parsePersisted, snapshotSession } from "./session";
import type { Action, AppState, Effect, PersistedState } from "./types";
import { createUpdate } from "./update";

const update = createUpdate(testRegistries());
const SAVE: Effect = { kind: "startTimer", id: "saveState", ms: 2000 };

const load = (s: AppState, path: string, text: string) =>
  update(s, { type: "fileLoaded", path, file: textFile(text) });
function keys(s: AppState, seq: string): AppState {
  for (const key of splitKeys(seq))
    s = update(s, { type: "key", key, now: 0 }).state;
  return s;
}
const shown = (s: AppState) =>
  Object.values(s.windows.byId).map((w) => ({
    id: w.id,
    path: s.buffers[w.content.bufferId]?.path,
    cursor: w.content.cursor,
  }));

/** Two side-by-side windows: b.md on the left (active), a.md on the right. */
function twoSplits(): AppState {
  let s = load(fresh(), "a.md", "a1\na2\na3\n").state;
  s = keys(s, "jj:vs<CR>");
  s = load(s, "b.md", "SECRET b1\nb2\n").state;
  return keys(s, "jl");
}

const saved: PersistedState = {
  version: 1,
  recent: ["b.md", "a.md"],
  jumps: { entries: [{ path: "a.md", line: 2, col: 0 }], at: 1 },
  buffers: [
    { path: "a.md", view: "source" },
    { path: "b.md", view: "source" },
  ],
  layout: {
    tree: {
      kind: "row",
      children: [
        { kind: "leaf", id: 2 },
        { kind: "leaf", id: 1 },
      ],
    },
    active: 2,
    windows: [
      { id: 1, path: "a.md", cursor: { line: 2, col: 1 }, scroll: 0 },
      { id: 2, path: "b.md", cursor: { line: 9, col: 0 }, scroll: 4 },
    ],
  },
};

test("the snapshot holds layout and positions but no text", () => {
  const snap = snapshotSession(twoSplits());
  expect(snap).toEqual({
    ...saved,
    jumps: { entries: [], at: 0 },
    layout: {
      ...saved.layout,
      windows: [
        { id: 2, path: "b.md", cursor: { line: 1, col: 1 }, scroll: 0 },
        { id: 1, path: "a.md", cursor: { line: 2, col: 0 }, scroll: 0 },
      ],
    },
  });
  expect(JSON.stringify(snap)).not.toContain("SECRET");
  expect(parsePersisted(JSON.parse(JSON.stringify(snap)))).toEqual(snap);
});

test("a folder start restores the windows as their files load", () => {
  const r = update(fresh(), {
    type: "stateLoaded",
    state: saved,
    restore: true,
  });
  expect(r.effects).toEqual([
    { kind: "read", path: "a.md" },
    { kind: "read", path: "b.md" },
  ]);
  expect(r.state.recent).toEqual(saved.recent);
  expect(r.state.jumps).toEqual(saved.jumps);
  expect(r.state.windows.tree).toEqual(saved.layout.tree);
  expect(r.state.windows.active).toBe(2);
  expect(r.state.windows.nextWindowId).toBe(3);

  let s = load(r.state, "b.md", "b1\nb2\n").state;
  expect(shown(s)).toEqual([
    { id: 2, path: "b.md", cursor: { line: 1, col: 0 } },
  ]);
  s = load(s, "a.md", "a1\na2\na3\n").state;
  expect(shown(s)).toEqual([
    { id: 1, path: "a.md", cursor: { line: 2, col: 1 } },
    { id: 2, path: "b.md", cursor: { line: 1, col: 0 } },
  ]);
  expect(s.windows.restore).toBeUndefined();
  expect(s.notifications.toasts).toEqual([]);
});

test("files missing since the last session are reported once", () => {
  let s = update(fresh(), {
    type: "stateLoaded",
    state: saved,
    restore: true,
  }).state;
  s = update(s, { type: "fileRefused", path: "a.md", reason: "io" }).state;
  expect(s.notifications.toasts).toEqual([]);
  s = load(s, "b.md", "b1\n").state;
  expect(s.notifications.toasts.map((t) => t.text)).toEqual([
    "1 files from the last session were not found",
  ]);
  expect(s.windows.restore).toBeUndefined();
});

test("a file start loads recents and jumps but keeps its own window", () => {
  const r = update(fresh(), {
    type: "stateLoaded",
    state: saved,
    restore: false,
  });
  expect(r.effects).toEqual([]);
  expect(r.state.recent).toEqual(saved.recent);
  expect(r.state.jumps).toEqual(saved.jumps);
  expect(r.state.windows).toEqual(fresh().windows);
});

test("unknown versions and garbage load as empty", () => {
  expect(parsePersisted({ ...saved, version: 2 })).toBeUndefined();
  expect(parsePersisted("{not json")).toBeUndefined();
  expect(parsePersisted(undefined)).toBeUndefined();
  expect(parsePersisted({ ...saved, recent: "a.md" })).toBeUndefined();
  const r = update(fresh(), {
    type: "stateLoaded",
    state: undefined,
    restore: true,
  });
  expect(r.state).toEqual(fresh());
  expect(r.effects).toEqual([]);
});

test("opening a file schedules a save but a cursor move does not", () => {
  const opened = load(fresh(), "a.md", "a1\na2\n");
  expect(opened.effects).toContainEqual(SAVE);
  const moved = update(opened.state, { type: "key", key: "j", now: 0 });
  expect(moved.effects).not.toContainEqual(SAVE);
  const jumped = update(opened.state, { type: "key", key: "G", now: 0 });
  expect(jumped.effects).toContainEqual(SAVE);
});

test("the save timer saves the current snapshot", () => {
  const s = load(fresh(), "a.md", "a1\n").state;
  const a: Action = { type: "timer", id: "saveState", now: 0 };
  expect(update(s, a).effects).toEqual([
    { kind: "saveState", state: snapshotSession(s) },
  ]);
});

test("a window waiting for a jump target saves without the wait marker", () => {
  const s = {
    ...fresh(),
    jumps: { entries: [{ path: "a.md", line: 1, col: 0 }], at: 1 },
  };
  const waiting = jumpBack(s, 0).state;
  expect(snapshotSession(waiting).layout.windows).toEqual([
    { id: 1, path: "a.md", cursor: { line: 1, col: 0 }, scroll: 0 },
  ]);
});
