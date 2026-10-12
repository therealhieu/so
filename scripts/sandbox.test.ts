import { afterAll, expect, test } from "bun:test";
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseConfig } from "../src/core/config/toml";
import { ensureStaged, parseSandboxArgs, profilePaths } from "./sandbox";
import { localDay } from "./sandbox/profile";
import { DEFAULT_PROFILE, PROFILES } from "./sandbox/profiles";
import { SKIP } from "./sandbox/profiles/tour";

const tmp = mkdtempSync(join(tmpdir(), "so-sandbox-"));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

const profile = (name: string) => {
  const p = PROFILES.find((x) => x.name === name);
  if (p === undefined) throw new Error(`no profile ${name}`);
  return p;
};

/** Stage `name` into a fresh folder and return its paths. */
async function staged(name: string) {
  const paths = profilePaths(tmp, name);
  await ensureStaged(profile(name), paths);
  return paths;
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" });
}

test("sandbox flags are taken and so's arguments pass through in order", () => {
  expect(
    parseSandboxArgs([
      "--profile",
      "git",
      "--",
      "--version",
      "--reset",
      "notes/a.md",
    ]),
  ).toEqual({
    profile: "git",
    reset: true,
    list: false,
    journeys: false,
    passthrough: ["--version", "notes/a.md"],
  });
  expect(parseSandboxArgs(["--profile=large", "--journeys"]).profile).toBe(
    "large",
  );
  expect(parseSandboxArgs(["--list"]).list).toBe(true);
});

test("no --profile selects the default profile", () => {
  expect(parseSandboxArgs([]).profile).toBe(DEFAULT_PROFILE);
});

test("--profile without a name is an error", () => {
  expect(() => parseSandboxArgs(["--profile"])).toThrow(
    "--profile needs a name",
  );
  expect(() => parseSandboxArgs(["--profile", "--reset"])).toThrow();
  expect(() => parseSandboxArgs(["--profile="])).toThrow();
});

test("profiles have unique kebab-case names and a checklist", () => {
  const names = PROFILES.map((p) => p.name);
  expect(new Set(names).size).toBe(names.length);
  expect(names).toContain(DEFAULT_PROFILE);
  for (const p of PROFILES) {
    expect(p.name).toMatch(/^[a-z]+(-[a-z]+)*$/);
    expect(p.summary).not.toBe("");
    expect(p.journeys.length).toBeGreaterThan(0);
    for (const j of p.journeys) {
      expect(j.steps.length).toBeGreaterThan(0);
      expect(j.expect.length).toBeGreaterThan(0);
    }
  }
});

test("profile configs parse, except the deliberately broken one", () => {
  for (const p of PROFILES) {
    if (p.config === undefined) continue;
    const result = parseConfig(p.config);
    if (p.name === "broken-config") {
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors).toHaveLength(2);
    } else expect(result.ok).toBe(true);
  }
});

test("tour stages the demo vault without today's daily note or skipped fixtures", async () => {
  const { vault } = await staged("tour");
  const files = filesUnder(vault);
  expect(files).toContain("tour.md");
  expect(files).toContain("so-roadmap.md");
  expect(files).toContain(".notes/hidden-idea.md");
  expect(files).toContain(".obsidian/plugins/demo/main.js");
  expect(files).toContain(".trash/old-idea.md");
  expect(files).toContain(`daily/${localDay(1)}.md`);
  expect(files).not.toContain(`daily/${localDay(0)}.md`);
  for (const name of SKIP)
    expect(files.some((f) => f.endsWith(name))).toBe(false);
});

test("a complete stage is kept and an interrupted one is redone", async () => {
  const paths = await staged("empty");
  writeFileSync(join(paths.vault, "kept.md"), "");
  await ensureStaged(profile("empty"), paths);
  expect(existsSync(join(paths.vault, "kept.md"))).toBe(true);
  rmSync(paths.staged);
  await ensureStaged(profile("empty"), paths);
  expect(existsSync(join(paths.vault, "kept.md"))).toBe(false);
});

test("broken-config writes its config file", async () => {
  const paths = await staged("broken-config");
  expect(await Bun.file(paths.config).text()).toBe(
    profile("broken-config").config as string,
  );
});

/** Git's output in `cwd`, ignoring the user's and the system's configuration. */
function gitOut(cwd: string, args: string[]): string[] {
  const env = {
    ...process.env,
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: "/dev/null",
  };
  const out = Bun.spawnSync(["git", ...args], { cwd, env }).stdout.toString();
  return out.split("\n").filter(Boolean);
}

const status = (cwd: string) => gitOut(cwd, ["status", "--porcelain"]).sort();

test("every profile's open folder exists after staging", async () => {
  for (const p of PROFILES.filter((x) => x.open !== undefined)) {
    const { vault } = await staged(p.name);
    expect(existsSync(join(vault, p.open as string))).toBe(true);
  }
});

test("git stages every hunk kind, staged, untracked, and deleted files", async () => {
  const { vault } = await staged("git");
  expect(status(vault)).toEqual([
    " D notes/todo.md",
    " M tour.md",
    "?? drafts/",
    "?? scratch.md",
    "M  notes/ideas.md",
  ]);
  expect(gitOut(vault, ["log", "--format=%s"])).toEqual([
    "Plan phases",
    "Import notes",
  ]);
  const hunks = gitOut(vault, ["diff", "--unified=0", "tour.md"]).filter((l) =>
    l.startsWith("@@"),
  );
  expect(hunks).toHaveLength(4);
});

test("git-conflict stops in a merge with one conflicted note", async () => {
  const { vault } = await staged("git-conflict");
  expect(status(vault)).toEqual(["M  tour.md", "UU notes/ideas.md"]);
  expect(existsSync(join(vault, ".git/MERGE_HEAD"))).toBe(true);
});

test("git-unborn has no commit and notes/ staged", async () => {
  const { vault } = await staged("git-unborn");
  expect(gitOut(vault, ["rev-parse", "--verify", "--quiet", "HEAD"])).toEqual(
    [],
  );
  expect(status(vault)).toContain("A  notes/ideas.md");
  expect(status(vault)).toContain("?? tour.md");
});

test("git-subfolder changes files inside and outside the workspace", async () => {
  const { vault } = await staged("git-subfolder");
  expect(status(vault)).toEqual([" M notes/tour.md", " M site/index.html"]);
});

test("git-worktree opens a linked worktree on branch feature", async () => {
  const { vault } = await staged("git-worktree");
  const feature = join(vault, "feature");
  expect(gitOut(feature, ["branch", "--show-current"])).toEqual(["feature"]);
  expect(status(feature)).toEqual([" M tour.md"]);
});

test("git-eol keeps CRLF clean and changes only the BOM", async () => {
  const { vault } = await staged("git-eol");
  expect(status(vault)).toEqual([" M bom.md"]);
  for (const name of ["crlf.md", "autocrlf.md"])
    expect(await Bun.file(join(vault, name)).text()).toContain("\r\n");
});

test("bases and large stage their vaults", async () => {
  expect(filesUnder((await staged("bases")).vault)).toContain(
    "edge/alfred/broken.base",
  );
  const notes = filesUnder((await staged("large")).vault).filter((f) =>
    f.endsWith(".md"),
  );
  expect(notes).toHaveLength(10_000);
});

test("lsp stages a Rust crate and a TypeScript project as their own repositories", async () => {
  const { vault } = await staged("lsp");
  const files = filesUnder(vault);
  for (const f of [
    "rs/Cargo.toml",
    "rs/src/main.rs",
    "ts/tsconfig.json",
    "ts/src/a.ts",
  ])
    expect(files).toContain(f);
  for (const repo of ["rs", "ts"]) {
    const status = Bun.spawnSync(["git", "status", "--porcelain"], {
      cwd: join(vault, repo),
    });
    expect(status.exitCode).toBe(0);
    expect(status.stdout.toString()).toBe("");
  }
});
