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

const tracked = (text: string, oid = "o1"): IndexEntry => ({
  kind: "tracked",
  oid,
  mode: "100644",
  conflicted: false,
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
