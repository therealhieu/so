import type { NoteIndex } from "../features/links/note-index";
import { dailyPath, parseDailyDate } from "../features/notes/daily";
import { BUILTIN_DAILY_TEMPLATE } from "../features/notes/template";
import type { Binding } from "../kernel/commands/defaults";
import type { Command } from "../kernel/commands/registry";
import {
  addDays,
  type LocalDate,
  localDateTime,
  withDate,
} from "../time/local";
import { activeBuffer, openPath } from "./buffers";
import type { CommandContext, CommandResult } from "./commands";
import { chain, none, toast } from "./result";
import type { Action, AppState, Result } from "./types";
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
];

export const noteBindings: readonly Binding[] = [
  { scope: { mode: "normal" }, seq: "<leader>nd", id: "note.today" },
];

export const noteGroups = { "<leader>n": "notes" } as const;
