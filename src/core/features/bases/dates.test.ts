import { expect, test } from "bun:test";
import { dateInstant, dateText, datetimeProperty } from "./dates";

const local = (y: number, mo: number, d: number, h = 0, mi = 0, s = 0) =>
  new Date(y, mo - 1, d, h, mi, s).getTime();

test("a written value with Z or an offset is that instant", () => {
  const at = Date.UTC(2026, 6, 20, 23, 21, 3, 655);
  expect(dateInstant("2026-07-20T23:21:03.655Z")).toBe(at);
  expect(dateInstant("2026-07-21T06:21:03.655+07:00")).toBe(at);
  expect(dateInstant("2026-07-21T06:21:03.655+0700")).toBe(at);
  expect(dateInstant("2026-07-20T18:21:03.655-05:00")).toBe(at);
});

test("a written value without a zone is local time, with T or a space, seconds optional", () => {
  expect(dateInstant("2026-04-13T08:19:00")).toBe(local(2026, 4, 13, 8, 19));
  expect(dateInstant("2026-04-13 08:20:00")).toBe(local(2026, 4, 13, 8, 20));
  expect(dateInstant("2026-04-13T08:46")).toBe(local(2026, 4, 13, 8, 46));
  expect(dateInstant("2026-04-13")).toBe(local(2026, 4, 13));
});

test("file times are as they are; other values are not dates", () => {
  expect(dateInstant(1234)).toBe(1234);
  expect(dateInstant(Number.NaN)).toBeUndefined();
  expect(dateInstant("soon")).toBeUndefined();
  expect(dateInstant("2026-04-13T8:00")).toBeUndefined();
  expect(dateInstant(null)).toBeUndefined();
});

test("every way of writing a time shows as local YYYY-MM-DD HH:mm:ss; a date alone as YYYY-MM-DD", () => {
  expect(dateText("2026-04-13 08:20:00")).toBe("2026-04-13 08:20:00");
  expect(dateText("2026-04-13T08:46")).toBe("2026-04-13 08:46:00");
  expect(dateText(local(2026, 10, 11, 11, 55, 7))).toBe("2026-10-11 11:55:07");
  const zoned = new Date(Date.UTC(2026, 6, 20, 23, 21, 3));
  const pad = (n: number) => String(n).padStart(2, "0");
  expect(dateText("2026-07-20T23:21:03.655Z")).toBe(
    `${zoned.getFullYear()}-${pad(zoned.getMonth() + 1)}-${pad(zoned.getDate())} ${pad(zoned.getHours())}:${pad(zoned.getMinutes())}:03`,
  );
  expect(dateText("2026-04-13")).toBe("2026-04-13");
  expect(dateText("soon")).toBeUndefined();
});

test("a datetime property is written as local YYYY-MM-DDTHH:mm:ss", () => {
  expect(datetimeProperty(local(2026, 10, 11, 9, 5, 3))).toBe(
    "2026-10-11T09:05:03",
  );
});
