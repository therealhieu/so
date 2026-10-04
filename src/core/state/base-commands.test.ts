import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import { isBaseWindowState } from "../features/bases/file-type";
import { activeBuffer, activeWindow, fullText } from "./buffers";
import { keymapFor } from "./keymap";
import type { Action, AppState, Effect, Result } from "./types";
import { createUpdate } from "./update";

const reg = testRegistries();
const update = createUpdate(reg);
const NOW = new Date(2026, 9, 3, 9, 5).getTime();
const TASKS = readFileSync(
  join(import.meta.dir, "../../../test/fixtures/workspace/tasks.base"),
  "utf8",
);

function run(s: AppState, ...actions: Action[]): Result {
  const effects: Effect[] = [];
  for (const a of actions) {
    const r = update(s, a);
    s = r.state;
    effects.push(...r.effects);
  }
  return { state: s, effects };
}

const key = (k: string): Action => ({ type: "key", key: k, now: NOW });
const keys = (seq: string): Action[] => [...seq].map(key);
const loaded = (path: string, text: string): Action => ({
  type: "fileLoaded",
  path,
  file: textFile(text),
});

const openBase = (s: AppState = fresh()) => run(s, loaded("tasks.base", TASKS));

const writes = (effects: Effect[]) =>
  effects.filter((e) => e.kind === "write" || e.kind === "applyEdits");

test("a base file opens read-only in the base editor kind at its first view", () => {
  const r = openBase();
  const w = activeWindow(r.state);
  const b = activeBuffer(r.state);
  expect(b?.fileType).toBe("base");
  expect(b?.readOnly).toBe(true);
  expect(w?.content.editor).toBe("base");
  const ws = w?.content.kindState;
  expect(isBaseWindowState(ws) && ws.view).toBe("All tasks");
  expect(r.effects).toContainEqual({ kind: "readPropertyTypes" });
});

test("a base file opened at a view's subpath selects that view", () => {
  const s = fresh();
  const pending = {
    ...s,
    windows: {
      ...s.windows,
      restore: {
        pending: {
          [s.windows.active]: {
            path: "tasks.base",
            cursor: { line: 0, col: 0 },
            scroll: 0,
            navigated: true as const,
            subpath: "#By status",
          },
        },
        missing: 0,
      },
    },
  };
  const r = run(pending, loaded("tasks.base", TASKS));
  const w = activeWindow(r.state);
  expect(w?.content.editor).toBe("base");
  expect(w?.content.subpath).toBeUndefined();
  const ws = w?.content.kindState;
  expect(isBaseWindowState(ws) && ws.view).toBe("By status");
});

test("printable keys in a base window never edit the file or reach vim", () => {
  const opened = openBase().state;
  const km = keymapFor(reg, opened.config);
  const scope = { mode: "normal", filetype: "base" } as const;
  const unbound = Array.from({ length: 95 }, (_, i) =>
    String.fromCharCode(32 + i),
  ).filter(
    (k) =>
      k !== ":" &&
      k !== opened.config.leader &&
      km.lookup(scope, [k]).kind === "none",
  );
  expect(unbound.length).toBeGreaterThan(40);
  const text = activeBuffer(opened)?.text;
  for (const k of unbound) {
    const r = run(opened, key(k));
    expect(activeBuffer(r.state)?.text).toBe(text as never);
    expect(r.state.vim.mode).toBe("normal");
    expect(r.state.vim.pending).toEqual([]);
    expect(r.effects).toEqual([]);
  }
});

test(":w on a base file is refused as read-only and never recreates it", () => {
  const opened = openBase().state;
  const saved = run(opened, ...keys(":w"), key("<CR>"));
  expect(writes(saved.effects)).toEqual([]);
  expect(saved.state.notifications.message).toEqual({
    text: "read-only file",
    level: "error",
  });

  const gone = run(opened, {
    type: "fileChanged",
    event: { kind: "removed", path: "tasks.base" },
  }).state;
  expect(activeBuffer(gone)?.disk).toBe("deleted");
  const recreate = run(gone, ...keys(":w"), key("<CR>"));
  expect(writes(recreate.effects)).toEqual([]);
  expect(recreate.state.notifications.message?.text).toBe("read-only file");
  expect(fullText(activeBuffer(recreate.state)?.text as never)).toBe(
    TASKS.slice(0, -1),
  );
});

test("leaving a base buffer writes nothing and shows no message", () => {
  const opened = openBase().state;
  const r = run(opened, ...keys(":e notes.md"), key("<CR>"));
  expect(writes(r.effects)).toEqual([]);
  expect(r.state.notifications.message).toBeUndefined();
});
