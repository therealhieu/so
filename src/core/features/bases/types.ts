import type { FrontmatterValue } from "../../lang/markdown/frontmatter-patch";

/**
 * The view type Obsidian writes for its Kanban layout; set only from a `.base`
 * saved by Obsidian ≥ 1.14.3 (see test/fixtures/bases/README.md). Until then no
 * view type selects the board, and Kanban views open as tables.
 */
export const KANBAN_TYPE: string | undefined = undefined;

export type BaseDiagnostic = {
  readonly severity: "info" | "warning" | "error";
  readonly code: string;
  readonly message: string;
  readonly path?: string;
};

export type BaseFilter =
  | string
  | { readonly and: readonly BaseFilter[] }
  | { readonly or: readonly BaseFilter[] }
  | { readonly not: readonly BaseFilter[] };

export type BaseSort = {
  readonly property: string;
  readonly direction: "ASC" | "DESC";
};

export type BaseGroupBy = {
  readonly property: string;
  readonly direction?: "ASC" | "DESC";
};

export type BaseView = {
  readonly type: string;
  readonly name: string;
  readonly limit?: number;
  readonly order?: readonly string[];
  readonly filters?: BaseFilter;
  readonly sort?: readonly BaseSort[];
  readonly groupBy?: BaseGroupBy;
  /** The groups to show, in order; `null` is the group without a value. */
  readonly groupOrder?: readonly FrontmatterValue[];
  readonly summaries?: Readonly<Record<string, string>>;
  /** Per-column widths, keyed by column property id; absent keys use the default. */
  readonly columnSize?: Readonly<Record<string, number>>;
  /** Column property ids whose cells wrap text. */
  readonly wrapText?: readonly string[];
  readonly [key: string]: unknown;
};

export type Base = {
  readonly filters?: BaseFilter;
  readonly formulas: Readonly<Record<string, string>>;
  readonly properties: Readonly<
    Record<
      string,
      { readonly displayName?: string; readonly [key: string]: unknown }
    >
  >;
  readonly summaries: Readonly<Record<string, string>>;
  readonly views: readonly BaseView[];
  /** Warnings found while parsing; the base still renders. */
  readonly diagnostics: readonly BaseDiagnostic[];
};

export type BaseSemanticType =
  | "title"
  | "text"
  | "number"
  | "select"
  | "multi_select"
  | "status"
  | "date"
  | "checkbox"
  | "url"
  | "email"
  | "phone"
  | "relation"
  | "formula"
  | "rollup"
  | "created_at"
  | "updated_at";

export type BaseColumnOptionColor =
  | "gray"
  | "brown"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "red";

export type BaseColumnOptionGroup = "not_started" | "in_progress" | "done";

export type BaseColumnOption = {
  readonly name: string;
  readonly color: BaseColumnOptionColor;
  readonly group?: BaseColumnOptionGroup;
};

/** One indexed file a base can list; `mtime` and `ctime` are epoch milliseconds. */
export type BaseCandidate = {
  readonly path: string;
  readonly name: string;
  readonly basename: string;
  readonly folder: string;
  readonly ext: string;
  readonly size: number;
  readonly mtime: number;
  readonly ctime: number;
  readonly properties: Readonly<Record<string, unknown>>;
  readonly tags: readonly string[];
  readonly links: readonly string[];
  readonly embeds: readonly string[];
};

/** A cell value; a `date` is epoch milliseconds or the text a note wrote. */
export type BaseCell =
  | { readonly type: "null"; readonly value: null }
  | { readonly type: "string"; readonly value: string }
  | { readonly type: "number"; readonly value: number }
  | { readonly type: "boolean"; readonly value: boolean }
  | { readonly type: "date"; readonly value: string | number }
  | { readonly type: "list"; readonly value: readonly unknown[] }
  | {
      readonly type: "link";
      readonly value: string;
      readonly display?: string;
    };

export type BaseColumn = {
  readonly id: string;
  readonly property: string;
  readonly displayName: string;
  readonly valueType:
    | "null"
    | "string"
    | "number"
    | "boolean"
    | "date"
    | "list"
    | "link"
    | "unknown";
  readonly source: "noteProperty" | "fileProperty" | "formula";
  readonly editable: boolean;
  readonly formulaExpression?: string;
  readonly semanticType?: BaseSemanticType;
  readonly options?: readonly BaseColumnOption[];
  /** Column width from the view's columnSize; absent = default. */
  readonly width?: number;
  /** Whether cells in this column wrap text, from the view's wrapText list. */
  readonly wrap?: boolean;
};

export type BaseRow = {
  readonly file: {
    readonly path: string;
    readonly name: string;
    readonly ext: string;
  };
  readonly cells: Readonly<Record<string, BaseCell>>;
};

/** One group of rows: `key` is the value as text ("" for none), `value` the typed value (`null` for none). */
export type BaseGroup = {
  readonly key: string;
  readonly value: FrontmatterValue;
  readonly rowIndexes: readonly number[];
};

/** A window's in-memory overrides of the selected view; none of them reaches the file. */
export type BaseUi = {
  /** Replaces the view's sort. */
  readonly sort?: BaseSort;
  /** `false` shows the rows ungrouped. */
  readonly grouped?: boolean;
  /** `false` ignores the view's own filters (the base's global filters still apply). */
  readonly filtered?: boolean;
};

export type BaseEvaluation = {
  readonly selectedView: {
    readonly name: string;
    readonly type: string;
    readonly groupBy?: BaseGroupBy;
    readonly groupOrder?: readonly FrontmatterValue[];
    readonly summaries?: Readonly<Record<string, string>>;
  };
  readonly availableViews: readonly {
    readonly name: string;
    readonly type: string;
  }[];
  readonly columns: readonly BaseColumn[];
  readonly rows: readonly BaseRow[];
  readonly groups?: readonly BaseGroup[];
  readonly diagnostics: readonly BaseDiagnostic[];
};
