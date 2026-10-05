import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import { splitKeys } from "../kernel/vim/keys";
import { calendarMarks } from "./calendar";
import type { Action, AppState, CalendarState, Effect, Result } from "./types";
import { createUpdate } from "./update";

const update = createUpdate(testRegistries());
/** Saturday 2026-10-03 09:05 in the local time zone. */
const NOW = new Date(2026, 9, 3, 9, 5).getTime();

function run(s: AppState, seq: string): Result {
  const effects: Effect[] = [];
  for (const key of splitKeys(seq)) {
    const r = update(s, { type: "key", key, now: NOW });
    s = r.state;
    effects.push(...r.effects);
  }
  return { state: s, effects };
}

const withIndex = (files: string[]): AppState =>
  update(opened(), {
    type: "indexBatch",
    summaries: [],
    files,
    done: 0,
    total: 0,
  } satisfies Action).state;

function opened(): AppState {
  return update(fresh(), {
    type: "fileLoaded",
    path: "index.md",
    file: textFile("# Index\n"),
  }).state;
}

const calendar = (s: AppState): CalendarState | undefined =>
  s.overlay.kind === "calendar" ? s.overlay.calendar : undefined;
const day = (s: AppState) => calendar(s)?.selected;

test("<leader>np opens the calendar on today with its announcement", () => {
  const s = run(opened(), " np").state;
  expect(calendar(s)).toEqual({
    month: { year: 2026, month: 10 },
    today: { year: 2026, month: 10, day: 3 },
    selected: { year: 2026, month: 10, day: 3 },
  });
  expect(s.notifications.message?.text).toBe("Sat 2026-10-03 · no note");
});

test("calendar keys move the selection and Enter opens or creates that day", () => {
  const open = run(opened(), " np").state;
  expect(day(run(open, "l").state)).toEqual({ year: 2026, month: 10, day: 4 });
  expect(day(run(open, "j").state)).toEqual({ year: 2026, month: 10, day: 10 });
  expect(day(run(open, "lj").state)).toEqual({
    year: 2026,
    month: 10,
    day: 11,
  });
  expect(day(run(open, "kh").state)).toEqual({
    year: 2026,
    month: 9,
    day: 25,
  });
  expect(calendar(run(open, "kh").state)?.month).toEqual({
    year: 2026,
    month: 9,
  });
  const next = run(open, "L").state;
  expect(day(next)).toEqual({ year: 2026, month: 11, day: 3 });
  expect(calendar(next)?.month).toEqual({ year: 2026, month: 11 });
  expect(day(run(next, "t").state)).toEqual({ year: 2026, month: 10, day: 3 });
  expect(run(open, "<Esc>").state.overlay.kind).toBe("none");
  expect(run(open, "x").state.overlay.kind).toBe("calendar");

  const entered = run(open, "l<CR>");
  expect(entered.state.overlay.kind).toBe("none");
  expect(entered.effects).toContainEqual(
    expect.objectContaining({
      kind: "createNote",
      path: "daily/2026-10-04.md",
    }),
  );
});

test("paging months keeps the day number, clamped to the month's length", () => {
  const s = run(opened(), " np").state;
  const march31: AppState = {
    ...s,
    overlay: {
      kind: "calendar",
      calendar: {
        month: { year: 2026, month: 3 },
        today: { year: 2026, month: 10, day: 3 },
        selected: { year: 2026, month: 3, day: 31 },
      },
    },
  };
  const feb = run(march31, "H").state;
  expect(day(feb)).toEqual({ year: 2026, month: 2, day: 28 });
  expect(calendar(feb)?.month).toEqual({ year: 2026, month: 2 });
});

test("days with an indexed daily note are marked and announced", () => {
  const s = run(
    withIndex(["daily/2026-10-01.md", "Daily/2026-10-02.md", "notes/x.md"]),
    " np",
  ).state;
  expect(calendarMarks(s)).toEqual(new Set([1, 2]));
  const moved = run(s, "h").state;
  expect(moved.notifications.message?.text).toBe(
    "Fri 2026-10-02 · note exists",
  );
});

test("an indexed note is opened from the calendar, not created", () => {
  const s = run(withIndex(["daily/2026-10-01.md"]), " np").state;
  const r = run(s, "hh<CR>");
  expect(r.effects.some((e) => e.kind === "createNote")).toBe(false);
  expect(r.effects).toContainEqual({
    kind: "read",
    path: "daily/2026-10-01.md",
  });
});
