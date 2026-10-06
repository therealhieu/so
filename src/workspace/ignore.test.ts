import { expect, test } from "bun:test";
import { createExclusionMatcher } from "./ignore";

const ROOT = "/ws";

/** A matcher over in-memory `.gitignore` files keyed by workspace-relative folder. */
function matcherWith(gitignores: Record<string, string>) {
  const reads: string[] = [];
  const read = (p: string): string | null => {
    reads.push(p);
    const dir = p
      .slice(ROOT.length + 1, -".gitignore".length)
      .replace(/\/$/, "");
    return gitignores[dir] ?? null;
  };
  return { matcher: createExclusionMatcher(ROOT, read), reads };
}

const workspace = {
  "": "build/\n*.log\n!keep.log\n*.tmp\n",
  pkg: "dist/\n!x.tmp\n",
};

test("hidden entries, node_modules, and gitignored folders are excluded", () => {
  const { matcher } = matcherWith(workspace);
  expect(matcher.isExcluded(".git", true)).toBe(true);
  expect(matcher.isExcluded(".obsidian", true)).toBe(true);
  expect(matcher.isExcluded(".env", false)).toBe(true);
  expect(matcher.isExcluded("node_modules", true)).toBe(true);
  expect(matcher.isExcluded("pkg/node_modules", true)).toBe(true);
  expect(matcher.isExcluded("build", true)).toBe(true);
  expect(matcher.isExcluded("pkg/dist", true)).toBe(true);
  expect(matcher.isExcluded("notes/a.md", false)).toBe(false);
  expect(matcher.isExcluded("pkg", true)).toBe(false);
});

test("shown dot entries still leave out .git, node_modules, and gitignored names", () => {
  const { matcher } = matcherWith({ "": ".env\n" });
  expect(matcher.isExcluded(".s1mple", true, true)).toBe(false);
  expect(matcher.isExcluded(".github/ci.yml", false, true)).toBe(false);
  expect(matcher.isExcludedPath(".github/workflows/ci.yml", true)).toBe(false);
  expect(matcher.isExcluded(".git", true, true)).toBe(true);
  expect(matcher.isExcludedPath(".git/HEAD", true)).toBe(true);
  expect(matcher.isExcluded("node_modules", true, true)).toBe(true);
  expect(matcher.isExcluded(".env", false, true)).toBe(true);
  expect(matcher.isExcludedPath(".github/ci.yml")).toBe(true);
});

test("a deeper negation re-includes what a shallower pattern excludes", () => {
  const { matcher } = matcherWith(workspace);
  expect(matcher.isExcluded("debug.log", false)).toBe(true);
  expect(matcher.isExcluded("keep.log", false)).toBe(false);
  expect(matcher.isExcluded("y.tmp", false)).toBe(true);
  expect(matcher.isExcluded("pkg/x.tmp", false)).toBe(false);
  expect(matcher.isExcluded("pkg/y.tmp", false)).toBe(true);
});

test("a directory-only pattern excludes the folder but not a file of that name", () => {
  const { matcher } = matcherWith(workspace);
  expect(matcher.isExcluded("build", true)).toBe(true);
  expect(matcher.isExcluded("build", false)).toBe(false);
  expect(matcher.isExcluded("notes/build", true)).toBe(true);
});

test("a path below an excluded folder is excluded without knowing its kind", () => {
  const { matcher } = matcherWith(workspace);
  expect(matcher.isExcludedPath("build/out.js")).toBe(true);
  expect(matcher.isExcludedPath(".git/HEAD")).toBe(true);
  expect(matcher.isExcludedPath("pkg/dist/a/b.js")).toBe(true);
  expect(matcher.isExcludedPath("node_modules/x/index.js")).toBe(true);
  expect(matcher.isExcludedPath("debug.log")).toBe(true);
  expect(matcher.isExcludedPath("notes/a.md")).toBe(false);
  expect(matcher.isExcludedPath("keep.log")).toBe(false);
});

test("each folder's .gitignore is read once", () => {
  const { matcher, reads } = matcherWith(workspace);
  matcher.isExcluded("pkg/a.md", false);
  matcher.isExcluded("pkg/b.md", false);
  matcher.isExcludedPath("pkg/c.md");
  expect(reads).toEqual(["/ws/.gitignore", "/ws/pkg/.gitignore"]);
});
