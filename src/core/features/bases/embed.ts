import { embedLink, wholeBlock } from "../../lang/markdown/block-text";
import type { BlockRenderer } from "../../lang/markdown/live-preview";
import { embedAsLink } from "../../lang/markdown/renderers/embed";
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
 * header and separator, leaves its summaries out, and counts the rows past
 * the cap; a board keeps its lane headers and `max` one-line cards per
 * lane, plus a row for `↓ N more` when a lane has more.
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
      table: {
        ...shown.table,
        summaries: shown.table.summaries.map(() => undefined),
      },
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

/** What the base embed painter draws under the embed's title. */
export type BaseEmbedData =
  | { title: string; state: "loading" }
  | { title: string; state: "missing"; notice: string }
  | { title: string; state: "ok"; model: BaseEmbedModel };

/**
 * `![[x.base]]` and `![[x.base#View]]` as a read-only `base` widget: the
 * model's rows under a title row and `↓ N more` when capped, three rows at
 * most while the base loads, and the title with a notice when it is
 * missing or cannot be shown. Inside an embedded note it stays a link.
 */
export const baseEmbedRenderer: BlockRenderer = (block, v, { doc, ctx }) => {
  const nestedLink = embedAsLink(block, v, doc, ctx);
  if (nestedLink !== undefined) return nestedLink;
  const { target, section } = embedLink(doc, block, v.buf);
  const title = `${target}${section ?? ""}`;
  const path = ctx.resolve(target);
  const got = path === undefined ? "missing" : ctx.embedModel(path, section);
  let data: BaseEmbedData;
  let rows: number;
  if (got === "loading") {
    data = { title, state: "loading" };
    rows = Math.min(ctx.embedMaxRows, 3);
  } else if (isBaseEmbedModel(got)) {
    data = { title, state: "ok", model: got };
    rows = 1 + got.bodyRows + (got.more > 0 ? 1 : 0);
  } else {
    const notice =
      got === "missing" ? "base not found" : "cannot show this file as a base";
    data = { title, state: "missing", notice };
    rows = 2;
  }
  return [
    {
      kind: "replace",
      range: wholeBlock(v.buf, block),
      block: true,
      widget: { type: "base", data, rows },
    },
  ];
};
