import type { FrontmatterValue } from "../../lang/markdown/frontmatter-patch";
import { formatDate } from "../../time/format";
import { localDateTime } from "../../time/local";
import { stringifyGroupKey } from "./evaluator";
import {
  type PropertyType,
  type PropertyTypes,
  propertyType,
} from "./property-types";
import { summarize } from "./summaries";
import type { BaseCell, BaseDiagnostic, BaseEvaluation, BaseUi } from "./types";

export type TableColumn = {
  id: string;
  label: string;
  /** Only note properties can be edited; file fields and formulas are derived. */
  editable: boolean;
  /** The editor type of the column's first value. */
  type: PropertyType;
  /** The direction the rows are sorted by this column, if they are. */
  sort?: "ASC" | "DESC";
  /** Cells the column takes: the window's width, else the view's `columnSize`, else its content's. */
  width: number;
};

export type TableCell = { text: string; value: BaseCell };
export type TableRow = { path: string; cells: TableCell[] };
/** A run of `count` rows from `start`; `key` is the group's value, `null` for None. */
export type TableGroup = {
  key: FrontmatterValue;
  label: string;
  start: number;
  count: number;
};
/** A column's summary; `value` is absent when the summary is not supported. */
export type TableSummary = { name: string; text: string; value?: BaseCell };

export type TableModel = {
  columns: TableColumn[];
  /** Grouped rows come group by group; a row in several groups appears in each. */
  rows: TableRow[];
  groups: TableGroup[];
  summaries: (TableSummary | undefined)[];
  /** Distinct rows the table shows; summaries cover the same rows. */
  total: number;
  diagnostics: BaseDiagnostic[];
};

/** A group of the evaluation's rows, in display order. */
export type OrderedGroup = {
  key: FrontmatterValue;
  label: string;
  rowIndexes: readonly number[];
};

/** The widest column sized by its content. */
const MAX_COL = 24;
/** The narrowest a column can be resized to. */
const MIN_COL = 3;
/** The widest a column can be resized to. */
const MAX_RESIZED_COL = 200;
/** Obsidian's `columnSize` is in pixels; one terminal cell stands for this many. */
const PX_PER_CELL = 8;

const len = (t: string) => [...t].length;

/** A width clamped to the resizable range. */
export const resizedWidth = (w: number) =>
  Math.max(MIN_COL, Math.min(Math.round(w), MAX_RESIZED_COL));

/** A cell as shown: checkboxes as boxes, empty values as a dim dash. */
export function shown(c: TableCell | undefined): {
  text: string;
  empty: boolean;
} {
  if (c === undefined || c.value.type === "null" || c.text === "")
    return { text: "—", empty: true };
  if (c.value.type === "boolean")
    return { text: c.value.value ? "☑" : "☐", empty: false };
  return { text: c.text, empty: false };
}

/** A column's header: its label and, when the rows are sorted by it, the arrow. */
export const headerOf = (c: Pick<TableColumn, "label" | "sort">) =>
  c.sort === undefined ? c.label : `${c.label} ${c.sort === "ASC" ? "↑" : "↓"}`;

/** The property without its `note.` prefix, as columns and summaries name it. */
const bare = (property: string) => property.replace(/^note\./, "");

const labelOf = (key: FrontmatterValue) =>
  key === null ? "None" : stringifyGroupKey(key);

/**
 * The view's groups in display order: exactly the `groupOrder` values when the
 * view has them (`null` is None, unlisted values are hidden, listed values
 * without rows stay empty); otherwise the evaluation's groups, which follow
 * the group direction, with None moved last. Shared by tables and boards.
 */
export function orderedGroups(
  e: BaseEvaluation,
  withNone: boolean,
): OrderedGroup[] {
  const groups = e.groups ?? [];
  const order = e.selectedView.groupOrder;
  if (order !== undefined) {
    const byKey = new Map(groups.map((g) => [g.key, g]));
    return order.map((key) => ({
      key,
      label: labelOf(key),
      rowIndexes: byKey.get(stringifyGroupKey(key))?.rowIndexes ?? [],
    }));
  }
  const none = groups.find((g) => g.key === "");
  const valued = groups
    .filter((g) => g.key !== "")
    .map((g) => ({
      key: g.value,
      label: labelOf(g.value),
      rowIndexes: g.rowIndexes,
    }));
  return none !== undefined || withNone
    ? [
        ...valued,
        { key: null, label: "None", rowIndexes: none?.rowIndexes ?? [] },
      ]
    : valued;
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

/**
 * The render-ready table for one evaluated view. The window's sort, grouping,
 * and filter overrides are already applied by `evaluateBase`; its column
 * widths come from `ui`.
 */
export function tableModel(
  e: BaseEvaluation,
  ui: BaseUi,
  types: PropertyTypes,
): TableModel {
  const sort = e.selectedView.sort?.[0];
  const headers = e.columns.map((c): Omit<TableColumn, "width"> => {
    const first = e.rows.find((r) => r.cells[c.id]?.type !== "null")?.cells[
      c.id
    ];
    const timed = first?.type === "date" && typeof first.value === "number";
    return {
      id: c.id,
      label: c.displayName,
      editable: c.editable,
      type: timed
        ? "datetime"
        : propertyType(bare(c.property), first?.value ?? null, types),
      ...(sort !== undefined && bare(sort.property) === bare(c.property)
        ? { sort: sort.direction }
        : {}),
    };
  });
  const toRow = (i: number): TableRow => {
    const r = e.rows[i];
    return {
      path: r?.file.path ?? "",
      cells: e.columns.map((c) => {
        const value: BaseCell = r?.cells[c.id] ?? { type: "null", value: null };
        return { text: cellText(value), value };
      }),
    };
  };

  const rows: TableRow[] = [];
  const groups: TableGroup[] = [];
  /** The evaluation rows the table shows, each once; hidden groups' rows are left out. */
  const listed = new Set<number>();
  if (e.groups === undefined) {
    for (let i = 0; i < e.rows.length; i++) {
      rows.push(toRow(i));
      listed.add(i);
    }
  } else {
    for (const g of orderedGroups(e, false)) {
      groups.push({
        key: g.key,
        label: g.label,
        start: rows.length,
        count: g.rowIndexes.length,
      });
      for (const i of g.rowIndexes) {
        rows.push(toRow(i));
        listed.add(i);
      }
    }
  }

  const diagnostics: BaseDiagnostic[] = [];
  const named = e.selectedView.summaries ?? {};
  const summaries = e.columns.map((c): TableSummary | undefined => {
    const name =
      named[c.property] ??
      named[bare(c.property)] ??
      named[`note.${bare(c.property)}`];
    if (name === undefined) return undefined;
    const r = summarize(
      name,
      [...listed].map(
        (i) => e.rows[i]?.cells[c.id] ?? { type: "null", value: null },
      ),
    );
    if ("diagnostic" in r) {
      diagnostics.push(r.diagnostic);
      return { name, text: "" };
    }
    return { name, text: cellText(r), value: r };
  });

  const columns = headers.map((c, i): TableColumn => {
    const set = ui.widths?.[c.id];
    const px = e.columns[i]?.width;
    if (set !== undefined) return { ...c, width: resizedWidth(set) };
    if (px !== undefined)
      return { ...c, width: resizedWidth(px / PX_PER_CELL) };
    let w = len(headerOf(c));
    for (const r of rows) w = Math.max(w, len(shown(r.cells[i]).text));
    return { ...c, width: Math.max(1, Math.min(w, MAX_COL)) };
  });

  return {
    columns,
    rows,
    groups,
    summaries,
    total: listed.size,
    diagnostics,
  };
}
