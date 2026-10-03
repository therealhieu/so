import {
  bufferForPath,
  buffersUnder,
  fullText,
  setBuffer,
  splitFile,
} from "./buffers";
import { dirname, pruneTree, relist } from "./explorer";
import { chain, message, none, toast } from "./result";
import { writeBuffer } from "./save";
import type {
  AppState,
  BufferId,
  BufferState,
  Effect,
  FileEvent,
  Result,
  Stamp,
  TextFile,
} from "./types";

const sameStamp = (a: Stamp, b: Stamp) =>
  a.mtimeMs === b.mtimeMs && a.size === b.size && a.hash === b.hash;

const cancelSaves = (id: BufferId): Effect[] => [
  { kind: "cancelTimer", id: `autosave:${id}` },
  { kind: "cancelTimer", id: `retry:${id}` },
];

/**
 * A watcher event. Removal marks open buffers deleted on disk; a change to an
 * open file reads it back (the read decides reload or conflict); anything else
 * relists the folders shown in the explorer.
 */
export function onFileChanged(s: AppState, e: FileEvent): Result {
  if (e.kind === "removed") {
    const open = buffersUnder(s, e.path).filter((b) => b.disk === "present");
    const marked = open.reduce<Result>(
      (r, b) => chain(r, (st) => markDeleted(st, b.id)),
      none(pruneTree(s, e.path)),
    );
    return chain(marked, (st) => relist(st, [dirname(e.path)]));
  }
  if (e.isDir) return relist(s, [dirname(e.path), e.path]);
  return bufferForPath(s, e.path) === undefined
    ? relist(s, [dirname(e.path)])
    : { state: s, effects: [{ kind: "read", path: e.path }] };
}

/** Mark a buffer deleted on disk: no autosave until `:w` recreates it. */
export function markDeleted(s: AppState, id: BufferId): Result {
  const marked = setBuffer(s, id, { disk: "deleted", save: { kind: "idle" } });
  return {
    ...message(marked, "deleted on disk — :w to recreate"),
    effects: cancelSaves(id),
  };
}

/** A read-back of an open buffer's file: same stamp → nothing; clean → reload; dirty → conflict. */
export function onDiskLoaded(s: AppState, b: BufferState, f: TextFile): Result {
  if (sameStamp(b.stamp, f.stamp) && b.disk === "present") return none(s);
  if (!b.dirty) return reload(s, b.id, f);
  return {
    state: {
      ...setBuffer(s, b.id, { save: { kind: "idle" } }),
      overlay: { kind: "conflict", bufferId: b.id, disk: f, showDiff: false },
    },
    effects: cancelSaves(b.id),
  };
}

/** Replace the buffer with the disk text as one undo step. */
function reload(s: AppState, id: BufferId, f: TextFile): Result {
  const b = s.buffers[id];
  if (b === undefined) return none(s);
  const { body, finalNewline } = splitFile(f);
  const unchanged = body === fullText(b.text);
  let text = b.text;
  let undo = b.undo;
  const windows = Object.values(s.windows.byId).filter(
    (w) => w.content.bufferId === id,
  );
  if (!unchanged) {
    const last = b.text.lineCount - 1;
    const edit = {
      range: {
        start: { line: 0, col: 0 },
        end: { line: last, col: b.text.line(last).length },
      },
      text: body,
    };
    const applied = b.text.apply(edit);
    text = applied.buffer;
    const active = s.windows.byId[s.windows.active];
    const cursorBefore =
      active?.content.bufferId === id
        ? active.content.cursor
        : { line: 0, col: 0 };
    undo = undo.push({
      edits: [edit],
      inverses: [applied.inverse],
      cursorBefore,
    });
  }
  const byId = { ...s.windows.byId };
  for (const w of windows) {
    const line = Math.min(w.content.cursor.line, text.lineCount - 1);
    const col = Math.min(w.content.cursor.col, text.line(line).length);
    byId[w.id] = { ...w, content: { ...w.content, cursor: { line, col } } };
  }
  const state: AppState = {
    ...setBuffer(s, id, {
      text,
      undo,
      bom: f.bom,
      eol: f.eol,
      finalNewline,
      stamp: f.stamp,
      savedVersion: text.version,
      dirty: false,
      disk: "present",
      save: { kind: "idle" },
    }),
    windows: { ...s.windows, byId },
    overlay:
      s.overlay.kind === "conflict" && s.overlay.bufferId === id
        ? { kind: "none" }
        : s.overlay,
  };
  return unchanged
    ? none(state)
    : message(state, "Reloaded from disk — u to undo");
}

/**
 * The conflict dialog's choice: keep writes the buffer over the disk version
 * just read; take reloads that version (undoable); diff toggles the diff view.
 */
export function resolveConflict(
  s: AppState,
  choice: "keep" | "take" | "diff",
  now: number,
): Result {
  const o = s.overlay;
  if (o.kind !== "conflict") return none(s);
  if (choice === "diff")
    return none({ ...s, overlay: { ...o, showDiff: !o.showDiff } });
  if (choice === "take") return reload(s, o.bufferId, o.disk);
  const kept: AppState = {
    ...setBuffer(s, o.bufferId, { stamp: o.disk.stamp, disk: "present" }),
    overlay: { kind: "none" },
  };
  return chain(writeBuffer(kept, o.bufferId, now), (st) =>
    toast(st, "info", "Kept your version — saved"),
  );
}
