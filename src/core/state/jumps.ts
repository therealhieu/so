import type { Pos } from "../kernel/text/pos";
import { activeBuffer, activeWindow, openPath, placeCursor } from "./buffers";
import { chain, message, none } from "./result";
import type { AppState, JumpEntry, JumpList, Result } from "./types";

export const JUMP_LIMIT = 100;

const sameLine = (a: JumpEntry, b: JumpEntry) =>
  a.path === b.path && a.line === b.line;

/**
 * Record a jump from `e`: newer entries past `at` are dropped, an older entry
 * on the same path and line is replaced, and the oldest entries fall off
 * past `JUMP_LIMIT`. Afterwards `at` points past the last entry.
 */
export function pushJump(j: JumpList, e: JumpEntry): JumpList {
  const entries = [
    ...j.entries.slice(0, j.at).filter((x) => !sameLine(x, e)),
    e,
  ].slice(-JUMP_LIMIT);
  return { entries, at: entries.length };
}

/** The active window's position, or undefined when nothing is open. */
function currentJump(s: AppState): JumpEntry | undefined {
  const w = activeWindow(s);
  const b = activeBuffer(s);
  return w && b && { path: b.path, ...w.content.cursor };
}

/** `pushJump` from the active window's position; a no-op when nothing is open. */
export function recordJump(s: AppState): AppState {
  const here = currentJump(s);
  return here === undefined ? s : { ...s, jumps: pushJump(s.jumps, here) };
}

/**
 * <C-o>: at the end of the list the current position is recorded first, so
 * <C-i> comes back to it; then the cursor moves to the previous entry.
 */
export function jumpBack(s: AppState, now: number): Result {
  let { jumps } = s;
  const here = currentJump(s);
  if (jumps.at === jumps.entries.length && here !== undefined) {
    const entries = [...jumps.entries.filter((x) => !sameLine(x, here)), here];
    jumps = { entries, at: entries.length - 1 };
  }
  return jumpTo({ ...s, jumps }, jumps.at - 1, now);
}

/** <C-i>: move to the next entry. */
export function jumpForward(s: AppState, now: number): Result {
  return jumpTo(s, s.jumps.at + 1, now);
}

function jumpTo(s: AppState, at: number, now: number): Result {
  const e = s.jumps.entries[at];
  if (e === undefined) return none(s);
  const moved: AppState = { ...s, jumps: { ...s.jumps, at } };
  return goTo(moved, e.path, { line: e.line, col: e.col }, now);
}

/**
 * Show `path` in the active window with the cursor at `pos`, once its read
 * answers when it is not open yet.
 */
export function goTo(s: AppState, path: string, pos: Pos, now: number): Result {
  if (activeBuffer(s)?.path === path) return none(placeCursor(s, pos));
  return chain(openPath(s, path, now), (st) =>
    none(
      activeBuffer(st)?.path === path
        ? placeCursor(st, pos)
        : awaitLoad(st, path, pos),
    ),
  );
}

/** The active window shows `path` at `cursor` once its read answers. */
function awaitLoad(s: AppState, path: string, cursor: Pos): AppState {
  const restore = s.windows.restore ?? { pending: {}, missing: 0 };
  const pending = {
    ...restore.pending,
    [s.windows.active]: { path, cursor, scroll: 0, navigated: true as const },
  };
  return { ...s, windows: { ...s.windows, restore: { ...restore, pending } } };
}

/** "jump i/n" once any jump is recorded; the current position counts at the end. */
export function jumpSegment(j: JumpList): string | undefined {
  if (j.entries.length === 0) return undefined;
  const n = j.entries.length + (j.at === j.entries.length ? 1 : 0);
  return `jump ${j.at + 1}/${n}`;
}

/**
 * `:jumps` in the message line: entries oldest first as `path:line`, `>`
 * before the current one (or at the end when not travelling).
 */
export function showJumps(s: AppState): Result {
  const { entries, at } = s.jumps;
  if (entries.length === 0) return message(s, "jump list is empty");
  const items = entries.map(
    (e, i) => `${i === at ? ">" : ""}${e.path}:${e.line + 1}`,
  );
  return message(
    s,
    `jumps: ${[...items, ...(at === entries.length ? [">"] : [])].join("  ")}`,
  );
}
