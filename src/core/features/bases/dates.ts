import { formatDate } from "../../time/format";
import { localDateTime } from "../../time/local";

/**
 * A written date or datetime: `T` or a space before the time, optional
 * seconds and fraction, and an optional `Z` or `±HH:mm` offset.
 */
const WRITTEN =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3})\d*)?)?\s*(Z|[+-]\d{2}:?\d{2})?)?$/;

type Parsed = { at: number; timed: boolean };

function parse(value: unknown): Parsed | undefined {
  if (typeof value === "number")
    return Number.isFinite(value) ? { at: value, timed: true } : undefined;
  if (typeof value !== "string") return undefined;
  const m = WRITTEN.exec(value.trim());
  if (m === null) return undefined;
  const [y, mo, d, h, mi, s] = m.slice(1, 7).map((x) => Number(x ?? 0)) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  const ms = Number((m[7] ?? "").padEnd(3, "0"));
  const zone = m[8];
  if (zone === undefined)
    return {
      at: new Date(y, mo - 1, d, h, mi, s, ms).getTime(),
      timed: m[4] !== undefined,
    };
  const offset =
    zone === "Z"
      ? 0
      : (zone[0] === "-" ? -1 : 1) *
        (Number(zone.slice(1, 3)) * 60 + Number(zone.slice(-2)));
  return {
    at: Date.UTC(y, mo - 1, d, h, mi, s, ms) - offset * 60_000,
    timed: true,
  };
}

/**
 * A date value's instant in epoch milliseconds: file times as they are, a
 * written value with `Z` or an offset at that instant, one without in local
 * time. `undefined` for anything else.
 */
export const dateInstant = (value: unknown): number | undefined =>
  parse(value)?.at;

/**
 * A date value as local `YYYY-MM-DD HH:mm:ss`, or `YYYY-MM-DD` when it has no
 * time; `undefined` when it is not a date.
 */
export function dateText(value: unknown): string | undefined {
  const p = parse(value);
  if (p === undefined) return undefined;
  return formatDate(
    localDateTime(p.at),
    p.timed ? "YYYY-MM-DD HH:mm:ss" : "YYYY-MM-DD",
  );
}

/** `ms` as Obsidian writes a datetime property: local `YYYY-MM-DDTHH:mm:ss`. */
export const datetimeProperty = (ms: number): string =>
  formatDate(localDateTime(ms), "YYYY-MM-DD[T]HH:mm:ss");
