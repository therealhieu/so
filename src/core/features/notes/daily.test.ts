import { expect, test } from "bun:test";
import type { LocalDate } from "../../time/local";
import { type DailyConfig, dailyPath, parseDailyDate } from "./daily";

const oct3: LocalDate = { year: 2026, month: 10, day: 3 };
const cfg = (format: string, folder = "daily"): DailyConfig => ({
  folder,
  format,
  template: "templates/daily.md",
});

test("daily paths follow the folder and a subfolder format", () => {
  expect(dailyPath(cfg("YYYY-MM-DD"), oct3)).toEqual({
    path: "daily/2026-10-03.md",
    title: "2026-10-03",
  });
  expect(dailyPath(cfg("YYYY/MM/YYYY-MM-DD"), oct3)).toEqual({
    path: "daily/2026/10/2026-10-03.md",
    title: "2026/10/2026-10-03",
  });
  expect(dailyPath(cfg("YYYY/MMMM/YYYY-MMM-DD"), oct3)).toEqual({
    path: "daily/2026/October/2026-Oct-03.md",
    title: "2026/October/2026-Oct-03",
  });
});

test("a daily note at the workspace root has no leading slash", () => {
  expect(dailyPath(cfg("YYYY-MM-DD", ""), oct3)).toEqual({
    path: "2026-10-03.md",
    title: "2026-10-03",
  });
});

test("the title is trimmed and weekday tokens use the note's day", () => {
  expect(dailyPath(cfg(" YYYY-MM-DD dddd "), oct3)).toEqual({
    path: "daily/2026-10-03 Saturday.md",
    title: "2026-10-03 Saturday",
  });
  const c = cfg(" YYYY-MM-DD dddd ");
  expect(parseDailyDate("daily/2026-10-03 Saturday.md", c)).toEqual(oct3);
});

test("parsing a daily path returns the date it was made from", () => {
  const formats = [
    "YYYY-MM-DD",
    "YYYY/MM/YYYY-MM-DD",
    "YYYY/MMMM/YYYY-MMM-DD",
    "dddd, MMMM Do YYYY",
    "D.M.YY",
  ];
  const days: LocalDate[] = [
    oct3,
    { year: 2026, month: 1, day: 1 },
    { year: 2028, month: 2, day: 29 },
    { year: 2026, month: 12, day: 31 },
  ];
  for (const folder of ["daily", "", "journal/days"])
    for (const format of formats)
      for (const d of days) {
        const c = cfg(format, folder);
        expect([format, parseDailyDate(dailyPath(c, d).path, c)]).toEqual([
          format,
          d,
        ]);
      }
});

test("whitespace the title trims is not required in the path", () => {
  const days: LocalDate[] = [
    oct3,
    { year: 2025, month: 12, day: 25 },
    { year: 2028, month: 2, day: 29 },
  ];
  for (const format of ["  YYYY-MM-DD", "[ ] YYYY-MM-DD", "YYYY-MM-DD  "])
    for (const d of days) {
      const c = cfg(format);
      expect([format, parseDailyDate(dailyPath(c, d).path, c)]).toEqual([
        format,
        d,
      ]);
    }
});

test("parsing ignores letter case like Obsidian's lookup", () => {
  const c = cfg("YYYY/MMMM/YYYY-MMM-DD");
  expect(parseDailyDate("Daily/2026/october/2026-OCT-03.MD", c)).toEqual(oct3);
});

test("paths that are not daily notes parse to nothing", () => {
  expect(parseDailyDate("daily/Saturday.md", cfg("dddd"))).toBeUndefined();
  const c = cfg("YYYY-MM-DD");
  expect(parseDailyDate("notes/idea.md", c)).toBeUndefined();
  expect(parseDailyDate("daily/idea.md", c)).toBeUndefined();
  expect(parseDailyDate("other/2026-10-03.md", c)).toBeUndefined();
  expect(parseDailyDate("daily/2026-10-03.txt", c)).toBeUndefined();
  expect(parseDailyDate("daily/2026-02-30.md", c)).toBeUndefined();
  expect(parseDailyDate("daily/2026-13-01.md", c)).toBeUndefined();
  expect(parseDailyDate("daily/x/2026-10-03.md", c)).toBeUndefined();
});
