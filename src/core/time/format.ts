import type { LocalDateTime } from "./local";

/**
 * Moment 2.29.4 display tokens, longest first, so the scan is greedy like Moment's.
 * Moment's compound `Hmm`/`hmm`/`Hmmss`/`hmmss` are left out: Moment renders them
 * exactly as their parts, which this scan produces.
 */
export const MOMENT_TOKENS: readonly string[] = [
  "YYYYYY",
  "YYYYY",
  "YYYY",
  "YY",
  "Y",
  "yyyy",
  "yyy",
  "yy",
  "yo",
  "y",
  "ggggg",
  "gggg",
  "gg",
  "GGGGG",
  "GGGG",
  "GG",
  "MMMM",
  "MMM",
  "MM",
  "Mo",
  "M",
  "Qo",
  "Q",
  "DDDD",
  "DDDo",
  "DDD",
  "DD",
  "Do",
  "D",
  "dddd",
  "ddd",
  "dd",
  "do",
  "d",
  "e",
  "E",
  "wo",
  "ww",
  "w",
  "Wo",
  "WW",
  "W",
  "NNNNN",
  "NNNN",
  "NNN",
  "NN",
  "N",
  "HH",
  "H",
  "hh",
  "h",
  "kk",
  "k",
  "mm",
  "m",
  "ss",
  "s",
  "SSSSSSSSS",
  "SSSSSSSS",
  "SSSSSSS",
  "SSSSSS",
  "SSSSS",
  "SSSS",
  "SSS",
  "SS",
  "S",
  "A",
  "a",
  "zz",
  "z",
  "ZZ",
  "Z",
  "X",
  "x",
  "LTS",
  "LT",
  "LLLL",
  "LLL",
  "LL",
  "L",
  "llll",
  "lll",
  "ll",
  "l",
].sort((x, y) => y.length - x.length);

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const pad = (n: number, width = 2) => String(n).padStart(width, "0");
const hour12 = (t: LocalDateTime) => t.hour % 12 || 12;

/** Moment's `en` ordinal suffix. */
function ordinal(n: number): string {
  const last = n % 10;
  if (Math.trunc((n % 100) / 10) === 1) return `${n}th`;
  if (last === 1) return `${n}st`;
  if (last === 2) return `${n}nd`;
  if (last === 3) return `${n}rd`;
  return `${n}th`;
}

/** The supported tokens and their Moment `en` output. */
const SUPPORTED: Readonly<Record<string, (t: LocalDateTime) => string>> = {
  YYYY: (t) => pad(t.year, 4),
  YY: (t) => pad(t.year % 100),
  M: (t) => String(t.month),
  MM: (t) => pad(t.month),
  MMM: (t) => (MONTHS[t.month - 1] ?? "").slice(0, 3),
  MMMM: (t) => MONTHS[t.month - 1] ?? "",
  D: (t) => String(t.day),
  DD: (t) => pad(t.day),
  Do: (t) => ordinal(t.day),
  d: (t) => String(t.weekday),
  ddd: (t) => (WEEKDAYS[t.weekday] ?? "").slice(0, 3),
  dddd: (t) => WEEKDAYS[t.weekday] ?? "",
  H: (t) => String(t.hour),
  HH: (t) => pad(t.hour),
  h: (t) => String(hour12(t)),
  hh: (t) => pad(hour12(t)),
  m: (t) => String(t.minute),
  mm: (t) => pad(t.minute),
  s: (t) => String(t.second),
  ss: (t) => pad(t.second),
  A: (t) => (t.hour > 11 ? "PM" : "AM"),
  a: (t) => (t.hour > 11 ? "pm" : "am"),
};

/** The longest Moment token at `i`, else the single character there. */
function tokenAt(format: string, i: number): string {
  for (const token of MOMENT_TOKENS)
    if (format.startsWith(token, i)) return token;
  return format.slice(i, i + 1);
}

/** A bracket group at `i` (Moment's `\[[^\[]*\]`), as its length, else 0. */
function bracketAt(format: string, i: number): number {
  if (format[i] !== "[") return 0;
  const next = format.indexOf("[", i + 1);
  const close = format.lastIndexOf("]", next < 0 ? format.length : next - 1);
  return close > i ? close - i + 1 : 0;
}

/**
 * Formats like Moment 2.29.4 with the `en` locale for the supported tokens.
 * `[...]` is literal text; a backslash makes the next token literal; any other
 * Moment token is emitted unchanged; other characters pass through.
 */
export function formatDate(at: LocalDateTime, format: string): string {
  let out = "";
  let i = 0;
  while (i < format.length) {
    const bracket = bracketAt(format, i);
    if (bracket > 0) {
      out += format.slice(i + 1, i + bracket - 1);
      i += bracket;
      continue;
    }
    if (format[i] === "\\") {
      const token = tokenAt(format, i + 1);
      out += token;
      i += 1 + token.length;
      continue;
    }
    const token = tokenAt(format, i);
    out += SUPPORTED[token]?.(at) ?? token;
    i += token.length;
  }
  return out;
}
