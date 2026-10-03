import {
  bufferForPath,
  closeActiveWindow,
  leaves,
  removeBuffer,
  saveText,
  setBuffer,
} from "./buffers";
import { chain, message, none } from "./result";
import type {
  Action,
  AppState,
  BufferId,
  BufferState,
  Effect,
  Result,
  SaveState,
} from "./types";

const isConflicted = (s: AppState, id: BufferId): boolean =>
  s.overlay.kind === "conflict" && s.overlay.bufferId === id;

/** The single save gate: dirty, present on disk, and not in a conflict. */
const writable = (s: AppState, b: BufferState): boolean =>
  b.dirty && b.disk === "present" && !isConflicted(s, b.id);

/** A buffer that `:q` and `:bd` must not close: its edits cannot be written. */
const blocked = (s: AppState, b: BufferState): boolean =>
  isConflicted(s, b.id) || (b.dirty && b.disk === "deleted");

const e37 = (s: AppState, b: BufferState): Result =>
  message(s, `E37: No write since last change (${b.path})`, "error");

const setSave = (s: AppState, id: BufferId, save: SaveState): AppState =>
  setBuffer(s, id, { save });

const retryDelay = (attempt: number): number =>
  Math.min(1000 * 2 ** (attempt - 1), 30_000);

/** Start (or restart) the autosave delay after an edit at `now`. */
export function scheduleAutosave(
  s: AppState,
  id: BufferId,
  now: number,
): Result {
  const b = s.buffers[id];
  if (
    b === undefined ||
    !s.config.autosave.enabled ||
    !writable(s, b) ||
    b.save.kind === "writing" ||
    b.save.kind === "failed"
  )
    return none(s);
  const ms = s.config.autosave.delayMs;
  return {
    state: setSave(s, id, { kind: "scheduled", at: now + ms }),
    effects: [{ kind: "startTimer", id: `autosave:${id}`, ms }],
  };
}

/**
 * Emit the buffer's write. A no-op unless the buffer is writable and no write
 * is in flight; `recreate` writes a deleted-on-disk buffer without a stamp check.
 */
export function writeBuffer(
  s: AppState,
  id: BufferId,
  now: number,
  opts: { recreate?: boolean } = {},
): Result {
  const b = s.buffers[id];
  if (b === undefined || b.save.kind === "writing" || isConflicted(s, id))
    return none(s);
  const recreate = opts.recreate === true && b.disk === "deleted";
  if (!recreate && !writable(s, b)) return none(s);
  const attempt = b.save.kind === "failed" ? b.save.attempt : 0;
  const effects: Effect[] = [{ kind: "cancelTimer", id: `autosave:${id}` }];
  if (b.save.kind === "failed")
    effects.push({ kind: "cancelTimer", id: `retry:${id}` });
  effects.push(
    recreate
      ? { kind: "write", path: b.path, text: saveText(b) }
      : { kind: "write", path: b.path, text: saveText(b), expected: b.stamp },
  );
  return {
    state: setSave(s, id, {
      kind: "writing",
      version: b.text.version,
      at: now,
      attempt,
    }),
    effects,
  };
}

/** Save now on leaving Insert or a buffer, when autosave is on. */
export const autosaveNow = (s: AppState, id: BufferId, now: number): Result =>
  s.config.autosave.enabled ? writeBuffer(s, id, now) : none(s);

export function onTimer(
  s: AppState,
  a: Extract<Action, { type: "timer" }>,
): Result {
  const [kind, n] = a.id.split(":");
  const id = Number(n);
  if (kind === "toast")
    return none({
      ...s,
      notifications: {
        ...s.notifications,
        toasts: s.notifications.toasts.filter((t) => t.id !== id),
      },
    });
  const save = s.buffers[id]?.save;
  if (kind === "autosave" && save?.kind === "scheduled" && save.at <= a.now)
    return writeBuffer(s, id, a.now);
  if (kind === "retry" && save?.kind === "failed")
    return writeBuffer(s, id, a.now);
  return none(s);
}

export function onSaved(
  s: AppState,
  a: Extract<Action, { type: "saved" }>,
): Result {
  const b = bufferForPath(s, a.path);
  if (b === undefined) return none(s);
  const writing = b.save.kind === "writing" ? b.save : undefined;
  const version = writing?.version ?? b.savedVersion;
  const dirty = b.text.version !== version;
  const r = none(
    setBuffer(s, b.id, {
      stamp: a.stamp,
      savedVersion: version,
      dirty,
      disk: "present",
      save: { kind: "idle" },
    }),
  );
  // Typed during the write: write the newer text now.
  if (dirty) return chain(r, (st) => writeBuffer(st, b.id, writing?.at ?? 0));
  const closed = b.closing ? chain(r, (st) => removeBuffer(st, b.id)) : r;
  return chain(closed, (st) => advanceQuit(st, b.id));
}

/** A saved buffer no longer holds up `:q`; the last one exits. */
function advanceQuit(s: AppState, id: BufferId): Result {
  const quit = s.terminal.quit;
  if (quit === undefined) return none(s);
  const waiting = quit.waiting.filter((w) => w !== id);
  if (waiting.length > 0)
    return none({
      ...s,
      terminal: { ...s.terminal, quit: { ...quit, waiting } },
    });
  const { quit: _, ...terminal } = s.terminal;
  return { state: { ...s, terminal }, effects: [{ kind: "exit", code: 0 }] };
}

/**
 * A failed write cancels a pending `:q` or `:bd`. A stamp conflict reads the
 * disk version back (the read opens the conflict); other errors retry with backoff.
 */
export function onSaveFailed(
  s: AppState,
  a: Extract<Action, { type: "saveFailed" }>,
): Result {
  const { quit: _, ...terminal } = s.terminal;
  const text = `save failed: ${a.reason}`;
  const b = bufferForPath(s, a.path);
  if (b === undefined) return message({ ...s, terminal }, text, "error");
  const { closing: __, ...rest } = b;
  const cleared: AppState = {
    ...s,
    terminal,
    buffers: { ...s.buffers, [b.id]: rest },
  };
  if (a.reason === "conflict")
    return chain(
      {
        state: setSave(cleared, b.id, { kind: "idle" }),
        effects: [{ kind: "read", path: b.path }],
      },
      (st) => message(st, text, "error"),
    );
  const writing = b.save.kind === "writing" ? b.save : undefined;
  const attempt = (writing?.attempt ?? 0) + 1;
  const ms = retryDelay(attempt);
  return chain(
    {
      state: setSave(cleared, b.id, {
        kind: "failed",
        reason: a.reason,
        attempt,
        retryAt: (writing?.at ?? 0) + ms,
      }),
      effects: [{ kind: "startTimer", id: `retry:${b.id}`, ms }],
    },
    (st) => message(st, text, "error"),
  );
}

/**
 * `:q` and `:q!`. With other windows open, only the active window closes.
 * Otherwise `:q` flushes every pending write and exits once all succeed.
 */
export function requestQuit(
  s: AppState,
  opts: { force: boolean },
  now: number,
): Result {
  if (leaves(s.windows.tree).length > 1) return closeActiveWindow(s);
  if (opts.force) return { state: s, effects: [{ kind: "exit", code: 0 }] };
  const buffers = Object.values(s.buffers);
  const stop = buffers.find((b) => blocked(s, b));
  if (stop !== undefined) return e37(s, stop);
  const ids = buffers
    .filter((b) => writable(s, b) || b.save.kind === "writing")
    .map((b) => b.id);
  if (ids.length === 0)
    return { state: s, effects: [{ kind: "exit", code: 0 }] };
  const waiting: AppState = {
    ...s,
    terminal: { ...s.terminal, quit: { code: 0, waiting: ids } },
  };
  return ids.reduce(
    (r, id) => chain(r, (st) => writeBuffer(st, id, now)),
    none(waiting),
  );
}

/** `:bd` and `:bd!`: `:bd` flushes first and closes once the write succeeds. */
export function closeBuffer(
  s: AppState,
  id: BufferId,
  opts: { force: boolean },
  now: number,
): Result {
  const b = s.buffers[id];
  if (b === undefined) return none(s);
  if (opts.force) return removeBuffer(s, id);
  if (blocked(s, b)) return e37(s, b);
  if (writable(s, b) || b.save.kind === "writing")
    return chain(none(setBuffer(s, id, { closing: true })), (st) =>
      writeBuffer(st, id, now),
    );
  return removeBuffer(s, id);
}

/** The write of every writable buffer, for the shutdown flush. */
export function pendingWrites(
  s: AppState,
): Extract<Effect, { kind: "write" }>[] {
  return Object.values(s.buffers)
    .filter((b) => writable(s, b))
    .map((b) => ({
      kind: "write",
      path: b.path,
      text: saveText(b),
      expected: b.stamp,
    }));
}
