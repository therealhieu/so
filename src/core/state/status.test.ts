import { expect, test } from "bun:test";
import {
  fresh,
  stamp,
  testRegistries,
  textFile,
} from "../../../test/support/state";
import { normalizeIndexText } from "../features/git/index-text";
import { summarize } from "../features/links/summarize";
import { splitKeys } from "../kernel/vim/keys";
import { scanDoc } from "../lang/markdown/scan";
import type { ServerView } from "./lsp-types";
import { SEARCH_COUNT_CAP, statusSegments } from "./status";
import type { Action, AppState, RepoInfo } from "./types";
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

const REPO: RepoInfo = {
  top: "/repo",
  gitDir: "/repo/.git",
  commonDir: "/repo/.git",
  prefix: "",
  head: { kind: "branch", name: "main" },
};

/** `text` open inside the repository with its index read as `index`. */
function gitOpen(
  text: string,
  index: { kind: "untracked" } | string,
  head: RepoInfo["head"] = REPO.head,
): AppState {
  const s = update(fresh(), {
    type: "gitDetected",
    repo: { ...REPO, head },
  }).state;
  const loaded = update(s, {
    type: "fileLoaded",
    path: "a.md",
    file: textFile(text),
  }).state;
  return update(loaded, {
    type: "gitIndexRead",
    path: "a.md",
    entry:
      typeof index === "string"
        ? {
            kind: "tracked",
            oid: "o1",
            mode: "100644",
            conflicted: false,
            text: normalizeIndexText(index, "lf"),
          }
        : index,
  }).state;
}

test("git segment counts follow the gitsigns summary and stay zero without a base", () => {
  const changed = gitOpen("a\nX\ne\n", "a\nb\nc\nd\ne\n");
  expect(statusSegments(changed).git).toEqual({
    ref: "main",
    added: 0,
    changed: 1,
    removed: 2,
  });
  const mixed = gitOpen("new\na\nB\nC\nD\ne\n", "a\nb\nc\ne\n");
  expect(statusSegments(mixed).git).toEqual({
    ref: "main",
    added: 2,
    changed: 2,
    removed: 0,
  });
  expect(statusSegments(gitOpen("a\nb\n", { kind: "untracked" })).git).toEqual({
    ref: "main",
    added: 0,
    changed: 0,
    removed: 0,
  });
  expect(
    statusSegments(
      gitOpen("a\nX\n", "a\nb\n", { kind: "unborn", name: "trunk" }),
    ).git,
  ).toEqual({ ref: "trunk", added: 0, changed: 0, removed: 0 });
  expect(statusSegments(open("a.md", "a\n")).git).toBeUndefined();
});

test("git segment shows a detached head by short sha and the operation in progress", () => {
  const s = gitOpen("a\n", "a\n", { kind: "detached", short: "a1b2c3d" });
  const rebasing = update(s, {
    type: "gitStatus",
    result: {
      ok: true,
      status: {
        head: { kind: "detached", short: "a1b2c3d" },
        op: "rebasing",
        files: new Map(),
      },
    },
  }).state;
  expect(statusSegments(rebasing).git).toEqual({
    ref: "a1b2c3d",
    op: "rebasing",
    added: 0,
    changed: 0,
    removed: 0,
  });
});

const keys = (s: AppState, seq: string) =>
  splitKeys(seq).reduce(
    (st, key) => update(st, { type: "key", key, now: 0 }).state,
    s,
  );

test("status counts the last search's matches up to the cursor", () => {
  const s = open("a.md", "cat cat\nno\ncat\n");
  expect(statusSegments(s).search).toBeUndefined();
  const found = keys(s, "/cat<CR>");
  expect(statusSegments(found).search).toEqual({
    current: 2,
    total: 3,
    capped: false,
  });
  expect(statusSegments(keys(found, "n")).search?.current).toBe(3);
  expect(statusSegments(keys(found, "j")).search?.current).toBe(2);
  expect(statusSegments(keys(s, "/dog<CR>")).search).toBeUndefined();
});

test("the search count follows edits", () => {
  const found = keys(open("a.md", "cat\n"), "/cat<CR>");
  expect(statusSegments(found).search?.total).toBe(1);
  expect(statusSegments(keys(found, "yyp")).search?.total).toBe(2);
});

test("the search count stops past the cap", () => {
  const many = "x\n".repeat(SEARCH_COUNT_CAP + 50);
  const found = keys(open("a.md", many), "/x<CR>");
  expect(statusSegments(found).search).toEqual({
    current: 2,
    total: SEARCH_COUNT_CAP + 1,
    capped: true,
  });
  expect(statusSegments(keys(found, "G")).search?.current).toBe(
    SEARCH_COUNT_CAP + 1,
  );
});

test("<Esc> and :noh hide the search count until the next n", () => {
  const found = keys(open("a.md", "cat\ncat\n"), "/cat<CR>");
  for (const clear of ["<Esc>", ":noh<CR>", ":nohlsearch<CR>"]) {
    const cleared = keys(found, clear);
    expect(cleared.vim.search).toEqual({
      pattern: "cat",
      dir: 1,
      hidden: true,
    });
    expect(statusSegments(cleared).search).toBeUndefined();
    const again = keys(cleared, "n");
    expect(again.vim.search?.hidden).toBeUndefined();
    expect(statusSegments(again).search?.current).toBe(1);
  }
});

test("<Esc> after a pending operator cancels it without hiding the search", () => {
  const found = keys(open("a.md", "cat\ncat\n"), "/cat<CR>");
  expect(keys(found, "d<Esc>").vim.search?.hidden).toBeUndefined();
});
