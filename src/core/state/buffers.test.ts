import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import { splitKeys } from "../kernel/vim/keys";
import type { Doc } from "../lang/markdown/doc";
import { applyBufferEdits, fullText } from "./buffers";
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

const CODE = "let a = 1;\nlet b = 2;\nlet c = 3;\n";
const code = () =>
  update(fresh(), {
    type: "fileLoaded",
    path: "src/a.ts",
    file: textFile(CODE),
  }).state;
const keys = (s: AppState, seq: string) =>
  splitKeys(seq).reduce((st, k) => key(st, k), s);
const span = (line: number, from: number, to: number, text: string) => ({
  range: { start: { line, col: from }, end: { line, col: to } },
  text,
});

test("overlapping edits change nothing", () => {
  const s = code();
  const r = applyBufferEdits(
    s,
    { path: "src/a.ts", edits: [span(0, 0, 5, "x"), span(0, 3, 7, "y")] },
    0,
    reg,
  );
  expect(r).toMatchObject({ stale: true, effects: [] });
  expect(r.state).toBe(s);
  expect(fullText(only(r.state).text)).toBe(CODE.slice(0, -1));
});

test("inserts at one position keep their order", () => {
  const r = applyBufferEdits(
    code(),
    {
      path: "src/a.ts",
      edits: [span(1, 0, 0, "first "), span(1, 0, 0, "second ")],
    },
    0,
    reg,
  );
  expect(r.stale).toBe(false);
  expect(only(r.state).text.line(1)).toBe("first second let b = 2;");
});

test("edits move the cursor of every window showing the buffer", () => {
  const split = keys(code(), "jjlll<C-w>vgg");
  const other = Object.values(split.windows.byId).find(
    (w) => w.id !== split.windows.active,
  );
  expect(other?.content.cursor).toEqual({ line: 2, col: 3 });
  const r = applyBufferEdits(
    split,
    {
      path: "src/a.ts",
      edits: [
        span(0, 0, 0, "import x;\n"),
        span(2, 0, 1, "XY"),
        span(2, 8, 9, "4"),
      ],
    },
    0,
    reg,
  );
  expect(r.stale).toBe(false);
  expect(fullText(only(r.state).text)).toBe(
    "import x;\nlet a = 1;\nlet b = 2;\nXYet c = 4;",
  );
  expect(r.state.windows.byId[other?.id ?? -1]?.content.cursor).toEqual({
    line: 3,
    col: 4,
  });
});

const load = (
  s: AppState,
  path: string,
  text = "one\ntwo\nthree\nfour\n",
  stamp = 1,
) => update(s, { type: "fileLoaded", path, file: textFile(text, stamp) }).state;
const ex = (s: AppState, line: string) =>
  [":", ...line, "<CR>"].reduce((st, k) => key(st, k), s);
const shownPath = (s: AppState) => {
  const w = s.windows.byId[s.windows.active];
  return w && s.buffers[w.content.bufferId]?.path;
};
const cursor = (s: AppState) =>
  s.windows.byId[s.windows.active]?.content.cursor;

test("switching buffers returns to where the window left each one", () => {
  let s = load(fresh(), "a.md");
  s = key(key(s, "j"), "j");
  s = load(s, "b.md");
  expect(cursor(s)).toEqual({ line: 0, col: 0 });
  s = ex(s, "bp");
  expect(shownPath(s)).toBe("a.md");
  expect(cursor(s)).toEqual({ line: 2, col: 0 });
});

test("a view is restored inside text that shrank meanwhile", () => {
  let s = load(fresh(), "a.md");
  s = key(s, "G");
  s = load(s, "b.md");
  s = load(s, "a.md", "only\n", 2);
  expect(shownPath(s)).toBe("b.md");
  s = ex(s, "bp");
  expect(cursor(s)).toEqual({ line: 0, col: 0 });
});

test("closing a buffer shows the one shown before it, where it was", () => {
  let s = load(fresh(), "a.md");
  s = load(s, "b.md");
  s = key(s, "G");
  s = load(s, "c.md");
  s = ex(s, "bn");
  expect(shownPath(s)).toBe("a.md");
  s = ex(s, "bp");
  s = ex(s, "bp");
  expect(shownPath(s)).toBe("b.md");
  s = ex(s, "bn");
  expect(shownPath(s)).toBe("c.md");
  s = ex(s, "bd");
  expect(shownPath(s)).toBe("b.md");
  expect(cursor(s)).toEqual({ line: 3, col: 0 });
  expect(s.bufferOrder.map((id) => s.buffers[id]?.path)).toEqual([
    "a.md",
    "b.md",
  ]);
});

test("the bufferline order keeps pinned buffers first and adds new ones last", () => {
  let s = load(fresh(), "a.md");
  s = load(s, "b.md");
  const b = Object.values(s.buffers).find((x) => x.path === "b.md");
  if (b === undefined) throw new Error("no b.md");
  s = { ...s, buffers: { ...s.buffers, [b.id]: { ...b, pinned: true } } };
  s = load(s, "c.md");
  expect(s.bufferOrder.map((id) => s.buffers[id]?.path)).toEqual([
    "b.md",
    "a.md",
    "c.md",
  ]);
  expect(s.bufferMru.map((id) => s.buffers[id]?.path)).toEqual([
    "c.md",
    "b.md",
    "a.md",
  ]);
});
