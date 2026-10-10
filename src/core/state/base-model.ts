import { candidatesFrom } from "../features/bases/candidates";
import { baseEmbedOf } from "../features/bases/embed";
import { evaluateBase } from "../features/bases/evaluator";
import {
  type BaseWindowState,
  isBaseWindowState,
} from "../features/bases/file-type";
import type { KanbanModel } from "../features/bases/kanban";
import { parseBase } from "../features/bases/parser";
import type { TableModel } from "../features/bases/table";
import type {
  BaseCandidate,
  BaseDiagnostic,
  BaseFilter,
  BaseSort,
  BaseUi,
} from "../features/bases/types";
import type { NoteIndex } from "../features/links/note-index";
import type { TextBuffer } from "../kernel/text/text-buffer";
import type { Doc } from "../lang/markdown/doc";
import type { DocScan } from "../lang/markdown/scan";
import { bufferForPath, fullText, setWindow } from "./buffers";
import type { EmbedModelBuilder } from "./embed-models";
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
  /** The filters in effect as one expression; absent when none apply. */
  filter?: string;
  /** Existing values of the text cell being edited that start with its text. */
  suggestions?: string[];
  /** Table: row and column. Board: lane and card. */
  focus: { row: number; column: number; lane: number; card: number };
};

/** A window's state, or an embed's view name and row cap. */
type Key = {
  text: TextBuffer;
  ix: NoteIndex;
  types: IndexState["types"];
  status: IndexState["status"];
  dirty: string;
  ws: BaseWindowState | string;
  max: number;
  layouts: Registries["layouts"];
};

const memo = new Map<string, { key: Key; model: unknown }>();

const sameKey = (a: Key, b: Key) =>
  a.text === b.text &&
  a.ix === b.ix &&
  a.types === b.types &&
  a.status === b.status &&
  a.dirty === b.dirty &&
  a.ws === b.ws &&
  a.max === b.max &&
  a.layouts === b.layouts;

/** The model memoized in `slot` for `key`, derived by `make` when an input changed. */
function memoized<T>(slot: string, key: Key, make: () => T): T {
  const prev = memo.get(slot);
  if (prev !== undefined && sameKey(prev.key, key)) return prev.model as T;
  const model = make();
  memo.set(slot, { key, model });
  return model;
}

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
        scroll: { col: 0 },
      });
}

const clamp = (n: number, max: number) => Math.max(0, Math.min(n, max));

/** A filter as one expression; nested groups are parenthesized, and `not` matches none of its parts. */
function filterText(f: BaseFilter): string {
  if (typeof f === "string") return f.trim();
  const group = (fs: readonly BaseFilter[], op: string) =>
    fs
      .map((x) =>
        typeof x === "string" || Object.values(x)[0]?.length === 1
          ? filterText(x)
          : `(${filterText(x)})`,
      )
      .join(` ${op} `);
  if ("and" in f) return group(f.and, "and");
  if ("or" in f) return group(f.or, "or");
  return `not (${group(f.not, "or")})`;
}

const MAX_SUGGESTIONS = 5;

/**
 * Distinct text values the candidates hold for `property` (any letter case
 * of its name) that start with `typed`, ignoring case, in order.
 */
function suggestionsFor(
  candidates: readonly BaseCandidate[],
  property: string,
  typed: string,
): string[] {
  const lower = property.toLowerCase();
  const prefix = typed.trim().toLowerCase();
  const values = new Set<string>();
  for (const c of candidates)
    for (const [k, v] of Object.entries(c.properties))
      if (
        k.toLowerCase() === lower &&
        typeof v === "string" &&
        v !== "" &&
        v.toLowerCase().startsWith(prefix)
      )
        values.add(v);
  return [...values].sort().slice(0, MAX_SUGGESTIONS);
}

/** The window's overrides as the evaluator takes them. */
const uiOf = (ws: BaseWindowState): BaseUi => ({
  ...(ws.sort === undefined ? {} : { sort: ws.sort }),
  ...(ws.grouped === false ? { grouped: false } : {}),
  ...(ws.filtered === false ? { filtered: false } : {}),
  ...(ws.widths === undefined ? {} : { widths: ws.widths }),
});

/**
 * The model of base window `windowId`, derived from the base text, the
 * index, property types, unsaved notes, and the window state. Frames whose
 * inputs are the same objects get the same model. Focus follows the focused
 * note's path; when it is gone, it stays at the row or card index the window
 * last focused.
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
    max: 0,
    layouts: reg.layouts,
  };
  return memoized(`window:${windowId}`, key, () =>
    derive(s, b.path, fullText(b.text), ws, reg),
  );
}

/**
 * What a note shows for an embedded base: the view `subpath` names (else
 * the first), read-only, capped at `embedMaxRows` lines; a notice while the
 * index loads or when the file is not valid YAML. Memoized per path and
 * view like a window's model.
 */
export const baseEmbedModel: EmbedModelBuilder = (s, path, subpath, reg) => {
  const b = bufferForPath(s, path);
  if (b === undefined) return "missing";
  const view = subpath?.replace(/^#/, "").trim() ?? "";
  const max = s.config.preview.embedMaxRows;
  const key: Key = {
    text: b.text,
    ix: s.index.ix,
    types: s.index.types,
    status: s.index.status,
    dirty: dirtyNoteSignature(s),
    ws: view,
    max,
    layouts: reg.layouts,
  };
  return memoized(`embed:${path}#${view}`, key, () => {
    const ws: BaseWindowState = {
      view,
      focus: { column: 0 },
      scroll: { col: 0 },
    };
    const m = derive(s, path, fullText(b.text), ws, reg);
    const notice =
      m.status === "waiting"
        ? "◌ waiting for index"
        : m.status === "parseError"
          ? `⚠ ${m.message ?? "invalid base"}`
          : m.notice;
    return baseEmbedOf(
      m.selected,
      {
        ...(m.table === undefined ? {} : { table: m.table }),
        ...(m.board === undefined ? {} : { board: m.board }),
        ...(notice === undefined ? {} : { notice }),
      },
      max,
    );
  });
};

function derive(
  s: AppState,
  path: string,
  text: string,
  ws: BaseWindowState,
  reg: Pick<Registries, "layouts">,
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
  const candidates = candidatesFrom(s.index.ix, overlayOf(s));
  const e = evaluateBase({
    base,
    candidates,
    ...(view === undefined ? {} : { view: view.name }),
    ui,
  });
  const { layout, notice } = reg.layouts.resolve(e.selectedView.type);
  const built = layout.model(e, ui, s.index.types);
  const sort = e.selectedView.sort?.[0];
  // A window that has not focused a note in this view starts at the first
  // row or card.
  const near = ws.view === e.selectedView.name ? (ws.focus.index ?? 0) : 0;
  const inEffect = [
    base.filters,
    ws.filtered === false ? undefined : view?.filters,
  ].filter((f): f is BaseFilter => f !== undefined);
  const [only, ...more] = inEffect;
  const filter =
    only === undefined
      ? undefined
      : filterText(more.length === 0 ? only : { and: inEffect });
  const edit = ws.edit;
  const common = {
    ...withViews,
    status: "ok" as const,
    selected: e.selectedView.name,
    ...(notice === undefined ? {} : { notice }),
    ...(sort === undefined ? {} : { sort }),
    ...(filter === undefined ? {} : { filter }),
    ...(edit?.type === "text"
      ? { suggestions: suggestionsFor(candidates, edit.property, edit.value) }
      : {}),
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
    const card = at >= 0 ? at : clamp(near, cards.length - 1);
    return {
      ...common,
      board,
      diagnostics: [...e.diagnostics],
      focus: { row: 0, column: lane, lane, card },
    };
  }
  const table = built;
  const at = table.rows.findIndex((r) => r.path === ws.focus.path);
  const row = at >= 0 ? at : clamp(near, table.rows.length - 1);
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
