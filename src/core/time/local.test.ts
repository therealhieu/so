import { expect, test } from "bun:test";
import {
  addDays,
  addMonthsClamped,
  daysInMonth,
  type LocalDate,
  localDateTime,
  mondayIndex,
  withDate,
} from "./local";

const date = (year: number, month: number, day: number): LocalDate => ({
  year,
  month,
  day,
});

/** Days since 1970-01-01 of a calendar date, independent of any time zone. */
const dayNumber = (d: LocalDate) =>
  Date.UTC(d.year, d.month - 1, d.day) / 86_400_000;

function walk(from: LocalDate, steps: number, n: 1 | -1): LocalDate[] {
  const out = [from];
  for (let i = 0; i < steps; i++) out.push(addDays(out[i] as LocalDate, n));
  return out;
}

test("day steps across daylight-saving changes neither skip nor repeat a day", () => {
  for (const start of [date(2026, 3, 26), date(2026, 10, 29)])
    for (const n of [1, -1] as const) {
      const days = walk(n === 1 ? start : addDays(start, 7), 7, n);
      for (let i = 1; i < days.length; i++)
        expect(
          dayNumber(days[i] as LocalDate) - dayNumber(days[i - 1] as LocalDate),
        ).toBe(n);
    }
  expect(addDays(date(2026, 3, 28), 1)).toEqual(date(2026, 3, 29));
  expect(addDays(date(2026, 3, 29), 1)).toEqual(date(2026, 3, 30));
  expect(addDays(date(2026, 11, 1), -1)).toEqual(date(2026, 10, 31));
  expect(addDays(date(2026, 11, 1), 1)).toEqual(date(2026, 11, 2));
});

test("day steps cross month and year ends", () => {
  expect(addDays(date(2026, 12, 31), 1)).toEqual(date(2027, 1, 1));
  expect(addDays(date(2026, 3, 1), -1)).toEqual(date(2026, 2, 28));
  expect(addDays(date(2028, 3, 1), -1)).toEqual(date(2028, 2, 29));
  expect(addDays(date(2026, 10, 3), 0)).toEqual(date(2026, 10, 3));
});

test("month steps clamp to the last day of a shorter month", () => {
  expect(addMonthsClamped(date(2026, 1, 31), 1)).toEqual(date(2026, 2, 28));
  expect(addMonthsClamped(date(2028, 1, 31), 1)).toEqual(date(2028, 2, 29));
  expect(addMonthsClamped(date(2026, 3, 31), -1)).toEqual(date(2026, 2, 28));
  expect(addMonthsClamped(date(2026, 12, 15), 1)).toEqual(date(2027, 1, 15));
  expect(addMonthsClamped(date(2026, 1, 15), -13)).toEqual(date(2024, 12, 15));
});

test("month lengths follow the leap-year rules", () => {
  expect(daysInMonth(2026, 2)).toBe(28);
  expect(daysInMonth(2028, 2)).toBe(29);
  expect(daysInMonth(2100, 2)).toBe(28);
  expect(daysInMonth(2000, 2)).toBe(29);
  expect(daysInMonth(2026, 4)).toBe(30);
  expect(daysInMonth(2026, 12)).toBe(31);
});

test("local fields come from the process time zone", () => {
  const ms = new Date(2026, 9, 3, 9, 5, 7, 250).getTime();
  expect(localDateTime(ms)).toEqual({
    year: 2026,
    month: 10,
    day: 3,
    hour: 9,
    minute: 5,
    second: 7,
    weekday: 6,
  });
});

test("weeks start on Monday and moving the date keeps the wall-clock time", () => {
  expect(mondayIndex(date(2026, 10, 5))).toBe(0);
  expect(mondayIndex(date(2026, 10, 3))).toBe(5);
  expect(mondayIndex(date(2026, 10, 4))).toBe(6);
  const at = localDateTime(new Date(2026, 9, 3, 9, 5).getTime());
  expect(withDate(at, date(2026, 10, 4))).toEqual({
    year: 2026,
    month: 10,
    day: 4,
    hour: 9,
    minute: 5,
    second: 0,
    weekday: 0,
  });
});
