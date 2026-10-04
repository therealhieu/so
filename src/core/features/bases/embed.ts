import type { KanbanModel } from "./kanban";
import type { TableModel } from "./table";

/**
 * One view of a base as a note embeds it: a table or a board capped at a
 * number of body lines, or a notice when there is nothing to show.
 */
export type BaseEmbedModel = {
  kind: "baseEmbed";
  /** The view shown. */
  view: string;
  table?: TableModel;
  board?: KanbanModel;
  /** Why the view shows as it does, or why nothing shows. */
  notice?: string;
  /** Rows of the table or board, headers included; one for a notice alone. */
  bodyRows: number;
  /** Table rows past the cap. */
  more: number;
};

export const isBaseEmbedModel = (x: unknown): x is BaseEmbedModel =>
  typeof x === "object" &&
  x !== null &&
  (x as { kind?: unknown }).kind === "baseEmbed";

/** Table lines in display order, group headers included, as the table painter lays them out. */
function tableLines(t: TableModel): ("group" | "row")[] {
  if (t.groups.length === 0) return t.rows.map(() => "row");
  return t.groups.flatMap((g) => [
    "group" as const,
    ...Array.from({ length: g.count }, () => "row" as const),
  ]);
}

/**
 * `view` shown as `shown` with at most `max` body lines: a table keeps its
 * header and separator and counts the rows past the cap; a board keeps its
 * lane headers and `max` one-line cards per lane, plus a row for `↓ N more`
 * when a lane has more.
 */
export function baseEmbedOf(
  view: string,
  shown: { table?: TableModel; board?: KanbanModel; notice?: string },
  max: number,
): BaseEmbedModel {
  const cap = Math.max(1, max);
  const common = {
    kind: "baseEmbed" as const,
    view,
    ...(shown.notice === undefined ? {} : { notice: shown.notice }),
  };
  if (shown.table !== undefined) {
    const lines = tableLines(shown.table);
    const hidden = lines.slice(cap).filter((l) => l === "row").length;
    return {
      ...common,
      table: shown.table,
      bodyRows: 2 + Math.max(1, Math.min(lines.length, cap)),
      more: hidden,
    };
  }
  if (shown.board !== undefined) {
    const most = Math.max(1, ...shown.board.lanes.map((l) => l.cards.length));
    return {
      ...common,
      board: shown.board,
      bodyRows: 1 + Math.min(most, cap) + (most > cap ? 1 : 0),
      more: 0,
    };
  }
  return { ...common, bodyRows: 1, more: 0 };
}
