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
  /** The focused note, and the focused column (table) or lane (board). */
  focus: { path?: string; column: number };
  scroll: { row: number; col: number };
  edit?: CellEdit;
};

export function isBaseWindowState(v: unknown): v is BaseWindowState {
  if (typeof v !== "object" || v === null) return false;
  const w = v as Partial<BaseWindowState>;
  return (
    typeof w.view === "string" &&
    typeof w.focus?.column === "number" &&
    typeof w.scroll?.row === "number"
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
      scroll: { row: 0, col: 0 },
    };
  },
};
