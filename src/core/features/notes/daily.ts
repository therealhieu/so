import { formatDate, formatParts } from "../../time/format";
import {
  daysInMonth,
  type LocalDate,
  type LocalDateTime,
  mondayIndex,
} from "../../time/local";

export type DailyConfig = { folder: string; format: string; template: string };

const midnight = (d: LocalDate): LocalDateTime => ({
  ...d,
  hour: 0,
  minute: 0,
  second: 0,
  weekday: (mondayIndex(d) + 1) % 7,
});

const inFolder = (folder: string, name: string) =>
  folder === "" ? name : `${folder}/${name}`;

/** `title` is the trimmed formatted string, including any "/" segments, as Obsidian's {{title}}. */
export function dailyPath(
  cfg: DailyConfig,
  d: LocalDate,
): { path: string; title: string } {
  const title = formatDate(midnight(d), cfg.format).trim();
  return { path: inFolder(cfg.folder, `${title}.md`), title };
}

type Field = "year" | "shortYear" | "month" | "monthName" | "day";

const monthNames = (token: "MMM" | "MMMM") =>
  Array.from({ length: 12 }, (_, i) =>
    formatDate(midnight({ year: 2000, month: i + 1, day: 1 }), token),
  );

/** The pattern and captured field of each date token. */
const DATE_TOKENS: Readonly<Record<string, { pattern: string; field: Field }>> =
  {
    YYYY: { pattern: "(\\d{4})", field: "year" },
    YY: { pattern: "(\\d{2})", field: "shortYear" },
    M: { pattern: "(\\d{1,2})", field: "month" },
    MM: { pattern: "(\\d{2})", field: "month" },
    MMM: { pattern: `(${monthNames("MMM").join("|")})`, field: "monthName" },
    MMMM: { pattern: `(${monthNames("MMMM").join("|")})`, field: "monthName" },
    D: { pattern: "(\\d{1,2})", field: "day" },
    DD: { pattern: "(\\d{2})", field: "day" },
    Do: { pattern: "(\\d{1,2})(?:st|nd|rd|th)", field: "day" },
  };

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Moment's two-digit year rule: 69–99 are 1900s, 00–68 are 2000s. */
const fullYear = (yy: number) => (yy > 68 ? 1900 : 2000) + yy;

/**
 * The date a daily-note path was made from, or `undefined` when `path` is not
 * a daily note of `cfg`. Only paths that `dailyPath` reproduces (ignoring case)
 * parse, so an ambiguous format never yields a wrong day.
 */
export function parseDailyDate(
  path: string,
  cfg: DailyConfig,
): LocalDate | undefined {
  const fields: Field[] = [];
  const parts = formatParts(cfg.format);
  let pattern = "";
  parts.forEach((part, i) => {
    if ("literal" in part) {
      // The title is trimmed, so outer spaces of the format are not in the path.
      let text = part.literal;
      if (i === 0) text = text.trimStart();
      if (i === parts.length - 1) text = text.trimEnd();
      pattern += escapeRegExp(text);
      return;
    }
    const date = DATE_TOKENS[part.token];
    if (date === undefined) {
      pattern += "\\S+?";
      return;
    }
    pattern += date.pattern;
    fields.push(date.field);
  });
  const prefix = escapeRegExp(inFolder(cfg.folder, ""));
  const match = new RegExp(`^${prefix}${pattern}\\.md$`, "i").exec(path);
  if (match === null) return undefined;

  const found: Partial<Record<Field, string>> = {};
  fields.forEach((f, i) => {
    const value = match[i + 1];
    if (value !== undefined) found[f] ??= value;
  });
  const year =
    found.year !== undefined
      ? Number(found.year)
      : found.shortYear !== undefined
        ? fullYear(Number(found.shortYear))
        : undefined;
  const month =
    found.month !== undefined
      ? Number(found.month)
      : found.monthName !== undefined
        ? monthIndex(found.monthName)
        : undefined;
  const day = found.day !== undefined ? Number(found.day) : undefined;
  if (year === undefined || month === undefined || day === undefined)
    return undefined;
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month))
    return undefined;

  const d = { year, month, day };
  return dailyPath(cfg, d).path.toLowerCase() === path.toLowerCase()
    ? d
    : undefined;
}

function monthIndex(name: string): number | undefined {
  const lower = name.toLowerCase();
  for (const token of ["MMMM", "MMM"] as const) {
    const i = monthNames(token).findIndex((n) => n.toLowerCase() === lower);
    if (i >= 0) return i + 1;
  }
  return undefined;
}
