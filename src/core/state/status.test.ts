import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import { statusSegments } from "./status";
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
