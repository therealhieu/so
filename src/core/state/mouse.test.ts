import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import { splitKeys } from "../kernel/vim/keys";
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
