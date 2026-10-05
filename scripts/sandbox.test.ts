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

test("git stages a repository with modified, staged, and untracked files", async () => {
  const { vault } = await staged("git");
  const run = (args: string[]) =>
    Bun.spawnSync(["git", ...args], { cwd: vault }).stdout.toString();
  expect(
    run(["status", "--porcelain"]).split("\n").filter(Boolean).sort(),
  ).toEqual([" M tour.md", "?? scratch.md", "M  notes/ideas.md"]);
  expect(run(["log", "--format=%s"]).trim().split("\n")).toEqual([
    "Plan phases",
    "Import notes",
  ]);
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
