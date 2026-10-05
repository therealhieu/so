// A sandbox profile: a named, reproducible scenario for checking end-to-end
// journeys by hand. Profiles are staged once into `.sandbox/<name>/vault`.
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

/** A manual check: what to do and what to see. */
export type Journey = { title: string; steps: string[]; expect: string[] };

export type Profile = {
  /** Kebab-case, unique; the value of `--profile`. */
  name: string;
  /** One line, shown by `--list`. */
  summary: string;
  /** `config.toml` text, written at stage time; none runs so with defaults. */
  config?: string;
  /** The folder so opens, relative to the vault; the vault itself when absent. */
  open?: string;
  journeys: Journey[];
  /** Write the vault's content into the empty folder `vault`. */
  stage(vault: string): void | Promise<void>;
};

/**
 * Replace the first `before` in `file` with `after`. Throws when `before` is
 * missing, so a fixture change cannot silently skip an edit.
 */
export function edit(file: string, before: string, after: string): void {
  const text = readFileSync(file, "utf8");
  if (!text.includes(before)) throw new Error(`${file}: no "${before}"`);
  writeFileSync(file, text.replace(before, after));
}

export const fixtures = join(import.meta.dir, "../../test/fixtures");

/** Copy `from` (relative to the test fixtures) to `to`, skipping entries named in `skip`. */
export function copyFixture(
  from: string,
  to: string,
  skip: ReadonlySet<string> = new Set(),
): void {
  cpSync(join(fixtures, from), to, {
    recursive: true,
    filter: (src) => !skip.has(basename(src)),
  });
}

/** Write each `path → text` under `root`, creating folders. */
export function writeFiles(root: string, files: Record<string, string>): void {
  for (const [path, text] of Object.entries(files)) {
    const file = join(root, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text);
  }
}

/** Local `YYYY-MM-DD` for `daysAgo` days before today. */
export function localDay(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Run git in `cwd` away from the user's and the system's configuration, with
 * a fixed identity and `date`, so staged history is the same on every machine.
 * Throws on a non-zero exit unless `allowFailure` (for an expected conflict).
 */
export function git(
  cwd: string,
  args: string[],
  { date = "2026-01-01T09:00:00Z", allowFailure = false } = {},
): void {
  const proc = Bun.spawnSync(["git", ...args], {
    cwd,
    env: {
      PATH: process.env.PATH ?? "/usr/bin:/bin",
      HOME: cwd,
      LANG: "C",
      LC_ALL: "C",
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_AUTHOR_NAME: "Ada",
      GIT_AUTHOR_EMAIL: "ada@example.com",
      GIT_AUTHOR_DATE: date,
      GIT_COMMITTER_NAME: "Ada",
      GIT_COMMITTER_EMAIL: "ada@example.com",
      GIT_COMMITTER_DATE: date,
    },
    stdout: "ignore",
    stderr: "pipe",
  });
  if (proc.exitCode !== 0 && !allowFailure)
    throw new Error(`git ${args.join(" ")}: ${proc.stderr.toString().trim()}`);
}

/** A repository on branch `main` in `dir` with everything in it committed. */
export function initRepo(dir: string, message = "Import notes"): void {
  git(dir, ["init", "--quiet", "--initial-branch=main"]);
  git(dir, ["add", "--all"]);
  git(dir, ["commit", "--quiet", `--message=${message}`]);
}
