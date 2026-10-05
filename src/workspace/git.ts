import { existsSync } from "node:fs";
import { join } from "node:path";
import { type BlameLine, parseBlame } from "../core/features/git/blame";
import { normalizeIndexText } from "../core/features/git/index-text";
import {
  parseStatus,
  type RepoHead,
  type RepoStatus,
} from "../core/features/git/status";
import type { IndexEntry, RepoInfo } from "../core/state/types";
import type { Logger } from "./log";

/** Runs one argv (never through a shell) and reads its output fully. */
export type GitSpawn = (
  argv: string[],
  o: { cwd: string; stdin?: string },
) => Promise<{ code: number; stdout: string; stderr: string }>;

/**
 * Every Git call so makes. Only `stage` writes the index; reads pass
 * `--no-optional-locks`, so they never refresh it either.
 */
export type Git = {
  detect(root: string): Promise<{ repo: RepoInfo | null; notice?: string }>;
  status(repo: RepoInfo): Promise<RepoStatus>;
  /** The index entry of `repoPath` (relative to the repository top). */
  readIndex(repo: RepoInfo, repoPath: string): Promise<IndexEntry>;
  /**
   * Apply `patch` to the index while the entry's oid is `expectedOid`;
   * `null` means the file has no entry, and adds it with intent-to-add first.
   */
  stage(
    repo: RepoInfo,
    e: { repoPath: string; expectedOid: string | null; patch: string },
  ): Promise<"ok" | "stale">;
  /** Blame 0-based `line` of `contents`, the buffer's unsaved text. */
  blame(
    repo: RepoInfo,
    repoPath: string,
    line: number,
    contents: string,
  ): Promise<BlameLine>;
};

/** The oldest Git with every flag and output format the adapter uses. */
export const MIN_GIT = [2, 31, 0] as const;

/** Lock-free, literal, uncoloured, unquoted, and never collecting garbage. */
export const BASE = [
  "git",
  "--no-optional-locks",
  "--literal-pathspecs",
  "-c",
  "core.quotepath=off",
  "-c",
  "color.ui=false",
  "-c",
  "gc.auto=0",
];

/** `"git version 2.39.3 (Apple Git-146)"` → `[2, 39, 3]`; null when there is no version. */
export function parseVersion(text: string): [number, number, number] | null {
  const m = /(\d+)\.(\d+)(?:\.(\d+))?/.exec(text);
  if (m === null) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3] ?? 0)];
}

const older = (v: readonly number[], min: readonly number[]): boolean => {
  for (let i = 0; i < min.length; i++) {
    const a = v[i] ?? 0;
    const b = min[i] ?? 0;
    if (a !== b) return a < b;
  }
  return false;
};

/** UTF-8 that keeps a leading BOM: blob output is file content, BOM included. */
const utf8 = new TextDecoder("utf-8", { ignoreBOM: true });
const decode = async (s: ReadableStream<Uint8Array>): Promise<string> =>
  utf8.decode(await new Response(s).arrayBuffer());

/** Bun's spawn with `env` (the process environment by default). */
export function bunGitSpawn(
  env: Record<string, string | undefined> = process.env,
): GitSpawn {
  return async (argv, o) => {
    const p = Bun.spawn(argv, {
      cwd: o.cwd,
      env,
      stdin: o.stdin === undefined ? "ignore" : Buffer.from(o.stdin),
      stdout: "pipe",
      stderr: "pipe",
    });
    const [stdout, stderr, code] = await Promise.all([
      decode(p.stdout),
      decode(p.stderr),
      p.exited,
    ]);
    return { code, stdout, stderr };
  };
}

/** One `ls-files -s --eol` record: an index stage, or an untracked file. */
type Listed =
  | { staged: true; mode: string; oid: string; stage: number; eol: string }
  | { staged: false };

const STAGED = /^(\d+) ([0-9a-f]+) (\d)\ti\/(\S*)/;

function parseListing(z: string): Listed[] {
  const out: Listed[] = [];
  for (const rec of z.split("\0")) {
    if (rec === "") continue;
    const m = STAGED.exec(rec);
    out.push(
      m === null
        ? { staged: false }
        : {
            staged: true,
            mode: m[1] ?? "",
            oid: m[2] ?? "",
            stage: Number(m[3]),
            eol: m[4] ?? "",
          },
    );
  }
  return out;
}

const eolAttr = (eol: string): "lf" | "crlf" | "mixed" | "none" =>
  eol === "lf" || eol === "crlf" || eol === "mixed" ? eol : "none";

const firstLine = (text: string): string =>
  text.split("\n").find((l) => l.trim() !== "") ?? "";

export function createGit(d: {
  spawn?: GitSpawn;
  which: (c: string) => string | null;
  logger: Logger;
}): Git {
  const spawn = d.spawn ?? bunGitSpawn();

  /** Run `git <args>`; a non-zero exit is logged and thrown with its first stderr line. */
  const run = async (
    cwd: string,
    args: string[],
    stdin?: string,
  ): Promise<string> => {
    const r = await spawn(
      [...BASE, ...args],
      stdin === undefined ? { cwd } : { cwd, stdin },
    );
    if (r.code === 0) return r.stdout;
    const reason = firstLine(r.stderr) || `git exited with ${r.code}`;
    d.logger.error("git.fail", {
      command: args.slice(0, 2).join(" "),
      code: r.code,
      reason,
    });
    throw new Error(reason);
  };

  /** Like `run`, but a non-zero exit is an answer (`null`), not a failure. */
  const probe = async (cwd: string, args: string[]): Promise<string | null> => {
    const r = await spawn([...BASE, ...args], { cwd });
    return r.code === 0 ? r.stdout : null;
  };

  /** The index stages of `repoPath`, plus a record for it when `others` and untracked. */
  const listed = async (repo: RepoInfo, repoPath: string, others: boolean) =>
    parseListing(
      await run(repo.top, [
        "ls-files",
        "-z",
        "-s",
        "--eol",
        ...(others ? ["--others", "--exclude-standard"] : []),
        "--",
        repoPath,
      ]),
    );

  const headOf = async (cwd: string): Promise<RepoHead> => {
    const ref = await probe(cwd, ["symbolic-ref", "-q", "HEAD"]);
    const short = await probe(cwd, [
      "rev-parse",
      "--short",
      "-q",
      "--verify",
      "HEAD",
    ]);
    if (ref === null) return { kind: "detached", short: (short ?? "").trim() };
    const name = ref.trim().replace(/^refs\/heads\//, "");
    return { kind: short === null ? "unborn" : "branch", name };
  };

  return {
    detect: async (root) => {
      if (d.which("git") === null) return { repo: null };
      try {
        const version = (await run(root, ["--version"])).trim();
        const v = parseVersion(version);
        if (v === null || older(v, MIN_GIT)) {
          const shown = v === null ? version : v.join(".");
          return {
            repo: null,
            notice: `git ${shown} is older than ${MIN_GIT[0]}.${MIN_GIT[1]}; git features off`,
          };
        }
        const paths = await probe(root, [
          "rev-parse",
          "--path-format=absolute",
          "--show-toplevel",
          "--git-dir",
          "--git-common-dir",
          "--show-prefix",
        ]);
        if (paths === null) return { repo: null };
        const [top = "", gitDir = "", commonDir = "", prefix = ""] =
          paths.split("\n");
        if (top === "") return { repo: null };
        return {
          repo: { top, gitDir, commonDir, prefix, head: await headOf(root) },
        };
      } catch {
        return { repo: null };
      }
    },

    status: async (repo) => {
      const z = await run(repo.top, [
        "status",
        "--porcelain=v2",
        "-z",
        "--branch",
        "-uall",
        "--",
        repo.prefix === "" ? "." : repo.prefix,
      ]);
      const status = parseStatus(z, repo.prefix);
      const at = (name: string) => existsSync(join(repo.gitDir, name));
      if (at("rebase-merge") || at("rebase-apply")) status.op = "rebasing";
      else if (at("MERGE_HEAD")) status.op = "merging";
      return status;
    },

    readIndex: async (repo, repoPath) => {
      const entries = await listed(repo, repoPath, true);
      if (entries.length === 0) return { kind: "ignored" };
      const stages = entries.filter((e) => e.staged);
      if (stages.length === 0) return { kind: "untracked" };
      // A conflicted file shows our side (stage 2) when it has one.
      const e =
        stages.find((x) => x.stage === 2) ?? (stages[0] as (typeof stages)[0]);
      const text = await run(repo.top, ["cat-file", "blob", e.oid]);
      return {
        kind: "tracked",
        oid: e.oid,
        mode: e.mode,
        conflicted: stages.some((x) => x.stage > 0),
        text: normalizeIndexText(text, eolAttr(e.eol)),
      };
    },

    stage: async (repo, e) => {
      const [entry] = await listed(repo, e.repoPath, false);
      const indexed = entry?.staged === true;
      // An untracked file must still have no entry; a tracked one the same oid.
      const stale =
        e.expectedOid === null
          ? indexed
          : !indexed || entry.oid !== e.expectedOid;
      if (stale) return "stale";
      if (e.expectedOid === null)
        await run(repo.top, ["add", "--intent-to-add", "--", e.repoPath]);
      await run(
        repo.top,
        ["apply", "--cached", "--unidiff-zero", "--whitespace=nowarn", "-"],
        e.patch,
      );
      return "ok";
    },

    blame: async (repo, repoPath, line, contents) =>
      parseBlame(
        await run(
          repo.top,
          [
            "blame",
            "--porcelain",
            "--contents",
            "-",
            "-L",
            `${line + 1},+1`,
            "--",
            repoPath,
          ],
          contents,
        ),
      ),
  };
}
