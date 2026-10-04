import {
  backlinksOf,
  notesWithTag,
  tagCounts,
} from "../features/links/note-index";
import type { Binding } from "../kernel/commands/defaults";
import { rankBy } from "../kernel/text/fuzzy";
import type { Key } from "../kernel/vim/keys";
import type { Doc } from "../lang/markdown/doc";
import {
  activeBuffer,
  bufferForPath,
  listedBuffers,
  openPath,
} from "./buffers";
import { type CommandContext, runCommand } from "./commands";
import { goTo, recordJump } from "./jumps";
import { effectiveBindings } from "./keymap";
import { unlinkedHits } from "./mentions";
import { chain, message, none } from "./result";
import type {
  Action,
  AppState,
  Effect,
  PickerItem,
  PickerState,
  Result,
  SearchHit,
} from "./types";
import type { Registries } from "./update";

/** Grep stops after this many matching lines and shows `1000+`. */
export const GREP_LIMIT = 1000;
/** Grep searches once the query has not changed for this long. */
export const SEARCH_DEBOUNCE_MS = 100;
/** Narrower terminals show no preview pane. */
export const PREVIEW_MIN_COLS = 100;
/** Rows `Ctrl-d` and `Ctrl-u` move the selection. */
const PAGE = 10;

export type PickerSource = {
  id: string;
  title: string;
  overlay?: "palette" | "help";
  /** Whether the source reads the workspace index. */
  indexed?: boolean;
  /** Ranked items for `query`; grep returns the current results unchanged and searches instead. */
  items(
    s: AppState,
    reg: Registries,
    query: string,
    arg?: string,
  ): PickerItem[];
  /** How many candidates there are before filtering. */
  total?(s: AppState, reg: Registries, arg?: string): number;
  accept(s: AppState, item: PickerItem, now: number, reg: Registries): Result;
  /** File-based sources: the path and line to preview. */
  preview?(item: PickerItem): { path: string; line: number } | undefined;
};

type Candidate = {
  key: string;
  text: string;
  detail?: string;
  path?: string;
  line?: number;
};

/** Rank candidates on their text; an empty query keeps their order. */
function ranked(cands: readonly Candidate[], query: string): PickerItem[] {
  return rankBy(cands, query, (c) => c.text).map(({ item, match }) => ({
    key: item.key,
    label: item.text,
    matches: match.positions,
    ...(item.detail === undefined ? {} : { detail: item.detail }),
    ...(item.path === undefined ? {} : { path: item.path }),
    ...(item.line === undefined ? {} : { line: item.line }),
  }));
}

const openPaths = (s: AppState) => listedBuffers(s).map((b) => b.path);

/** Every workspace file and open buffer; recent files first, then by path. */
function allFiles(s: AppState): string[] {
  const set = new Set([...s.index.ix.files, ...openPaths(s)]);
  const recent = s.recent.filter((p) => set.has(p));
  const seen = new Set(recent);
  return [...recent, ...[...set].filter((p) => !seen.has(p)).sort()];
}

/** A recent file is listed while it still exists, as far as the index knows. */
function recentFiles(s: AppState): string[] {
  const open = new Set(openPaths(s));
  const known = s.index.status !== "ready";
  return s.recent.filter(
    (p) => known || s.index.ix.files.has(p) || open.has(p),
  );
}

const fileItem = (path: string, line?: number): Candidate =>
  line === undefined
    ? { key: path, text: path, path }
    : { key: path, text: path, path, line };

/** Close the picker, record a jump, and open `path` (at `line`). */
function openAt(s: AppState, path: string, now: number, line?: number): Result {
  const closed = recordJump({ ...s, overlay: { kind: "none" } });
  return line === undefined
    ? openPath(closed, path, now)
    : goTo(closed, path, { line, col: 0 }, now);
}

const acceptFile: PickerSource["accept"] = (s, item, now) =>
  item.path === undefined ? none(s) : openAt(s, item.path, now, item.line);
const previewFile: PickerSource["preview"] = (item) =>
  item.path === undefined
    ? undefined
    : { path: item.path, line: item.line ?? 0 };

/** The commands the active buffer can run, with their bindings in the current config. */
function commandBindings(s: AppState, reg: Registries) {
  const ft = activeBuffer(s)?.fileType;
  const bindings = effectiveBindings(reg, s.config).filter(
    (b) =>
      (b.scope.mode === "normal" || b.scope.mode === "explorer") &&
      (b.scope.filetype === undefined || b.scope.filetype === ft),
  );
  return { commands: reg.commands.list(ft), bindings };
}

const scopeLabel = (b: Binding) =>
  b.scope.filetype ?? (b.scope.mode === "normal" ? "" : b.scope.mode);

/** `path:line  text`, the matched characters marked. */
const grepItem = (h: SearchHit): PickerItem => {
  const head = `${h.path}:${h.line + 1}  `;
  const at = [...head].length + [...h.text.slice(0, h.col)].length;
  const len = [...h.text.slice(h.col, h.col + h.len)].length;
  return {
    key: `${h.path}:${h.line}:${h.col}`,
    label: head + h.text,
    path: h.path,
    line: h.line,
    matches: Array.from({ length: len }, (_, i) => at + i),
  };
};

/** Notes linking to `target`, then its unlinked mentions from the newest mentions search. */
function backlinkCandidates(s: AppState, target?: string): Candidate[] {
  if (target === undefined) return [];
  const linked = backlinksOf(s.index.ix, target).map(
    (b): Candidate => ({
      key: `${b.from}:${b.link.line}:${b.link.col}`,
      text: `${b.from}:${b.link.line + 1}`,
      path: b.from,
      line: b.link.line,
    }),
  );
  const unlinked = unlinkedHits(s).map(
    (h): Candidate => ({
      key: `unlinked ${h.path}:${h.line}:${h.col}`,
      text: `${h.path}:${h.line + 1}`,
      detail: "unlinked mention",
      path: h.path,
      line: h.line,
    }),
  );
  return [...linked, ...unlinked];
}

export const pickerSources: Readonly<Record<string, PickerSource>> = {
  files: {
    id: "files",
    title: "Find files",
    indexed: true,
    items: (s, _r, q) =>
      ranked(
        allFiles(s).map((p) => fileItem(p)),
        q,
      ),
    total: (s) => allFiles(s).length,
    accept: acceptFile,
    preview: previewFile,
  },
  recent: {
    id: "recent",
    title: "Recent files",
    items: (s, _r, q) =>
      ranked(
        recentFiles(s).map((p) => fileItem(p)),
        q,
      ),
    total: (s) => recentFiles(s).length,
    accept: acceptFile,
    preview: previewFile,
  },
  grep: {
    id: "grep",
    title: "Grep workspace",
    indexed: true,
    items: (s) =>
      s.overlay.kind === "picker" && s.overlay.picker.source === "grep"
        ? s.overlay.picker.items
        : [],
    accept: acceptFile,
    preview: previewFile,
  },
  headings: {
    id: "headings",
    title: "Headings",
    items: (s, _r, q) => {
      const b = activeBuffer(s);
      const doc = b?.analysis as Doc | undefined;
      const headings = doc?.scan.headings ?? [];
      return ranked(
        headings.map((h) => ({
          key: `${h.line}`,
          text: h.text,
          detail: `${"#".repeat(h.level)} :${h.line + 1}`,
          ...(b === undefined ? {} : { path: b.path }),
          line: h.line,
        })),
        q,
      );
    },
    accept: acceptFile,
    preview: previewFile,
  },
  tags: {
    id: "tags",
    title: "Tags",
    indexed: true,
    items: (s, _r, q) =>
      ranked(
        tagCounts(s.index.ix).map((t) => ({
          key: t.tag,
          text: `#${t.tag}`,
          detail: `${t.count} notes`,
        })),
        q,
      ),
    accept: (s, item, now, reg) =>
      openPicker({ state: s, now, reg }, "tagNotes", item.key),
  },
  tagNotes: {
    id: "tagNotes",
    title: "Notes with tag",
    indexed: true,
    items: (s, _r, q, tag) =>
      ranked(
        (tag === undefined ? [] : notesWithTag(s.index.ix, tag)).map((p) =>
          fileItem(p),
        ),
        q,
      ),
    accept: acceptFile,
    preview: previewFile,
  },
  backlinks: {
    id: "backlinks",
    title: "Backlinks",
    indexed: true,
    items: (s, _r, q, target) => ranked(backlinkCandidates(s, target), q),
    total: (s, _r, target) => backlinkCandidates(s, target).length,
    accept: acceptFile,
    preview: previewFile,
  },
  commands: {
    id: "commands",
    title: "Commands",
    overlay: "palette",
    items: (s, reg, q) => {
      const { commands, bindings } = commandBindings(s, reg);
      return ranked(
        commands.map((c) => {
          const own = bindings.filter((b) => b.id === c.id);
          const keys = own
            .map((b) => `${b.seq}${b.overridden ? " ●" : ""}`)
            .join("  ");
          return {
            key: c.id,
            text: c.title,
            detail: keys === "" ? c.id : `${c.id}  ${keys}`,
          };
        }),
        q,
      );
    },
    total: (s, reg) => reg.commands.list(activeBuffer(s)?.fileType).length,
    accept: (s, item, now, reg) =>
      runCommand({ ...s, overlay: { kind: "none" } }, item.key, now, reg),
  },
  help: {
    id: "help",
    title: "Help: keymap",
    overlay: "help",
    items: (s, reg, q) => {
      const { commands, bindings } = commandBindings(s, reg);
      const titles = new Map(commands.map((c) => [c.id, c.title]));
      return ranked(
        bindings
          .filter((b) => titles.has(b.id))
          .map((b) => {
            const scope = scopeLabel(b);
            return {
              key: `${scope}\u0000${b.seq}`,
              text: `${b.seq}  ${titles.get(b.id)}`,
              detail: [b.id, scope, b.overridden ? "●" : ""]
                .filter((x) => x !== "")
                .join("  "),
            };
          }),
        q,
      );
    },
    accept: (s, item, now, reg) => {
      const id = item.detail?.split("  ")[0];
      const closed: AppState = { ...s, overlay: { kind: "none" } };
      return id === undefined ? none(closed) : runCommand(closed, id, now, reg);
    },
  },
};

const pickerOf = (s: AppState): PickerState | undefined =>
  s.overlay.kind === "picker" ||
  s.overlay.kind === "palette" ||
  s.overlay.kind === "help"
    ? s.overlay.picker
    : undefined;

const withPicker = (s: AppState, p: PickerState): AppState =>
  s.overlay.kind === "picker" ||
  s.overlay.kind === "palette" ||
  s.overlay.kind === "help"
    ? { ...s, overlay: { kind: s.overlay.kind, picker: p } }
    : s;

/**
 * Point the preview at the selected item: an open buffer previews from
 * memory, a closed file is read. A new id per selection drops late reads.
 */
function requestPreview(s: AppState): Result {
  const p = pickerOf(s);
  if (p === undefined) return none(s);
  const source = pickerSources[p.source];
  const item = p.items[p.selected];
  const target = item && source?.preview?.(item);
  if (s.terminal.cols < PREVIEW_MIN_COLS || target === undefined) {
    const { preview: _, ...rest } = p;
    return none(withPicker(s, rest));
  }
  const id = (p.preview?.id ?? 0) + 1;
  const preview = { id, path: target.path, line: target.line };
  const next = withPicker(s, { ...p, preview });
  return bufferForPath(s, target.path) !== undefined
    ? none(next)
    : {
        state: next,
        effects: [{ kind: "readPreview", id, path: target.path }],
      };
}

/**
 * Re-list an open `source` picker after its inputs changed, keeping the
 * query and, where it still exists, the selection.
 */
export function refreshPicker(
  s: AppState,
  reg: Registries,
  source: string,
): Result {
  const p = pickerOf(s);
  const src = pickerSources[source];
  if (p?.source !== source || src === undefined) return none(s);
  const items = src.items(s, reg, p.query, p.arg);
  const total = src.total?.(s, reg, p.arg) ?? items.length;
  const selected = Math.min(p.selected, Math.max(0, items.length - 1));
  return requestPreview(withPicker(s, { ...p, items, total, selected }));
}

/** A resize across `PREVIEW_MIN_COLS` shows or drops the open picker's preview. */
export function onPickerResize(s: AppState, prevCols: number): Result {
  const wide = (cols: number) => cols >= PREVIEW_MIN_COLS;
  return pickerOf(s) !== undefined && wide(prevCols) !== wide(s.terminal.cols)
    ? requestPreview(s)
    : none(s);
}

/** Open the `id` picker with an empty query. */
export function openPicker(
  c: CommandContext,
  id: string,
  arg?: string,
): Result {
  const s = c.state;
  const source = pickerSources[id];
  if (source === undefined) return message(s, `unknown picker: ${id}`, "error");
  const items = source.items(s, c.reg, "", arg);
  const picker: PickerState = {
    source: id,
    query: "",
    items,
    total: source.total?.(s, c.reg, arg) ?? items.length,
    selected: 0,
    ...(arg === undefined ? {} : { arg }),
    ...(source.indexed && s.index.status === "unavailable"
      ? { error: "index unavailable" }
      : {}),
  };
  const opened: AppState = {
    ...s,
    overlay: { kind: source.overlay ?? "picker", picker },
  };
  return requestPreview(opened);
}

/** Re-rank for a new query; grep (re)starts its debounce instead. */
function setQuery(
  s: AppState,
  p: PickerState,
  query: string,
  reg: Registries,
): Result {
  const source = pickerSources[p.source];
  if (source === undefined) return none(s);
  if (p.source === "grep") {
    const { search: _, ...rest } = p;
    const next = withPicker(
      s,
      query === ""
        ? { ...rest, query, items: [], total: 0, selected: 0 }
        : { ...p, query },
    );
    return query === ""
      ? chain(requestPreview(next), (st) => ({
          state: st,
          effects: [{ kind: "cancelTimer", id: "search" }],
        }))
      : {
          state: next,
          effects: [
            { kind: "startTimer", id: "search", ms: SEARCH_DEBOUNCE_MS },
          ],
        };
  }
  const items = source.items(s, reg, query, p.arg);
  return requestPreview(withPicker(s, { ...p, query, items, selected: 0 }));
}

function select(s: AppState, p: PickerState, to: number): Result {
  if (p.items.length === 0) return none(s);
  const selected = Math.max(0, Math.min(p.items.length - 1, to));
  if (selected === p.selected) return none(s);
  const item = p.items[selected];
  return chain(requestPreview(withPicker(s, { ...p, selected })), (st) =>
    message(st, `${selected + 1}/${p.items.length} ${item?.label ?? ""}`),
  );
}

/** Keys while a picker is open: type to filter, move, `Enter` to accept, `Esc` to close. */
export function pickerKey(
  s: AppState,
  a: { key: Key; now: number },
  reg: Registries,
): Result {
  const p = pickerOf(s);
  if (p === undefined) return none(s);
  switch (a.key) {
    case "<Esc>":
      return {
        state: { ...s, overlay: { kind: "none" } },
        effects: [{ kind: "cancelTimer", id: "search" }],
      };
    case "<CR>": {
      const item = p.items[p.selected];
      const source = pickerSources[p.source];
      return item === undefined || source === undefined
        ? none(s)
        : source.accept(s, item, a.now, reg);
    }
    case "<C-n>":
    case "<Down>":
      return select(s, p, p.selected + 1);
    case "<C-p>":
    case "<Up>":
      return select(s, p, p.selected - 1);
    case "<C-d>":
    case "<PageDown>":
      return select(s, p, p.selected + PAGE);
    case "<C-u>":
    case "<PageUp>":
      return select(s, p, p.selected - PAGE);
    case "<BS>":
      return p.query === ""
        ? none(s)
        : setQuery(s, p, [...p.query].slice(0, -1).join(""), reg);
    default:
      return [...a.key].length === 1
        ? setQuery(s, p, p.query + a.key, reg)
        : none(s);
  }
}

/** The grep query settled: search it under a fresh id. */
export function onSearchTimer(s: AppState): Result {
  const p = pickerOf(s);
  if (p === undefined || p.source !== "grep" || p.query === "") return none(s);
  const id = s.index.searchSeq + 1;
  const next = withPicker(
    { ...s, index: { ...s.index, searchSeq: id } },
    { ...p, search: { id, pending: true, capped: false } },
  );
  const effect: Effect = {
    kind: "search",
    id,
    query: p.query,
    limit: GREP_LIMIT,
  };
  return { state: next, effects: [effect] };
}

/** Results for the picker's current search; any other id is stale and dropped. */
export function onSearchResults(
  s: AppState,
  a: Extract<Action, { type: "searchResults" }>,
): Result {
  const p = pickerOf(s);
  if (p?.search === undefined || p.search.id !== a.id) return none(s);
  const items = a.hits.map(grepItem);
  return requestPreview(
    withPicker(s, {
      ...p,
      items,
      total: items.length,
      selected: 0,
      search: { id: a.id, pending: false, capped: a.capped },
    }),
  );
}

/** A preview read finished; a read for an older selection is dropped. */
export function onPreviewLoaded(
  s: AppState,
  a: Extract<Action, { type: "previewLoaded" }>,
): Result {
  const p = pickerOf(s);
  if (p?.preview === undefined || p.preview.id !== a.id) return none(s);
  const preview =
    "refused" in a.result
      ? { ...p.preview, refused: a.result.refused }
      : { ...p.preview, file: a.result };
  return none(withPicker(s, { ...p, preview }));
}
