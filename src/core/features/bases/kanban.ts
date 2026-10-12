import type { FrontmatterValue } from "../../lang/markdown/frontmatter-patch";
import { orderedGroups } from "./table";
import type { BaseEvaluation, BaseUi } from "./types";
import { cellText } from "./values";

export type KanbanCard = { path: string; title: string; fields: string[] };
/** One lane: `key` is the group property's typed value, `null` for None. */
export type KanbanLane = {
  key: FrontmatterValue;
  label: string;
  cards: KanbanCard[];
};
export type KanbanModel = {
  property: string;
  lanes: KanbanLane[];
  /** Whether a move can write the group property: only note properties can. */
  movable: boolean;
  why?: "formula" | "file";
};

const fixedBy = (property: string): "formula" | "file" | undefined =>
  property.startsWith("formula.")
    ? "formula"
    : property.startsWith("file.")
      ? "file"
      : undefined;

/**
 * The board for one evaluated view, grouped by its `groupBy` property. Lanes
 * follow `groupOrder` exactly when the view has one, else each distinct value
 * in the group direction with a None lane last. Lane keys keep their YAML type,
 * so a move into a numeric lane writes a number. The window's overrides are
 * already applied by `evaluateBase`; `_ui` keeps the layout contract.
 */
export function kanbanModel(e: BaseEvaluation, _ui: BaseUi): KanbanModel {
  const property = e.selectedView.groupBy?.property ?? "";
  const shown = e.columns.filter(
    (c) => c.property !== "file.name" && c.property !== property,
  );
  const cardAt = (i: number): KanbanCard | undefined => {
    const r = e.rows[i];
    if (r === undefined) return undefined;
    const dot = r.file.name.lastIndexOf(".");
    return {
      path: r.file.path,
      title: dot > 0 ? r.file.name.slice(0, dot) : r.file.name,
      fields: shown.flatMap((c) => {
        const cell = r.cells[c.id];
        const text = cell === undefined ? "" : cellText(cell);
        return text === "" ? [] : [text];
      }),
    };
  };
  const lanes =
    e.groups === undefined
      ? [{ key: null, label: "None", rowIndexes: e.rows.map((_, i) => i) }]
      : orderedGroups(e, true);
  const why = property === "" ? undefined : fixedBy(property);
  return {
    property,
    lanes: lanes.map((l) => ({
      key: l.key,
      label: l.label,
      cards: l.rowIndexes.flatMap((i) => cardAt(i) ?? []),
    })),
    movable: property !== "" && why === undefined,
    ...(why === undefined ? {} : { why }),
  };
}
