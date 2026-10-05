import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gitRoot, resolveWorkspace } from "./workspace";

let dirs: string[] = [];
afterEach(async () => {
  for (const d of dirs) await rm(d, { recursive: true, force: true });
  dirs = [];
});

/** A repository with `src/main.rs`, `notes/a.md`, and `.git` as a folder or a worktree file. */
function repo(git: "dir" | "file" | "none"): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "so-ws-")));
  dirs.push(root);
  mkdirSync(join(root, "src"));
  mkdirSync(join(root, "notes"));
  writeFileSync(join(root, "src/main.rs"), "fn main() {}\n");
  writeFileSync(join(root, "notes/a.md"), "# A\n");
  if (git === "dir") mkdirSync(join(root, ".git"));
  if (git === "file") writeFileSync(join(root, ".git"), "gitdir: /x\n");
  return root;
}

test("a code file opens in its repository", async () => {
  const root = repo("dir");
  expect(await resolveWorkspace(join(root, "src/main.rs"))).toEqual({
    root,
    file: "src/main.rs",
  });
});

test("a worktree's .git file marks the repository too", async () => {
  const root = repo("file");
  expect(await resolveWorkspace(join(root, "src/main.rs"))).toEqual({
    root,
    file: "src/main.rs",
  });
});

test("a code file outside a repository opens in its own folder", async () => {
  const root = repo("none");
  expect(
    await resolveWorkspace(join(root, "src/main.rs"), (d) =>
      gitRoot(d, undefined, root),
    ),
  ).toEqual({ root: join(root, "src"), file: "main.rs" });
});

test("a note opens in its own folder even inside a repository", async () => {
  const root = repo("dir");
  expect(await resolveWorkspace(join(root, "notes/a.md"))).toEqual({
    root: join(root, "notes"),
    file: "a.md",
  });
});

test("a folder is the workspace, and a missing path is none", async () => {
  const root = repo("dir");
  expect(await resolveWorkspace(join(root, "src"))).toEqual({
    root: join(root, "src"),
  });
  expect(await resolveWorkspace(join(root, "nope.rs"))).toBeUndefined();
});

test("the home folder is never a repository root", () => {
  const exists = (p: string) => p === "/home/me/.git";
  expect(gitRoot("/home/me/code/x", exists, "/home/me")).toBeUndefined();
  expect(
    gitRoot("/home/me/code/x", (p) => p === "/home/me/code/.git", "/home/me"),
  ).toBe("/home/me/code");
});
