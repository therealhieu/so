export type LocalDate = { year: number; month: number; day: number };
export type LocalDateTime = LocalDate & {
  hour: number;
  minute: number;
  second: number;
  /** 0 = Sunday, as Moment's `d`. */
  weekday: number;
};

/** The calendar fields of `ms` in the process time zone. */
export function localDateTime(ms: number): LocalDateTime {
  const d = new Date(ms);
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    hour: d.getHours(),
    minute: d.getMinutes(),
    second: d.getSeconds(),
    weekday: d.getDay(),
  };
}

/** A calendar date as a UTC instant, so arithmetic never meets a DST change. */
const toUtc = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month - 1, day));

const fromUtc = (d: Date): LocalDate => ({
  year: d.getUTCFullYear(),
  month: d.getUTCMonth() + 1,
  day: d.getUTCDate(),
});

/** Calendar arithmetic through Date.UTC, so DST never shifts the day. */
export function addDays(d: LocalDate, n: number): LocalDate {
  return fromUtc(toUtc(d.year, d.month, d.day + n));
}

/** `n` months later; a day past the end of the target month becomes its last day. */
export function addMonthsClamped(d: LocalDate, n: number): LocalDate {
  const first = fromUtc(toUtc(d.year, d.month + n, 1));
  return {
    ...first,
    day: Math.min(d.day, daysInMonth(first.year, first.month)),
  };
}

/** The same wall-clock time on day `d`. */
export function withDate(at: LocalDateTime, d: LocalDate): LocalDateTime {
  return {
    ...at,
    year: d.year,
    month: d.month,
    day: d.day,
    weekday: toUtc(d.year, d.month, d.day).getUTCDay(),
  };
}

export function daysInMonth(year: number, month: number): number {
  return toUtc(year, month + 1, 0).getUTCDate();
}

/** Monday-first column: Monday = 0 … Sunday = 6. */
export function mondayIndex(d: LocalDate): number {
  return (toUtc(d.year, d.month, d.day).getUTCDay() + 6) % 7;
}
