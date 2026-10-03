import { expect, test } from "bun:test";
import {
  fresh,
  openBuffer,
  stamp,
  testRegistries,
} from "../../../test/support/state";
import { setBuffer } from "./buffers";
import { closeBuffer, requestQuit, scheduleAutosave } from "./save";
import type { AppState, Effect, Result } from "./types";
import { createUpdate } from "./update";

const update = createUpdate(testRegistries());

/** Type "x" at the start of the buffer at time `now`, as an Insert key would. */
function typeX(s: AppState, id: number, now: number): Result {
  const b = s.buffers[id];
  if (b === undefined) throw new Error("no buffer");
  const text = b.text.apply({
    range: { start: { line: 0, col: 0 }, end: { line: 0, col: 0 } },
    text: "x",
  }).buffer;
  const edited = setBuffer(s, id, {
    text,
    dirty: text.version !== b.savedVersion,
  });
  return scheduleAutosave(edited, id, now);
}

const writes = (effects: Effect[]) => effects.filter((e) => e.kind === "write");

test("an edit autosaves once after the delay and failed saves back off", () => {
  let s = openBuffer(fresh(), "a.md", "hello");
  const edit = typeX(s, 1, 0);
  expect(edit.effects).toEqual([
    { kind: "startTimer", id: "autosave:1", ms: 1000 },
  ]);
  s = edit.state;

  expect(
    writes(update(s, { type: "timer", id: "autosave:1", now: 999 }).effects),
  ).toEqual([]);
  const fired = update(s, { type: "timer", id: "autosave:1", now: 1000 });
  expect(fired.effects).toEqual([
    { kind: "cancelTimer", id: "autosave:1" },
    { kind: "write", path: "a.md", text: "xhello\n", expected: stamp(1) },
  ]);
  s = fired.state;
  expect(
    writes(update(s, { type: "timer", id: "autosave:1", now: 1000 }).effects),
  ).toEqual([]);

  const delays: number[] = [];
  let now = 1000;
  for (let i = 0; i < 7; i++) {
    const failed = update(s, {
      type: "saveFailed",
      path: "a.md",
      reason: "ENOSPC",
    });
    const timer = failed.effects.find((e) => e.kind === "startTimer");
    if (timer?.kind !== "startTimer") throw new Error("no retry timer");
    expect(timer.id).toBe("retry:1");
    delays.push(timer.ms);
    s = failed.state;
    expect(s.buffers[1]?.save).toEqual({
      kind: "failed",
      reason: "ENOSPC",
      attempt: i + 1,
      retryAt: now + timer.ms,
    });
    expect(s.notifications.message).toEqual({
      text: "save failed: ENOSPC",
      level: "error",
    });
    now += timer.ms;
    const retry = update(s, { type: "timer", id: "retry:1", now });
    expect(writes(retry.effects)).toHaveLength(1);
    s = retry.state;
  }
  expect(delays).toEqual([1000, 2000, 4000, 8000, 16000, 30000, 30000]);

  const saved = update(s, { type: "saved", path: "a.md", stamp: stamp(2) });
  expect(saved.effects).toEqual([]);
  expect(saved.state.buffers[1]).toMatchObject({
    dirty: false,
    stamp: stamp(2),
    save: { kind: "idle" },
  });
});

test("typing during a write keeps the buffer dirty and writes again", () => {
  let s = typeX(openBuffer(fresh(), "a.md", "hello"), 1, 0).state;
  s = update(s, { type: "timer", id: "autosave:1", now: 1000 }).state;
  const during = typeX(s, 1, 1100);
  expect(during.effects).toEqual([]);
  s = during.state;

  const saved = update(s, { type: "saved", path: "a.md", stamp: stamp(2) });
  expect(saved.state.buffers[1]?.dirty).toBe(true);
  expect(saved.effects).toEqual([
    { kind: "startTimer", id: "autosave:1", ms: 1000 },
  ]);
  const timer = update(saved.state, {
    type: "timer",
    id: "autosave:1",
    now: 2000,
  });
  expect(writes(timer.effects)).toEqual([
    { kind: "write", path: "a.md", text: "xxhello\n", expected: stamp(2) },
  ]);
  const again = update(timer.state, {
    type: "saved",
    path: "a.md",
    stamp: stamp(3),
  });
  expect(again.state.buffers[1]?.dirty).toBe(false);
});

test(":q with autosave off writes text typed during its flush at once", () => {
  let s = openBuffer(fresh(), "a.md", "hello");
  s = {
    ...s,
    config: { ...s.config, autosave: { enabled: false, delayMs: 1000 } },
  };
  s = requestQuit(typeX(s, 1, 0).state, { force: false }, 500).state;
  s = typeX(s, 1, 600).state;

  const saved = update(s, { type: "saved", path: "a.md", stamp: stamp(2) });
  expect(writes(saved.effects)).toEqual([
    { kind: "write", path: "a.md", text: "xxhello\n", expected: stamp(2) },
  ]);
  const exit = update(saved.state, {
    type: "saved",
    path: "a.md",
    stamp: stamp(3),
  });
  expect(exit.effects).toEqual([{ kind: "exit", code: 0 }]);
});

test(":q flushes dirty buffers, then exits", () => {
  const s = typeX(openBuffer(fresh(), "a.md", "hello"), 1, 0).state;
  const quit = requestQuit(s, { force: false }, 500);
  expect(quit.state.terminal.quit).toEqual({ code: 0, waiting: [1] });
  expect(writes(quit.effects)).toHaveLength(1);
  expect(quit.effects).not.toContainEqual({ kind: "exit", code: 0 });

  const saved = update(quit.state, {
    type: "saved",
    path: "a.md",
    stamp: stamp(2),
  });
  expect(saved.effects).toEqual([{ kind: "exit", code: 0 }]);
  expect(saved.state.terminal.quit).toBeUndefined();
});

test(":q with nothing to save exits at once", () => {
  const s = openBuffer(fresh(), "a.md", "hello");
  expect(requestQuit(s, { force: false }, 0).effects).toEqual([
    { kind: "exit", code: 0 },
  ]);
});

test(":q stays open when the flush fails", () => {
  const s = typeX(openBuffer(fresh(), "a.md", "hello"), 1, 0).state;
  const quit = requestQuit(s, { force: false }, 500);
  const failed = update(quit.state, {
    type: "saveFailed",
    path: "a.md",
    reason: "EACCES: permission denied",
  });
  expect(failed.effects).not.toContainEqual({ kind: "exit", code: 0 });
  expect(failed.state.terminal.quit).toBeUndefined();
  expect(failed.state.notifications.message).toEqual({
    text: "save failed: EACCES: permission denied",
    level: "error",
  });
});

test(":q is blocked by a conflicted or a dirty deleted-on-disk buffer", () => {
  const dirty = typeX(openBuffer(fresh(), "a.md", "hello"), 1, 0).state;
  const conflicted: AppState = {
    ...dirty,
    overlay: {
      kind: "conflict",
      bufferId: 1,
      disk: { text: "disk", bom: false, eol: "\n", stamp: stamp(9) },
      showDiff: false,
    },
  };
  const deleted = setBuffer(dirty, 1, { disk: "deleted" });
  for (const s of [conflicted, deleted]) {
    const quit = requestQuit(s, { force: false }, 500);
    expect(quit.effects).toEqual([]);
    expect(quit.state.notifications.message).toEqual({
      text: "E37: No write since last change (a.md)",
      level: "error",
    });
    expect(quit.state.terminal.quit).toBeUndefined();
  }
});

test(":q! exits without writing", () => {
  const s = typeX(openBuffer(fresh(), "a.md", "hello"), 1, 0).state;
  expect(requestQuit(s, { force: true }, 500).effects).toEqual([
    { kind: "exit", code: 0 },
  ]);
});

test(":q with two windows closes only the window", () => {
  const one = typeX(openBuffer(fresh(), "a.md", "hello"), 1, 0).state;
  const w1 = one.windows.byId[1];
  if (w1 === undefined) throw new Error("no window");
  const s: AppState = {
    ...one,
    windows: {
      tree: {
        kind: "row",
        children: [
          { kind: "leaf", id: 2 },
          { kind: "leaf", id: 1 },
        ],
      },
      byId: { 1: w1, 2: { ...w1, id: 2 } },
      active: 2,
      nextWindowId: 3,
    },
  };
  for (const force of [false, true]) {
    const quit = requestQuit(s, { force }, 500);
    expect(quit.effects).toEqual([]);
    expect(quit.state.windows.tree).toEqual({ kind: "leaf", id: 1 });
    expect(quit.state.windows.active).toBe(1);
    expect(quit.state.windows.byId[2]).toBeUndefined();
    expect(quit.state.buffers[1]?.dirty).toBe(true);
  }
});

test(":bd! closes a dirty buffer without writing", () => {
  const s = typeX(openBuffer(fresh(), "a.md", "hello"), 1, 0).state;
  const closed = closeBuffer(s, 1, { force: true }, 500);
  expect(writes(closed.effects)).toEqual([]);
  expect(closed.state.buffers[1]).toBeUndefined();
  expect(closed.state.windows.byId[1]).toBeUndefined();
});

test(":bd flushes first and closes only after the write succeeds", () => {
  const s = typeX(openBuffer(fresh(), "a.md", "hello"), 1, 0).state;
  const close = closeBuffer(s, 1, { force: false }, 500);
  expect(writes(close.effects)).toHaveLength(1);
  expect(close.state.buffers[1]).toBeDefined();

  const saved = update(close.state, {
    type: "saved",
    path: "a.md",
    stamp: stamp(2),
  });
  expect(saved.state.buffers[1]).toBeUndefined();

  const failed = update(close.state, {
    type: "saveFailed",
    path: "a.md",
    reason: "EACCES",
  });
  expect(failed.state.buffers[1]?.dirty).toBe(true);
  const retried = update(failed.state, {
    type: "timer",
    id: "retry:1",
    now: 2000,
  });
  const resaved = update(retried.state, {
    type: "saved",
    path: "a.md",
    stamp: stamp(3),
  });
  expect(resaved.state.buffers[1]).toBeDefined();
});
