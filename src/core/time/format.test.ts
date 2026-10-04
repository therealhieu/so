import { expect, test } from "bun:test";
import { formatDate } from "./format";
import type { LocalDateTime } from "./local";

/** Weekday of a calendar date, independent of any time zone. */
const weekdayOf = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month - 1, day)).getUTCDay();

const at = (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): LocalDateTime => ({
  year,
  month,
  day,
  hour,
  minute,
  second,
  weekday: weekdayOf(year, month, day),
});

const oct3 = at(2026, 10, 3, 9, 5);

test("formats every supported token as Moment does", () => {
  const expected: [string, string][] = [
    ["YYYY", "2026"],
    ["YY", "26"],
    ["M", "10"],
    ["MM", "10"],
    ["MMM", "Oct"],
    ["MMMM", "October"],
    ["D", "3"],
    ["DD", "03"],
    ["Do", "3rd"],
    ["d", "6"],
    ["ddd", "Sat"],
    ["dddd", "Saturday"],
    ["H", "9"],
    ["HH", "09"],
    ["h", "9"],
    ["hh", "09"],
    ["m", "5"],
    ["mm", "05"],
    ["s", "0"],
    ["ss", "00"],
    ["A", "AM"],
    ["a", "am"],
  ];
  for (const [token, out] of expected)
    expect([token, formatDate(oct3, token)]).toEqual([token, out]);
  expect(formatDate(oct3, "dddd, MMMM Do YYYY [at] h:mm A")).toBe(
    "Saturday, October 3rd 2026 at 9:05 AM",
  );
  expect(formatDate(at(2026, 3, 7), "M MM MMM MMMM")).toBe("3 03 Mar March");
  expect(formatDate(at(26, 1, 1), "YYYY YY")).toBe("0026 26");
});

test("the twelve-hour clock and meridiem follow Moment at midnight and noon", () => {
  const cases: [number, number, string][] = [
    [0, 0, "12 12 AM am"],
    [0, 30, "12 12 AM am"],
    [11, 59, "11 11 AM am"],
    [12, 0, "12 12 PM pm"],
    [12, 30, "12 12 PM pm"],
    [13, 5, "1 01 PM pm"],
    [23, 59, "11 11 PM pm"],
  ];
  for (const [hour, minute, out] of cases)
    expect(formatDate(at(2026, 10, 3, hour, minute), "h hh A a")).toBe(out);
});

test("ordinals follow Moment's English rule for every day of the month", () => {
  const days = Array.from({ length: 31 }, (_, i) =>
    formatDate(at(2026, 10, i + 1), "Do"),
  );
  expect(days).toEqual([
    "1st",
    "2nd",
    "3rd",
    "4th",
    "5th",
    "6th",
    "7th",
    "8th",
    "9th",
    "10th",
    "11th",
    "12th",
    "13th",
    "14th",
    "15th",
    "16th",
    "17th",
    "18th",
    "19th",
    "20th",
    "21st",
    "22nd",
    "23rd",
    "24th",
    "25th",
    "26th",
    "27th",
    "28th",
    "29th",
    "30th",
    "31st",
  ]);
});

test("day numbers run from Sunday 0 to Saturday 6", () => {
  const week = [4, 5, 6, 7, 8, 9, 10].map((day) =>
    formatDate(at(2026, 10, day), "d ddd dddd"),
  );
  expect(week).toEqual([
    "0 Sun Sunday",
    "1 Mon Monday",
    "2 Tue Tuesday",
    "3 Wed Wednesday",
    "4 Thu Thursday",
    "5 Fri Friday",
    "6 Sat Saturday",
  ]);
});

test("unsupported tokens stay whole instead of splitting into supported ones", () => {
  expect(formatDate(oct3, "YYYY-[W]ww")).toBe("2026-Www");
  expect(formatDate(oct3, "dd")).toBe("dd");
  expect(formatDate(oct3, "Q")).toBe("Q");
  expect(formatDate(oct3, "DDDD DDD Wo gggg")).toBe("DDDD DDD Wo gggg");
  expect(formatDate(oct3, "LTS LLLL")).toBe("LTS LLLL");
  expect(formatDate(oct3, "YYYYYY")).toBe("YYYYYY");
  expect(formatDate(oct3, "SSS")).toBe("SSS");
});

test("brackets and backslashes emit literal text", () => {
  expect(formatDate(oct3, "\\Y")).toBe("Y");
  expect(formatDate(oct3, "\\YYYY")).toBe("YYYY");
  expect(formatDate(oct3, "[YYYY] YYYY")).toBe("YYYY 2026");
  expect(formatDate(oct3, "[a]b] D")).toBe("a]b 3");
  expect(formatDate(oct3, "YYYY\\")).toBe("2026");
  // No closing bracket: "[" is literal and the rest is tokenized, so "l" and "e"
  // stay whole, "s" is the second, and "d" the day number.
  expect(formatDate(oct3, "[unclosed")).toBe("[unclo0e6");
});

test("characters that are not tokens pass through", () => {
  expect(formatDate(oct3, "YYYY/MM/DD - HH:mm, ñ ✓")).toBe(
    "2026/10/03 - 09:05, ñ ✓",
  );
  expect(formatDate(oct3, "")).toBe("");
});
