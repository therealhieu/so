import {
  backlinksOf,
  notesWithTag,
  tagCounts,
} from "../features/links/note-index";
import { expandTemplate } from "../features/notes/template";
import type { Binding } from "../kernel/commands/defaults";
import { rankBy } from "../kernel/text/fuzzy";
import type { Key } from "../kernel/vim/keys";
import type { Doc } from "../lang/markdown/doc";
import { localDateTime } from "../time/local";
import { baseViewModel, selectBaseView } from "./base-model";
import {
  activeBuffer,
  bufferForPath,
  fullText,
  listedBuffers,
  openPath,
} from "./buffers";
import { type CommandContext, runCommand } from "./commands";
import { goTo, recordJump } from "./jumps";
import { effectiveBindings } from "./keymap";
import { unlinkedHits } from "./mentions";
import { insertTemplate } from "./note-commands";
import { chain, message, none } from "./result";
import type {
  Action,
  AppState,
  Effect,
  PickerItem,
  PickerState,
  Result,
  SearchHit,
  TextFile,
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

/** Display lines a source computes for its preview pane; styles are theme tokens. */
export type PreviewLines = {
  text: string;
  style?: string;
  /** The preview pane's selected row, kept in view. */
  selected?: true;
  /** Code-point ranges of `text` drawn in their own style. */
  ranges?: { from: number; to: number; style: string }[];
}[];

export type PickerSource = {
  id: string;
  title: string;
  /** The title for the picker's `arg`, when it says more than `title`. */
  titleFor?(arg: string): string;
  /** What Enter does, for the footer ("open" or "run" when absent). */
  action?: string;
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
  /** Display lines computed from the loaded preview file, instead of its raw lines. */
  render?(s: AppState, item: PickerItem, file: TextFile): PreviewLines;
  /** Sources without a file to preview: display lines computed from the state, with note `browse` selected. */
  describe?(s: AppState, item: PickerItem, browse?: number): PreviewLines;
  /** The notes the preview lists, which `C-l` lets you move through and open. */
  notes?(s: AppState, item: PickerItem): readonly string[];
  /**
   * Load the preview even below `PREVIEW_MIN_COLS`, because `accept` needs
   * the file; there `Tab` shows it in place of the list.
   */
  previewAlways?: true;
  /** What an empty list says when nothing is typed, one row per line. */
  empty?(s: AppState): string;
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

const noteCount = (n: number) => `${n} ${n === 1 ? "note" : "notes"}`;

/** A tag's notes, one path per row, under the tag and its count. */
function tagPreview(
  s: AppState,
  item: PickerItem,
  browse?: number,
): PreviewLines {
  const paths = notesWithTag(s.index.ix, item.key);
  return [
    { text: `#${item.key}`, style: "floatTitle" },
    { text: noteCount(paths.length), style: "floatDim" },
    { text: "" },
    ...paths.map((p, i) =>
      browse === undefined
        ? { text: p }
        : i === browse
          ? { text: `▸ ${p}`, style: "floatSel", selected: true as const }
          : { text: `  ${p}` },
    ),
  ];
}

const fileItem = (path: string, line?: number): Candidate =>
  line === undefined
    ? { key: path, text: path, path }
    : { key: path, text: path, path, line };

/** The active base window's views, with their layout type. */
function baseViewCandidates(s: AppState, reg: Registries): Candidate[] {
  const m = baseViewModel(s, s.windows.active, reg);
  return (m?.views ?? []).map((v) => ({
    key: v.name,
    text: v.name,
    detail: v.name === m?.selected ? `${v.type} · shown` : v.type,
  }));
}

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

/** Every `.md` file under the configured templates folder, by path. */
export function templatePaths(s: AppState): string[] {
  const { folder } = s.config.templates;
  const prefix = folder === "" ? "" : `${folder}/`;
  return [...s.index.ix.files]
    .filter((p) => p.startsWith(prefix) && /\.md$/i.test(p))
    .sort();
}

const templateItem =
  (s: AppState) =>
  (path: string): Candidate => ({
    key: path,
    text: path.slice(
      s.config.templates.folder === ""
        ? 0
        : s.config.templates.folder.length + 1,
    ),
    path,
  });

/**
 * The preview's file once it is loaded: the read file, or the text of an
 * open buffer at that path.
 */
export function loadedPreview(
  s: AppState,
  item: PickerItem,
): TextFile | undefined {
  const p = pickerOf(s);
  if (item.path === undefined || p?.preview?.path !== item.path)
    return undefined;
  if (p.preview.file !== undefined) return p.preview.file;
  const b = bufferForPath(s, item.path);
  return b === undefined
    ? undefined
    : {
        text: fullText(b.text) + (b.finalNewline ? "\n" : ""),
        bom: b.bom,
        eol: "\n",
        stamp: b.stamp,
      };
}

/** A note's title for `{{title}}`: its file name without `.md`. */
export const noteTitle = (path: string | undefined): string =>
  (path ?? "").slice((path ?? "").lastIndexOf("/") + 1).replace(/\.md$/i, "");

const lineList = (text: string) =>
  text.replaceAll("\r\n", "\n").replace(/\n$/, "").split("\n");
const cp = (text: string) => [...text].length;

/** The template's source with `{{…}}` marked, `▸`, then its expansion. */
export function templatePreview(
  text: string,
  title: string,
  time: number,
): PreviewLines {
  const source = lineList(text).map((line) => {
    const ranges = [...line.matchAll(/\{\{[^}]*\}\}/g)].map((m) => {
      const from = cp(line.slice(0, m.index));
      return { from, to: from + cp(m[0]), style: "floatMatch" };
    });
    return ranges.length === 0 ? { text: line } : { text: line, ranges };
  });
  const expanded = expandTemplate(text, { title, at: localDateTime(time) });
  return [
    ...source,
    { text: "▸", style: "floatDim" },
    ...lineList(expanded).map((line) => ({ text: line })),
  ];
}

const timeOf = (s: AppState) => pickerOf(s)?.time ?? 0;

/** The new-note picker's first row: no template. */
const BLANK = "\u0000blank";

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
          detail: noteCount(t.count),
        })),
        q,
      ),
    accept: (s, item, now, reg) =>
      openPicker({ state: s, now, reg }, "tagNotes", item.key),
    describe: tagPreview,
    notes: (s, item) => notesWithTag(s.index.ix, item.key),
  },
  tagNotes: {
    id: "tagNotes",
    title: "Notes with tag",
    titleFor: (tag) => `Notes with #${tag}`,
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
    titleFor: (path) => `Backlinks of ${noteTitle(path)}`,
    indexed: true,
    items: (s, _r, q, target) => ranked(backlinkCandidates(s, target), q),
    total: (s, _r, target) => backlinkCandidates(s, target).length,
    accept: acceptFile,
    preview: previewFile,
  },
  templates: {
    id: "templates",
    title: "Insert template",
    action: "insert",
    indexed: true,
    previewAlways: true,
    items: (s, _r, q) => ranked(templatePaths(s).map(templateItem(s)), q),
    total: (s) => templatePaths(s).length,
    empty: (s) =>
      `No templates in ${s.config.templates.folder}/\nCreate a .md file there to add one`,
    preview: previewFile,
    render: (s, _item, file) =>
      templatePreview(file.text, noteTitle(activeBuffer(s)?.path), timeOf(s)),
    accept: (s, item, now, reg) => {
      const file = loadedPreview(s, item);
      return file === undefined
        ? message(s, "loading template…")
        : insertTemplate(s, file, now, reg);
    },
  },
  baseViews: {
    id: "baseViews",
    title: "Views",
    action: "switch",
    items: (s, reg, q) => ranked(baseViewCandidates(s, reg), q),
    total: (s, reg) => baseViewCandidates(s, reg).length,
    accept: (s, item) =>
      none(
        selectBaseView(
          { ...s, overlay: { kind: "none" } },
          s.windows.active,
          item.key,
        ),
      ),
  },
  newNoteTemplates: {
    id: "newNoteTemplates",
    title: "New note — choose a template",
    action: "create",
    indexed: true,
    previewAlways: true,
    items: (s, _r, q) =>
      ranked(
        [
          { key: BLANK, text: "(blank note)", detail: "empty" },
          ...templatePaths(s).map(templateItem(s)),
        ],
        q,
      ),
    total: (s) => templatePaths(s).length + 1,
    preview: (item) =>
      item.path === undefined ? undefined : previewFile(item),
    render: (s, _item, file) =>
      templatePreview(file.text, noteTitle(pickerOf(s)?.arg), timeOf(s)),
    accept: (s, item, now) => {
      const path = pickerOf(s)?.arg;
      const closed: AppState = { ...s, overlay: { kind: "none" } };
      if (path === undefined) return none(closed);
      return {
        state: closed,
        effects: [
          {
            kind: "createNote",
            path,
            ...(item.path === undefined ? {} : { template: item.path }),
            vars: { title: noteTitle(path), at: localDateTime(now) },
            after: "insert",
            reason: "new",
          },
        ],
      };
    },
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
  const wanted =
    s.terminal.cols >= PREVIEW_MIN_COLS || source?.previewAlways === true;
  if (!wanted || target === undefined) {
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
    ...(source.render === undefined ? {} : { time: c.now }),
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

/** Select row `index` of the open picker, as moving to it does; the list takes the keys back. */
export function selectPickerItem(s: AppState, index: number): Result {
  const p = pickerOf(s);
  if (p === undefined) return none(s);
  const { browse: _, ...list } = p;
  return select(withPicker(s, list), list, index);
}

function togglePreview(p: PickerState): PickerState {
  const { showPreview, ...rest } = p;
  return showPreview === true ? rest : { ...rest, showPreview: true };
}

/**
 * Keys while the preview pane has them: move through its notes, `Enter` to
 * open one, `C-h` (or `<BS>`, which a terminal without the kitty keyboard
 * protocol sends for it) back to the list. Typing goes back and filters.
 */
function browseKey(
  s: AppState,
  p: PickerState,
  browse: number,
  a: { key: Key; now: number },
  reg: Registries,
): Result {
  const item = p.items[p.selected];
  const paths =
    item === undefined ? [] : (pickerSources[p.source]?.notes?.(s, item) ?? []);
  const { browse: _, ...list } = p;
  const at = (i: number) =>
    none(
      withPicker(s, {
        ...p,
        browse: Math.max(0, Math.min(i, paths.length - 1)),
      }),
    );
  switch (a.key) {
    case "<C-h>":
    case "<BS>":
      return none(withPicker(s, list));
    case "<C-j>":
    case "<C-n>":
    case "<Down>":
      return at(browse + 1);
    case "<C-k>":
    case "<C-p>":
    case "<Up>":
      return at(browse - 1);
    case "<CR>": {
      const path = paths[browse];
      return path === undefined ? none(s) : openAt(s, path, a.now);
    }
    case "<Esc>":
      return pickerKey(withPicker(s, list), a, reg);
    default:
      return [...a.key].length === 1
        ? pickerKey(withPicker(s, list), a, reg)
        : none(s);
  }
}

/** Keys while a picker is open: type to filter, move, `Enter` to accept, `Esc` to close. */
export function pickerKey(
  s: AppState,
  a: { key: Key; now: number },
  reg: Registries,
): Result {
  const p = pickerOf(s);
  if (p === undefined) return none(s);
  if (p.browse !== undefined) return browseKey(s, p, p.browse, a, reg);
  switch (a.key) {
    case "<C-l>": {
      const item = p.items[p.selected];
      const notes =
        item === undefined ? undefined : pickerSources[p.source]?.notes;
      return notes === undefined ||
        item === undefined ||
        notes(s, item).length === 0
        ? none(s)
        : none(withPicker(s, { ...p, browse: 0 }));
    }
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
    case "<C-j>":
    case "<C-n>":
    case "<Down>":
      return select(s, p, p.selected + 1);
    case "<C-k>":
    case "<C-p>":
    case "<Up>":
      return select(s, p, p.selected - 1);
    case "<C-d>":
    case "<PageDown>":
      return select(s, p, p.selected + PAGE);
    case "<C-u>":
    case "<PageUp>":
      return select(s, p, p.selected - PAGE);
    case "<Tab>":
      return pickerSources[p.source]?.previewAlways === true
        ? none(withPicker(s, togglePreview(p)))
        : none(s);
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
