import type { Pos } from "../kernel/text/pos";
import type { Key } from "../kernel/vim/keys";
import { activeBuffer, leaves, placeCursor } from "./buffers";
import { runCommand } from "./commands";
import { handleKeyAction } from "./keys";
import { chain, clearMessage, none } from "./result";
import type { AppState, MouseEvent, MouseTarget, Result } from "./types";
import type { Registries } from "./update";

const LINK_FOLLOW = "link.follow";

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
      return none(s);
  }
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
