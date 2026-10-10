import { formatDate } from "../../time/format";
import { localDateTime } from "../../time/local";
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

/** A cell as display text; file times are local "YYYY-MM-DD HH:mm". */
export function cellText(c: BaseCell): string {
  switch (c.type) {
    case "null":
      return "";
    case "date":
      return typeof c.value === "number"
        ? formatDate(localDateTime(c.value), "YYYY-MM-DD HH:mm")
        : c.value;
    case "list":
      return c.value.map((v) => stringifyGroupKey(v)).join(", ");
    case "link":
      return c.display ?? c.value;
    default:
      return String(c.value);
  }
}
