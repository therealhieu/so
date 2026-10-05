import { afterEach, expect, test } from "bun:test";
import { watch } from "node:fs";
import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type GitRepo, gitRepo } from "../../test/support/git-repo";
import { type GitWatcher, IGNORED_NAME, watchGitDirs } from "./git-watcher";
import type { Logger } from "./log";

const cleanups: (() => Promise<void> | void)[] = [];
afterEach(async () => {
  for (const c of cleanups.splice(0).reverse()) await c();
});

const quiet: Logger = { info() {}, error() {} };

function counted(dirs: string[], logger: Logger = quiet, watchFn = watch) {
  const c = { n: 0, w: undefined as unknown as GitWatcher };
  c.w = watchGitDirs(dirs, () => c.n++, logger, watchFn);
  cleanups.push(() => c.w.stop());
  return c;
}

async function repo(opts: { worktree?: boolean } = {}): Promise<GitRepo> {
  const r = await gitRepo({ "a.md": "a\n" }, opts);
  cleanups.push(() => r.cleanup());
  return r;
}

async function within(pred: () => boolean, ms: number): Promise<void> {
  const until = performance.now() + ms;
  while (!pred()) {
    if (performance.now() > until) throw new Error(`not within ${ms} ms`);
    await Bun.sleep(5);
  }
}

/** Long enough for a first-level event to arrive on every platform. */
const quietPeriod = () => Bun.sleep(300);

test("lock, cookie, and commit-message names are ignored", () => {
  for (const name of [
    "index.lock",
    "HEAD.lock",
    "refs/heads/main.lock",
    ".watchman-cookie-host-1",
    "COMMIT_EDITMSG",
  ])
    expect(IGNORED_NAME.test(name)).toBe(true);
  for (const name of ["index", "HEAD", "main", "ORIG_HEAD", "packed-refs"])
    expect(IGNORED_NAME.test(name)).toBe(false);
});

test("a commit notifies within a second, including a linked worktree, and lock files never do", async () => {
  const r = await repo();
  const gitDir = join(r.root, ".git");
  const c = counted([gitDir, gitDir, join(gitDir, "refs", "heads")]);
  // macOS can deliver the repository's creation late; start counting after it.
  await quietPeriod();
  c.n = 0;
  await writeFile(join(gitDir, "index.lock"), "");
  await rm(join(gitDir, "index.lock"));
  await quietPeriod();
  expect(c.n).toBe(0);
  await r.write("a.md", "changed\n");
  await r.run(["commit", "-qam", "change"]);
  await within(() => c.n >= 1, 1000);

  const wt = await repo({ worktree: true });
  const common = join(wt.main, ".git");
  const own = counted([join(common, "worktrees", "wt")]);
  const shared = counted([common, join(common, "refs", "heads")]);
  await quietPeriod();
  own.n = 0;
  shared.n = 0;
  await wt.write("a.md", "in the worktree\n");
  await wt.run(["commit", "-qam", "worktree change"]);
  await within(() => own.n >= 1 && shared.n >= 1, 1000);
});

test("a failing directory is logged and the others keep notifying after retarget", async () => {
  const base = await realpath(await mkdtemp(join(tmpdir(), "so-gitwatch-")));
  cleanups.push(() => rm(base, { recursive: true, force: true }));
  const [a, b, c] = ["a", "b", "c"].map((n) => join(base, n)) as [
    string,
    string,
    string,
  ];
  for (const dir of [a, b, c]) await mkdir(dir);
  const logged: { event: string; dir: unknown }[] = [];
  const logger: Logger = {
    info() {},
    error: (event, fields) => logged.push({ event, dir: fields?.dir }),
  };
  const failing = ((dir: string, ...rest: unknown[]) => {
    if (dir === a) throw new Error("EMFILE: too many open files");
    return (watch as (...args: unknown[]) => ReturnType<typeof watch>)(
      dir,
      ...rest,
    );
  }) as typeof watch;
  const w = counted([a, b], logger, failing);
  expect(logged).toEqual([{ event: "git.watch.fail", dir: a }]);
  await quietPeriod();
  w.n = 0;
  await writeFile(join(b, "HEAD"), "1");
  await within(() => w.n >= 1, 1000);

  w.w.retarget([c]);
  await quietPeriod();
  w.n = 0;
  await writeFile(join(b, "HEAD"), "2");
  await quietPeriod();
  expect(w.n).toBe(0);
  await writeFile(join(c, "HEAD"), "1");
  await within(() => w.n >= 1, 1000);

  w.w.stop();
  await quietPeriod();
  w.n = 0;
  await writeFile(join(c, "HEAD"), "2");
  await quietPeriod();
  expect(w.n).toBe(0);
});
