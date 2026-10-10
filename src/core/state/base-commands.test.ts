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

test("> and < resize the focused column, = returns it, and the file is untouched", () => {
  const s = openPlan();
  const width = (st: AppState) => model(st)?.table?.columns[0]?.width;
  expect(width(s)).toBe(4);
  const wider = press(s, ">>");
  expect(ws(wider.state).widths).toEqual({ "file.name": 12 });
  expect(width(wider.state)).toBe(12);
  expect(width(press(wider.state, "<lt>").state)).toBe(8);
  expect(width(press(s, "<lt><lt><lt>").state)).toBe(3);
  const reset = press(wider.state, "=");
  expect(ws(reset.state).widths).toBeUndefined();
  expect(width(reset.state)).toBe(4);
  expect(ws(press(wider.state, "l>").state).widths).toEqual({
    "file.name": 12,
    status: 10,
  });
  expect(ws(press(wider.state, "2").state).widths).toBeUndefined();
  for (const r of [wider, reset]) {
    expect(writes(r.effects)).toEqual([]);
    expect(planText(r.state)).toBe(planText(s));
    expect(activeBuffer(r.state)?.dirty).toBe(false);
  }
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

test("text edits in a base window are refused as a read-only file", () => {
  const s = openBase().state;
  const text = fullText(activeBuffer(s)?.text as never);
  const r = run(s, ...keys(":s/a/b/"), key("<CR>"));
  expect(r.state.notifications.message?.text).toBe("read-only file");
  expect(fullText(activeBuffer(r.state)?.text as never)).toBe(text);
  expect(r.effects).toEqual([]);
});

test("a text cell edit suggests the property's existing values and Tab completes", () => {
  const s = openPlan();
  const editing = press(s, "li<BS><BS><BS><BS>");
  expect(model(editing.state)?.suggestions).toEqual(["doing", "todo"]);
  const typed = press(editing.state, "d");
  expect(model(typed.state)?.suggestions).toEqual(["doing"]);
  const completed = press(typed.state, "<Tab>");
  expect(ws(completed.state).edit).toMatchObject({ value: "doing", caret: 5 });
  expect(press(completed.state, "<CR>").effects).toEqual([
    {
      kind: "patchFrontmatter",
      path: "tasks/a.md",
      patch: { set: "status", value: "doing" },
      expected: "todo",
    },
  ]);
  expect(model(press(s, "l").state)?.suggestions).toBeUndefined();
});

const LABELS = `views:
  - type: table
    name: Labels
    order: [file.name, labels]
`;

test("a list cell edits as chips: Enter adds, Backspace removes, Enter on empty writes", () => {
  const s = run(
    fresh(),
    loaded("labels.base", LABELS),
    indexed({ "tasks/a.md": "---\nlabels: [api, docs]\n---\n# A\n" }),
  ).state;
  const editing = press(s, "li");
  expect(ws(editing.state).edit).toMatchObject({
    type: "list",
    value: "",
    items: ["api", "docs"],
  });
  const added = press(editing.state, "ui<CR>");
  expect(ws(added.state).edit).toMatchObject({
    value: "",
    caret: 0,
    items: ["api", "docs", "ui"],
  });
  expect(writes(added.effects)).toEqual([]);
  const removed = press(added.state, "<BS>");
  expect(ws(removed.state).edit?.items).toEqual(["api", "docs"]);
  const dropped = press(removed.state, "<BS>x<CR><CR>");
  expect(dropped.effects).toEqual([
    {
      kind: "patchFrontmatter",
      path: "tasks/a.md",
      patch: { set: "labels", value: ["api", "x"] },
      expected: ["api", "docs"],
    },
  ]);
  expect(ws(dropped.state).edit).toBeUndefined();
});

test("the model summarizes the filters in effect", () => {
  const FILTERED = `filters:
  and:
    - file.inFolder("tasks")
views:
  - type: table
    name: Open
    filters:
      or:
        - 'status == "todo"'
        - 'done == false'
`;
  const s = run(fresh(), loaded("open.base", FILTERED), indexed(NOTES)).state;
  expect(model(s)?.filter).toBe(
    'file.inFolder("tasks") and (status == "todo" or done == false)',
  );
  expect(model(press(s, "f").state)?.filter).toBe('file.inFolder("tasks")');
  expect(model(openPlan())?.filter).toBeUndefined();
  const NONE_OF = `views:
  - type: table
    name: Rest
    filters:
      not:
        - 'status == "todo"'
        - 'done == true'
`;
  const rest = run(fresh(), loaded("rest.base", NONE_OF), indexed(NOTES)).state;
  expect(model(rest)?.filter).toBe('not (status == "todo" or done == true)');
  expect(model(rest)?.table?.rows).toEqual([]);
});

test("a board grouped by a file property refuses moves with an explanation", () => {
  const BY_FOLDER = `views:
  - type: kanban-test
    name: By folder
    order: [file.name]
    groupBy:
      property: file.folder
      direction: ASC
`;
  const s = run(
    fresh(),
    loaded("folders.base", BY_FOLDER),
    indexed(NOTES),
  ).state;
  expect(model(s)?.board?.movable).toBe(false);
  const r = press(s, "L");
  expect(writes(r.effects)).toEqual([]);
  expect(r.state.notifications.toasts.at(-1)?.text).toBe(
    "Moves are off: this board groups by a file property",
  );
});
