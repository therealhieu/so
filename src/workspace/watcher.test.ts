import { afterAll, beforeAll, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { FileEvent } from "../core/state/types";
import { atomicWrite } from "./fs";
import { createExclusionMatcher } from "./ignore";
import { createOwnOps, watchWorkspace } from "./watcher";

const stamp = (n: number) => ({ mtimeMs: n, size: n, hash: `h${n}` });

test("own writes match by exact stamp; own moves and removals by path for one second", () => {
  let now = 0;
  const own = createOwnOps(() => now);
  own.noteWrite("a.md", stamp(1));
  expect(own.isOwn("a.md", stamp(1))).toBe(true);
  expect(own.isOwn("a.md", stamp(2))).toBe(false);
  expect(own.isOwn("a.md")).toBe(false);

  own.noteMove("notes", "archive/notes");
  own.noteRemove("old.md");
  expect(own.isOwn("notes")).toBe(true);
  expect(own.isOwn("notes/a.md", stamp(9))).toBe(true);
  expect(own.isOwn("archive/notes/a.md")).toBe(true);
  expect(own.isOwn("old.md")).toBe(true);
  expect(own.isOwn("notes-2/a.md")).toBe(false);
  now = 999;
  expect(own.isOwn("archive/notes")).toBe(true);
  now = 1000;
  expect(own.isOwn("archive/notes")).toBe(false);
  expect(own.isOwn("old.md")).toBe(false);
});

test("a move also covers the folders it creates above its target, but not their other entries", () => {
  let now = 0;
  const own = createOwnOps(() => now);
  own.noteMove("notes", "archive/2026/notes");
  expect(own.isOwn("archive")).toBe(true);
  expect(own.isOwn("archive/2026")).toBe(true);
  expect(own.isOwn("archive/other.md")).toBe(false);
  expect(own.isOwn("archive/2026/other.md")).toBe(false);
  now = 1000;
  expect(own.isOwn("archive")).toBe(false);
});

let root = "";
let events: FileEvent[] = [];
let stop = () => {};
let startMs = Number.POSITIVE_INFINITY;
const own = createOwnOps();

/** The watcher debounce (50 ms) plus time for macOS event replays. */
const settle = () => Bun.sleep(50 + 300);

async function waitFor(pred: () => boolean, ms = 3000): Promise<void> {
  const until = performance.now() + ms;
  while (!pred()) {
    if (performance.now() > until) throw new Error("timed out waiting");
    await Bun.sleep(10);
  }
}

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "so-watch-"));
  await mkdir(join(root, "notes"));
  await mkdir(join(root, "build"));
  await writeFile(join(root, ".gitignore"), "build/\n");
  await writeFile(join(root, "notes/a.md"), "a\n");
  await symlink("..", join(root, "notes/loop"));
  const matcher = createExclusionMatcher(root, (p) => {
    try {
      return readFileSync(p, "utf8");
    } catch {
      return null;
    }
  });
  const t0 = performance.now();
  stop = watchWorkspace(root, own, matcher, (e) => events.push(e));
  startMs = performance.now() - t0;
  await settle();
  events = [];
});

afterAll(async () => {
  stop();
  await rm(root, { recursive: true, force: true });
});

test("watching a folder with a symlink loop starts at once", () => {
  expect(startMs).toBeLessThan(100);
});

test("an own write is silent and a later external write is reported", async () => {
  const p = join(root, "notes/a.md");
  own.noteWrite("notes/a.md", await atomicWrite(p, "mine\n"));
  await settle();
  expect(events).toEqual([]);

  await writeFile(p, "theirs\n");
  await waitFor(() => events.length > 0);
  expect(events).toEqual([
    { kind: "changed", path: "notes/a.md", isDir: false },
  ]);
  events = [];
});

test("writes under excluded paths are never reported", async () => {
  await writeFile(join(root, "build/out.txt"), "x\n");
  await writeFile(join(root, ".hidden.md"), "x\n");
  await settle();
  expect(events).toEqual([]);
});

test("a removal and a new folder are classified by stat", async () => {
  await writeFile(join(root, "gone.md"), "x\n");
  await waitFor(() => events.some((e) => e.path === "gone.md"));
  events = [];
  await rm(join(root, "gone.md"));
  await mkdir(join(root, "fresh"));
  await waitFor(() => events.length >= 2);
  expect(events).toContainEqual({ kind: "removed", path: "gone.md" });
  expect(events).toContainEqual({
    kind: "changed",
    path: "fresh",
    isDir: true,
  });
  events = [];
});
