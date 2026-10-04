import { candidatesFrom } from "../features/bases/candidates";
import { evaluateBase } from "../features/bases/evaluator";
import {
  type BaseWindowState,
  isBaseWindowState,
} from "../features/bases/file-type";
import type { KanbanModel } from "../features/bases/kanban";
import { parseBase } from "../features/bases/parser";
import type { TableModel } from "../features/bases/table";
import type { BaseDiagnostic, BaseSort, BaseUi } from "../features/bases/types";
import type { NoteIndex } from "../features/links/note-index";
import type { TextBuffer } from "../kernel/text/text-buffer";
import type { Doc } from "../lang/markdown/doc";
import type { DocScan } from "../lang/markdown/scan";
import { fullText, setWindow } from "./buffers";
import type { AppState, IndexState, WindowId } from "./types";
import type { Registries } from "./update";

/**
 * What a base window shows: the evaluated view as a table or a board, the
 * views to switch between, notices, and the focused row or card.
 */
export type BaseViewModel = {
  status: "waiting" | "parseError" | "ok";
  /** The base file's name. */
  title: string;
  views: { name: string; type: string }[];
  /** The view shown; the window's view when the file still has it, else the first. */
  selected: string;
  table?: TableModel;
  board?: KanbanModel;
  /** Why the view is shown in another layout. */
  notice?: string;
  /** The parse error, when the file is not valid YAML. */
  message?: string;
  diagnostics: BaseDiagnostic[];
  /** The sort in effect, the window's override included. */
  sort?: BaseSort;
  grouped: boolean;
  /** Whether the view's own filters apply ("none" when it has none). */
  filters: "on" | "off" | "none";
  /** Table: row and column. Board: lane and card. */
  focus: { row: number; column: number; lane: number; card: number };
};

type Key = {
  text: TextBuffer;
  ix: NoteIndex;
  types: IndexState["types"];
  status: IndexState["status"];
  dirty: string;
  ws: BaseWindowState;
  layouts: Registries["layouts"];
};

const memo = new Map<string, { key: Key; model: BaseViewModel }>();

const sameKey = (a: Key, b: Key) =>
  a.text === b.text &&
  a.ix === b.ix &&
  a.types === b.types &&
  a.status === b.status &&
  a.dirty === b.dirty &&
  a.ws === b.ws &&
  a.layouts === b.layouts;

const isNote = (path: string) => /\.md$/i.test(path);

/** Listed notes with unsaved edits and their current analysis. */
const dirtyNotes = (s: AppState) =>
  Object.values(s.buffers).filter(
    (b) =>
      b.dirty &&
      isNote(b.path) &&
      (b.analysis as Doc | undefined)?.scan !== undefined,
  );

/** Identifies the unsaved note text a base could list; equal when nothing relevant changed. */
export const dirtyNoteSignature = (s: AppState): string =>
  dirtyNotes(s)
    .map((b) => `${b.path}@${b.text.version}`)
    .join("|");

/** The current scans of notes with unsaved edits, which override the index. */
export const overlayOf = (s: AppState): ReadonlyMap<string, DocScan> =>
  new Map(dirtyNotes(s).map((b) => [b.path, (b.analysis as Doc).scan]));

/** The base window state of window `id`, when it shows a base. */
export function baseWindow(
  s: AppState,
  id: WindowId,
): BaseWindowState | undefined {
  const ws = s.windows.byId[id]?.content.kindState;
  return isBaseWindowState(ws) ? ws : undefined;
}

/** Replace the base window state of window `id`. */
export function setBaseWindow(
  s: AppState,
  id: WindowId,
  ws: BaseWindowState,
): AppState {
  const w = s.windows.byId[id];
  return w === undefined
    ? s
    : setWindow(s, { ...w, content: { ...w.content, kindState: ws } });
}

/**
 * Show view `name` in base window `id`, at its first row with no overrides;
 * an open cell edit is dropped. The file is never touched.
 */
export function selectBaseView(
  s: AppState,
  id: WindowId,
  name: string,
): AppState {
  return baseWindow(s, id) === undefined
    ? s
    : setBaseWindow(s, id, {
        view: name,
        focus: { column: 0 },
        scroll: { row: 0, col: 0 },
      });
}

const clamp = (n: number, max: number) => Math.max(0, Math.min(n, max));

/** The window's overrides as the evaluator takes them. */
const uiOf = (ws: BaseWindowState): BaseUi => ({
  ...(ws.sort === undefined ? {} : { sort: ws.sort }),
  ...(ws.grouped === false ? { grouped: false } : {}),
  ...(ws.filtered === false ? { filtered: false } : {}),
});

/**
 * The model of base window `windowId`, derived from the base text, the
 * index, property types, unsaved notes, and the window state. Frames whose
 * inputs are the same objects get the same model. Focus follows the focused
 * note's path; when it is gone, it stays near the row or card it was on.
 */
export function baseViewModel(
  s: AppState,
  windowId: WindowId,
  reg: Pick<Registries, "layouts">,
): BaseViewModel | undefined {
  const w = s.windows.byId[windowId];
  const b = w && s.buffers[w.content.bufferId];
  const ws = baseWindow(s, windowId);
  if (b === undefined || ws === undefined) return undefined;
  const key: Key = {
    text: b.text,
    ix: s.index.ix,
    types: s.index.types,
    status: s.index.status,
    dirty: dirtyNoteSignature(s),
    ws,
    layouts: reg.layouts,
  };
  const slot = `window:${windowId}`;
  const prev = memo.get(slot);
  if (prev !== undefined && sameKey(prev.key, key)) return prev.model;
  const model = derive(s, b.path, fullText(b.text), ws, reg, prev?.model);
  memo.set(slot, { key, model });
  return model;
}

function derive(
  s: AppState,
  path: string,
  text: string,
  ws: BaseWindowState,
  reg: Pick<Registries, "layouts">,
  prev: BaseViewModel | undefined,
): BaseViewModel {
  const title = path.slice(path.lastIndexOf("/") + 1);
  const empty = {
    title,
    views: [],
    selected: ws.view,
    diagnostics: [],
    grouped: false,
    filters: "none" as const,
    focus: { row: 0, column: 0, lane: 0, card: 0 },
  };
  const parsed = parseBase(text);
  if (!parsed.ok)
    return {
      ...empty,
      status: "parseError",
      message: parsed.diagnostic.message,
    };
  const { base } = parsed;
  const views = base.views.map((v) => ({ name: v.name, type: v.type }));
  const view = base.views.find((v) => v.name === ws.view) ?? base.views[0];
  const withViews = { ...empty, views, selected: view?.name ?? "" };
  if (s.index.status !== "ready" && s.index.ix.files.size === 0)
    return { ...withViews, status: "waiting" };
  const ui = uiOf(ws);
  const e = evaluateBase({
    base,
    candidates: candidatesFrom(s.index.ix, overlayOf(s)),
    ...(view === undefined ? {} : { view: view.name }),
    ui,
  });
  const { layout, notice } = reg.layouts.resolve(e.selectedView.type);
  const built = layout.model(e, ui, s.index.types);
  const sort = e.selectedView.sort?.[0];
  // A view switch starts at the first row or card.
  const near = prev?.selected === e.selectedView.name ? prev.focus : undefined;
  const common = {
    ...withViews,
    status: "ok" as const,
    selected: e.selectedView.name,
    ...(notice === undefined ? {} : { notice }),
    ...(sort === undefined ? {} : { sort }),
    grouped: e.selectedView.groupBy !== undefined,
    filters:
      view?.filters === undefined
        ? ("none" as const)
        : ws.filtered === false
          ? ("off" as const)
          : ("on" as const),
  };
  if ("lanes" in built) {
    const board = built;
    const found = board.lanes.findIndex((l) =>
      l.cards.some((c) => c.path === ws.focus.path),
    );
    const lane =
      found >= 0 ? found : clamp(ws.focus.column, board.lanes.length - 1);
    const cards = board.lanes[lane]?.cards ?? [];
    const at = cards.findIndex((c) => c.path === ws.focus.path);
    const card = at >= 0 ? at : clamp(near?.card ?? 0, cards.length - 1);
    return {
      ...common,
      board,
      diagnostics: [...e.diagnostics],
      focus: { row: 0, column: lane, lane, card },
    };
  }
  const table = built;
  const at = table.rows.findIndex((r) => r.path === ws.focus.path);
  const row = at >= 0 ? at : clamp(near?.row ?? 0, table.rows.length - 1);
  return {
    ...common,
    table,
    diagnostics: [...e.diagnostics, ...table.diagnostics],
    focus: {
      row,
      column: clamp(ws.focus.column, table.columns.length - 1),
      lane: 0,
      card: 0,
    },
  };
}
