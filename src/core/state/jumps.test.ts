import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import {
  JUMP_LIMIT,
  jumpBack,
  jumpForward,
  jumpSegment,
  pushJump,
} from "./jumps";
import { RECENT_LIMIT, touchRecent } from "./recent";
import type { AppState, JumpList } from "./types";
import { createUpdate } from "./update";

const update = createUpdate(testRegistries());
const empty: JumpList = { entries: [], at: 0 };
const at = (path: string, line: number, col = 0) => ({ path, line, col });

const load = (s: AppState, path: string, text: string) =>
  update(s, { type: "fileLoaded", path, file: textFile(text) }).state;
const cursorOf = (s: AppState) => {
  const w = s.windows.byId[s.windows.active];
  const b = w && s.buffers[w.content.bufferId];
  return { path: b?.path, ...w?.content.cursor };
};

test("the jump list keeps the newest 100 entries", () => {
  let j = empty;
  for (let i = 0; i < 105; i++) j = pushJump(j, at("a.md", i));
  expect(j.entries).toHaveLength(JUMP_LIMIT);
  expect(j.entries[0]).toEqual(at("a.md", 5));
  expect(j.entries.at(-1)).toEqual(at("a.md", 104));
  expect(j.at).toBe(JUMP_LIMIT);
});

test("a jump from a line already in the list replaces the older entry", () => {
  let j = pushJump(empty, at("a.md", 3, 1));
  j = pushJump(j, at("b.md", 3));
  j = pushJump(j, at("a.md", 3, 7));
  expect(j.entries).toEqual([at("b.md", 3), at("a.md", 3, 7)]);
  expect(j.at).toBe(2);
});

test("a jump from the middle of the list drops the newer entries", () => {
  const j = pushJump(
    { entries: [at("a.md", 1), at("a.md", 2), at("a.md", 3)], at: 1 },
    at("b.md", 9),
  );
  expect(j.entries).toEqual([at("a.md", 1), at("b.md", 9)]);
  expect(j.at).toBe(2);
});

test("jumping back from the end records the current position for <C-i>", () => {
  let s = load(fresh(), "a.md", "one\ntwo\nthree\n");
  s = { ...s, jumps: pushJump(empty, at("a.md", 0)) };
  s = update(s, { type: "key", key: "j", now: 0 }).state;
  s = update(s, { type: "key", key: "j", now: 0 }).state;

  s = jumpBack(s, 0).state;
  expect(cursorOf(s)).toEqual({ path: "a.md", line: 0, col: 0 });
  expect(s.jumps).toEqual({ entries: [at("a.md", 0), at("a.md", 2)], at: 0 });

  s = jumpForward(s, 0).state;
  expect(cursorOf(s)).toEqual({ path: "a.md", line: 2, col: 0 });
  expect(s.jumps.at).toBe(1);
  expect(jumpForward(s, 0).state.jumps.at).toBe(1);
});

test("jumping back to another open file shows it at the recorded position", () => {
  let s = load(fresh(), "a.md", "a1\na2\na3\n");
  s = { ...s, jumps: pushJump(empty, at("a.md", 2, 1)) };
  s = load(s, "b.md", "b1\n");
  s = jumpBack(s, 0).state;
  expect(cursorOf(s)).toEqual({ path: "a.md", line: 2, col: 1 });
});

test("the jump segment counts the current position after the last jump", () => {
  expect(jumpSegment(empty)).toBeUndefined();
  const j = pushJump(empty, at("a.md", 0));
  expect(jumpSegment(j)).toBe("jump 2/2");
  expect(jumpSegment({ entries: [at("a.md", 0), at("b.md", 0)], at: 0 })).toBe(
    "jump 1/2",
  );
});

test("<C-o> and <C-i> run the jump commands", () => {
  let s = load(fresh(), "a.md", "one\ntwo\nthree\n");
  for (const key of ["G", "<C-o>"])
    s = update(s, { type: "key", key, now: 0 }).state;
  expect(cursorOf(s)).toEqual({ path: "a.md", line: 0, col: 0 });
  for (const key of ["<Tab>"])
    s = update(s, { type: "key", key, now: 0 }).state;
  expect(cursorOf(s)).toEqual({ path: "a.md", line: 2, col: 0 });
});

test("opening a file records a jump and its recent entry", () => {
  let s = load(fresh(), "a.md", "one\ntwo\n");
  s = update(s, { type: "key", key: "j", now: 0 }).state;
  for (const key of [...":e b.md"])
    s = update(s, { type: "key", key, now: 0 }).state;
  const r = update(s, { type: "key", key: "<CR>", now: 0 });
  expect(r.effects).toContainEqual({ kind: "read", path: "b.md" });
  expect(r.state.jumps).toEqual({ entries: [at("a.md", 1)], at: 1 });
});

test("recents are most-recent-first, unique, and capped", () => {
  let r: string[] = [];
  for (const p of ["a.md", "b.md", "a.md", "c.md"]) r = touchRecent(r, p);
  expect(r).toEqual(["c.md", "a.md", "b.md"]);
  for (let i = 0; i < 101; i++) r = touchRecent(r, `n${i}.md`);
  expect(r).toHaveLength(RECENT_LIMIT);
  expect(r[0]).toBe("n100.md");
  expect(r).not.toContain("c.md");
});

test("loading a file makes it the most recent", () => {
  let s = load(fresh(), "a.md", "a\n");
  s = load(s, "b.md", "b\n");
  expect(s.recent).toEqual(["b.md", "a.md"]);
});
