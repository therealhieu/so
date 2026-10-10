import type { EditorKindSpec, FileType } from "../../filetypes/registry";
import type { FrontmatterValue } from "../../lang/markdown/frontmatter-patch";
import { parseBase } from "./parser";
import type { PropertyType } from "./property-types";
import type { BaseSort } from "./types";

/** A cell being edited: the text typed so far and the value the note held when editing began. */
export type CellEdit = {
  path: string;
  property: string;
  type: PropertyType;
  value: string;
  /** Insertion point in `value`, in code units. */
  caret: number;
  /** The note's value when editing began; a write expects it still there. */
  original: FrontmatterValue | undefined;
  /** A list cell's values as chips; `value` is the chip being typed. */
  items?: string[];
  /** Why `value` cannot be written; Enter does nothing while it is set. */
  error?: string;
};

/**
 * What one base window remembers beyond the file: the selected view, the
 * window's own sort, grouping, and filter overrides (never written to the
 * file), the focused row or card, the first column shown, and an open cell edit.
 */
export type BaseWindowState = {
  view: string;
  /** Replaces the view's sort in this window. */
  sort?: BaseSort;
  /** `false` shows the view ungrouped. */
  grouped?: false;
  /** `false` ignores the view's own filters. */
  filtered?: false;
  /**
   * The focused note, the focused column (table) or lane (board), and the
   * row (table) or card in its lane (board) last focused, where focus stays
   * when the note leaves the view.
   */
  focus: { path?: string; column: number; index?: number };
  /** The first table column shown. */
  scroll: { col: number };
  /** Table column widths in cells by column id, set by resizing in this window. */
  widths?: Record<string, number>;
  edit?: CellEdit;
};

export function isBaseWindowState(v: unknown): v is BaseWindowState {
  if (typeof v !== "object" || v === null) return false;
  const w = v as Partial<BaseWindowState>;
  return (
    typeof w.view === "string" &&
    typeof w.focus?.column === "number" &&
    typeof w.scroll?.col === "number"
  );
}

/** `.base` files: shown by the base editor kind, never edited or written. */
export const baseFileType: FileType = {
  id: "base",
  match: { extensions: [".base"] },
  editor: "base",
  readOnly: true,
  views: [{ id: "base", readOnly: true, decorations: [] }],
};

/** A base window opens at the view its subpath names, else at the first view. */
export const baseEditorKind: EditorKindSpec<BaseWindowState> = {
  id: "base",
  open: (_path, text, subpath) => {
    const parsed = parseBase(text);
    const named = subpath?.replace(/^#/, "");
    const views = parsed.ok ? parsed.base.views : [];
    const view = views.find((v) => v.name === named) ?? views[0];
    return {
      view: view?.name ?? "",
      focus: { column: 0 },
      scroll: { col: 0 },
    };
  },
};
