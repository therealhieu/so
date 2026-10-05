import { expect, test } from "bun:test";
import { indexed, TASKS_BASE } from "../../../test/support/bases";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import type { BaseWindowState } from "../features/bases/file-type";
import { splitKeys } from "../kernel/vim/keys";
import { baseViewModel } from "./base-model";
import { fullText } from "./buffers";
import type {
  AppState,
  Effect,
  MouseEvent,
  MouseTarget,
  Result,
  WindowId,
} from "./types";
import { createUpdate } from "./update";

const reg = testRegistries();
const update = createUpdate(reg);
const NOW = 1_000;

function open(path: string, text: string, s = fresh()): AppState {
  return update(s, { type: "fileLoaded", path, file: textFile(text) }).state;
}

/** Feed keys one action at a time; returns the last state and every effect. */
function keys(s: AppState, seq: string): Result {
  const effects: Effect[] = [];
  for (const key of splitKeys(seq)) {
    const r = update(s, { type: "key", key, now: NOW });
    s = r.state;
    effects.push(...r.effects);
  }
  return { state: s, effects };
}

const mouse = (s: AppState, event: MouseEvent): Result =>
  update(s, { type: "mouse", event, now: NOW });

const text = (
  window: WindowId,
  line: number,
  col: number,
  edge: -1 | 0 | 1 = 0,
): MouseTarget => ({
  kind: "window",
  window,
  spot: { kind: "text", pos: { line, col }, edge },
});

const press = (
  target: MouseTarget,
  clicks: 1 | 2 | 3 = 1,
  ctrl = false,
): MouseEvent => ({ kind: "press", target, clicks, ctrl });

/**
 * The session-save debounce restarts once per action, so a gesture that
 * equals several keys restarts it fewer times; compare it once. A prefix key
 * such as the "g" of "gd" also arms the which-key popup, which a gesture
 * never waits for.
 */
function expectSame(actual: Result, expected: Result): void {
  const comparable = (effects: Effect[]) =>
    effects.filter(
      (e, i) =>
        !(e.kind === "startTimer" && e.id === "whichKey") &&
        (!(e.kind === "startTimer" && e.id === "saveState") ||
          effects.findIndex((f) => f.kind === "startTimer" && f.id === e.id) ===
            i),
    );
  expect(actual.state).toEqual(expected.state);
  expect(comparable(actual.effects)).toEqual(comparable(expected.effects));
}

const cursorOf = (s: AppState, id = s.windows.active) =>
  s.windows.byId[id]?.content.cursor;
const textOf = (s: AppState, id = 1) => {
  const b = s.buffers[id];
  if (b === undefined) throw new Error("no buffer");
  return fullText(b.text);
};

const LINES = "alpha beta\nsecond line\nthird one here\nfourth\nfifth\n";

test("a press focuses the window, explorer, or side panel under it", () => {
  const split = keys(open("a.md", LINES), "<C-w>v").state;
  const other = split.windows.active === 1 ? 2 : 1;
  const onText = mouse(split, press(text(other, 1, 2))).state;
  expect(onText.windows.active).toBe(other);
  expect(cursorOf(onText)).toEqual({ line: 1, col: 2 });

  const onWinbar = mouse(
    split,
    press({ kind: "window", window: other, spot: { kind: "winbar" } }),
  ).state;
  expect(onWinbar.windows.active).toBe(other);
  expect(cursorOf(onWinbar)).toEqual(cursorOf(split, other));

  const onExplorer = mouse(split, press({ kind: "explorer", path: "" })).state;
  expect(onExplorer.panels.explorer.focused).toBe(true);
  expect(onExplorer.panels.explorer.cursor).toBe(split.panels.explorer.cursor);

  const docked: AppState = {
    ...split,
    panels: { ...split.panels, side: { ...split.panels.side, open: true } },
  };
  const onPanel = mouse(docked, press({ kind: "sidePanel", row: -1 })).state;
  expect(onPanel.panels.side.focused).toBe(true);
  expect(onPanel.panels.explorer.focused).toBe(false);

  const back = mouse(onPanel, press(text(other, 0, 0))).state;
  expect(back.panels.side.focused).toBe(false);
  expect(back.panels.explorer.focused).toBe(false);
});

test("a press on a window that no longer exists changes nothing", () => {
  const s = open("a.md", LINES);
  const r = mouse(s, press(text(99, 1, 1)));
  expect(r.state).toBe(s);
  expect(r.effects).toEqual([]);
});

test("a click in Normal mode places the cursor and resets pending keys and Visual mode", () => {
  const s = open("a.md", LINES);
  const placed = mouse(s, press(text(1, 2, 4))).state;
  expect(cursorOf(placed)).toEqual({ line: 2, col: 4 });
  expect(placed.vim.mode).toBe("normal");

  const pastEnd = mouse(s, press(text(1, 3, 99))).state;
  expect(cursorOf(pastEnd)).toEqual({ line: 3, col: "fourth".length - 1 });

  const pending = keys(s, "d").state;
  expect(pending.vim.pending).toEqual(["d"]);
  const cancelled = mouse(pending, press(text(1, 1, 1))).state;
  expect(cancelled.vim.pending).toEqual([]);
  expect(textOf(cancelled)).toBe(textOf(s));

  const visual = keys(s, "vl").state;
  const normal = mouse(visual, press(text(1, 2, 0))).state;
  expect(normal.vim.mode).toBe("normal");
  expect(cursorOf(normal)).toEqual({ line: 2, col: 0 });

  const down = keys(s, "$j").state;
  const clicked = keys(mouse(down, press(text(1, 2, 1))).state, "j").state;
  expect(cursorOf(clicked)).toEqual({ line: 3, col: 1 });
});

test("an Insert-mode click keeps Insert and starts a new undo step", () => {
  const typed = keys(open("a.md", LINES), "iab").state;
  const clicked = mouse(typed, press(text(1, 1, 3))).state;
  expect(clicked.vim.mode).toBe("insert");
  expect(cursorOf(clicked)).toEqual({ line: 1, col: 3 });
  const more = keys(clicked, "cd").state;
  expect(textOf(more).split("\n")[1]).toBe("seccdond line");
  const undone = keys(more, "<Esc>u").state;
  expect(textOf(undone).split("\n").slice(0, 2)).toEqual([
    "abalpha beta",
    "second line",
  ]);

  const end = mouse(typed, press(text(1, 3, 99))).state;
  expect(end.vim.mode).toBe("insert");
  expect(cursorOf(end)).toEqual({ line: 3, col: "fourth".length });
});

test("dragging selects charwise from the press to the pointer", () => {
  const s = open("a.md", LINES);
  const pressed = mouse(s, press(text(1, 1, 3))).state;
  const dragged = mouse(pressed, { kind: "drag", target: text(1, 2, 1) }).state;
  expect(dragged.vim.mode).toBe("visual");
  expect(dragged.vim.visualAnchor).toEqual({ line: 1, col: 3 });
  expect(cursorOf(dragged)).toEqual({ line: 2, col: 1 });
  const further = mouse(dragged, { kind: "drag", target: text(1, 2, 4) }).state;
  expect(further.vim.visualAnchor).toEqual({ line: 1, col: 3 });
  const yanked = keys(further, "y").state;
  expect(yanked.vim.registers.get('"')?.text).toBe("ond line\nthird");

  const below = mouse(pressed, { kind: "drag", target: text(1, 3, 0, 1) });
  expect(cursorOf(below.state)).toEqual({ line: 4, col: 0 });

  const fromInsert = mouse(keys(s, "i").state, press(text(1, 1, 5))).state;
  const insertDrag = mouse(fromInsert, {
    kind: "drag",
    target: text(1, 1, 8),
  }).state;
  expect(insertDrag.vim.mode).toBe("visual");
  expect(insertDrag.vim.visualAnchor).toEqual({ line: 1, col: 5 });
});

test("double and triple clicks equal viw and V", () => {
  const s = open("a.md", LINES);
  const single = mouse(s, press(text(1, 2, 7))).state;
  expectSame(mouse(s, press(text(1, 2, 7), 2)), keys(single, "viw"));
  expectSame(mouse(s, press(text(1, 2, 7), 3)), keys(single, "V"));
  expect(mouse(s, press(text(1, 2, 7), 2)).state.vim.mode).toBe("visual");
});

test("ctrl+click on a link follows it like gd", () => {
  const s = open("a.md", "see [[b]] here\nplain text\n");
  const onLink = mouse(s, press(text(1, 0, 6))).state;
  const followed = mouse(s, press(text(1, 0, 6), 1, true));
  expectSame(followed, keys(onLink, "gd"));
  expect(followed.state.overlay.kind).toBe("prompt");

  expectSame(
    mouse(s, press(text(1, 1, 2), 1, true)),
    mouse(s, press(text(1, 1, 2))),
  );
});

test("the core mouse contract carries no button", () => {
  // @ts-expect-error a button is not part of the core mouse contract
  const event: MouseEvent = { ...press(text(1, 0, 0)), button: 2 };
  expect(event.kind).toBe("press");
});

const wheel = (target: MouseTarget, dy: -1 | 0 | 1, dx: -1 | 0 | 1 = 0) =>
  ({ kind: "wheel", target, dx, dy }) as const;

const withActive = (s: AppState, active: WindowId): AppState => ({
  ...s,
  windows: { ...s.windows, active },
});

const MANY = `${Array.from({ length: 40 }, (_, i) => `line ${i}`).join("\n")}\n`;

/** a.md and tasks.base side by side, with the note's window active. */
function noteAndBase(): AppState {
  const split = keys(open("a.md", MANY), "<C-w>v").state;
  const other = split.windows.active;
  const based = update(
    update(split, {
      type: "fileLoaded",
      path: "tasks.base",
      file: textFile(TASKS_BASE),
    }).state,
    indexed(),
  ).state;
  return withActive(based, other === 1 ? 2 : 1);
}

const baseWindowOf = (s: AppState) =>
  Object.values(s.windows.byId).find((w) => w.content.editor === "base");
const baseFocus = (s: AppState) =>
  (baseWindowOf(s)?.content.kindState as BaseWindowState | undefined)?.focus;

test("the wheel scrolls the window under the pointer, not the active one", () => {
  const split = keys(open("a.md", MANY), "<C-w>v").state;
  const other = split.windows.active === 1 ? 2 : 1;
  const r = mouse(split, wheel(text(other, 0, 0), 1));
  expect(r.state.windows.byId[other]?.content.scroll).toBe(3);
  expect(r.state.windows.byId[other]?.content.cursor).toEqual(
    split.windows.byId[other]?.content.cursor,
  );
  expect(r.state.windows.active).toBe(split.windows.active);
  expect(r.state.vim.mode).toBe("normal");

  const back = mouse(r.state, wheel(text(other, 0, 0), -1)).state;
  expect(back.windows.byId[other]?.content.scroll).toBe(0);
  const top = mouse(split, wheel(text(other, 0, 0), -1)).state;
  expect(top.windows.byId[other]?.content.scroll).toBe(0);

  const inserting = keys(split, "i").state;
  const scrolled = mouse(inserting, wheel(text(other, 0, 0), 1)).state;
  expect(scrolled.vim.mode).toBe("insert");
  expect(scrolled.windows.active).toBe(split.windows.active);

  const sideways = mouse(split, wheel(text(other, 0, 0), 0, 1));
  expect(sideways.state).toEqual(split);
  expect(sideways.effects).toEqual([]);
});

test("the wheel moves the explorer list without focusing it", () => {
  const listed = update(open("a.md", MANY), {
    type: "dirListed",
    dir: "",
    entries: ["a", "b", "c", "d", "e"].map((n) => ({
      name: `${n}.md`,
      kind: "file" as const,
    })),
  }).state;
  const s: AppState = {
    ...listed,
    panels: {
      ...listed.panels,
      explorer: { ...listed.panels.explorer, open: true, cursor: "a.md" },
    },
  };
  const down = mouse(s, wheel({ kind: "explorer", path: "b.md" }, 1)).state;
  expect(down.panels.explorer.cursor).toBe("d.md");
  expect(down.panels.explorer.focused).toBe(false);
  const clamped = mouse(down, wheel({ kind: "explorer", path: "" }, 1)).state;
  expect(clamped.panels.explorer.cursor).toBe("e.md");
});

test("the wheel moves the focus of an inactive Base without activating it", () => {
  const s = noteAndBase();
  const base = baseWindowOf(s);
  if (base === undefined) throw new Error("expected a base window");
  expect(baseFocus(s)?.index ?? 0).toBe(0);
  const r = mouse(
    s,
    wheel({ kind: "window", window: base.id, spot: { kind: "base" } }, 1),
  ).state;
  expect(baseFocus(r)?.index).toBe(3);
  expect(r.windows.active).toBe(s.windows.active);
  expect(r.panels).toEqual(s.panels);
});

test("the wheel over a Base table scrolls its columns once per sideways notch", () => {
  const s = noteAndBase();
  const base = baseWindowOf(s);
  if (base === undefined) throw new Error("expected a base window");
  const target: MouseTarget = {
    kind: "window",
    window: base.id,
    spot: { kind: "baseCell", row: 0, column: 0 },
  };
  const focused = withActive(s, base.id);
  const right = mouse(s, wheel(target, 0, 1));
  expectSame(
    { ...right, state: withActive(right.state, base.id) },
    keys(focused, "L"),
  );
  expect(right.state.windows.active).toBe(s.windows.active);
  const model = baseViewModel(withActive(right.state, base.id), base.id, reg);
  expect(model?.table).toBeDefined();
});

const OUTLINE = "# One\n## Two\n## Three\n# Four\n# Five\n# Six\n";

function withOutline(): AppState {
  const s = open("a.md", OUTLINE);
  return {
    ...s,
    panels: {
      ...s.panels,
      side: { ...s.panels.side, kind: "outline", open: true },
    },
  };
}

test("the wheel over the side panel equals j without focusing it", () => {
  const s = withOutline();
  const r = mouse(s, wheel({ kind: "sidePanel", row: 0 }, 1));
  expect(r.state.panels.side.cursor).toBe(3);
  expect(r.state.panels.side.focused).toBe(false);
  const side = (st: AppState, focused: boolean): AppState => ({
    ...st,
    panels: { ...st.panels, side: { ...st.panels.side, focused } },
  });
  const typed = keys(side(s, true), "jjj");
  expectSame(r, { ...typed, state: side(typed.state, false) });
});

test.each<[string, () => AppState, MouseEvent, string]>([
  [
    "a picker",
    () => keys(open("a.md", MANY), " sc").state,
    wheel({ kind: "overlayItem", index: 0 }, 1),
    "<C-n><C-n><C-n>",
  ],
  [
    "a picker, upwards",
    () => keys(open("a.md", MANY), " sc<C-n><C-n><C-n><C-n>").state,
    wheel({ kind: "overlay" }, -1),
    "<C-p><C-p><C-p>",
  ],
  [
    "the calendar",
    () => keys(open("a.md", MANY), " np").state,
    wheel({ kind: "overlay" }, 1),
    "j",
  ],
  [
    "the calendar, upwards",
    () => keys(open("a.md", MANY), " np").state,
    wheel({ kind: "calendarDay", date: { year: 2026, month: 1, day: 1 } }, -1),
    "k",
  ],
])("the wheel over %s equals its list keys", (_label, setup, event, seq) => {
  const s = setup();
  const r = mouse(s, event);
  expectSame(r, keys(s, seq));
  expect(r.state).not.toEqual(s);
});

function completing(): AppState {
  const s = update(open("a.md", "x\n"), indexed()).state;
  const r = keys(s, "o[[");
  if (r.state.overlay.kind !== "completion")
    throw new Error("expected completion");
  return r.state;
}

test("the wheel stops at the last completion item instead of wrapping", () => {
  const s = keys(completing(), "<C-n><C-n>").state;
  if (s.overlay.kind !== "completion") throw new Error("expected completion");
  const n = s.overlay.completion.items.length;
  expect(n).toBe(4);
  expect(s.overlay.completion.selected).toBe(2);
  const down = mouse(s, wheel({ kind: "overlayItem", index: 0 }, 1));
  expectSame(down, keys(s, "<C-n>"));
  const again = mouse(down.state, wheel({ kind: "overlayItem", index: 0 }, 1));
  expect(again.state).toEqual(down.state);
  const up = mouse(s, wheel({ kind: "overlay" }, -1));
  expectSame(up, keys(s, "<C-p><C-p>"));
  expect(up.state.vim.mode).toBe("insert");
});
