import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import type { Doc } from "../lang/markdown/doc";
import type { AppState, BufferState } from "./types";
import { createUpdate } from "./update";

const reg = testRegistries();
const update = createUpdate(reg);

const key = (s: AppState, k: string, now = 0) =>
  update(s, { type: "key", key: k, now }).state;
const only = (s: AppState): BufferState => {
  const b = Object.values(s.buffers)[0];
  if (b === undefined) throw new Error("no buffer");
  return b;
};
const docOf = (b: BufferState) => b.analysis as Doc;

test("a Markdown buffer carries the analysis of its current text", () => {
  let s = update(fresh(), {
    type: "fileLoaded",
    path: "notes/a.md",
    file: textFile("# Plan\n\nSee [[b]]\n"),
  }).state;
  expect(docOf(only(s)).version).toBe(only(s).text.version);
  expect(docOf(only(s)).scan.links.map((l) => l.target)).toEqual(["b"]);

  for (const k of ["G", "o", "[", "[", "c", "]", "]", "<Esc>"]) s = key(s, k);
  const b = only(s);
  expect(docOf(b).version).toBe(b.text.version);
  expect(docOf(b).scan.links.map((l) => l.target)).toEqual(["b", "c"]);
});

test("reloading from disk re-analyzes the buffer", () => {
  let s = update(fresh(), {
    type: "fileLoaded",
    path: "a.md",
    file: textFile("[[old]]\n"),
  }).state;
  s = update(s, {
    type: "fileLoaded",
    path: "a.md",
    file: textFile("[[new]]\n", 2),
  }).state;
  const b = only(s);
  expect(docOf(b).version).toBe(b.text.version);
  expect(docOf(b).scan.links.map((l) => l.target)).toEqual(["new"]);
});

test("a substitution re-analyzes the buffer", () => {
  let s = update(fresh(), {
    type: "fileLoaded",
    path: "a.md",
    file: textFile("[[old]]\n"),
  }).state;
  for (const k of [":", ..."s/old/new/", "<CR>"]) s = key(s, k);
  expect(docOf(only(s)).scan.links.map((l) => l.target)).toEqual(["new"]);
});

test("a file type whose analysis throws still opens without analysis", () => {
  const broken = testRegistries();
  broken.fileTypes.register({
    id: "broken",
    match: { extensions: [".broken"] },
    editor: "text",
    views: [{ id: "source", decorations: [] }],
    analyze: () => {
      throw new Error("analysis failed");
    },
  });
  const s = createUpdate(broken)(fresh(), {
    type: "fileLoaded",
    path: "x.broken",
    file: textFile("text\n"),
  }).state;
  expect(only(s).path).toBe("x.broken");
  expect(only(s).analysis).toBeUndefined();
});
