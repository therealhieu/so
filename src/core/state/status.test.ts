import { expect, test } from "bun:test";
import {
  fresh,
  stamp,
  testRegistries,
  textFile,
} from "../../../test/support/state";
import { summarize } from "../features/links/summarize";
import { scanDoc } from "../lang/markdown/scan";
import type { ServerView } from "./lsp-types";
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
    view: "live",
    path: "a.md",
    position: { line: 0, col: 0 },
    words: 3,
    preview: "preview off",
  });
  expect(statusSegments(open("a.ts", "one two\n")).words).toBeUndefined();
});

test("the word count covers every block and follows edits", () => {
  const note = [
    "---",
    "tags: [a, b]",
    "---",
    "# Title here",
    "",
    "One two three",
    "four five",
    "",
    "```ts",
    "const x = 1;",
    "```",
    "",
    "- item one",
    "- item two",
    "",
  ].join("\n");
  const naive = (text: string) => text.match(/\S+/g)?.length ?? 0;
  let s = open("a.md", note);
  expect(statusSegments(s).words).toBe(naive(note));
  for (const key of ["G", "o", "s", "i", "x", " ", "w", "<Esc>"])
    s = update(s, { type: "key", key, now: 0 }).state;
  expect(statusSegments(s).words).toBe(naive(note) + 2);
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

test("status shows a deleted file until it is saved again", () => {
  let s = open("a.md", "x\n");
  s = update(s, {
    type: "fileChanged",
    event: { kind: "removed", path: "a.md" },
  }).state;
  s = update(s, { type: "key", key: "j", now: 0 }).state;
  expect(s.notifications.message).toBeUndefined();
  expect(statusSegments(s).deletedOnDisk).toBe(true);

  s = update(s, { type: "saved", path: "a.md", stamp: stamp(2) }).state;
  expect(statusSegments(s).deletedOnDisk).toBeUndefined();
});

test("status with nothing open shows only the mode and the preview", () => {
  expect(statusSegments(fresh())).toEqual({
    mode: "explorer",
    dirty: false,
    preview: "preview off",
  });
});

test("status shows the preview while it starts and its port once it runs", () => {
  let s = open("a.md", "x\n");
  s = update(s, { type: "key", key: ":", now: 0 }).state;
  for (const key of "Preview")
    s = update(s, { type: "key", key, now: 0 }).state;
  s = update(s, { type: "key", key: "<CR>", now: 0 }).state;
  expect(statusSegments(s).preview).toBe("preview …");
  s = update(s, { type: "previewStarted", port: 8731 }).state;
  expect(statusSegments(s).preview).toBe("preview :8731");
});

const withIndex = (s: AppState, ...actions: Action[]) =>
  actions.reduce((st, a) => update(st, a).state, s);
const batch = (done: number, total: number): Action => ({
  type: "indexBatch",
  summaries: [
    summarize("a.md", { mtime: 1, size: 0, ctime: 1 }, scanDoc("")),
    summarize(
      "b.md",
      { mtime: 1, size: 0, ctime: 1 },
      scanDoc("[[a]] and [[a#h]]"),
    ),
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

test("the statusline lists servers attached to the active buffer with their state", () => {
  const view = (name: string, state: ServerView["state"]): ServerView => ({
    name,
    root: "/ws",
    state,
    features: [],
    pullDiagnostics: false,
    completionTriggers: [],
    signatureTriggers: [],
  });
  let s = open("a.rs", "fn main() {}\n");
  expect(statusSegments(s).lsp).toBeUndefined();
  const actions: Action[] = [
    {
      type: "lspServer",
      key: "a@/ws",
      view: { ...view("a", "starting"), progress: "indexing 42%" },
    },
    { type: "lspServer", key: "b@/ws", view: view("b", "ready") },
    { type: "lspServer", key: "d@/ws", view: view("d", "unavailable") },
    {
      type: "lspAttached",
      path: "a.rs",
      keys: ["a@/ws", "b@/ws", "d@/ws"],
    },
    { type: "lspAttached", path: "other.rs", keys: ["a@/ws"] },
  ];
  for (const a of actions) s = update(s, a).state;
  expect(statusSegments(s).lsp).toEqual([
    { text: "a indexing 42%", state: "starting" },
    { text: "b", state: "ready" },
  ]);
  s = update(s, { type: "lspAttached", path: "a.rs", keys: [] }).state;
  expect(statusSegments(s).lsp).toBeUndefined();
});

test("a server that failed for good stays on the statusline of the files it served", () => {
  const failed = (root: string): ServerView => ({
    name: "rust-analyzer",
    root,
    state: "failed",
    reason: "exited with code 1",
    features: [],
    pullDiagnostics: false,
    completionTriggers: [],
    signatureTriggers: [],
  });
  let s = open("app/src/main.rs", "fn main() {}\n");
  const root = `${s.workspace.root}/app`;
  s = update(s, {
    type: "lspServer",
    key: `rust-analyzer@${root}`,
    view: failed(root),
  }).state;
  expect(statusSegments(s).lsp).toEqual([
    { text: "rust-analyzer", state: "failed" },
  ]);
  s = update(s, {
    type: "fileLoaded",
    path: "lib/src/lib.rs",
    file: textFile("pub fn f() {}\n"),
  }).state;
  expect(statusSegments(s).lsp).toBeUndefined();
  s = update(s, {
    type: "fileLoaded",
    path: "app/notes.md",
    file: textFile("# x\n"),
  }).state;
  expect(statusSegments(s).lsp).toBeUndefined();
});
