import { dateText } from "./dates";
import type { BaseCell } from "./types";

/** A value as its group key: the text it groups under, "" for no value. */
export function stringifyGroupKey(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number")
    return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return String(value);
  return JSON.stringify(value) ?? String(value);
}

/** A cell as display text; dates and times are local "YYYY-MM-DD HH:mm:ss". */
export function cellText(c: BaseCell): string {
  switch (c.type) {
    case "null":
      return "";
    case "date":
      return dateText(c.value) ?? String(c.value);
    case "list":
      return c.value.map((v) => stringifyGroupKey(v)).join(", ");
    case "link":
      return c.display ?? c.value;
    default:
      return String(c.value);
  }
}
