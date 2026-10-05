import { afterEach, expect, test } from "bun:test";
import { statSync, utimesSync } from "node:fs";
import { join } from "node:path";
import { type GitRepo, gitRepo } from "../../test/support/git-repo";
import { diffLines } from "../core/features/git/diff";
import type { IndexText } from "../core/features/git/index-text";
import { hunkPatch } from "../core/features/git/patch";
import type { IndexEntry, RepoInfo } from "../core/state/types";
import {
  BASE,
  bunGitSpawn,
  createGit,
  type GitSpawn,
  parseVersion,
} from "./git";
import type { Logger } from "./log";

type Logged = { event: string; fields?: Record<string, unknown> };

const repos: GitRepo[] = [];
afterEach(async () => {
  for (const r of repos.splice(0)) await r.cleanup();
});

async function repo(
  files: Record<string, string> = {},
  opts: { commit?: boolean; worktree?: boolean } = {},
): Promise<GitRepo> {
  const r = await gitRepo(files, opts);
  repos.push(r);
  return r;
}

function recordingLogger(): Logger & { logged: Logged[] } {
  const logged: Logged[] = [];
  return {
    logged,
    info: () => {},
    error: (event, fields) =>
      logged.push(fields === undefined ? { event } : { event, fields }),
  };
}

/** The adapter over real git, isolated from the user's configuration. */
function gitIn(r: GitRepo, logger: Logger = recordingLogger()) {
  return createGit({
    spawn: bunGitSpawn(r.env),
    which: (c) => Bun.which(c),
    logger,
  });
}

async function detected(r: GitRepo, dir = r.root): Promise<RepoInfo> {
  const { repo } = await gitIn(r).detect(dir);
  if (repo === null) throw new Error("no repository detected");
  return repo;
}

test("detect resolves a subfolder prefix, a linked worktree, and an unborn branch", async () => {
  const sub = await repo({ "notes/a.md": "a\n", "top.md": "t\n" });
  expect(await detected(sub, join(sub.root, "notes"))).toEqual({
    top: sub.root,
    gitDir: join(sub.root, ".git"),
    commonDir: join(sub.root, ".git"),
    prefix: "notes/",
    head: { kind: "branch", name: "main" },
  });
  expect((await detected(sub)).prefix).toBe("");

  const wt = await repo({ "a.md": "a\n" }, { worktree: true });
  const linked = await detected(wt);
  expect(linked.top).toBe(wt.root);
  expect(linked.commonDir).toBe(join(wt.main, ".git"));
  expect(linked.gitDir).toBe(join(wt.main, ".git", "worktrees", "wt"));
  expect(linked.head).toEqual({ kind: "branch", name: "wt" });

  const unborn = await repo({}, { commit: false });
  expect((await detected(unborn)).head).toEqual({
    kind: "unborn",
    name: "main",
  });

  const detached = await repo({ "a.md": "a\n" });
  await detached.run(["checkout", "-q", "--detach"]);
  const sha = (await detached.run(["rev-parse", "--short", "HEAD"])).trim();
  expect((await detected(detached)).head).toEqual({
    kind: "detached",
    short: sha,
  });
});

test("detect gates old git and stays silent without git or outside a repository", async () => {
  expect(parseVersion("git version 2.39.3 (Apple Git-146)")).toEqual([
    2, 39, 3,
  ]);
  expect(parseVersion("git version 2.31.0.windows.1")).toEqual([2, 31, 0]);
  expect(parseVersion("git version 2.45")).toEqual([2, 45, 0]);
  expect(parseVersion("not git")).toBeNull();

  const calls: string[][] = [];
  const old: GitSpawn = async (argv) => {
    calls.push(argv);
    return { code: 0, stdout: "git version 2.20.1\n", stderr: "" };
  };
  const logger = recordingLogger();
  expect(
    await createGit({ spawn: old, which: () => "/usr/bin/git", logger }).detect(
      "/w",
    ),
  ).toEqual({
    repo: null,
    notice: "git 2.20.1 is older than 2.31; git features off",
  });
  expect(calls).toHaveLength(1);

  const none: GitSpawn = async () => {
    throw new Error("spawned without git");
  };
  expect(
    await createGit({ spawn: none, which: () => null, logger }).detect("/w"),
  ).toEqual({ repo: null });

  const outside = await repo();
  const plain = join(outside.main, "..");
  expect(await gitIn(outside, logger).detect(plain)).toEqual({ repo: null });
  expect(logger.logged).toEqual([]);
});

test("reads never touch the index file", async () => {
  const r = await repo({ "a.md": "one\ntwo\n", "b.md": "b\n" });
  const g = gitIn(r);
  const info = await detected(r);
  // A tracked file whose stat no longer matches the index makes a locking
  // status rewrite the index to refresh it.
  const future = new Date(Date.now() + 60_000);
  utimesSync(join(r.root, "a.md"), future, future);
  const index = join(r.root, ".git", "index");
  const before = statSync(index).mtimeMs;
  await g.status(info);
  await g.readIndex(info, "a.md");
  await g.blame(info, "a.md", 0, "one\ntwo\n");
  expect(statSync(index).mtimeMs).toBe(before);
});

test("status is scoped to the workspace prefix and reads the operation", async () => {
  const r = await repo({ "notes/a.md": "a\n", "top.md": "t\n" });
  await r.write("notes/a.md", "changed\n");
  await r.write("top.md", "changed\n");
  await r.write("notes/new.md", "n\n");
  const info = await detected(r, join(r.root, "notes"));
  const st = await gitIn(r).status(info);
  expect([...st.files.keys()].sort()).toEqual(["a.md", "new.md"]);
  expect(st.head).toEqual({ kind: "branch", name: "main" });
  expect(st.op).toBeUndefined();

  await r.run(["checkout", "-q", "-b", "side"]);
  await r.write("notes/a.md", "side\n");
  await r.run(["commit", "-qam", "side"]);
  await r.run(["checkout", "-q", "main"]);
  await r.write("notes/a.md", "main\n");
  await r.run(["commit", "-qam", "main"]);
  await r.run(["merge", "-q", "side"]).catch(() => {});
  const merging = await gitIn(r).status(info);
  expect(merging.op).toBe("merging");
  expect(merging.files.get("a.md")?.conflict).toBe(true);

  await r.run(["merge", "--abort"]);
  await r.run(["checkout", "-q", "side"]);
  await r.run(["rebase", "main"]).catch(() => {});
  expect((await gitIn(r).status(info)).op).toBe("rebasing");
});

test("index reads classify ignored, untracked, and conflicted files, and blame of an unsaved line is uncommitted", async () => {
  const r = await repo({
    ".gitignore": "skip.md\n",
    "a.md": "one\r\ntwo\r\n",
    "c.md": "base\n",
  });
  await r.write("skip.md", "s\n");
  await r.write("new.md", "n\n");
  const logger = recordingLogger();
  const g = gitIn(r, logger);
  const info = await detected(r);

  expect(await g.readIndex(info, "skip.md")).toEqual({ kind: "ignored" });
  expect(await g.readIndex(info, "missing.md")).toEqual({ kind: "ignored" });
  expect(await g.readIndex(info, "new.md")).toEqual({ kind: "untracked" });
  const oid = (await r.run(["rev-parse", ":a.md"])).trim();
  expect(await g.readIndex(info, "a.md")).toEqual({
    kind: "tracked",
    oid,
    mode: "100644",
    conflicted: false,
    text: {
      lines: ["one", "two"],
      finalNewline: true,
      bom: false,
      eol: "\r\n",
    },
  });

  await r.run(["checkout", "-q", "-b", "side"]);
  await r.write("c.md", "theirs\n");
  await r.run(["commit", "-qam", "side"]);
  await r.run(["checkout", "-q", "main"]);
  await r.write("c.md", "ours\n");
  await r.run(["commit", "-qam", "main"]);
  await r.run(["merge", "-q", "side"]).catch(() => {});
  const conflicted = await g.readIndex(info, "c.md");
  expect(conflicted).toMatchObject({ kind: "tracked", conflicted: true });
  expect(conflicted.kind === "tracked" && conflicted.text.lines).toEqual([
    "ours",
  ]);

  const committed = await g.blame(info, "a.md", 0, "one\r\ntwo\r\n");
  expect(committed).toMatchObject({
    committed: true,
    author: "Ada",
    summary: "init",
  });
  expect(await g.blame(info, "a.md", 1, "one\r\ntyped\r\ntwo\r\n")).toEqual({
    committed: false,
  });

  await expect(g.blame(info, "nowhere.md", 0, "x\n")).rejects.toThrow();
  expect(logger.logged).toHaveLength(1);
  expect(logger.logged[0]).toMatchObject({
    event: "git.fail",
    fields: { command: "blame --porcelain", code: 128 },
  });
  expect(String(logger.logged[0]?.fields?.reason)).toStartWith("fatal:");
});

test("an index entry that starts with a BOM keeps it", async () => {
  const r = await repo({ "a.md": "﻿hello\nworld\n" });
  const g = gitIn(r);
  const info = await detected(r);
  expect(tracked(await g.readIndex(info, "a.md")).text).toEqual({
    lines: ["hello", "world"],
    finalNewline: true,
    bom: true,
    eol: "\n",
  });
  expect(await g.blame(info, "a.md", 0, "﻿hello\nworld\n")).toMatchObject({
    committed: true,
    summary: "init",
  });
});

/** A file's text in the buffer's line model. */
const bufferOf = (text: string) => {
  const lf = text.replaceAll("\r\n", "\n");
  const finalNewline = lf.endsWith("\n");
  return {
    lines: (finalNewline ? lf.slice(0, -1) : lf).split("\n"),
    finalNewline,
    bom: false,
  };
};

const tracked = (e: IndexEntry) => {
  if (e.kind !== "tracked") throw new Error(`entry is ${e.kind}`);
  return e;
};

const TEN = `${Array.from({ length: 10 }, (_, i) => `line ${i + 1}`).join("\n")}\n`;

test("staging one of two hunks stages exactly that hunk", async () => {
  const r = await repo({ "notes/a.md": TEN });
  const info = await detected(r, join(r.root, "notes"));
  const g = gitIn(r);
  const saved = TEN.replace("line 2\n", "line two\n").replace(
    "line 8\n",
    "line eight\n",
  );
  await r.write("notes/a.md", saved);
  const entry = tracked(await g.readIndex(info, "notes/a.md"));
  const cur = bufferOf(saved);
  const hunks = diffLines(entry.text.lines, cur.lines);
  expect(hunks).toHaveLength(2);
  const first = hunks[0] as (typeof hunks)[0];
  const patch = hunkPatch("notes/a.md", entry.mode, first, entry.text, cur);

  expect(
    await g.stage(info, {
      repoPath: "notes/a.md",
      expectedOid: entry.oid,
      patch,
    }),
  ).toBe("ok");
  const cached = await r.run(["diff", "--cached", "-U0"]);
  expect(cached).toContain("-line 2\n+line two\n");
  expect(cached).not.toContain("eight");
  const unstaged = await r.run(["diff", "-U0"]);
  expect(unstaged).toContain("-line 8\n+line eight\n");
  expect(unstaged).not.toContain("two");
});

test("staging an untracked file and a CRLF line stage only the hunk", async () => {
  const r = await repo({ "a.md": TEN });
  const info = await detected(r);
  const g = gitIn(r);
  await r.write("new.md", "first\r\nsecond\r\n");
  expect(await g.readIndex(info, "new.md")).toEqual({ kind: "untracked" });
  // An untracked file is staged against an empty entry in its own ending.
  const cur = bufferOf("first\r\nsecond\r\n");
  const [whole] = diffLines([], cur.lines, { untracked: true });
  if (whole === undefined) throw new Error("no hunk");
  const empty: IndexText = {
    lines: [],
    finalNewline: false,
    bom: false,
    eol: "\r\n",
  };
  const patch = hunkPatch("new.md", "100644", whole, empty, cur);
  expect(
    await g.stage(info, { repoPath: "new.md", expectedOid: null, patch }),
  ).toBe("ok");
  expect(await r.run(["show", ":new.md"])).toBe("first\r\nsecond\r\n");
  await r.write("new.md", "first\r\nsecond\r\nthird\r\n");
  expect(await r.run(["status", "--porcelain", "--", "new.md"])).toBe(
    "AM new.md\n",
  );

  const crlf = await repo({ "c.md": "one\ntwo\nthree\n" });
  await crlf.run(["config", "core.autocrlf", "true"]);
  const cinfo = await detected(crlf);
  const cg = gitIn(crlf);
  const saved = "one\r\nTWO\r\nthree\r\n";
  await crlf.write("c.md", saved);
  const entry = tracked(await cg.readIndex(cinfo, "c.md"));
  const ccur = bufferOf(saved);
  const hunks = diffLines(entry.text.lines, ccur.lines);
  expect(hunks).toHaveLength(1);
  const h = hunks[0] as (typeof hunks)[0];
  expect(
    await cg.stage(cinfo, {
      repoPath: "c.md",
      expectedOid: entry.oid,
      patch: hunkPatch("c.md", entry.mode, h, entry.text, ccur),
    }),
  ).toBe("ok");
  expect(await crlf.run(["diff", "--cached", "--numstat"])).toBe(
    "1\t1\tc.md\n",
  );
  expect(await crlf.run(["show", ":c.md"])).toBe("one\nTWO\nthree\n");
  expect(await crlf.run(["diff", "--numstat"])).toBe("");
});

test("a changed index entry stages nothing", async () => {
  const r = await repo({ "a.md": TEN });
  const info = await detected(r);
  const g = gitIn(r);
  const entry = tracked(await g.readIndex(info, "a.md"));
  const saved = TEN.replace("line 2\n", "line two\n");
  await r.write("a.md", saved);
  const cur = bufferOf(saved);
  const [h] = diffLines(entry.text.lines, cur.lines);
  if (h === undefined) throw new Error("no hunk");
  const patch = hunkPatch("a.md", entry.mode, h, entry.text, cur);
  // Another writer stages a different change first.
  await r.write("a.md", TEN.replace("line 9\n", "line nine\n"));
  await r.run(["add", "a.md"]);
  const before = await r.run(["ls-files", "-s"]);
  expect(
    await g.stage(info, { repoPath: "a.md", expectedOid: entry.oid, patch }),
  ).toBe("stale");
  expect(await r.run(["ls-files", "-s"])).toBe(before);
});

test("an untracked file added elsewhere stages nothing", async () => {
  const r = await repo({ "a.md": TEN });
  const info = await detected(r);
  const g = gitIn(r);
  const text = "first\nsecond\n";
  await r.write("new.md", text);
  const cur = bufferOf(text);
  const [whole] = diffLines([], cur.lines, { untracked: true });
  if (whole === undefined) throw new Error("no hunk");
  const empty: IndexText = {
    lines: [],
    finalNewline: false,
    bom: false,
    eol: "\n",
  };
  const patch = hunkPatch("new.md", "100644", whole, empty, cur);
  // Another writer adds the file before the stage runs.
  await r.run(["add", "new.md"]);
  const before = await r.run(["ls-files", "-s"]);
  expect(
    await g.stage(info, { repoPath: "new.md", expectedOid: null, patch }),
  ).toBe("stale");
  expect(await r.run(["ls-files", "-s"])).toBe(before);
  expect(await r.run(["show", ":new.md"])).toBe(text);
});

const ALLOWED = new Set([
  "--version",
  "rev-parse",
  "symbolic-ref",
  "status",
  "ls-files",
  "cat-file",
  "blame",
  "add",
  "apply",
]);

test("every git call uses an allowed subcommand and keeps contents on stdin", async () => {
  const r = await repo({ "a.md": TEN, "notes/b.md": "b\n" });
  const real = bunGitSpawn(r.env);
  const calls: { argv: string[]; stdin?: string }[] = [];
  const spawn: GitSpawn = (argv, o) => {
    calls.push(o.stdin === undefined ? { argv } : { argv, stdin: o.stdin });
    return real(argv, o);
  };
  const g = createGit({
    spawn,
    which: (c) => Bun.which(c),
    logger: recordingLogger(),
  });
  const { repo: info } = await g.detect(join(r.root, "notes"));
  if (info === null) throw new Error("no repository detected");
  await g.status(info);
  const saved = TEN.replace("line 2\n", "line two\n");
  await r.write("a.md", saved);
  const entry = tracked(await g.readIndex(info, "a.md"));
  const cur = bufferOf(saved);
  const [h] = diffLines(entry.text.lines, cur.lines);
  if (h === undefined) throw new Error("no hunk");
  const patch = hunkPatch("a.md", entry.mode, h, entry.text, cur);
  await g.stage(info, { repoPath: "a.md", expectedOid: entry.oid, patch });
  await r.write("notes/new.md", "new\n");
  const newPatch = hunkPatch(
    "notes/new.md",
    "100644",
    {
      kind: "untracked",
      old: { start: 0, count: 0 },
      new: { start: 0, count: 1 },
      oldLines: [],
    },
    { lines: [], finalNewline: false, bom: false, eol: "\n" },
    bufferOf("new\n"),
  );
  await g.stage(info, {
    repoPath: "notes/new.md",
    expectedOid: null,
    patch: newPatch,
  });
  const contents = "line 1\nunsaved\nline 2\n";
  await g.blame(info, "a.md", 1, contents);

  const subcommands = new Set<string>();
  for (const { argv, stdin } of calls) {
    expect(argv.slice(0, BASE.length)).toEqual(BASE);
    const [sub = "", ...rest] = argv.slice(BASE.length);
    subcommands.add(sub);
    expect(ALLOWED.has(sub)).toBe(true);
    if (sub === "add") expect(rest[0]).toBe("--intent-to-add");
    if (sub === "apply") expect(rest[0]).toBe("--cached");
    for (const arg of argv) {
      expect(arg).not.toContain("\n");
      expect(arg).not.toContain("line two");
      expect(arg).not.toContain("unsaved");
    }
    if (sub === "apply") expect([patch, newPatch]).toContain(stdin as string);
    else if (sub === "blame") expect(stdin).toBe(contents);
    else expect(stdin).toBeUndefined();
  }
  expect([...subcommands].sort()).toEqual([...ALLOWED].sort());
});
