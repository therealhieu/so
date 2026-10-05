import type { Pos } from "../kernel/text/pos";
import type { Key } from "../kernel/vim/keys";
import { baseViewModel } from "./base-model";
import { activeBuffer, leaves, placeCursor, setWindow } from "./buffers";
import { runCommand } from "./commands";
import { moveCursor } from "./explorer";
import { handleKeyAction } from "./keys";
import { chain, clearMessage, none } from "./result";
import type { AppState, MouseEvent, MouseTarget, Result } from "./types";
import type { Registries } from "./update";

const LINK_FOLLOW = "link.follow";
/** Lines, rows, or items one vertical wheel notch moves. */
const WHEEL_LINES = 3;

/**
 * One mouse gesture, run as its keyboard equivalent: a press focuses what it
 * is over and then acts on it, a drag extends a charwise selection from the
 * press, and the wheel scrolls what it is over.
 */
export function onMouse(
  s: AppState,
  a: { event: MouseEvent; now: number },
  reg: Registries,
): Result {
  const e = a.event;
  if (stale(s, e.target)) return none(s);
  switch (e.kind) {
    case "press": {
      const focused = focusTarget(s, e.target);
      const t = e.target;
      return t.kind === "window" && t.spot.kind === "text"
        ? pressText(none(focused), t.spot.pos, e.clicks, e.ctrl, a.now, reg)
        : none(focused);
    }
    case "drag": {
      const t = e.target;
      return t.kind === "window" &&
        t.spot.kind === "text" &&
        t.window === s.windows.active
        ? dragText(s, t.spot.pos, t.spot.edge, a.now, reg)
        : none(s);
    }
    case "wheel":
      return wheel(s, e.target, e.dx, e.dy, a.now, reg);
  }
}

const repeat = (key: Key, n: number): Key[] => Array<Key>(n).fill(key);

/**
 * One wheel notch over `t`, never moving focus or changing mode: a text
 * window scrolls without moving its cursor; a Base moves its focus three
 * rows, or for a sideways notch scrolls its columns (table) or moves to the
 * next lane (board); the explorer and the side panel move their selection;
 * an open list moves its selection, stopping at either end; the calendar
 * moves a week.
 */
function wheel(
  s: AppState,
  t: MouseTarget,
  dx: number,
  dy: number,
  now: number,
  reg: Registries,
): Result {
  switch (t.kind) {
    case "window":
      return s.windows.byId[t.window]?.content.editor === "base"
        ? withFocus(s, t, (f) => wheelBase(f, dx, dy, now, reg))
        : scrollWindow(s, t.window, dy);
    case "explorer":
      return dy === 0 ? none(s) : moveCursor(s, dy * WHEEL_LINES);
    case "sidePanel":
      return dy === 0
        ? none(s)
        : withFocus(s, t, (f) =>
            feedKeys(
              none(f),
              repeat(dy > 0 ? "j" : "k", WHEEL_LINES),
              now,
              reg,
            ),
          );
    case "overlayItem":
    case "overlay":
    case "calendarDay":
      return dy === 0 ? none(s) : wheelOverlay(s, dy, now, reg);
    default:
      return none(s);
  }
}

/** Scroll window `id` by whole notches, keeping its last line on screen. */
function scrollWindow(s: AppState, id: number, dy: number): Result {
  const w = s.windows.byId[id];
  const b = w && s.buffers[w.content.bufferId];
  if (dy === 0 || w === undefined || b === undefined) return none(s);
  const scroll = Math.max(
    0,
    Math.min(w.content.scroll + dy * WHEEL_LINES, b.text.lineCount - 1),
  );
  return scroll === w.content.scroll
    ? none(s)
    : none(setWindow(s, { ...w, content: { ...w.content, scroll } }));
}

/**
 * The Base commands its keys run (`j`/`k`, then `L`/`H` on a table or
 * `l`/`h` on a board), so a notch works whatever the mode is.
 */
function wheelBase(
  s: AppState,
  dx: number,
  dy: number,
  now: number,
  reg: Registries,
): Result {
  if (dy !== 0)
    return Array.from({ length: WHEEL_LINES }).reduce<Result>(
      (r) =>
        chain(r, (st) =>
          runCommand(st, dy > 0 ? "base.down" : "base.up", now, reg),
        ),
      none(s),
    );
  if (dx === 0) return none(s);
  const board = baseViewModel(s, s.windows.active, reg)?.board !== undefined;
  const id = board
    ? dx > 0
      ? "base.right"
      : "base.left"
    : dx > 0
      ? "base.moveRight"
      : "base.moveLeft";
  return runCommand(s, id, now, reg);
}

/** The open list or calendar under the wheel. */
function wheelOverlay(
  s: AppState,
  dy: number,
  now: number,
  reg: Registries,
): Result {
  const key = dy > 0 ? "<Down>" : "<Up>";
  switch (s.overlay.kind) {
    case "picker":
    case "palette":
    case "help":
      return feedKeys(none(s), repeat(key, WHEEL_LINES), now, reg);
    case "completion": {
      const { items, selected } = s.overlay.completion;
      const room = dy > 0 ? items.length - 1 - selected : selected;
      const steps = Math.max(0, Math.min(WHEEL_LINES, room));
      return feedKeys(none(s), repeat(key, steps), now, reg);
    }
    case "calendar":
      return feedKeys(none(s), [dy > 0 ? "j" : "k"], now, reg);
    default:
      return none(s);
  }
}

/**
 * Run `run` with keyboard focus on `target` and no pending keys, then put
 * the previous focus and pending keys back.
 */
function withFocus(
  s: AppState,
  target: MouseTarget,
  run: (s: AppState) => Result,
): Result {
  const r = run({ ...focusTarget(s, target), vim: { ...s.vim, pending: [] } });
  const st = r.state;
  return {
    ...r,
    state: {
      ...setPanelFocus(
        { ...st, windows: { ...st.windows, active: s.windows.active } },
        s.panels.explorer.focused,
        s.panels.side.focused,
      ),
      vim: { ...st.vim, pending: s.vim.pending },
    },
  };
}

/** A target naming a window that was closed since the frame was painted. */
const stale = (s: AppState, t: MouseTarget): boolean =>
  t.kind === "window" && !leaves(s.windows.tree).includes(t.window);

/** Run keys through the same path as typed keys, concatenating effects. */
function feedKeys(
  r: Result,
  keys: readonly Key[],
  now: number,
  reg: Registries,
): Result {
  return keys.reduce(
    (acc, key) =>
      chain(acc, (s) => handleKeyAction(clearMessage(s), { key, now }, reg)),
    r,
  );
}

const setPanelFocus = (
  s: AppState,
  explorer: boolean,
  side: boolean,
): AppState => ({
  ...s,
  panels: {
    explorer: { ...s.panels.explorer, focused: explorer },
    side: { ...s.panels.side, focused: side },
  },
});

/** Give keyboard focus to the window, explorer, or side panel under the pointer. */
function focusTarget(s: AppState, t: MouseTarget): AppState {
  switch (t.kind) {
    case "window":
      return setPanelFocus(
        { ...s, windows: { ...s.windows, active: t.window } },
        false,
        false,
      );
    case "explorer":
      return setPanelFocus(s, true, false);
    case "sidePanel":
      return setPanelFocus(s, false, true);
    default:
      return s;
  }
}

/**
 * Put the cursor at `pos` as a click does: clamped like a motion, and the
 * column that `j`/`k` return to becomes the clicked one.
 */
function placeAt(r: Result, pos: Pos): Result {
  const { wantCol: _, ...vim } = r.state.vim;
  return { ...r, state: placeCursor({ ...r.state, vim }, pos) };
}

/**
 * A press on text. In Insert a single click leaves Insert, moves, and
 * enters it again, so the typing after it is a new undo step; a click past
 * the line end appends. Otherwise Visual mode and pending keys are
 * cancelled first; a double click selects the word (`viw`), a triple click
 * the line (`V`), and Ctrl follows the link under the click (`gd`).
 */
function pressText(
  r: Result,
  pos: Pos,
  clicks: 1 | 2 | 3,
  ctrl: boolean,
  now: number,
  reg: Registries,
): Result {
  const { mode, pending } = r.state.vim;
  if (mode === "insert" && clicks === 1 && !ctrl) {
    const placed = placeAt(feedKeys(r, ["<Esc>"], now, reg), pos);
    const length = activeBuffer(placed.state)?.text.line(
      cursorLine(placed.state),
    ).length;
    const append = length !== undefined && length > 0 && pos.col >= length;
    return feedKeys(placed, [append ? "a" : "i"], now, reg);
  }
  const idle = mode === "normal" && pending.length === 0;
  const placed = placeAt(idle ? r : feedKeys(r, ["<Esc>"], now, reg), pos);
  if (ctrl)
    return followsLinks(placed.state, reg)
      ? chain(placed, (s) => runCommand(s, LINK_FOLLOW, now, reg))
      : placed;
  if (clicks === 2) return feedKeys(placed, ["v", "i", "w"], now, reg);
  if (clicks === 3) return feedKeys(placed, ["V"], now, reg);
  return placed;
}

const cursorLine = (s: AppState): number =>
  s.windows.byId[s.windows.active]?.content.cursor.line ?? 0;

/** Whether the active buffer's file type has links to follow. */
function followsLinks(s: AppState, reg: Registries): boolean {
  const ft = activeBuffer(s)?.fileType;
  const types = reg.commands.get(LINK_FOLLOW)?.filetypes;
  return ft !== undefined && (types === undefined || types.includes(ft));
}

/**
 * A drag on the pressed window's text: charwise Visual from the press (the
 * cursor before the drag) to the pointer, one line past it at an edge.
 */
function dragText(
  s: AppState,
  pos: Pos,
  edge: -1 | 0 | 1,
  now: number,
  reg: Registries,
): Result {
  const { mode, pending } = s.vim;
  let r = none(s);
  if (mode !== "visual" && mode !== "visualLine") {
    const from = s.windows.byId[s.windows.active]?.content.cursor;
    if (mode !== "normal" || pending.length > 0) {
      r = feedKeys(r, ["<Esc>"], now, reg);
      if (from !== undefined) r = placeAt(r, from);
    }
    r = feedKeys(r, ["v"], now, reg);
  }
  return placeAt(r, { line: pos.line + edge, col: pos.col });
}
