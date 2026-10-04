import type { AppConfig } from "../config/schema";
import type { FileEdit } from "../features/links/rename";
import type { FileType } from "../filetypes/registry";
import { UndoHistory } from "../kernel/editor/undo";
import type { WindowTree } from "../kernel/editor/windows";
import { closeWindow } from "../kernel/editor/windows";
import type { Edit, Pos } from "../kernel/text/pos";
import { createTextBuffer, type TextBuffer } from "../kernel/text/text-buffer";
import { onDiskLoaded } from "./disk";
import { touchRecent } from "./recent";
import { chain, message, none } from "./result";
import { autosaveNow, scheduleAutosave } from "./save";
import {
  awaitsNavigation,
  awaitsRestore,
  dropRestored,
  fillRestored,
} from "./session";
import type {
  Action,
  AppState,
  BufferId,
  BufferState,
  Effect,
  Result,
  TextFile,
  WindowState,
} from "./types";
import type { Registries } from "./update";

export const activeWindow = (s: AppState): WindowState | undefined =>
  s.windows.byId[s.windows.active];

export function activeBuffer(s: AppState): BufferState | undefined {
  const w = activeWindow(s);
  return w && s.buffers[w.content.bufferId];
}

export const bufferForPath = (
  s: AppState,
  path: string,
): BufferState | undefined =>
  Object.values(s.buffers).find((b) => b.path === path);

/** Buffers at `path` or, for a folder, anywhere below it. */
export const buffersUnder = (s: AppState, path: string): BufferState[] =>
  Object.values(s.buffers).filter(
    (b) => b.path === path || b.path.startsWith(`${path}/`),
  );

/**
 * Re-analyze `b` when its text version changed. A failing analysis leaves the
 * buffer without one, so the file still opens and edits.
 */
export function withAnalysis(
  b: BufferState,
  ft: FileType | undefined,
): BufferState {
  if (ft?.analyze === undefined) return b;
  const prev = b.analysis as { version?: number } | undefined;
  if (prev?.version === b.text.version) return b;
  try {
    return { ...b, analysis: ft.analyze(b.text, b.analysis) };
  } catch {
    const { analysis: _, ...rest } = b;
    return rest;
  }
}

/** Patch a buffer; a patch that replaces `text` re-analyzes it with its file type. */
export function setBuffer(
  s: AppState,
  id: BufferId,
  patch: Partial<Omit<BufferState, "text">>,
): AppState;
export function setBuffer(
  s: AppState,
  id: BufferId,
  patch: Partial<BufferState> & { text: TextBuffer },
  reg: Registries,
): AppState;
export function setBuffer(
  s: AppState,
  id: BufferId,
  patch: Partial<BufferState>,
  reg?: Registries,
): AppState {
  const b = s.buffers[id];
  if (b === undefined) return s;
  const next = { ...b, ...patch };
  const analyzed =
    patch.text === undefined || reg === undefined
      ? next
      : withAnalysis(next, reg.fileTypes.get(next.fileType));
  return { ...s, buffers: { ...s.buffers, [id]: analyzed } };
}

export function setWindow(s: AppState, w: WindowState): AppState {
  return {
    ...s,
    windows: { ...s.windows, byId: { ...s.windows.byId, [w.id]: w } },
  };
}

/**
 * Put the active window's cursor at `pos`, clamped to its buffer, and scroll
 * just enough to show it.
 */
export function placeCursor(s: AppState, pos: Pos): AppState {
  const w = activeWindow(s);
  const b = w && s.buffers[w.content.bufferId];
  if (w === undefined || b === undefined) return s;
  const line = Math.max(0, Math.min(pos.line, b.text.lineCount - 1));
  const col = Math.max(0, Math.min(pos.col, b.text.line(line).length - 1));
  const rows = Math.max(1, s.terminal.rows - 2);
  const top = w.content.scroll;
  const scroll = line < top ? line : line >= top + rows ? line - rows + 1 : top;
  return setWindow(s, {
    ...w,
    content: { ...w.content, cursor: { line, col }, scroll },
  });
}

/** The whole buffer text with "\n" line separators. */
export const fullText = (t: TextBuffer): string =>
  t.slice({
    start: { line: 0, col: 0 },
    end: { line: t.lineCount - 1, col: t.line(t.lineCount - 1).length },
  });

const BOM = String.fromCharCode(0xfeff);

/** The bytes to write: original line separator, final newline, and BOM restored. */
export function saveText(b: BufferState): string {
  const body = fullText(b.text) + (b.finalNewline ? "\n" : "");
  return (
    (b.bom ? BOM : "") + (b.eol === "\n" ? body : body.replaceAll("\n", b.eol))
  );
}

/** The bytes to write for a file read as `f` whose text became `text`: the BOM restored. */
export const restoreFile = (f: TextFile, text: string): string =>
  (f.bom ? BOM : "") + text;

/**
 * Apply `edit` to the open buffer at `edit.path` as one undo step, then
 * schedule its autosave. Nothing changes (`stale`) when no buffer is open
 * there or any span's text differs from `expected`.
 */
export function applyBufferEdits(
  s: AppState,
  edit: FileEdit,
  now: number,
  reg: Registries,
): Result & { stale: boolean } {
  const b = bufferForPath(s, edit.path);
  const stale = { state: s, effects: [], stale: true };
  if (b === undefined) return stale;
  const spans = [...edit.edits].sort(
    (x, y) =>
      y.range.start.line - x.range.start.line ||
      y.range.start.col - x.range.start.col,
  );
  let text = b.text;
  const edits: Edit[] = [];
  const inverses: Edit[] = [];
  for (const span of spans) {
    const { end } = span.range;
    if (
      end.line >= text.lineCount ||
      end.col > text.line(end.line).length ||
      text.slice(span.range) !== span.expected
    )
      return stale;
    const e = { range: span.range, text: span.text };
    const applied = text.apply(e);
    text = applied.buffer;
    edits.push(e);
    inverses.push(applied.inverse);
  }
  if (edits.length === 0) return { state: s, effects: [], stale: false };
  const shown = Object.values(s.windows.byId).find(
    (w) => w.content.bufferId === b.id,
  );
  const cursorBefore = shown?.content.cursor ?? { line: 0, col: 0 };
  let next = setBuffer(
    s,
    b.id,
    {
      text,
      undo: b.undo.push({ edits, inverses, cursorBefore }),
      dirty: text.version !== b.savedVersion,
    },
    reg,
  );
  for (const w of Object.values(next.windows.byId)) {
    if (w.content.bufferId !== b.id) continue;
    const line = Math.min(w.content.cursor.line, text.lineCount - 1);
    const col = Math.min(w.content.cursor.col, text.line(line).length);
    next = setWindow(next, {
      ...w,
      content: { ...w.content, cursor: { line, col } },
    });
  }
  return { ...scheduleAutosave(next, b.id, now), stale: false };
}

/** Window ids in tree order. */
export function leaves(tree: WindowTree): number[] {
  return tree.kind === "leaf" ? [tree.id] : tree.children.flatMap(leaves);
}

/** Close the active window; the buffer it showed stays open. */
export function closeActiveWindow(s: AppState): Result {
  const tree = closeWindow(s.windows.tree, s.windows.active);
  if (tree === undefined) return none(s);
  const { [s.windows.active]: _, ...byId } = s.windows.byId;
  return none({
    ...s,
    windows: { ...s.windows, tree, byId, active: leaves(tree)[0] ?? 0 },
  });
}

/**
 * Drop a buffer without writing it. Windows that showed it switch to
 * another open buffer, or become empty when none is left.
 */
export function removeBuffer(s: AppState, id: BufferId): Result {
  const { [id]: _, ...buffers } = s.buffers;
  const other = Object.values(buffers).sort((a, b) => a.id - b.id)[0];
  const byId: Record<number, WindowState> = {};
  for (const w of Object.values(s.windows.byId)) {
    if (w.content.bufferId !== id) byId[w.id] = w;
    else if (other !== undefined)
      byId[w.id] = {
        id: w.id,
        content: {
          editor: "text",
          bufferId: other.id,
          cursor: { line: 0, col: 0 },
          scroll: 0,
        },
      };
  }
  const quit = s.terminal.quit;
  const terminal =
    quit === undefined
      ? s.terminal
      : {
          ...s.terminal,
          quit: { ...quit, waiting: quit.waiting.filter((w) => w !== id) },
        };
  const effects: Effect[] = [
    { kind: "cancelTimer", id: `autosave:${id}` },
    { kind: "cancelTimer", id: `retry:${id}` },
  ];
  return {
    state: {
      ...s,
      buffers,
      windows: { ...s.windows, byId },
      overlay:
        s.overlay.kind === "conflict" && s.overlay.bufferId === id
          ? { kind: "none" }
          : s.overlay,
      terminal,
    },
    effects,
  };
}

/** A file's text as buffer lines: "\n" separators and the final newline split off. */
export function splitFile(f: TextFile): {
  body: string;
  finalNewline: boolean;
} {
  const text = f.text.replaceAll("\r\n", "\n");
  const finalNewline = text.endsWith("\n");
  return { body: finalNewline ? text.slice(0, -1) : text, finalNewline };
}

/** Show buffer `id` in the active window. */
export function showBuffer(s: AppState, id: BufferId): AppState {
  const w = activeWindow(s);
  if (w?.content.bufferId === id) return s;
  return setWindow(s, {
    id: s.windows.active,
    content: {
      editor: "text",
      bufferId: id,
      cursor: { line: 0, col: 0 },
      scroll: 0,
    },
  });
}

/**
 * Open `path` in the active window: an open buffer is shown at once, any
 * other path is read first. The buffer being left is saved now.
 */
export function openPath(s: AppState, path: string, now: number): Result {
  const current = activeBuffer(s);
  const left =
    current !== undefined && current.path !== path
      ? autosaveNow(s, current.id, now)
      : none(s);
  return chain(left, (st) => {
    const open = bufferForPath(st, path);
    return open === undefined
      ? { state: st, effects: [{ kind: "read", path }] }
      : none({
          ...showBuffer(st, open.id),
          recent: touchRecent(st.recent, path),
        });
  });
}

/** The configured preview mode when the file type has that view, else its first view. */
export const defaultView = (ft: FileType, cfg: AppConfig): string =>
  ft.views.some((v) => v.id === cfg.preview.mode)
    ? cfg.preview.mode
    : (ft.views[0]?.id ?? "source");

/** A read finished: reload an open buffer, or open a new one of the path's file type. */
export function onFileLoaded(
  s: AppState,
  a: Extract<Action, { type: "fileLoaded" }>,
  reg: Registries,
): Result {
  const open = bufferForPath(s, a.path);
  if (open !== undefined)
    return chain(onDiskLoaded(s, open, a.file, reg), (st) =>
      awaitsRestore(st, a.path) ? fillRestored(st, a.path, open.id) : none(st),
    );
  const ft = reg.fileTypes.forPath(a.path);
  const { body, finalNewline } = splitFile(a.file);
  const text = createTextBuffer(body);
  const id = s.nextBufferId;
  const b: BufferState = withAnalysis(
    {
      id,
      path: a.path,
      fileType: ft.id,
      view: defaultView(ft, s.config),
      text,
      undo: new UndoHistory(),
      bom: a.file.bom,
      eol: a.file.eol,
      finalNewline,
      stamp: a.file.stamp,
      savedVersion: text.version,
      dirty: false,
      disk: "present",
      save: { kind: "idle" },
    },
    ft,
  );
  const explorer = { ...s.panels.explorer, focused: false };
  const added: AppState = {
    ...s,
    buffers: { ...s.buffers, [id]: b },
    nextBufferId: id + 1,
    panels: { ...s.panels, explorer },
  };
  const recent = touchRecent(s.recent, a.path);
  if (!awaitsRestore(s, a.path))
    return none({ ...showBuffer(added, id), recent });
  // A window coming back to its file keeps the recents order it was saved with.
  return fillRestored(
    awaitsNavigation(s, a.path) ? { ...added, recent } : added,
    a.path,
    id,
  );
}

const REFUSED = {
  binary: () => "binary file — not opened",
  tooLarge: () => "file too large — not opened (limit 16 MiB)",
  io: (path: string) => `cannot read file — not opened (${path})`,
};

/** The open policy refused a file: nothing opens and nothing changes. */
export function onFileRefused(
  s: AppState,
  a: Extract<Action, { type: "fileRefused" }>,
): Result {
  const refused = (st: AppState) =>
    message(st, REFUSED[a.reason](a.path), "error");
  if (!awaitsRestore(s, a.path)) return refused(s);
  const dropped = dropRestored(s, a.path);
  return awaitsNavigation(s, a.path) ? chain(dropped, refused) : dropped;
}
