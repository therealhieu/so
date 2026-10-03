import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import { summarize } from "../features/links/summarize";
import { scanDoc } from "../lang/markdown/scan";
import { statusSegments } from "./status";
import type { Action, AppState } from "./types";
import { createUpdate } from "./update";

const update = createUpdate(testRegistries());
const open = (path: string, text: string) =>
  update(fresh(), { type: "fileLoaded", path, file: textFile(text) }).state;

test("status shows a word count only for Markdown buffers", () => {
  expect(statusSegments(open("a.md", "one two\n three\n"))).toEqual({
    mode: "normal",
    dirty: false,
    view: "source",
    path: "a.md",
    position: { line: 0, col: 0 },
    words: 3,
  });
  expect(statusSegments(open("a.ts", "one two\n")).words).toBeUndefined();
});

test("status shows a failed save and its retry time", () => {
  let s = open("a.md", "x\n");
  s = update(s, { type: "key", key: "x", now: 0 }).state;
  s = update(s, { type: "timer", id: "autosave:1", now: 1000 }).state;
  s = update(s, { type: "saveFailed", path: "a.md", reason: "EACCES" }).state;
  expect(statusSegments(s).saveError).toEqual({
    reason: "EACCES",
    retryAt: 2000,
  });
});

test("status with nothing open shows only the mode", () => {
  expect(statusSegments(fresh())).toEqual({ mode: "explorer", dirty: false });
});

const withIndex = (s: AppState, ...actions: Action[]) =>
  actions.reduce((st, a) => update(st, a).state, s);
const batch = (done: number, total: number): Action => ({
  type: "indexBatch",
  summaries: [
    summarize("a.md", 1, scanDoc("")),
    summarize("b.md", 1, scanDoc("[[a]] and [[a#h]]")),
  ],
  files: ["scripts/sync.ts"],
  done,
  total,
});

test("index segment reflects status", () => {
  const s = open("a.md", "x\n");
  expect(statusSegments(s).index).toBeUndefined();
  const indexing = withIndex(s, batch(4210, 10000));
  expect(statusSegments(indexing)).toMatchObject({
    index: "indexing",
    indexProgress: { done: 4210, total: 10000 },
  });
  const ready = withIndex(indexing, { type: "indexReady" });
  expect(statusSegments(ready).index).toBe("ready");
  expect(statusSegments(ready).indexProgress).toBeUndefined();
  const down = withIndex(
    ready,
    { type: "indexFailed", final: false, reason: "x" },
    { type: "indexFailed", final: true, reason: "x" },
  );
  expect(statusSegments(down).index).toBe("unavailable");
  expect(statusSegments(withIndex(fresh(), batch(1, 2))).index).toBe(
    "indexing",
  );
});

test("backlinks show only for notes and not while indexing", () => {
  const s = open("a.md", "x\n");
  expect(statusSegments(withIndex(s, batch(2, 2))).backlinks).toBeUndefined();
  const ready = withIndex(s, batch(2, 2), { type: "indexReady" });
  expect(statusSegments(ready).backlinks).toBe(2);
  const code = withIndex(open("scripts/sync.ts", "x\n"), batch(2, 2), {
    type: "indexReady",
  });
  expect(statusSegments(code).backlinks).toBeUndefined();
  expect(statusSegments(code).index).toBe("ready");
});

test("the statusline shows the jump position", () => {
  let s = open("a.md", "one\ntwo\nthree\n");
  expect(statusSegments(s).jump).toBeUndefined();
  s = withIndex(s, { type: "key", key: "G", now: 0 });
  expect(statusSegments(s).jump).toBe("jump 2/2");
  s = withIndex(s, { type: "key", key: "<C-o>", now: 0 });
  expect(statusSegments(s).jump).toBe("jump 1/2");
});
