import type { WindowTree } from "../kernel/editor/windows";
import { closeWindow } from "../kernel/editor/windows";
import type { TextBuffer } from "../kernel/text/text-buffer";
import { none } from "./result";
import type {
  AppState,
  BufferId,
  BufferState,
  Effect,
  Result,
  WindowState,
} from "./types";

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
