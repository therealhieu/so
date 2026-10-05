import { expect, test } from "bun:test";
import {
  fresh,
  stamp,
  testRegistries,
  textFile,
} from "../../../test/support/state";
import { normalizeIndexText } from "../features/git/index-text";
import type { FileStatus, RepoStatus } from "../features/git/status";
import type {
  Action,
  AppState,
  Effect,
  IndexEntry,
  RepoInfo,
  Result,
} from "./types";
import { createUpdate } from "./update";

const update = createUpdate(testRegistries());

const REPO: RepoInfo = {
  top: "/repo",
  gitDir: "/repo/.git",
  commonDir: "/repo/.git",
  prefix: "ws/",
  head: { kind: "branch", name: "main" },
};

const tracked = (text: string, oid = "o1", conflicted = false): IndexEntry => ({
  kind: "tracked",
  oid,
  mode: "100644",
  conflicted,
  text: normalizeIndexText(text, text.includes("\r\n") ? "crlf" : "lf"),
});

/** Run `actions` in order, each on the state the previous one left. */
function run(s: AppState, ...actions: Action[]): Result {
  let r: Result = { state: s, effects: [] };
  for (const a of actions) r = update(r.state, a);
  return r;
}

/** Open `text` (saved with a final newline) in the active window. */
const load = (path: string, text: string): Action => ({
  type: "fileLoaded",
  path,
  file: textFile(`${text}\n`),
});

/** `text` open in the active window inside the repository, its index read as `entry`. */
function inRepo(
  path: string,
  text: string,
  entry: IndexEntry = tracked(`${text}\n`),
  s: AppState = run(fresh(), { type: "gitDetected", repo: REPO }).state,
): AppState {
  return run(s, load(path, text), { type: "gitIndexRead", path, entry }).state;
}

const keys = (s: AppState, ...ks: string[]): Result =>
  run(s, ...ks.map((key): Action => ({ type: "key", key, now: 0 })));

const gitEffects = (r: Result): Effect[] =>
  r.effects.filter((e) => e.kind.startsWith("git") || e.kind === "runTool");

const file = (patch: Partial<FileStatus> = {}): FileStatus => ({
  index: ".",
  worktree: "M",
  conflict: false,
  untracked: false,
  submodule: false,
  hI: "h1",
  ...patch,
});

const status = (
  files: Record<string, FileStatus>,
  head: RepoStatus["head"] = { kind: "branch", name: "main" },
): Action => ({
  type: "gitStatus",
  result: { ok: true, status: { head, files: new Map(Object.entries(files)) } },
});

test("discovery stores the repo, watches its git dirs, and reads open buffers", () => {
  const r = run(fresh(), load("notes/a.md", "a"), {
    type: "gitDetected",
    repo: REPO,
  });
  expect(r.state.git.repo).toEqual(REPO);
  expect(r.state.git.files).toEqual({ "notes/a.md": { hunks: [] } });
  expect(r.effects).toEqual([
    { kind: "gitWatch", dirs: ["/repo/.git", "/repo/.git/refs/heads"] },
    { kind: "startTimer", id: "gitRefresh", ms: 200 },
    {
      kind: "gitReadIndex",
      repo: REPO,
      path: "notes/a.md",
      repoPath: "ws/notes/a.md",
    },
  ]);
});

test("an old git shows a warning and keeps git off", () => {
  const r = update(fresh(), {
    type: "gitDetected",
    repo: null,
    notice: "git 2.20.1 is older than 2.31; git features off",
  });
  expect(r.state.notifications.message).toEqual({
    text: "git 2.20.1 is older than 2.31; git features off",
    level: "warn",
  });
  expect(r.state.git.repo).toBeNull();
  expect(r.effects).toEqual([]);
});

test("typing debounces the diff and runs no git effect", () => {
  const s = inRepo("a.md", "one\ntwo");
  const insert = keys(s, "i");
  for (const key of ["x", "y"]) {
    const r = keys(insert.state, key);
    expect(r.effects).toContainEqual({
      kind: "startTimer",
      id: "gitDiff:1",
      ms: 100,
    });
    expect(gitEffects(r)).toEqual([]);
  }
  const typed = keys(insert.state, "x", "y").state;
  expect(typed.git.files["a.md"]?.hunks).toEqual([]);
  const r = update(typed, { type: "timer", id: "gitDiff:1", now: 100 });
  expect(r.state.git.files["a.md"]?.hunks).toEqual([
    {
      kind: "change",
      old: { start: 0, count: 1 },
      new: { start: 0, count: 1 },
      oldLines: ["one"],
    },
  ]);
  expect(r.effects).toEqual([]);
});

test("outside a repository typing and saving start no git timer", () => {
  const s = run(fresh(), load("a.md", "one")).state;
  const typed = keys(s, "i", "x");
  expect(
    typed.effects.some(
      (e) => e.kind === "startTimer" && e.id.startsWith("git"),
    ),
  ).toBe(false);
  const saved = update(typed.state, {
    type: "saved",
    path: "a.md",
    stamp: stamp(2),
  });
  expect(gitEffects(saved)).toEqual([]);
  expect(saved.effects).not.toContainEqual({
    kind: "startTimer",
    id: "gitRefresh",
    ms: 200,
  });
  expect(typed.state.git.files).toEqual({});
});

test("saves, file changes, git-dir changes, and tool exits coalesce into one status run", () => {
  const s = inRepo("a.md", "one");
  const refresh: Effect = { kind: "startTimer", id: "gitRefresh", ms: 200 };
  const triggers: Action[] = [
    { type: "saved", path: "a.md", stamp: stamp(2) },
    {
      type: "fileChanged",
      event: { kind: "changed", path: "b.md", isDir: false },
    },
    { type: "gitDirChanged" },
    { type: "toolExited", result: { kind: "exited", code: 0 } },
  ];
  for (const a of triggers)
    expect(update(s, a).effects).toContainEqual(refresh);
  const r = update(s, { type: "timer", id: "gitRefresh", now: 200 });
  expect(r.effects).toEqual([{ kind: "gitStatus", repo: REPO, prefix: "ws/" }]);
});

test("a head change retargets the watch and an index change re-reads only that file", () => {
  const two = run(
    inRepo("c.md", "three", tracked("three\n"), inRepo("a.md", "one")),
    status({ "a.md": file(), "c.md": file(), "x.md": file() }),
  ).state;
  const r = update(
    two,
    status(
      {
        "a.md": file({ index: "M", worktree: ".", hI: "h2" }),
        "c.md": file({ worktree: "D" }),
        "x.md": file({ index: "M", hI: "h9" }),
      },
      { kind: "branch", name: "feature/x" },
    ),
  );
  expect(r.effects).toEqual([
    {
      kind: "gitWatch",
      dirs: ["/repo/.git", "/repo/.git/refs/heads/feature"],
    },
    {
      kind: "gitReadIndex",
      repo: { ...REPO, head: { kind: "branch", name: "feature/x" } },
      path: "a.md",
      repoPath: "ws/a.md",
    },
  ]);
  expect(r.state.git.repo?.head).toEqual({ kind: "branch", name: "feature/x" });
  expect(r.state.git.status?.files.get("a.md")?.hI).toBe("h2");
});

test("an index entry that appears or disappears is read again", () => {
  const s = run(inRepo("a.md", "one"), status({})).state;
  const appears = update(s, status({ "a.md": file({ index: "A" }) }));
  expect(gitEffects(appears)).toEqual([
    { kind: "gitReadIndex", repo: REPO, path: "a.md", repoPath: "ws/a.md" },
  ]);
  expect(gitEffects(update(appears.state, status({})))).toHaveLength(1);
});

test("a status result after the repository is gone changes nothing", () => {
  const gone = run(inRepo("a.md", "one"), {
    type: "gitDetected",
    repo: null,
  }).state;
  const r = update(gone, status({ "a.md": file() }));
  expect(r.state).toBe(gone);
  expect(r.effects).toEqual([]);
  const read = update(gone, {
    type: "gitIndexRead",
    path: "a.md",
    entry: tracked("x\n"),
  });
  expect(read.state).toBe(gone);
});

test("a BOM-only difference is one change hunk on line 0", () => {
  const s = inRepo("a.md", "one\ntwo", tracked("﻿one\ntwo\n"));
  expect(s.git.files["a.md"]?.hunks).toEqual([
    {
      kind: "change",
      old: { start: 0, count: 1 },
      new: { start: 0, count: 1 },
      oldLines: ["one"],
    },
  ]);
});

test("a final-newline difference is one change hunk on the last line", () => {
  const s = inRepo("a.md", "one\ntwo", tracked("one\ntwo"));
  expect(s.git.files["a.md"]?.hunks).toEqual([
    {
      kind: "change",
      old: { start: 1, count: 1 },
      new: { start: 1, count: 1 },
      oldLines: ["two"],
    },
  ]);
});

test("an empty buffer saved with a newline differs from an empty index entry", () => {
  expect(inRepo("a.md", "", tracked("")).git.files["a.md"]?.hunks).toEqual([
    {
      kind: "add",
      old: { start: 0, count: 0 },
      new: { start: 0, count: 1 },
      oldLines: [],
    },
  ]);
});

test("an untracked file is one untracked hunk and an ignored one has none", () => {
  const u = inRepo("a.md", "one\ntwo", { kind: "untracked" });
  expect(u.git.files["a.md"]?.hunks.map((h) => [h.kind, h.new])).toEqual([
    ["untracked", { start: 0, count: 2 }],
  ]);
  expect(
    inRepo("a.md", "one", { kind: "ignored" }).git.files["a.md"]?.hunks,
  ).toEqual([]);
});

test("closing a buffer drops its git entry in the same step", () => {
  const s = inRepo("a.md", "one");
  const r = keys(s, ":", "b", "d", "<CR>");
  expect(r.state.buffers[1]).toBeUndefined();
  expect(r.state.git.files).toEqual({});
});

/** `<leader>` then `seq`, one key at a time. */
const leader = (s: AppState, seq: string): Result =>
  keys(s, " ", ...seq.split(""));

const withoutAutosave = (s: AppState): AppState => ({
  ...s,
  config: { ...s.config, autosave: { ...s.config.autosave, enabled: false } },
});

const NOTE = "notes/a.md";
const lines5 = "a\nb\nc\nd\ne\n";

test("staging a clean tracked hunk sends its patch with the index oid", () => {
  const s = inRepo(NOTE, "a\nB\nc\nD\ne", tracked(lines5, "oid1"));
  const r = leader(keys(s, "j", "j", "j").state, "ghs");
  expect(gitEffects(r)).toEqual([
    {
      kind: "gitStage",
      repo: REPO,
      path: NOTE,
      repoPath: "ws/notes/a.md",
      expectedOid: "oid1",
      patch:
        "diff --git a/ws/notes/a.md b/ws/notes/a.md\n" +
        "index 0000000..0000000 100644\n" +
        "--- a/ws/notes/a.md\n+++ b/ws/notes/a.md\n" +
        "@@ -4,1 +4,1 @@\n-d\n+D\n",
      report: { n: 2, m: 2, saved: false },
    },
  ]);
  expect(r.state.git.pending).toBeUndefined();
});

test("staging an untracked file asks for intent-to-add", () => {
  const s = inRepo(NOTE, "one\ntwo", { kind: "untracked" });
  const [stage] = gitEffects(leader(s, "ghs"));
  expect(stage).toMatchObject({
    kind: "gitStage",
    expectedOid: null,
    report: { n: 1, m: 1, saved: false },
  });
  expect(stage?.kind === "gitStage" && stage.patch).toEndWith(
    "@@ -0,0 +1,2 @@\n+one\n+two\n",
  );
});

test("a stale index warns and refreshes", () => {
  const s = inRepo(NOTE, "a");
  const r = update(s, {
    type: "gitStaged",
    path: NOTE,
    result: "stale",
    report: { n: 1, m: 1, saved: false },
  });
  expect(r.state.notifications.message).toEqual({
    text: "index changed; hunks refreshed",
    level: "warn",
  });
  expect(r.effects).toEqual([
    { kind: "gitReadIndex", repo: REPO, path: NOTE, repoPath: "ws/notes/a.md" },
    { kind: "startTimer", id: "gitRefresh", ms: 200 },
  ]);
});

test("a conflicted file is never staged", () => {
  const r = leader(inRepo(NOTE, "b", tracked("a\n", "o1", true)), "ghs");
  expect(gitEffects(r)).toEqual([]);
  expect(r.state.notifications.message).toEqual({
    text: "notes/a.md has conflicts; resolve them in lazygit",
    level: "error",
  });
});

test("a dirty buffer is saved before staging, and a failed save stages nothing", () => {
  const s = withoutAutosave(inRepo(NOTE, "a\nb", tracked("a\nb\n")));
  const dirty = keys(s, "A", "x", "<Esc>").state;
  const r = leader(dirty, "ghs");
  expect(gitEffects(r)).toEqual([]);
  expect(r.effects.filter((e) => e.kind === "write")).toEqual([
    { kind: "write", path: NOTE, text: "ax\nb\n", expected: stamp(1) },
  ]);
  expect(r.state.git.pending).toEqual({
    op: "stage",
    bufferId: 1,
    line: 0,
    waiting: [1],
  });
  const saved = update(r.state, { type: "saved", path: NOTE, stamp: stamp(2) });
  expect(saved.state.git.pending).toBeUndefined();
  expect(gitEffects(saved)).toMatchObject([
    {
      kind: "gitStage",
      expectedOid: "o1",
      report: { n: 1, m: 1, saved: true },
    },
  ]);
  const failed = update(r.state, {
    type: "saveFailed",
    path: NOTE,
    reason: "EACCES",
  });
  expect(failed.state.git.pending).toBeUndefined();
  expect(gitEffects(failed)).toEqual([]);
  expect(failed.state.notifications.message).toEqual({
    text: "not staged: notes/a.md could not be saved",
    level: "error",
  });
});

test("text typed while the stage save is written is saved before staging", () => {
  const s = withoutAutosave(inRepo(NOTE, "a\nb", tracked("a\nb\n")));
  const r = leader(keys(s, "A", "x", "<Esc>").state, "ghs");
  const again = keys(r.state, "A", "y", "<Esc>").state;
  const first = update(again, { type: "saved", path: NOTE, stamp: stamp(2) });
  expect(gitEffects(first)).toEqual([]);
  expect(first.effects).toContainEqual({
    kind: "write",
    path: NOTE,
    text: "axy\nb\n",
    expected: stamp(2),
  });
  const second = update(first.state, {
    type: "saved",
    path: NOTE,
    stamp: stamp(3),
  });
  expect(gitEffects(second)).toMatchObject([
    { kind: "gitStage", report: { saved: true } },
  ]);
});

test("a buffer that cannot be saved is not staged", () => {
  const s = inRepo(NOTE, "a\nb", tracked("a\nb\n"));
  const deleted = run(keys(s, "A", "x", "<Esc>").state, {
    type: "fileChanged",
    event: { kind: "removed", path: NOTE },
  }).state;
  const r = leader(deleted, "ghs");
  expect(gitEffects(r)).toEqual([]);
  expect(r.effects.some((e) => e.kind === "write")).toBe(false);
  expect(r.state.notifications.message).toEqual({
    text: "cannot save notes/a.md",
    level: "error",
  });
});

test("a second git operation while one is pending is refused", () => {
  const s = withoutAutosave(inRepo(NOTE, "a\nb", tracked("a\nb\n")));
  const pending = leader(keys(s, "A", "x", "<Esc>").state, "ghs").state;
  const r = leader(pending, "ghs");
  expect(gitEffects(r)).toEqual([]);
  expect(r.effects.some((e) => e.kind === "write")).toBe(false);
  expect(r.state.notifications.message).toEqual({
    text: "git: another operation is running",
    level: "info",
  });
  expect(r.state.git.pending).toEqual(pending.git.pending);
});

test("closing the buffer a stage waits for cancels the stage", () => {
  const s = withoutAutosave(inRepo(NOTE, "a\nb", tracked("a\nb\n")));
  const pending = leader(keys(s, "A", "x", "<Esc>").state, "ghs").state;
  const closed = keys(pending, ":", "b", "d", "!", "<CR>").state;
  expect(closed.git.pending).toBeUndefined();
});

const textOf = (s: AppState, id = 1): string[] => {
  const t = s.buffers[id]?.text;
  return t === undefined
    ? []
    : Array.from({ length: t.lineCount }, (_, i) => t.line(i));
};

test("reset restores index lines in one undo step and the final-newline flag", () => {
  const s = inRepo(NOTE, "a\nb\nX", tracked("a\nb\nc"));
  expect(s.buffers[1]?.finalNewline).toBe(true);
  const r = leader(keys(s, "G").state, "ghr");
  expect(gitEffects(r)).toEqual([]);
  expect(textOf(r.state)).toEqual(["a", "b", "c"]);
  expect(r.state.buffers[1]?.finalNewline).toBe(false);
  expect(r.state.buffers[1]?.dirty).toBe(true);
  expect(r.state.notifications.message).toEqual({
    text: "reset hunk 1/1 · buffer changed, autosave pending",
    level: "info",
  });
  expect(textOf(keys(r.state, "u").state)).toEqual(["a", "b", "X"]);
});

test("reset puts deleted lines back and removes added ones", () => {
  const deleted = inRepo(NOTE, "a\nc", tracked("a\nb\nc\n"));
  expect(textOf(leader(deleted, "ghr").state)).toEqual(["a", "b", "c"]);
  const top = inRepo(NOTE, "b\nc", tracked("a\nb\nc\n"));
  expect(textOf(leader(top, "ghr").state)).toEqual(["a", "b", "c"]);
  const end = inRepo(NOTE, "a\nb", tracked("a\nb\nc\n"));
  expect(textOf(leader(keys(end, "G").state, "ghr").state)).toEqual([
    "a",
    "b",
    "c",
  ]);
  const added = inRepo(NOTE, "a\nx\nb", tracked("a\nb\n"));
  expect(textOf(leader(keys(added, "j").state, "ghr").state)).toEqual([
    "a",
    "b",
  ]);
  const tail = inRepo(NOTE, "a\nx\ny", tracked("a\n"));
  expect(textOf(leader(keys(tail, "G").state, "ghr").state)).toEqual(["a"]);
});

test("reset and stage without a hunk or a repository say why", () => {
  const clean = inRepo(NOTE, "a\nb");
  for (const seq of ["ghs", "ghr"])
    expect(leader(clean, seq).state.notifications.message).toEqual({
      text: "no hunk at cursor",
      level: "info",
    });
  const untracked = inRepo(NOTE, "a", { kind: "untracked" });
  expect(leader(untracked, "ghr").state.notifications.message?.text).toBe(
    "no hunk at cursor",
  );
  const outside = run(fresh(), load(NOTE, "a")).state;
  for (const seq of ["ghs", "ghr"])
    expect(leader(outside, seq).state.notifications.message).toEqual({
      text: "not a git repository",
      level: "info",
    });
});

test("hunk action messages read as the accepted catalogue", () => {
  const s = inRepo("projects/so-roadmap.md", "a");
  const staged = (result: "ok" | { failed: string }, saved: boolean) =>
    update(s, {
      type: "gitStaged",
      path: "projects/so-roadmap.md",
      result,
      report: { n: 2, m: 4, saved },
    }).state.notifications.message;
  expect(staged("ok", false)).toEqual({
    text: "staged hunk 2/4",
    level: "info",
  });
  expect(staged("ok", true)).toEqual({
    text: '"projects/so-roadmap.md" written · staged hunk 2/4',
    level: "info",
  });
  expect(
    staged(
      {
        failed:
          "error: patch failed: a.md:3\nerror: a.md: patch does not apply",
      },
      false,
    ),
  ).toEqual({ text: "error: patch failed: a.md:3", level: "error" });
});

const B_NOTE = "notes/b.md";

/** Two notes in the repository, both edited and not yet saved. */
function twoDirty(): AppState {
  const one = withoutAutosave(inRepo(NOTE, "a", tracked("a\n")));
  const typed = keys(one, "A", "x", "<Esc>").state;
  const two = inRepo(B_NOTE, "b", tracked("b\n"), typed);
  return keys(two, "A", "y", "<Esc>").state;
}

const runTools = (r: Result): Effect[] =>
  r.effects.filter((e) => e.kind === "runTool");

test("opening the tool writes every dirty buffer first and then runs it at the repo top", () => {
  const r = leader(twoDirty(), "gg");
  expect(runTools(r)).toEqual([]);
  expect(
    r.effects.flatMap((e) => (e.kind === "write" ? [e.path] : [])).sort(),
  ).toEqual([NOTE, B_NOTE]);
  const first = update(r.state, { type: "saved", path: NOTE, stamp: stamp(2) });
  expect(runTools(first)).toEqual([]);
  expect(first.state.notifications.message).toBeUndefined();
  const both = update(first.state, {
    type: "saved",
    path: B_NOTE,
    stamp: stamp(2),
  });
  expect(runTools(both)).toEqual([
    { kind: "runTool", argv: ["lazygit"], cwd: "/repo" },
  ]);
  expect(both.state.notifications.message).toEqual({
    text: "2 files written · opening lazygit",
    level: "info",
  });
  expect(both.state.git.pending).toBeUndefined();
  const exited = update(both.state, {
    type: "toolExited",
    result: { kind: "exited", code: 0 },
  });
  expect(exited.state.notifications.message).toBeUndefined();
});

test("one dirty buffer names the file before opening the tool", () => {
  const s = withoutAutosave(inRepo(NOTE, "a", tracked("a\n")));
  const r = leader(keys(s, "A", "x", "<Esc>").state, "gg");
  const saved = update(r.state, { type: "saved", path: NOTE, stamp: stamp(2) });
  expect(runTools(saved)).toHaveLength(1);
  expect(saved.state.notifications.message).toEqual({
    text: '"notes/a.md" written · opening lazygit',
    level: "info",
  });
});

test("with nothing to save the tool runs at once without a message", () => {
  const s = inRepo(NOTE, "a");
  const r = leader(s, "gg");
  expect(runTools(r)).toEqual([
    { kind: "runTool", argv: ["lazygit"], cwd: "/repo" },
  ]);
  expect(r.state.notifications.message).toBeUndefined();
  const custom: AppState = {
    ...s,
    config: { ...s.config, git: { tool: ["gitui", "-l", "~/log"] } },
  };
  expect(runTools(leader(custom, "gg"))).toEqual([
    { kind: "runTool", argv: ["gitui", "-l", "~/log"], cwd: "/repo" },
  ]);
});

test("a failed or blocked save cancels the tool", () => {
  const notStarted = {
    text: "git tool not started: notes/a.md could not be saved",
    level: "error" as const,
  };
  const r = leader(twoDirty(), "gg");
  const failed = update(r.state, {
    type: "saveFailed",
    path: NOTE,
    reason: "EACCES",
  });
  expect(failed.state.git.pending).toBeUndefined();
  expect(failed.state.notifications.message).toEqual(notStarted);
  const rest = update(failed.state, {
    type: "saved",
    path: B_NOTE,
    stamp: stamp(2),
  });
  expect(runTools(rest)).toEqual([]);

  const s = inRepo(NOTE, "a", tracked("a\n"));
  const deleted = run(keys(s, "A", "x", "<Esc>").state, {
    type: "fileChanged",
    event: { kind: "removed", path: NOTE },
  }).state;
  const blocked = leader(deleted, "gg");
  expect(runTools(blocked)).toEqual([]);
  expect(blocked.effects.some((e) => e.kind === "write")).toBe(false);
  expect(blocked.state.notifications.message).toEqual(notStarted);

  const b = s.buffers[1];
  if (b === undefined) throw new Error("expected the note");
  const readOnly: AppState = {
    ...s,
    buffers: { ...s.buffers, 1: { ...b, dirty: true, readOnly: true } },
  };
  const refused = leader(readOnly, "gg");
  expect(runTools(refused)).toEqual([]);
  expect(refused.state.notifications.message).toEqual(notStarted);
});

test("without a repository or tool the user is told why", () => {
  const outside = run(fresh(), load(NOTE, "a")).state;
  const r = leader(outside, "gg");
  expect(runTools(r)).toEqual([]);
  expect(r.state.notifications.message).toEqual({
    text: "not a git repository",
    level: "info",
  });
  const missing = update(inRepo(NOTE, "a"), {
    type: "toolExited",
    result: { kind: "missing", tool: "lazygit" },
  });
  expect(missing.state.notifications.message).toEqual({
    text: "lazygit not found (git.tool)",
    level: "error",
  });
  expect(missing.effects).toEqual([]);
});

test("the tool is refused while a stage waits for its save", () => {
  const s = withoutAutosave(inRepo(NOTE, "a\nb", tracked("a\nb\n")));
  const pending = leader(keys(s, "A", "x", "<Esc>").state, "ghs").state;
  const r = leader(pending, "gg");
  expect(runTools(r)).toEqual([]);
  expect(r.state.notifications.message).toEqual({
    text: "git: another operation is running",
    level: "info",
  });
});

test("after the tool exits buffers and git state are refreshed and the message is cleared", () => {
  const s = inRepo(B_NOTE, "b", tracked("b\n"), inRepo(NOTE, "a"));
  const shown = {
    ...s,
    notifications: {
      ...s.notifications,
      message: {
        text: "2 files written · opening lazygit",
        level: "info" as const,
      },
    },
  };
  const r = update(shown, {
    type: "toolExited",
    result: { kind: "exited", code: 0 },
  });
  expect(r.state.notifications.message).toBeUndefined();
  expect(r.effects).toEqual([
    { kind: "startTimer", id: "gitRefresh", ms: 200 },
    { kind: "read", path: NOTE },
    { kind: "read", path: B_NOTE },
    { kind: "gitReadIndex", repo: REPO, path: NOTE, repoPath: "ws/notes/a.md" },
    {
      kind: "gitReadIndex",
      repo: REPO,
      path: B_NOTE,
      repoPath: "ws/notes/b.md",
    },
  ]);
});
