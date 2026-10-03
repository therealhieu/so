import { expect, test } from "bun:test";
import {
  fresh,
  stamp,
  testRegistries,
  textFile,
} from "../../../test/support/state";
import { fullText, openPath, setBuffer } from "./buffers";
import { resolveConflict } from "./disk";
import { requestQuit, writeBuffer } from "./save";
import type { AppState, Effect } from "./types";
import { createUpdate } from "./update";

const update = createUpdate(testRegistries());
const writes = (effects: Effect[]) => effects.filter((e) => e.kind === "write");

/** Open `path` through the reducer: read effect, then fileLoaded. */
function open(s: AppState, path: string, text: string): AppState {
  expect(openPath(s, path, 0).effects).toContainEqual({ kind: "read", path });
  return update(s, { type: "fileLoaded", path, file: textFile(text) }).state;
}

const textOf = (s: AppState, id = 1) => {
  const b = s.buffers[id];
  if (b === undefined) throw new Error("no buffer");
  return fullText(b.text);
};

/** Make buffer 1 dirty, as an edit would. */
function dirty(s: AppState, text = "mine"): AppState {
  const b = s.buffers[1];
  if (b === undefined) throw new Error("no buffer");
  const edited = b.text.apply({
    range: {
      start: { line: 0, col: 0 },
      end: { line: 0, col: b.text.line(0).length },
    },
    text,
  }).buffer;
  return setBuffer(s, 1, { text: edited, dirty: true });
}

test("a loaded file opens as a buffer of its file type in the active window", () => {
  const s = open(fresh(), "scripts/sync.ts", "let a = 1;\r\nlet b = 2;\r\n");
  expect(s.buffers[1]).toMatchObject({
    path: "scripts/sync.ts",
    fileType: "typescript",
    view: "source",
    eol: "\r\n",
    finalNewline: true,
    dirty: false,
    disk: "present",
  });
  expect(textOf(s)).toBe("let a = 1;\nlet b = 2;");
  expect(s.windows.byId[1]?.content.bufferId).toBe(1);
  expect(s.panels.explorer.focused).toBe(false);
});

test("a refused file opens nothing and says why", () => {
  const s = open(fresh(), "a.md", "keep");
  const cases = [
    ["binary", "binary file — not opened"],
    ["tooLarge", "file too large — not opened (limit 16 MiB)"],
    ["io", "cannot read file — not opened (photo.png)"],
  ] as const;
  for (const [reason, text] of cases) {
    const r = update(s, { type: "fileRefused", path: "photo.png", reason });
    expect(r.state.buffers).toEqual(s.buffers);
    expect(r.state.windows).toEqual(s.windows);
    expect(r.state.notifications.message).toEqual({ text, level: "error" });
  }
});

test("opening a path that is already open switches to its buffer", () => {
  let s = open(fresh(), "a.md", "a");
  s = open(s, "b.md", "b");
  const back = openPath(s, "a.md", 0);
  expect(back.effects.filter((e) => e.kind === "read")).toEqual([]);
  expect(back.state.windows.byId[1]?.content.bufferId).toBe(1);
});

test("a clean buffer deleted on disk is never autosaved and comes back on reappearance", () => {
  let s = open(fresh(), "a.md", "hello\n");
  const removed = update(s, {
    type: "fileChanged",
    event: { kind: "removed", path: "a.md" },
  });
  s = removed.state;
  expect(s.buffers[1]?.disk).toBe("deleted");
  expect(s.notifications.message).toEqual({
    text: "deleted on disk — :w to recreate",
    level: "info",
  });
  expect(removed.effects).toContainEqual({
    kind: "cancelTimer",
    id: "autosave:1",
  });

  expect(
    writes(update(s, { type: "timer", id: "autosave:1", now: 5000 }).effects),
  ).toEqual([]);
  expect(requestQuit(s, { force: false }, 0).effects).toEqual([
    { kind: "exit", code: 0 },
  ]);

  const changed = update(s, {
    type: "fileChanged",
    event: { kind: "changed", path: "a.md", isDir: false },
  });
  expect(changed.effects).toContainEqual({ kind: "read", path: "a.md" });
  s = update(changed.state, {
    type: "fileLoaded",
    path: "a.md",
    file: textFile("again\n", 2),
  }).state;
  expect(s.buffers[1]?.disk).toBe("present");
  expect(textOf(s)).toBe("again");
});

test("a dirty buffer deleted on disk blocks :q and :w recreates it", () => {
  let s = dirty(open(fresh(), "a.md", "hello\n"));
  s = update(s, {
    type: "fileChanged",
    event: { kind: "removed", path: "a.md" },
  }).state;
  const quit = requestQuit(s, { force: false }, 0);
  expect(quit.effects).toEqual([]);
  expect(quit.state.notifications.message?.text).toBe(
    "E37: No write since last change (a.md)",
  );

  expect(writes(writeBuffer(s, 1, 0).effects)).toEqual([]);
  const recreate = writeBuffer(s, 1, 0, { recreate: true });
  expect(writes(recreate.effects)).toEqual([
    { kind: "write", path: "a.md", text: "mine\n" },
  ]);
  const saved = update(recreate.state, {
    type: "saved",
    path: "a.md",
    stamp: stamp(3),
  });
  expect(saved.state.buffers[1]).toMatchObject({
    disk: "present",
    dirty: false,
  });
});

test("an external change reloads a clean buffer as one undo step", () => {
  let s = open(fresh(), "a.md", "one\ntwo\n");
  const same = update(s, {
    type: "fileLoaded",
    path: "a.md",
    file: textFile("one\ntwo\n"),
  });
  expect(same.state).toBe(s);

  s = update(s, {
    type: "fileLoaded",
    path: "a.md",
    file: textFile("one\nthree\nfour\n", 2),
  }).state;
  expect(textOf(s)).toBe("one\nthree\nfour");
  expect(s.notifications.message).toEqual({
    text: "Reloaded from disk — u to undo",
    level: "info",
  });
  const b = s.buffers[1];
  expect(b).toMatchObject({ dirty: false, stamp: stamp(2) });
  expect(b?.undo.done).toHaveLength(1);

  const step = b?.undo.undo();
  let text = b?.text;
  for (const edit of step?.edits ?? []) text = text?.apply(edit).buffer;
  expect(text && fullText(text)).toBe("one\ntwo");
});

test("an external change to a dirty buffer opens a conflict and writes nothing", () => {
  const s = dirty(open(fresh(), "a.md", "hello\n"));
  const disk = textFile("theirs\n", 2);
  const r = update(s, { type: "fileLoaded", path: "a.md", file: disk });
  expect(writes(r.effects)).toEqual([]);
  expect(r.state.overlay).toEqual({
    kind: "conflict",
    bufferId: 1,
    disk,
    showDiff: false,
  });
  expect(textOf(r.state)).toBe("mine");
  expect(
    writes(
      update(r.state, { type: "timer", id: "autosave:1", now: 9e9 }).effects,
    ),
  ).toEqual([]);

  const diff = resolveConflict(r.state, "diff", 0);
  expect(diff.state.overlay).toMatchObject({
    kind: "conflict",
    showDiff: true,
  });

  const keep = resolveConflict(r.state, "keep", 0);
  expect(keep.state.overlay).toEqual({ kind: "none" });
  expect(writes(keep.effects)).toEqual([
    { kind: "write", path: "a.md", text: "mine\n", expected: stamp(2) },
  ]);
  expect(keep.state.notifications.toasts.map((t) => t.text)).toEqual([
    "Kept your version — saved",
  ]);

  const take = resolveConflict(r.state, "take", 0);
  expect(take.state.overlay).toEqual({ kind: "none" });
  expect(textOf(take.state)).toBe("theirs");
  expect(take.state.buffers[1]).toMatchObject({
    dirty: false,
    stamp: stamp(2),
  });
});

test("a save conflict reads the disk version back", () => {
  let s = dirty(open(fresh(), "a.md", "hello\n"));
  s = writeBuffer(s, 1, 0).state;
  const r = update(s, { type: "saveFailed", path: "a.md", reason: "conflict" });
  expect(r.effects).toContainEqual({ kind: "read", path: "a.md" });
  const loaded = update(r.state, {
    type: "fileLoaded",
    path: "a.md",
    file: textFile("theirs\n", 2),
  });
  expect(loaded.state.overlay.kind).toBe("conflict");
});

test("changes outside open buffers relist listed folders", () => {
  const s: AppState = {
    ...fresh(),
    panels: {
      explorer: { ...fresh().panels.explorer, expanded: ["notes"] },
    },
  };
  const ev = (event: Parameters<typeof update>[1] & { type: "fileChanged" }) =>
    update(s, event).effects;
  expect(
    ev({
      type: "fileChanged",
      event: { kind: "changed", path: "notes/new.md", isDir: false },
    }),
  ).toEqual([{ kind: "listDir", dir: "notes" }]);
  expect(
    ev({ type: "fileChanged", event: { kind: "removed", path: "x/y.md" } }),
  ).toEqual([]);
  expect(
    ev({
      type: "fileChanged",
      event: { kind: "changed", path: "notes", isDir: true },
    }),
  ).toEqual([
    { kind: "listDir", dir: "" },
    { kind: "listDir", dir: "notes" },
  ]);
});
