import { dailyPath } from "../features/notes/daily";
import type { Key } from "../kernel/vim/keys";
import { formatDate } from "../time/format";
import {
  addDays,
  addMonthsClamped,
  daysInMonth,
  type LocalDate,
  localDateTime,
  mondayIndex,
} from "../time/local";
import type { CommandContext } from "./commands";
import { findPathInsensitive, openDaily } from "./note-commands";
import { message, none } from "./result";
import type { AppState, CalendarState, Result } from "./types";
import type { Registries } from "./update";

const dateOf = (d: LocalDate): LocalDate => ({
  year: d.year,
  month: d.month,
  day: d.day,
});

const calendarOf = (s: AppState): CalendarState | undefined =>
  s.overlay.kind === "calendar" ? s.overlay.calendar : undefined;

const hasNote = (s: AppState, d: LocalDate): boolean =>
  findPathInsensitive(s.index.ix, dailyPath(s.config.daily, d).path) !==
  undefined;

/** Days of the shown month whose daily note is in the index; no disk read. */
export function calendarMarks(s: AppState): ReadonlySet<number> {
  const cal = calendarOf(s);
  const marks = new Set<number>();
  if (cal === undefined) return marks;
  const { year, month } = cal.month;
  for (let day = 1; day <= daysInMonth(year, month); day++)
    if (hasNote(s, { year, month, day })) marks.add(day);
  return marks;
}

/** The calendar showing `selected`, with the message line announcing it. */
function show(s: AppState, cal: CalendarState, selected: LocalDate): Result {
  const next: CalendarState = {
    ...cal,
    selected,
    month: { year: selected.year, month: selected.month },
  };
  const weekday = (mondayIndex(selected) + 1) % 7;
  const label = formatDate(
    { ...selected, hour: 0, minute: 0, second: 0, weekday },
    "ddd YYYY-MM-DD",
  );
  const exists = hasNote(s, selected) ? "note exists" : "no note";
  return message(
    { ...s, overlay: { kind: "calendar", calendar: next } },
    `${label} · ${exists}`,
  );
}

/** Select `date` in the open calendar, as moving to it does. */
export function selectCalendarDay(s: AppState, date: LocalDate): Result {
  const cal = calendarOf(s);
  return cal === undefined ? none(s) : show(s, cal, date);
}

/** `<leader>np`: the calendar on today's month with today selected. */
export function openCalendar(c: CommandContext): Result {
  const today = dateOf(localDateTime(c.now));
  const cal = {
    month: { year: today.year, month: today.month },
    today,
    selected: today,
  };
  return show(c.state, cal, today);
}

const STEPS: Readonly<Record<string, number>> = { h: -1, l: 1, j: 7, k: -7 };

/**
 * Keys while the calendar is open: `h`/`l` a day, `j`/`k` a week, `H`/`L` a
 * month (the day clamped to its length), `t` today, `Esc` close, `Enter`
 * open or create the selected day's note. Other keys do nothing.
 */
export function calendarKey(
  s: AppState,
  a: { key: Key; now: number },
  reg: Registries,
): Result {
  const cal = calendarOf(s);
  if (cal === undefined) return none(s);
  const step = STEPS[a.key];
  if (step !== undefined) return show(s, cal, addDays(cal.selected, step));
  switch (a.key) {
    case "H":
    case "L":
      return show(
        s,
        cal,
        addMonthsClamped(cal.selected, a.key === "L" ? 1 : -1),
      );
    case "t":
      return show(s, cal, cal.today);
    case "<Esc>":
      return none({ ...s, overlay: { kind: "none" } });
    case "<CR>":
      return openDaily(
        { state: { ...s, overlay: { kind: "none" } }, now: a.now, reg },
        cal.selected,
      );
    default:
      return none(s);
  }
}
