import { linkMentionEdit, type MentionHit } from "../features/links/mentions";
import { backlinksOf } from "../features/links/note-index";
import type { Key } from "../kernel/vim/keys";
import type { Doc } from "../lang/markdown/doc";
import { markdownFileType } from "../lang/markdown/file-type";
import { activeBuffer, bufferForPath } from "./buffers";
import type { CommandContext } from "./commands";
import { goTo, recordJump } from "./jumps";
import { startMentionEdit } from "./link-edits";
import { hitRange, unlinkedHits } from "./mentions";
import { GREP_LIMIT, openPicker, refreshPicker } from "./picker";
import { chain, none } from "./result";
import type { Action, AppState, Result, SidePanelState } from "./types";
import type { Registries } from "./update";

/** Below this width the panel is not docked; its picker opens instead. */
const DOCK_MIN_COLS = 100;

/** The panel is docked: open on a terminal wide enough for it. */
export const panelDocked = (s: AppState): boolean =>
  s.panels.side.open && s.terminal.cols >= DOCK_MIN_COLS;

/** Keys go to the panel: docked and focused. */
export const panelFocused = (s: AppState): boolean =>
  panelDocked(s) && s.panels.side.focused;

export type SidePanelRow = {
  section: "linked" | "unlinked" | "outline";
  /** The note the row opens; the shown note itself for outline rows. */
  path?: string;
  line: number;
  /** Linked: the line with the link; unlinked: the line; outline: the indented heading. */
  text: string;
  hit?: MentionHit;
};

const setSide = (s: AppState, patch: Partial<SidePanelState>): AppState => ({
  ...s,
  panels: { ...s.panels, side: { ...s.panels.side, ...patch } },
});

const basenameNoExt = (path: string) =>
  path.slice(path.lastIndexOf("/") + 1).replace(/\.[^.]*$/, "");

/** The shown note: the active buffer when it is a note. */
function shownNote(s: AppState): string | undefined {
  const b = activeBuffer(s);
  return b?.fileType === markdownFileType.id ? b.path : undefined;
}

/**
 * Search other notes for plain-text mentions of `path`'s name and aliases;
 * the answer replaces the unlinked rows.
 */
export function requestMentions(s: AppState, path: string): Result {
  const id = s.index.searchSeq + 1;
  const aliases = s.index.ix.summaries.get(path)?.aliases ?? [];
  const asked = setSide(
    { ...s, index: { ...s.index, searchSeq: id } },
    { mentions: { id, pending: true, hits: [] } },
  );
  return {
    state: asked,
    effects: [
      {
        kind: "search",
        id,
        query: "",
        limit: GREP_LIMIT,
        mode: "mentions",
        names: [basenameNoExt(path), ...aliases],
        exclude: path,
      },
    ],
  };
}

/** Whether `results` answer the panel's newest mentions search. */
export const answersMentions = (
  s: AppState,
  a: Extract<Action, { type: "searchResults" }>,
): boolean => s.panels.side.mentions?.id === a.id;

/** The mentions arrived: the panel shows them, and an open backlinks picker lists them. */
export function onMentionResults(
  s: AppState,
  a: Extract<Action, { type: "searchResults" }>,
  reg: Registries,
): Result {
  const next = setSide(s, {
    mentions: { id: a.id, pending: false, hits: a.hits },
  });
  return refreshPicker(next, reg, "backlinks");
}

/**
 * `<leader>lb` / `<leader>o`: below 100 columns the backlinks or headings
 * picker opens instead. Otherwise the docked panel opens with focus, gets
 * focus when it is open without it, and closes when it has it.
 */
export function toggleSidePanel(
  c: CommandContext,
  kind: SidePanelState["kind"],
): Result {
  const s = c.state;
  const path = shownNote(s);
  if (s.terminal.cols < DOCK_MIN_COLS)
    return kind === "backlinks"
      ? openBacklinksPicker(c, path)
      : openPicker(c, "headings");
  const side = s.panels.side;
  const same = side.open && side.kind === kind;
  if (same && side.focused)
    return none(setSide(s, { open: false, focused: false }));
  const explorer = { ...s.panels.explorer, focused: false };
  const shown = setSide(
    { ...s, panels: { ...s.panels, explorer } },
    { kind, open: true, focused: true, cursor: same ? side.cursor : 0 },
  );
  return kind === "backlinks" && !same && path !== undefined
    ? requestMentions(shown, path)
    : none(shown);
}

/** The backlinks picker for `path`: linked notes now, its unlinked mentions once the search answers. */
export function openBacklinksPicker(
  c: CommandContext,
  path: string | undefined,
): Result {
  return chain(openPicker(c, "backlinks", path), (st) =>
    path === undefined ? none(st) : requestMentions(st, path),
  );
}

/** The backlinks panel follows the active note: a new note asks for its mentions. */
export function followShownNote(prev: AppState, r: Result): Result {
  const side = r.state.panels.side;
  const path = shownNote(r.state);
  if (
    !side.open ||
    side.kind !== "backlinks" ||
    path === undefined ||
    path === shownNote(prev)
  )
    return r;
  const asked = requestMentions(r.state, path);
  return { state: asked.state, effects: [...r.effects, ...asked.effects] };
}

/**
 * The panel's rows for the active note: Linked (from the index) before
 * Unlinked (from the mentions search, minus mentions linked since), or the
 * outline from the live scan, so it follows unsaved edits.
 */
export function sidePanelRows(s: AppState): SidePanelRow[] {
  const path = shownNote(s);
  if (path === undefined) return [];
  if (s.panels.side.kind === "outline") {
    const doc = activeBuffer(s)?.analysis as Doc | undefined;
    return (doc?.scan.headings ?? []).map((h) => ({
      section: "outline",
      path,
      line: h.line,
      text: `${"  ".repeat(h.level - 1)}${h.text}`,
    }));
  }
  const linked: SidePanelRow[] = backlinksOf(s.index.ix, path).map((b) => ({
    section: "linked",
    path: b.from,
    line: b.link.line,
    text:
      bufferForPath(s, b.from)?.text.line(b.link.line) ??
      b.link.context ??
      b.link.raw,
  }));
  const unlinked = unlinkedHits(s).map(
    (h): SidePanelRow => ({
      section: "unlinked",
      path: h.path,
      line: h.line,
      text: h.text,
      hit: {
        path: h.path,
        range: hitRange(h),
        text: h.text.slice(h.col, h.col + h.len),
      },
    }),
  );
  return [...linked, ...unlinked];
}

/** `link.linkMention`: wrap the selected unlinked mention in a link to the shown note. */
export function linkMentionAtPanel(c: CommandContext): Result {
  const s = c.state;
  const path = shownNote(s);
  const rows = sidePanelRows(s);
  const row = rows[Math.min(s.panels.side.cursor, rows.length - 1)];
  if (
    !s.panels.side.open ||
    path === undefined ||
    row?.section !== "unlinked" ||
    row.hit === undefined
  )
    return none(s);
  const edit = linkMentionEdit(s.index.ix, path, row.hit);
  return startMentionEdit(s, edit, c.now, c.reg);
}

/**
 * A key while the panel has focus: j/k move, Enter opens the row (focus
 * returns to the editor), l links an unlinked mention, q closes, Esc
 * returns to the editor. Other keys are undefined, for the keymap.
 */
export function sidePanelKey(
  s: AppState,
  a: { key: Key; now: number },
  reg: Registries,
): Result | undefined {
  const rows = sidePanelRows(s);
  const last = Math.max(0, rows.length - 1);
  const cursor = Math.min(s.panels.side.cursor, last);
  switch (a.key) {
    case "j":
    case "<Down>":
      return none(setSide(s, { cursor: Math.min(last, cursor + 1) }));
    case "k":
    case "<Up>":
      return none(setSide(s, { cursor: Math.max(0, cursor - 1) }));
    case "<CR>": {
      const row = rows[cursor];
      if (row?.path === undefined) return none(s);
      const pos = { line: row.line, col: row.hit?.range.start.col ?? 0 };
      const back = recordJump(setSide(s, { focused: false }));
      return goTo(back, row.path, pos, a.now);
    }
    case "l":
      return linkMentionAtPanel({ state: s, now: a.now, reg });
    case "q":
      return none(setSide(s, { open: false, focused: false }));
    case "<Esc>":
      return none(setSide(s, { focused: false }));
  }
  return undefined;
}
