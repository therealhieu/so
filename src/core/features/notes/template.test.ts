import { expect, test } from "bun:test";
import type { LocalDateTime } from "../../time/local";
import { BUILTIN_DAILY_TEMPLATE, expandTemplate } from "./template";

const oct3: LocalDateTime = {
  year: 2026,
  month: 10,
  day: 3,
  hour: 9,
  minute: 5,
  second: 0,
  weekday: 6,
};

test("expansion matches Obsidian including replacement patterns and one instant", () => {
  expect(
    expandTemplate(
      "{{Title}} {{ title }} {{DATE:YYYY}} {{date: YYYY}} {{date:}} {{time}} {{weather}} {{date:x}}{{date:x}}",
      { title: "Meeting $&", at: oct3 },
    ),
  ).toBe("Meeting $& {{ title }} 2026  2026 2026-10-03 09:05 {{weather}} xx");
});

test("dates and times take a format, and an empty one uses the default", () => {
  const vars = { title: "t", at: oct3 };
  expect(expandTemplate("{{time:YYYY-MM-DD}} {{TIME:}} {{Time}}", vars)).toBe(
    "2026-10-03 09:05 09:05",
  );
  expect(
    expandTemplate("# {{date:dddd, MMMM D}} {{Title}} {{ title }}", {
      title: "Meeting",
      at: oct3,
    }),
  ).toBe("# Saturday, October 3 Meeting {{ title }}");
});

test("every occurrence of the title is replaced and other braces stay", () => {
  expect(
    expandTemplate("{{title}}/{{TITLE}} {{}} {{date }} {title}", {
      title: "2026/10/2026-10-03",
      at: oct3,
    }),
  ).toBe("2026/10/2026-10-03/2026/10/2026-10-03 {{}} {{date }} {title}");
});

test("the built-in daily template is a dated heading", () => {
  expect(BUILTIN_DAILY_TEMPLATE).toBe("# {{date}}");
  expect(expandTemplate(BUILTIN_DAILY_TEMPLATE, { title: "x", at: oct3 })).toBe(
    "# 2026-10-03",
  );
});
