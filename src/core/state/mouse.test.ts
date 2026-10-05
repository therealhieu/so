import { expect, test } from "bun:test";
import { indexed, TASKS_BASE } from "../../../test/support/bases";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import type { BaseWindowState } from "../features/bases/file-type";
import { splitKeys } from "../kernel/vim/keys";
import { addDays } from "../time/local";
import { baseViewModel } from "./base-model";
import { fullText } from "./buffers";
import { pressStops } from "./mouse";
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

/** Buffer texts as strings: equal texts from separate edits are separate objects. */
const plain = (s: AppState) => ({
  ...s,
  buffers: Object.fromEntries(
    Object.entries(s.buffers).map(([id, b]) => [
      id,
      { ...b, text: fullText(b.text) },
    ]),
  ),
});

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
  expect(plain(actual.state)).toEqual(plain(expected.state));
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

test("a click at the length of a line ending in a link lands after the link", () => {
  const link = "See [[Project Plan]]";
  const s = open("a.md", `${link}\n`);
  const atEnd = press(text(1, 0, link.length));

  const normal = mouse(s, atEnd).state;
  expect(normal.vim.mode).toBe("normal");
  expect(cursorOf(normal)).toEqual({ line: 0, col: link.length - 1 });

  const inserting = keys(s, "i").state;
  const clicked = mouse(inserting, atEnd).state;
  expect(clicked.vim.mode).toBe("insert");
  expect(cursorOf(clicked)).toEqual({ line: 0, col: link.length });
  expect(textOf(keys(clicked, "!").state).split("\n")[0]).toBe(`${link}!`);
});

test("an Insert-mode click in another window ends Insert where it was typed", () => {
  const split = keys(open("a.md", LINES), "<C-w>v").state;
  const typing = split.windows.active;
  const other = typing === 1 ? 2 : 1;
  const typed = keys(open("b.md", "bee\n", split), "Axy").state;
  expect(cursorOf(typed, typing)).toEqual({ line: 0, col: 5 });
  const clicked = mouse(typed, press(text(other, 2, 3))).state;
  expect(clicked.windows.active).toBe(other);
  expect(clicked.vim.mode).toBe("insert");
  expect(cursorOf(clicked, typing)).toEqual({ line: 0, col: 4 });
  expect(cursorOf(clicked, other)).toEqual({ line: 2, col: 3 });
  expect(textOf(clicked, 2)).toBe("beexy");
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

test("C-j and C-k move a completion like C-n and C-p", () => {
  const c = completing();
  expect(keys(c, "<C-j><C-j><C-k>").state).toEqual(
    keys(c, "<C-n><C-n><C-p>").state,
  );
  const s = keys(c, "<C-j>").state;
  expect(s.overlay.kind === "completion" && s.overlay.completion.selected).toBe(
    1,
  );
});

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

const setPanels = (
  s: AppState,
  explorer: Partial<AppState["panels"]["explorer"]>,
  side: Partial<AppState["panels"]["side"]> = {},
): AppState => ({
  ...s,
  panels: {
    explorer: { ...s.panels.explorer, ...explorer },
    side: { ...s.panels.side, ...side },
  },
});

/** a.md open, with an explorer listing two notes and a folder. */
function withExplorer(): AppState {
  const listed = update(open("a.md", MANY), {
    type: "dirListed",
    dir: "",
    entries: [
      { name: "a.md", kind: "file" },
      { name: "b.md", kind: "file" },
      { name: "notes", kind: "dir" },
    ],
  }).state;
  return setPanels(listed, { open: true, cursor: "a.md" });
}

function baseCase(): { s: AppState; id: WindowId } {
  const s = noteAndBase();
  const base = baseWindowOf(s);
  if (base === undefined) throw new Error("expected a base window");
  return { s, id: base.id };
}

test.each<
  [string, () => { start: AppState; event: MouseEvent; expected: Result }]
>([
  [
    "a buffer tab",
    () => {
      const start = open("b.md", "bee\n", open("a.md", MANY));
      return {
        start,
        event: press({ kind: "bufferTab", bufferId: 1 }),
        expected: keys(start, ":bn<CR>"),
      };
    },
  ],
  [
    "an explorer file",
    () => {
      const start = withExplorer();
      return {
        start,
        event: press({ kind: "explorer", path: "b.md" }),
        expected: keys(
          setPanels(start, { focused: true, cursor: "b.md" }),
          "<CR>",
        ),
      };
    },
  ],
  [
    "an explorer folder",
    () => {
      const start = withExplorer();
      return {
        start,
        event: press({ kind: "explorer", path: "notes" }),
        expected: keys(
          setPanels(start, { focused: true, cursor: "notes" }),
          "<CR>",
        ),
      };
    },
  ],
  [
    "a side-panel row",
    () => {
      const start = withOutline();
      return {
        start,
        event: press({ kind: "sidePanel", row: 3 }),
        expected: keys(
          setPanels(start, {}, { focused: true, cursor: 3 }),
          "<CR>",
        ),
      };
    },
  ],
  [
    "a Bases view tab",
    () => {
      const { s, id } = baseCase();
      return {
        start: s,
        event: press({
          kind: "window",
          window: id,
          spot: { kind: "baseTab", view: 1 },
        }),
        expected: keys(withActive(s, id), "2"),
      };
    },
  ],
  [
    "a picker row",
    () => {
      const start = keys(open("a.md", MANY), " sc").state;
      return {
        start,
        event: press({ kind: "overlayItem", index: 1 }),
        expected: keys(start, "<C-n><CR>"),
      };
    },
  ],
  [
    "a completion row",
    () => {
      const start = completing();
      return {
        start,
        event: press({ kind: "overlayItem", index: 2 }),
        expected: keys(start, "<C-n><C-n><CR>"),
      };
    },
  ],
  [
    "a calendar day",
    () => {
      const start = keys(open("a.md", MANY), " np").state;
      if (start.overlay.kind !== "calendar")
        throw new Error("expected a calendar");
      const date = addDays(start.overlay.calendar.selected, 2);
      return {
        start,
        event: press({ kind: "calendarDay", date }),
        expected: keys(start, "ll<CR>"),
      };
    },
  ],
])("a click on %s equals its keyboard action", (_label, setup) => {
  const { start, event, expected } = setup();
  const r = mouse(start, event);
  expectSame(r, expected);
  expect(r.state).not.toEqual(start);
});

test("a single click on a Bases cell focuses it and a double click opens it", () => {
  const { s, id } = baseCase();
  const cell: MouseTarget = {
    kind: "window",
    window: id,
    spot: { kind: "baseCell", row: 2, column: 1 },
  };
  const single = mouse(s, press(cell));
  expectSame(single, keys(withActive(s, id), "jjl"));
  expect(baseFocus(single.state)).toMatchObject({ index: 2, column: 1 });
  expect(Object.keys(single.state.windows.byId)).toEqual(
    Object.keys(s.windows.byId),
  );
  expect(single.effects).toEqual([]);

  const double = mouse(s, press(cell, 2));
  expectSame(double, keys(withActive(s, id), "jjl<CR>"));
  expect(double.effects.length).toBeGreaterThan(0);
});

test("a click on panel chrome only focuses the panel", () => {
  const start = withExplorer();
  const explorer = mouse(start, press({ kind: "explorer", path: "" })).state;
  expect(explorer.panels.explorer).toEqual({
    ...start.panels.explorer,
    focused: true,
  });
  const outline = withOutline();
  const side = mouse(
    {
      ...outline,
      panels: {
        ...outline.panels,
        side: { ...outline.panels.side, cursor: 2 },
      },
    },
    press({ kind: "sidePanel", row: -1 }),
  ).state;
  expect(side.panels.side).toMatchObject({ focused: true, cursor: 2 });
  expect(side.windows).toEqual(outline.windows);
});

test("a click on inert chrome or a stale item changes nothing", () => {
  const s = open("a.md", MANY);
  for (const target of [
    { kind: "inert" },
    { kind: "overlay" },
    { kind: "outside" },
    { kind: "bufferTab", bufferId: 42 },
  ] as MouseTarget[]) {
    const r = mouse(s, press(target));
    expect(r.state).toEqual(s);
    expect(r.effects).toEqual([]);
  }
  const picking = keys(s, " sc").state;
  const stale = mouse(picking, press({ kind: "overlayItem", index: 999 }));
  expect(stale.state).toEqual(picking);
});

const ALL_TARGETS: MouseTarget[] = [
  text(1, 1, 1),
  { kind: "window", window: 1, spot: { kind: "winbar" } },
  { kind: "explorer", path: "" },
  { kind: "sidePanel", row: 0 },
  { kind: "bufferTab", bufferId: 1 },
  { kind: "overlayItem", index: 0 },
  { kind: "calendarDay", date: { year: 2026, month: 10, day: 5 } },
  { kind: "overlay" },
  { kind: "outside" },
  { kind: "inert" },
];

test("prompt and conflict dialogs ignore every mouse gesture", () => {
  const prompting = keys(open("a.md", "see [[b]] here\nmore\n"), "wwgd").state;
  expect(prompting.overlay.kind).toBe("prompt");
  const conflicted: AppState = {
    ...open("a.md", LINES),
    overlay: {
      kind: "conflict",
      bufferId: 1,
      disk: textFile("changed\n", 2),
      showDiff: false,
    },
  };
  for (const start of [prompting, conflicted])
    for (const target of ALL_TARGETS)
      for (const event of [
        press(target),
        press(target, 2, true),
        { kind: "drag", target } as const,
        wheel(target, 1),
        wheel(target, 0, -1),
      ]) {
        const r = mouse(start, event);
        expect(r.state).toBe(start);
        expect(r.effects).toEqual([]);
      }
});

test("a click outside an overlay or the command line closes it and goes no further", () => {
  const s = open("a.md", LINES);
  const picking = keys(s, " sc").state;
  for (const target of [{ kind: "outside" }, text(1, 2, 2)] as MouseTarget[]) {
    const r = mouse(picking, press(target));
    expectSame(r, keys(picking, "<Esc>"));
    expect(r.state.overlay.kind).toBe("none");
    expect(cursorOf(r.state)).toEqual(cursorOf(s));
  }
  const inside = mouse(picking, press({ kind: "overlay" }));
  expect(inside.state).toEqual(picking);

  for (const line of [":", "/"]) {
    const typing = keys(s, `${line}ab`).state;
    expect(typing.vim.mode).toBe("cmdline");
    const r = mouse(typing, press(text(1, 2, 2)));
    expectSame(r, keys(typing, "<Esc>"));
    expect(r.state.vim.mode).toBe("normal");
    expect(cursorOf(r.state)).toEqual(cursorOf(s));
    expect(mouse(typing, press({ kind: "inert" })).state).toEqual(typing);
  }
});

test("a press stops at the gate exactly where the gate closes something", () => {
  const s = open("a.md", LINES);
  const onOverlay = ["overlayItem", "calendarDay", "overlay"];
  const prompting = keys(open("a.md", "see [[b]] here\nmore\n"), "wwgd").state;
  const cases: [AppState, (t: MouseTarget) => boolean][] = [
    [s, () => false],
    [keys(s, " sc").state, (t) => !onOverlay.includes(t.kind)],
    [keys(s, ":ab").state, (t) => t.kind !== "inert"],
    [completing(), () => false],
    [prompting, () => true],
  ];
  for (const [start, stops] of cases)
    for (const target of ALL_TARGETS)
      expect([target.kind, pressStops(start, target)]).toEqual([
        target.kind,
        stops(target),
      ]);
});

test("which-key ignores clicks and the wheel inside it and closes on a click outside", () => {
  const armed = keys(open("a.md", MANY), " ").state;
  const s = update(armed, { type: "timer", id: "whichKey", now: NOW }).state;
  expect(s.overlay.kind).toBe("whichKey");
  for (const event of [
    press({ kind: "overlay" }),
    press({ kind: "overlay" }, 2),
    wheel({ kind: "overlay" }, 1),
    wheel({ kind: "overlay" }, -1),
    wheel({ kind: "overlay" }, 0, 1),
  ]) {
    const r = mouse(s, event);
    expect(r.state).toEqual(s);
    expect(r.effects).toEqual([]);
  }
  for (const target of [{ kind: "outside" }, text(1, 2, 2)] as MouseTarget[]) {
    const r = mouse(s, press(target));
    expectSame(r, keys(s, "<Esc>"));
    expect(r.state.overlay.kind).toBe("none");
  }
});

test("a click on the text closes completion and still moves the cursor", () => {
  const s = completing();
  const r = mouse(s, press(text(1, 0, 0)));
  expect(r.state.overlay.kind).toBe("none");
  expect(r.state.vim.mode).toBe("insert");
  expect(cursorOf(r.state)).toEqual({ line: 0, col: 0 });
});

const BOARD = `views:
  - type: kanban-test
    name: Board
    order: [file.name]
    groupBy:
      property: status
      direction: ASC
`;

function board(): { s: AppState; id: WindowId } {
  const loaded = update(fresh(), {
    type: "fileLoaded",
    path: "plan.base",
    file: textFile(BOARD),
  }).state;
  const s = update(
    loaded,
    indexed({
      "tasks/a.md": "---\nstatus: todo\n---\n# A\n",
      "tasks/b.md": "---\nstatus: doing\n---\n# B\n",
    }),
  ).state;
  if (baseViewModel(s, s.windows.active, reg)?.board === undefined)
    throw new Error("expected a board");
  return { s, id: s.windows.active };
}

test("a click on a board card focuses it, a double click opens it, and a sideways notch changes lane", () => {
  const { s, id } = board();
  const card: MouseTarget = {
    kind: "window",
    window: id,
    spot: { kind: "baseCard", lane: 1, card: 0 },
  };
  expectSame(mouse(s, press(card)), keys(s, "l"));
  const opened = mouse(s, press(card, 2));
  expectSame(opened, keys(s, "l<CR>"));
  expect(opened.effects.length).toBeGreaterThan(0);
  expectSame(
    mouse(
      s,
      wheel({ kind: "window", window: id, spot: { kind: "base" } }, 0, 1),
    ),
    keys(s, "l"),
  );
  const missing: MouseTarget = {
    kind: "window",
    window: id,
    spot: { kind: "baseCard", lane: 9, card: 0 },
  };
  expect(mouse(s, press(missing)).state).toEqual(s);
});
