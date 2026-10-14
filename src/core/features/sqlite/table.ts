import { resizedWidth, type TableModel } from "../bases/table";
import type { SqliteCell } from "./types";
import { gridText, tableCell } from "./value";

/** The widest a column sized by its content gets. */
const MAX_COL = 24;
const MIN_COL = 3;

const len = (t: string) => [...t].length;

/**
 * Rows read from a database as the shared table painter's model. A column is
 * as wide as its resized width, else its widest header or cell up to
 * `MAX_COL`; nothing is editable, grouped, or summarized.
 */
export function sqliteTableModel(
  columns: readonly string[],
  rows: readonly SqliteCell[][],
  widths: Readonly<Record<string, number>> = {},
): TableModel {
  return {
    columns: columns.map((name, i) => {
      const resized = widths[name];
      let w = len(name);
      if (resized === undefined)
        for (const r of rows) {
          const c = r[i];
          if (c !== undefined) w = Math.max(w, len(gridText(c)));
          if (w >= MAX_COL) break;
        }
      return {
        id: String(i),
        label: name,
        editable: false,
        type: "text",
        width:
          resized === undefined
            ? Math.max(MIN_COL, Math.min(w, MAX_COL))
            : resizedWidth(resized),
      };
    }),
    rows: rows.map((r) => ({ path: "", cells: r.map(tableCell) })),
    groups: [],
    summaries: [],
    total: rows.length,
    diagnostics: [],
  };
}
