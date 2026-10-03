import { UndoHistory } from "../kernel/editor/undo";
import type { WindowTree } from "../kernel/editor/windows";
import { closeWindow } from "../kernel/editor/windows";
import { createTextBuffer, type TextBuffer } from "../kernel/text/text-buffer";
import { onDiskLoaded } from "./disk";
import { chain, message, none } from "./result";
import { autosaveNow } from "./save";
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

export function setBuffer(
  s: AppState,
  id: BufferId,
  patch: Partial<BufferState>,
): AppState {
  const b = s.buffers[id];
  if (b === undefined) return s;
  return { ...s, buffers: { ...s.buffers, [id]: { ...b, ...patch } } };
}

export function setWindow(s: AppState, w: WindowState): AppState {
  return {
    ...s,
    windows: { ...s.windows, byId: { ...s.windows.byId, [w.id]: w } },
  };
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
      : none(showBuffer(st, open.id));
  });
}

/** A read finished: reload an open buffer, or open a new one of the path's file type. */
export function onFileLoaded(
  s: AppState,
  a: Extract<Action, { type: "fileLoaded" }>,
  reg: Registries,
): Result {
  const open = bufferForPath(s, a.path);
  if (open !== undefined) return onDiskLoaded(s, open, a.file);
  const ft = reg.fileTypes.forPath(a.path);
  const { body, finalNewline } = splitFile(a.file);
  const text = createTextBuffer(body);
  const id = s.nextBufferId;
  const b: BufferState = {
    id,
    path: a.path,
    fileType: ft.id,
    view: ft.views[0]?.id ?? "source",
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
  };
  const explorer = { ...s.panels.explorer, focused: false };
  return none(
    showBuffer(
      {
        ...s,
        buffers: { ...s.buffers, [id]: b },
        nextBufferId: id + 1,
        panels: { ...s.panels, explorer },
      },
      id,
    ),
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
  return message(s, REFUSED[a.reason](a.path), "error");
}
