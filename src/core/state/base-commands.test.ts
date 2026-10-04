import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { indexed } from "../../../test/support/bases";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import {
  type BaseWindowState,
  isBaseWindowState,
} from "../features/bases/file-type";
import { splitKeys } from "../kernel/vim/keys";
import { baseViewModel } from "./base-model";
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
  effects.filter(
    (e) =>
      e.kind === "write" ||
      e.kind === "applyEdits" ||
      e.kind === "patchFrontmatter",
  );

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

const PLAN = `formulas:
  late: 'done == false'
views:
  - type: table
    name: Tasks
    order: [file.name, status, est, due, done, formula.late]
  - type: kanban-test
    name: Board
    order: [file.name, due]
    groupBy:
      property: status
      direction: ASC
  - type: kanban-test
    name: By late
    order: [file.name]
    groupBy:
      property: formula.late
      direction: ASC
  - type: cards
    name: Gallery
`;
const NOTES = {
  "tasks/a.md":
    "---\nstatus: todo\nest: 3\ndue: 2026-10-05\ndone: false\n---\n# A\n",
  "tasks/b.md":
    "---\nstatus: doing\nest: 1\ndue: 2026-10-07\ndone: true\n---\n# B\n",
};

/** plan.base open over two indexed notes; the table's rows are a.md then b.md. */
const openPlan = () =>
  run(fresh(), loaded("plan.base", PLAN), indexed(NOTES)).state;
const press = (s: AppState, seq: string) => run(s, ...splitKeys(seq).map(key));
const ws = (s: AppState) =>
  activeWindow(s)?.content.kindState as BaseWindowState;
const model = (s: AppState) => baseViewModel(s, s.windows.active, reg);
const planText = (s: AppState) => fullText(activeBuffer(s)?.text as never);

test("sort, group, and filter toggles never touch the base file", () => {
  const s = openPlan();
  const text = planText(s);
  const sorted = press(s, "ls");
  expect(ws(sorted.state).sort).toEqual({
    property: "status",
    direction: "ASC",
  });
  expect(model(sorted.state)?.table?.columns[1]?.sort).toBe("ASC");
  expect(ws(press(sorted.state, "s").state).sort).toEqual({
    property: "status",
    direction: "DESC",
  });
  expect(ws(press(sorted.state, "ss").state).sort).toBeUndefined();
  const grouped = press(s, "g");
  expect(ws(grouped.state).grouped).toBe(false);
  expect(ws(press(grouped.state, "g").state).grouped).toBeUndefined();
  const filtered = press(s, "f");
  expect(ws(filtered.state).filtered).toBe(false);
  for (const r of [sorted, grouped, filtered]) {
    expect(writes(r.effects)).toEqual([]);
    expect(planText(r.state)).toBe(text);
    expect(activeBuffer(r.state)?.dirty).toBe(false);
  }
});

test("derived cells explain that they are read-only", () => {
  const s = openPlan();
  const name = press(s, "i");
  expect(ws(name.state).edit).toBeUndefined();
  expect(name.state.notifications.message?.text).toBe(
    "name — file property, read only",
  );
  const formula = press(s, "lllllli");
  expect(ws(formula.state).edit).toBeUndefined();
  expect(formula.state.notifications.message?.text).toBe(
    "late — formula, read only",
  );
  expect(writes([...name.effects, ...formula.effects])).toEqual([]);
});

test("number and date cells step with Ctrl-a and Ctrl-x and reject invalid text", () => {
  const s = openPlan();
  const est = press(s, "lli<C-a><C-a>");
  expect(ws(est.state).edit).toMatchObject({ value: "5", original: 3 });
  expect(press(est.state, "<CR>").effects).toEqual([
    {
      kind: "patchFrontmatter",
      path: "tasks/a.md",
      patch: { set: "est", value: 5 },
      expected: 3,
    },
  ]);
  const due = press(s, "llli<C-x><CR>");
  expect(due.effects).toEqual([
    {
      kind: "patchFrontmatter",
      path: "tasks/a.md",
      patch: { set: "due", value: "2026-10-04", date: true },
      expected: "2026-10-05",
    },
  ]);
  const bad = press(s, "lli<BS>abc<CR>");
  expect(ws(bad.state).edit?.error).toBe("not a number");
  expect(writes(bad.effects)).toEqual([]);
  const cancelled = press(bad.state, "<Esc>");
  expect(ws(cancelled.state).edit).toBeUndefined();
  expect(writes(cancelled.effects)).toEqual([]);
});

test("typed text replaces a text cell; keys while editing never run base commands", () => {
  const s = openPlan();
  const r = press(s, "li<BS><BS><BS><BS>doing<CR>");
  expect(writes(r.effects)).toEqual([
    {
      kind: "patchFrontmatter",
      path: "tasks/a.md",
      patch: { set: "status", value: "doing" },
      expected: "todo",
    },
  ]);
  expect(ws(r.state).sort).toBeUndefined();
  expect(ws(r.state).edit).toBeUndefined();
  const same = press(s, "li<CR>");
  expect(writes(same.effects)).toEqual([]);
});

test("x toggles a checkbox cell and explains other cells", () => {
  const s = openPlan();
  expect(press(s, "llllx").effects).toEqual([
    {
      kind: "patchFrontmatter",
      path: "tasks/a.md",
      patch: { set: "done", value: true },
      expected: false,
    },
  ]);
  const other = press(s, "lx");
  expect(writes(other.effects)).toEqual([]);
  expect(other.state.notifications.message?.text).toBe(
    "x toggles checkbox cells",
  );
});

test("card moves write the group property and None removes it", () => {
  // Lanes by status ascending: doing (b.md), todo (a.md), None.
  const board = press(openPlan(), "2");
  expect(model(board.state)?.board?.lanes.map((l) => l.label)).toEqual([
    "doing",
    "todo",
    "None",
  ]);
  const todo = press(board.state, "l");
  expect(model(todo.state)?.focus).toMatchObject({ lane: 1, card: 0 });
  expect(press(todo.state, "H").effects).toEqual([
    {
      kind: "patchFrontmatter",
      path: "tasks/a.md",
      patch: { set: "status", value: "doing" },
      expected: "todo",
    },
  ]);
  const none = press(todo.state, "L");
  expect(none.effects).toEqual([
    {
      kind: "patchFrontmatter",
      path: "tasks/a.md",
      patch: { remove: "status" },
      expected: "todo",
    },
  ]);
  expect(ws(none.state).focus.path).toBe("tasks/a.md");
  // At the edge nothing moves.
  expect(writes(press(board.state, "H").effects)).toEqual([]);
});

test("a board grouped by a formula refuses moves with an explanation", () => {
  const r = press(openPlan(), "3L");
  expect(writes(r.effects)).toEqual([]);
  expect(r.state.notifications.toasts.at(-1)?.text).toBe(
    "Moves are off: this board groups by a formula",
  );
});

test("views switch by number, Tab, and the view list", () => {
  const s = openPlan();
  expect(ws(press(s, "4").state).view).toBe("Gallery");
  expect(model(press(s, "4").state)?.notice).toBe(
    "cards view is not supported yet; showing a table",
  );
  expect(ws(press(s, "<Tab><Tab>").state).view).toBe("By late");
  expect(ws(press(s, "<Tab><Tab><Tab><Tab>").state).view).toBe("Tasks");
  const list = press(s, "v");
  expect(list.state.overlay.kind).toBe("picker");
  const picked = press(list.state, "Board<CR>");
  expect(picked.state.overlay.kind).toBe("none");
  expect(ws(picked.state).view).toBe("Board");
  expect(planText(picked.state)).toBe(planText(s));
});

test("Enter opens the focused row's note", () => {
  const r = press(openPlan(), "j<CR>");
  expect(r.effects).toContainEqual({ kind: "read", path: "tasks/b.md" });
});
