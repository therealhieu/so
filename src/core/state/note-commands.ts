import type { NoteIndex } from "../features/links/note-index";
import type { SpanEdit } from "../features/links/rename";
import { dailyPath, parseDailyDate } from "../features/notes/daily";
import {
  BUILTIN_DAILY_TEMPLATE,
  expandTemplate,
} from "../features/notes/template";
import type { Binding } from "../kernel/commands/defaults";
import type { Command } from "../kernel/commands/registry";
import type { Pos } from "../kernel/text/pos";
import {
  mergeFrontmatter,
  splitFrontmatter,
} from "../lang/markdown/frontmatter-patch";
import {
  addDays,
  type LocalDate,
  localDateTime,
  withDate,
} from "../time/local";
import {
  activeBuffer,
  activeWindow,
  applyBufferEdits,
  fullText,
  openPath,
  placeCursor,
  READ_ONLY_HINT,
  readOnlyView,
} from "./buffers";
import { openCalendar } from "./calendar";
import type { CommandContext, CommandResult } from "./commands";
import { noteTitle, openPicker } from "./picker";
import { chain, message, none, toast } from "./result";
import type { Action, AppState, Result, TextFile } from "./types";
import type { Registries } from "./update";

type AppCommand = Command<CommandContext, CommandResult>;

const lowerPaths = new WeakMap<NoteIndex, Map<string, string>>();

/**
 * The indexed file at `path`, compared without regard to case, so a daily
 * note is never created beside a case variant of itself.
 */
export function findPathInsensitive(
  ix: NoteIndex,
  path: string,
): string | undefined {
  if (ix.files.has(path)) return path;
  let byLower = lowerPaths.get(ix);
  if (byLower === undefined) {
    byLower = new Map();
    for (const p of ix.files) {
      const key = p.toLowerCase();
      if (!byLower.has(key)) byLower.set(key, p);
    }
    lowerPaths.set(ix, byLower);
  }
  return byLower.get(path.toLowerCase());
}

/**
 * Open the daily note of `date` with the cursor on its first open task, or
 * create it from the daily template when no file of that path exists.
 */
export function openDaily(c: CommandContext, date: LocalDate): Result {
  const { daily } = c.state.config;
  const { path, title } = dailyPath(daily, date);
  const found = findPathInsensitive(c.state.index.ix, path);
  if (found !== undefined)
    return openPath(c.state, found, c.now, { after: "firstTask", reg: c.reg });
  return {
    state: c.state,
    effects: [
      {
        kind: "createNote",
        path,
        template: daily.template,
        fallback: BUILTIN_DAILY_TEMPLATE,
        vars: { title, at: withDate(localDateTime(c.now), date) },
        after: "firstTask",
        reason: "daily",
      },
    ],
  };
}

/** Today, or `step` days from the active daily note (from today when none is active). */
function relativeDay(c: CommandContext, step: -1 | 0 | 1): LocalDate {
  const today = localDateTime(c.now);
  if (step === 0) return today;
  const path = activeBuffer(c.state)?.path;
  const from =
    path === undefined ? undefined : parseDailyDate(path, c.state.config.daily);
  return addDays(from ?? today, step);
}

/**
 * A `createNote` answered. A daily note opens whether it was created or
 * already there; a new note with a taken name is refused and not opened.
 */
export function onNoteCreated(
  s: AppState,
  a: Extract<Action, { type: "noteCreated" }>,
  now: number,
  reg: Registries,
): Result {
  if (a.outcome === "failed")
    return toast(
      s,
      "error",
      `cannot create ${a.path}: ${a.failure ?? "error"}`,
    );
  if (a.outcome === "exists" && a.reason === "new")
    return toast(s, "error", `E13: File exists (${a.path})`);
  const notified = a.outcome === "created" ? createdToasts(s, a) : none(s);
  return chain(notified, (st) =>
    openPath(st, a.path, now, { after: a.after, reg }),
  );
}

function createdToasts(
  s: AppState,
  a: Extract<Action, { type: "noteCreated" }>,
): Result {
  const tpl = a.templatePath ?? "template";
  const from = a.template === "used" ? ` from ${a.templatePath}` : "";
  const info = toast(s, "info", `Created ${a.path}${from}`);
  if (a.template === "unreadable")
    return chain(info, (st) =>
      toast(st, "error", `template unreadable: ${tpl} — created an empty note`),
    );
  if (a.template === "missing" && a.reason === "new")
    return chain(info, (st) =>
      toast(st, "error", `template not found: ${tpl} — created an empty note`),
    );
  return info;
}

/** Where `text` ends when inserted at `at`. */
function endOf(at: Pos, text: string): Pos {
  const lines = text.split("\n");
  const last = lines.at(-1) ?? "";
  return lines.length === 1
    ? { line: at.line, col: at.col + last.length }
    : { line: at.line + lines.length - 1, col: last.length };
}

/** Lines that `edits` above `at` add (or remove) before it. */
function linesAdded(edits: readonly SpanEdit[], at: Pos): number {
  let n = 0;
  for (const e of edits) {
    const { start, end } = e.range;
    if (end.line > at.line || (end.line === at.line && end.col > at.col))
      continue;
    n += e.text.split("\n").length - 1 - (end.line - start.line);
  }
  return n;
}

/**
 * Insert `file`, a template, into the active note as one undo step: whole
 * at the note's start, else its body at the cursor with its properties
 * merged into the note's. The cursor ends after the inserted text.
 */
export function insertTemplate(
  s: AppState,
  file: TextFile,
  now: number,
  reg: Registries,
): Result {
  const closed: AppState = { ...s, overlay: { kind: "none" } };
  const b = activeBuffer(closed);
  const w = activeWindow(closed);
  if (b === undefined || w === undefined) return none(closed);
  if (readOnlyView(reg, b)) return message(closed, READ_ONLY_HINT);
  const text = expandTemplate(file.text.replaceAll("\r\n", "\n"), {
    title: noteTitle(b.path),
    at: localDateTime(now),
  });
  const at = w.content.cursor;
  const start = at.line === 0 && at.col === 0;
  const { fm, body } = start
    ? { fm: undefined, body: text }
    : splitFrontmatter(text);
  const merged = fm && mergeFrontmatter(fullText(b.text), fm);
  const merges = merged?.ok ? merged.edits : [];
  const insert: SpanEdit = {
    range: { start: at, end: at },
    expected: "",
    text: body,
  };
  const r = applyBufferEdits(
    closed,
    { path: b.path, edits: [insert, ...merges] },
    now,
    reg,
  );
  if (r.stale)
    return message(closed, "cannot insert the template here", "error");
  const shifted = { line: at.line + linesAdded(merges, at), col: at.col };
  const placed = { ...r, state: placeCursor(r.state, endOf(shifted, body)) };
  return merged === undefined || merged.ok
    ? placed
    : chain(placed, (st) =>
        message(st, `template properties not merged: ${merged.reason}`),
      );
}

/** `<leader>nn`: ask for the new note's title. */
export function startNewNote(c: CommandContext): Result {
  return none({
    ...c.state,
    overlay: {
      kind: "prompt",
      prompt: { kind: "input", title: "New note", value: "", newNote: true },
    },
  });
}

/** The title is valid: choose the new note's template, "(blank note)" first. */
export function submitNewNote(
  s: AppState,
  path: string,
  now: number,
  reg: Registries,
): Result {
  return openPicker({ state: s, now, reg }, "newNoteTemplates", path);
}

export const noteCommands: readonly AppCommand[] = [
  {
    id: "note.today",
    title: "Today's daily note",
    run: (c) => openDaily(c, relativeDay(c, 0)),
  },
  {
    id: "note.yesterday",
    title: "Previous day's daily note",
    run: (c) => openDaily(c, relativeDay(c, -1)),
  },
  {
    id: "note.tomorrow",
    title: "Next day's daily note",
    run: (c) => openDaily(c, relativeDay(c, 1)),
  },
  { id: "note.pickDate", title: "Pick a daily note date", run: openCalendar },
  { id: "note.new", title: "New note from a template", run: startNewNote },
  {
    id: "template.insert",
    title: "Insert template",
    filetypes: ["markdown"],
    run: (c) => openPicker(c, "templates"),
  },
];

export const noteBindings: readonly Binding[] = [
  { scope: { mode: "normal" }, seq: "<leader>nd", id: "note.today" },
  { scope: { mode: "normal" }, seq: "<leader>np", id: "note.pickDate" },
  { scope: { mode: "normal" }, seq: "<leader>nn", id: "note.new" },
  {
    scope: { mode: "normal", filetype: "markdown" },
    seq: "<leader>nt",
    id: "template.insert",
  },
];

export const noteGroups = { "<leader>n": "notes" } as const;
