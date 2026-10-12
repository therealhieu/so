import { dateInstant } from "./dates";
import type { BaseCell, BaseDiagnostic } from "./types";

/** Obsidian's default summary names; a view's `summaries` maps a property to one of them. */
export const DEFAULT_SUMMARIES = [
  "Average",
  "Min",
  "Max",
  "Sum",
  "Range",
  "Median",
  "Stddev",
  "Earliest",
  "Latest",
  "DateRange",
  "Checked",
  "Unchecked",
  "Empty",
  "Filled",
  "Unique",
] as const;

const DAY_MS = 86_400_000;
const EMPTY: BaseCell = { type: "null", value: null };

const num = (value: number): BaseCell =>
  Number.isFinite(value) ? { type: "number", value } : EMPTY;

const numbers = (values: readonly BaseCell[]) =>
  values.flatMap((c) => (c.type === "number" ? [c.value] : []));

/** A date cell's instant for comparison. */
const instant = (c: BaseCell): number | undefined =>
  c.type === "date" || c.type === "string" ? dateInstant(c.value) : undefined;

const dates = (values: readonly BaseCell[]) =>
  values.flatMap((cell) => {
    const at = instant(cell);
    return at === undefined ? [] : [{ cell, at }];
  });

const isEmpty = (c: BaseCell) =>
  c.type === "null" ||
  (c.type === "string" && c.value === "") ||
  (c.type === "list" && c.value.length === 0);

function median(xs: readonly number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 === 1
    ? (s[mid] as number)
    : ((s[mid - 1] as number) + (s[mid] as number)) / 2;
}

function stddev(xs: readonly number[]): number {
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, x) => a + (x - mean) ** 2, 0) / xs.length);
}

function numberSummary(name: string, xs: readonly number[]): BaseCell {
  if (name === "Sum") return num(xs.reduce((a, b) => a + b, 0));
  if (xs.length === 0) return EMPTY;
  switch (name) {
    case "Average":
      return num(xs.reduce((a, b) => a + b, 0) / xs.length);
    case "Min":
      return num(Math.min(...xs));
    case "Max":
      return num(Math.max(...xs));
    case "Range":
      return num(Math.max(...xs) - Math.min(...xs));
    case "Median":
      return num(median(xs));
    default:
      return num(stddev(xs));
  }
}

function dateSummary(name: string, values: readonly BaseCell[]): BaseCell {
  const ds = dates(values);
  if (ds.length === 0) return EMPTY;
  const first = ds.reduce((a, b) => (b.at < a.at ? b : a));
  const last = ds.reduce((a, b) => (b.at > a.at ? b : a));
  if (name === "Earliest") return first.cell;
  if (name === "Latest") return last.cell;
  const days = Math.round((last.at - first.at) / DAY_MS);
  return { type: "string", value: `${days} ${days === 1 ? "day" : "days"}` };
}

/**
 * One default summary over a column's cells, as Obsidian documents it: number
 * summaries read number cells, date summaries read dates, Checked/Unchecked
 * count booleans, and Empty/Filled/Unique read every cell. Any other name is a
 * custom summary formula, which needs expressions this subset does not have.
 */
export function summarize(
  name: string,
  values: readonly BaseCell[],
): BaseCell | { diagnostic: BaseDiagnostic } {
  switch (name) {
    case "Average":
    case "Min":
    case "Max":
    case "Sum":
    case "Range":
    case "Median":
    case "Stddev":
      return numberSummary(name, numbers(values));
    case "Earliest":
    case "Latest":
    case "DateRange":
      return dateSummary(name, values);
    case "Checked":
    case "Unchecked": {
      const want = name === "Checked";
      return num(
        values.filter((c) => c.type === "boolean" && c.value === want).length,
      );
    }
    case "Empty":
      return num(values.filter(isEmpty).length);
    case "Filled":
      return num(values.filter((c) => !isEmpty(c)).length);
    case "Unique":
      return num(new Set(values.map((c) => JSON.stringify(c.value))).size);
    default:
      return {
        diagnostic: {
          severity: "warning",
          code: "summary_unsupported",
          message: `summary "${name}" is not supported`,
        },
      };
  }
}
