import { afterEach, expect, test } from "bun:test";
import { statSync, utimesSync } from "node:fs";
import { join } from "node:path";
import { type GitRepo, gitRepo } from "../../test/support/git-repo";
import type { RepoInfo } from "../core/state/types";
import { bunGitSpawn, createGit, type GitSpawn, parseVersion } from "./git";
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
