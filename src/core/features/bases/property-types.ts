import { daysInMonth } from "../../time/local";

/** Obsidian's property types; `list` is its "multitext". */
export type PropertyType =
  | "text"
  | "number"
  | "date"
  | "datetime"
  | "checkbox"
  | "list"
  | "tags"
  | "aliases";

/** `.obsidian/types.json` assignments, keyed by lower-cased property name. */
export type PropertyTypes = Readonly<Record<string, PropertyType>>;

const DATE = /^\d{4}-[01]\d-[0-3]\d$/;
const DATETIME = /^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d$/;
const DATETIME_WRITTEN = /^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d(?::[0-5]\d)?$/;

/** Type names as `types.json` writes them. */
const STORED: Readonly<Record<string, PropertyType>> = {
  text: "text",
  number: "number",
  date: "date",
  datetime: "datetime",
  checkbox: "checkbox",
  multitext: "list",
  list: "list",
  tags: "tags",
  aliases: "aliases",
};

/** Whether `YYYY-MM-DD` at the start of `value` is a real calendar day. */
function realDay(value: string): boolean {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return (
    m !== undefined &&
    d !== undefined &&
    m >= 1 &&
    m <= 12 &&
    d >= 1 &&
    d <= daysInMonth(y as number, m)
  );
}

/** Whether `value` is valid for `type`; an absent value fits every type. */
export function validates(type: PropertyType, value: unknown): boolean {
  if (value === null || value === undefined) return true;
  switch (type) {
    case "text":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "checkbox":
      return typeof value === "boolean";
    case "date":
      return typeof value === "string" && DATE.test(value) && realDay(value);
    case "datetime":
      return (
        typeof value === "string" &&
        DATETIME_WRITTEN.test(value) &&
        realDay(value)
      );
    default:
      return Array.isArray(value) && value.every((v) => typeof v === "string");
  }
}

/**
 * Obsidian's rule: the `types.json` assignment when the value validates
 * against it, else `tags`/`aliases` by name, else inferred from the value.
 */
export function propertyType(
  name: string,
  value: unknown,
  types: PropertyTypes,
): PropertyType {
  const key = name.toLowerCase();
  const assigned = types[key];
  if (assigned !== undefined && validates(assigned, value)) return assigned;
  if (key === "tags") return "tags";
  if (key === "aliases") return "aliases";
  if (typeof value === "string")
    return DATE.test(value)
      ? "date"
      : DATETIME.test(value)
        ? "datetime"
        : "text";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "checkbox";
  return Array.isArray(value) ? "list" : "text";
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** The assignments in a parsed `types.json` (`{ "types": { name: type } }`); any other shape gives none. */
export function parsePropertyTypes(json: unknown): PropertyTypes {
  if (!isRecord(json) || !isRecord(json.types)) return {};
  const out: Record<string, PropertyType> = {};
  for (const [name, stored] of Object.entries(json.types)) {
    const type = typeof stored === "string" ? STORED[stored] : undefined;
    if (type !== undefined) out[name.toLowerCase()] = type;
  }
  return out;
}
