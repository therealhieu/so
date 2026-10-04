import { expect, test } from "bun:test";
import { indexed, TASK_NOTES, TASKS_BASE } from "../../../test/support/bases";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import type { BaseWindowState } from "../features/bases/file-type";
import { baseViewModel, setBaseWindow } from "./base-model";
import { activeWindow } from "./buffers";
import type { Action, AppState, PersistedState } from "./types";
import { createUpdate } from "./update";

const reg = testRegistries();
const update = createUpdate(reg);
const NOW = new Date(2026, 9, 3, 9, 5).getTime();

const run = (s: AppState, ...actions: Action[]): AppState =>
  actions.reduce((st, a) => update(st, a).state, s);
const key = (k: string): Action => ({ type: "key", key: k, now: NOW });
const keys = (seq: string): Action[] => [...seq].map(key);
const loaded = (path: string, text: string): Action => ({
  type: "fileLoaded",
  path,
  file: textFile(text),
});

const opened = () => run(fresh(), loaded("tasks.base", TASKS_BASE));
const model = (s: AppState, id = s.windows.active) => baseViewModel(s, id, reg);
const windowState = (s: AppState) =>
  activeWindow(s)?.content.kindState as BaseWindowState;
const focusOn = (s: AppState, path: string) =>
  setBaseWindow(s, s.windows.active, {
    ...windowState(s),
    focus: { path, column: 1 },
  });

test("a base window waits for the index, then shows the evaluated rows", () => {
  const s = opened();
  expect(model(s)?.status).toBe("waiting");
  const ready = run(s, indexed());
  const m = model(ready);
  expect(m?.status).toBe("ok");
  expect(m?.selected).toBe("All tasks");
  expect(m?.table?.rows.map((r) => r.path)).toEqual([
    "tasks/ship-release.md",
    "tasks/review-pr.md",
    "tasks/write-report.md",
    "tasks/inbox.md",
  ]);
  expect(m?.views.map((v) => v.name)).toEqual([
    "All tasks",
    "By status",
    "Late",
    "Cards",
  ]);
});

test("focus stays on the same note when a candidate changes and the rows reorder", () => {
  const s = focusOn(run(opened(), indexed()), "tasks/inbox.md");
  expect(model(s)?.focus).toMatchObject({ row: 3, column: 1 });
  const earlier = run(
    s,
    indexed({ "tasks/inbox.md": "---\ndue: 2026-09-01\n---\n# Inbox\n" }),
  );
  expect(model(earlier)?.table?.rows[0]?.path).toBe("tasks/inbox.md");
  expect(model(earlier)?.focus).toMatchObject({ row: 0, column: 1 });
});

test("a renamed view in the base file falls back to the first view", () => {
  const s = run(opened(), indexed());
  const byStatus = setBaseWindow(s, s.windows.active, {
    ...windowState(s),
    view: "By status",
  });
  expect(model(byStatus)?.selected).toBe("By status");
  const renamed = run(byStatus, {
    type: "fileLoaded",
    path: "tasks.base",
    file: textFile(TASKS_BASE.replace("By status", "Grouped"), 2),
  });
  expect(model(renamed)?.selected).toBe("All tasks");
});

test("a state file from before base windows restores a base window at its first view", () => {
  const state: PersistedState = {
    version: 1,
    recent: ["tasks.base"],
    jumps: { entries: [], at: 0 },
    buffers: [{ path: "tasks.base", view: "source" }],
    layout: {
      tree: { kind: "leaf", id: 1 },
      active: 1,
      windows: [
        { id: 1, path: "tasks.base", cursor: { line: 3, col: 2 }, scroll: 0 },
      ],
    },
  };
  const s = run(
    fresh(),
    { type: "stateLoaded", state, restore: true },
    loaded("tasks.base", TASKS_BASE),
    indexed(),
  );
  expect(activeWindow(s)?.content.editor).toBe("base");
  expect(model(s)?.status).toBe("ok");
  expect(model(s)?.selected).toBe("All tasks");
});

test("an unparsable base shows its error and no rows", () => {
  const s = run(fresh(), loaded("tasks.base", "views: [\n"), indexed());
  const m = model(s);
  expect(m?.status).toBe("parseError");
  expect(m?.message).toBeString();
  expect(m?.table).toBeUndefined();
});

test("an unsupported layout shows as a table with a notice", () => {
  const s = run(opened(), indexed());
  const cards = setBaseWindow(s, s.windows.active, {
    ...windowState(s),
    view: "Cards",
  });
  const m = model(cards);
  expect(m?.table).toBeDefined();
  expect(m?.notice).toBe("cards view is not supported yet; showing a table");
});

test("frames without a relevant change reuse the same model", () => {
  const s = run(opened(), indexed());
  const a = model(s);
  expect(model({ ...s })).toBe(a as never);
  // A second window edits a file no base lists; the base window's model stays.
  const base = s.windows.active;
  const split = run(
    s,
    key("<C-w>"),
    key("v"),
    ...keys(":e scripts/sync.ts"),
    key("<CR>"),
    loaded("scripts/sync.ts", "export const n = 1;\n"),
  );
  expect(split.windows.active).not.toBe(base);
  const typed = run(split, ...keys("ix"), key("<Esc>"));
  expect(typed.buffers).not.toBe(split.buffers);
  expect(model(typed, base)).toBe(model(split, base) as never);
  expect(model(split, base)).toBe(a as never);
});

test("an unsaved edit to a listed note shows in the base at once", () => {
  const s = run(opened(), indexed());
  const path = "tasks/inbox.md";
  const note = run(
    s,
    ...keys(`:e ${path}`),
    key("<CR>"),
    loaded(path, TASK_NOTES[path] ?? ""),
    ...keys("jwwr9"),
  );
  const back = run(note, ...keys(":e tasks.base"), key("<CR>"));
  const row = model(back)?.table?.rows.find((r) => r.path === path);
  expect(row?.cells[2]?.text).toBe("9026-10-08");
});
