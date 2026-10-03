import { afterEach, expect, test } from "bun:test";
import { mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import type { PersistedState } from "../core/state/types";
import {
  readStateFile,
  saveStateFile,
  saveStateFileSync,
  statePath,
} from "./state-file";

const dirs: string[] = [];
afterEach(async () => {
  for (const d of dirs.splice(0)) await rm(d, { recursive: true, force: true });
});
async function tmp(): Promise<string> {
  const d = await mkdtemp(join(tmpdir(), "so-state-"));
  dirs.push(d);
  return d;
}

const state: PersistedState = {
  version: 1,
  recent: ["a.md"],
  jumps: { entries: [], at: 0 },
  buffers: [{ path: "a.md", view: "source" }],
  layout: {
    tree: { kind: "leaf", id: 1 },
    active: 1,
    windows: [{ id: 1, path: "a.md", cursor: { line: 0, col: 0 }, scroll: 0 }],
  },
};
const HASHED = /\/so\/[0-9a-f]{16}\/state\.json$/;

test("the state file lives under the XDG state directory, one per workspace", () => {
  const a = statePath({ XDG_STATE_HOME: "/xdg" }, "/home/u", "/notes/a");
  expect(a).toMatch(/^\/xdg\/so\/[0-9a-f]{16}\/state\.json$/);
  expect(statePath({}, "/home/u", "/notes/a")).toMatch(
    /^\/home\/u\/\.local\/state\/so\/[0-9a-f]{16}\/state\.json$/,
  );
  expect(statePath({ XDG_STATE_HOME: "" }, "/home/u", "/notes/a")).toMatch(
    /^\/home\/u\/\.local\/state\//,
  );
  expect(
    statePath({ XDG_STATE_HOME: "relative" }, "/home/u", "/notes/a"),
  ).toMatch(/^\/home\/u\/\.local\/state\//);
  expect(statePath({}, "/home/u", "/notes/b")).not.toBe(
    statePath({}, "/home/u", "/notes/a"),
  );
});

test("the state file is never placed inside the workspace", () => {
  const inXdg = statePath({ XDG_STATE_HOME: "/w/state" }, "/home/u", "/w");
  expect(inXdg).toMatch(/^\/home\/u\/\.local\/state\//);
  expect(statePath({}, "/home/u", "/home/u")).toBeUndefined();
  expect(statePath({}, "/home/u", "/")).toBeUndefined();
});

test("a saved state reads back, private to the user", async () => {
  const path = join(
    await tmp(),
    "state",
    "so",
    "0123456789abcdef",
    "state.json",
  );
  expect(path).toMatch(HASHED);
  await saveStateFile(path, state);
  expect(readStateFile(path)).toEqual(state);
  expect((await stat(path)).mode & 0o777).toBe(0o600);
  expect((await stat(dirname(path))).mode & 0o777).toBe(0o700);

  saveStateFileSync(path, { ...state, recent: ["b.md"] });
  expect(readStateFile(path)).toEqual({ ...state, recent: ["b.md"] });
  expect((await stat(path)).mode & 0o777).toBe(0o600);
});

test("a missing or corrupt state file reads as nothing", async () => {
  const dir = await tmp();
  expect(readStateFile(join(dir, "none.json"))).toBeUndefined();
  await writeFile(join(dir, "bad.json"), "{ not json");
  expect(readStateFile(join(dir, "bad.json"))).toBeUndefined();
});
