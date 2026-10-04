import { expect, test } from "bun:test";
import { DEFAULT_SUMMARIES, summarize } from "./summaries";
import type { BaseCell } from "./types";

const num = (value: number): BaseCell => ({ type: "number", value });
const date = (value: string | number): BaseCell => ({ type: "date", value });
const bool = (value: boolean): BaseCell => ({ type: "boolean", value });
const str = (value: string): BaseCell => ({ type: "string", value });
const empty: BaseCell = { type: "null", value: null };

const numbers = [num(1), num(2), num(4), num(3), empty, str("x")];
const dates = [
  date("2026-10-05"),
  str("2026-10-01"),
  date("2026-10-11"),
  empty,
];
const checks = [bool(true), bool(false), bool(true), empty];
const mixed = [
  str("a"),
  str("a"),
  str(""),
  empty,
  { type: "list", value: [] } as BaseCell,
  num(1),
];

test("default summaries match Obsidian's documented results", () => {
  const cases: [string, readonly BaseCell[], BaseCell][] = [
    ["Average", numbers, num(2.5)],
    ["Min", numbers, num(1)],
    ["Max", numbers, num(4)],
    ["Sum", numbers, num(10)],
    ["Range", numbers, num(3)],
    ["Median", numbers, num(2.5)],
    ["Median", [num(5), num(1), num(3)], num(3)],
    [
      "Stddev",
      [num(2), num(4), num(4), num(4), num(5), num(5), num(7), num(9)],
      num(2),
    ],
    ["Earliest", dates, str("2026-10-01")],
    ["Latest", dates, date("2026-10-11")],
    ["DateRange", dates, str("10 days")],
    ["DateRange", [date("2026-10-01"), date("2026-10-02")], str("1 day")],
    ["Checked", checks, num(2)],
    ["Unchecked", checks, num(1)],
    ["Empty", mixed, num(3)],
    ["Filled", mixed, num(3)],
    ["Unique", mixed, num(5)],
  ];
  for (const [name, values, expected] of cases)
    expect([name, summarize(name, values)]).toEqual([name, expected]);
  expect(new Set(cases.map(([name]) => name))).toEqual(
    new Set(DEFAULT_SUMMARIES),
  );
});

test("number and date summaries over no matching values are empty", () => {
  for (const name of [
    "Average",
    "Min",
    "Median",
    "Stddev",
    "Earliest",
    "DateRange",
  ])
    expect(summarize(name, [str("x"), empty])).toEqual(empty);
  expect(summarize("Sum", [])).toEqual(num(0));
});

test("dates in epoch milliseconds are compared and spanned by day", () => {
  const day = 86_400_000;
  expect(summarize("Earliest", [date(3 * day), date(day)])).toEqual(date(day));
  expect(summarize("DateRange", [date(day), date(3 * day)])).toEqual(
    str("2 days"),
  );
});

test("custom summary formulas are reported as unsupported", () => {
  const r = summarize("values.filter(value > 2).length", numbers);
  expect(r).toEqual({
    diagnostic: expect.objectContaining({
      severity: "warning",
      code: "summary_unsupported",
    }),
  });
});
