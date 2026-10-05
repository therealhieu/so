import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/**
 * An environment that keeps Git away from the user's and the system's
 * configuration, with a fixed identity, so temp repos behave the same on
 * every machine.
 */
function isolatedEnv(home: string): Record<string, string> {
  return {
    PATH: process.env.PATH ?? "/usr/bin:/bin",
    HOME: home,
    LANG: "C",
    LC_ALL: "C",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: join(home, ".gitconfig"),
    GIT_AUTHOR_NAME: "Ada",
    GIT_AUTHOR_EMAIL: "ada@example.com",
    GIT_COMMITTER_NAME: "Ada",
    GIT_COMMITTER_EMAIL: "ada@example.com",
  };
}

export type GitRepo = {
  /** The working tree the test uses: the repository, or its linked worktree. */
  root: string;
  /** The main repository; equal to `root` without a worktree. */
  main: string;
  env: Record<string, string>;
  /** Run git in `root` (or `cwd`); rejects on a non-zero exit. */
  run(args: string[], o?: { cwd?: string; stdin?: string }): Promise<string>;
  /** Write a file relative to `root`, creating its folders. */
  write(path: string, text: string): Promise<void>;
  cleanup(): Promise<void>;
};

/**
 * A temp repository on branch `main` holding `files`, committed unless
 * `commit` is false. With `worktree`, `root` is a linked worktree on branch
 * `wt` beside the main repository.
 */
export async function gitRepo(
  files: Record<string, string> = {},
  opts: { commit?: boolean; worktree?: boolean } = {},
): Promise<GitRepo> {
  const home = await realpath(await mkdtemp(join(tmpdir(), "so-git-")));
  const main = join(home, "repo");
  await mkdir(main);
  const env = isolatedEnv(home);
  await writeFile(env.GIT_CONFIG_GLOBAL as string, "");
  const git = async (
    args: string[],
    o: { cwd?: string; stdin?: string } = {},
  ): Promise<string> => {
    const p = Bun.spawn(["git", ...args], {
      cwd: o.cwd ?? main,
      env,
      stdin: o.stdin === undefined ? "ignore" : Buffer.from(o.stdin),
      stdout: "pipe",
      stderr: "pipe",
    });
    const [out, err, code] = await Promise.all([
      new Response(p.stdout).text(),
      new Response(p.stderr).text(),
      p.exited,
    ]);
    if (code !== 0)
      throw new Error(`git ${args.join(" ")} failed (${code}): ${err}`);
    return out;
  };
  const writeIn = async (base: string, path: string, text: string) => {
    await mkdir(dirname(join(base, path)), { recursive: true });
    await writeFile(join(base, path), text);
  };
  await git(["init", "-q", "-b", "main"]);
  for (const [path, text] of Object.entries(files))
    await writeIn(main, path, text);
  if (opts.commit !== false) {
    await git(["add", "-A"]);
    await git(["commit", "-q", "--allow-empty", "-m", "init"]);
  }
  let root = main;
  if (opts.worktree === true) {
    root = join(home, "wt");
    await git(["worktree", "add", "-q", "-b", "wt", root]);
  }
  return {
    root,
    main,
    env,
    run: (args, o = {}) => git(args, { ...o, cwd: o.cwd ?? root }),
    write: (path, text) => writeIn(root, path, text),
    cleanup: () => rm(home, { recursive: true, force: true }),
  };
}
