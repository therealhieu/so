import { parse } from "yaml";
import type { FrontmatterValue } from "../../lang/markdown/frontmatter-patch";
import type {
  Base,
  BaseDiagnostic,
  BaseFilter,
  BaseGroupBy,
  BaseSort,
  BaseView,
} from "./types";

type BaseRecord = Record<string, unknown>;

export type ParsedBase =
  | { readonly ok: true; readonly base: Base }
  | { readonly ok: false; readonly diagnostic: BaseDiagnostic };

const defaultView: BaseView = { type: "table", name: "Table" };

const REJECTED = "Obsidian will not load this base";

/**
 * Parse a `.base` file. Only invalid YAML fails; anything else Obsidian would
 * refuse still parses, with a warning in `base.diagnostics`.
 */
export function parseBase(source: string): ParsedBase {
  let parsed: unknown;
  try {
    parsed = parse(source);
  } catch (error) {
    return {
      ok: false,
      diagnostic: {
        severity: "error",
        code: "invalid_yaml",
        message: error instanceof Error ? error.message : "Invalid YAML",
      },
    };
  }
  const document = isRecord(parsed) ? parsed : {};
  const diagnostics: BaseDiagnostic[] = [];
  const filters = isBaseFilter(document.filters) ? document.filters : undefined;
  return {
    ok: true,
    base: {
      ...(filters === undefined ? {} : { filters }),
      formulas: normalizeStringRecord(document.formulas),
      properties: normalizeProperties(document.properties),
      summaries: normalizeStringRecord(document.summaries),
      views: normalizeViews(document.views, diagnostics),
      diagnostics,
    },
  };
}

function normalizeStringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, recordValue]) =>
      typeof recordValue === "string" ? [[key, recordValue]] : [],
    ),
  );
}

function normalizeProperties(
  value: unknown,
): Record<
  string,
  { readonly displayName?: string; readonly [key: string]: unknown }
> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).map(([key, recordValue]) => [
      key,
      isRecord(recordValue) ? recordValue : {},
    ]),
  );
}

function normalizeViews(
  value: unknown,
  diagnostics: BaseDiagnostic[],
): BaseView[] {
  if (!Array.isArray(value)) return [defaultView];

  const views = value.flatMap((view, index): BaseView[] => {
    if (!isRecord(view)) return [];
    const name = typeof view.name === "string" ? view.name : "Table";
    if (typeof view.name !== "string")
      diagnostics.push({
        severity: "warning",
        code: "view_name_missing",
        message: `view ${index + 1} has no name; ${REJECTED}`,
      });
    if (view.groupBy !== undefined && !isObsidianGroupBy(view.groupBy))
      diagnostics.push({
        severity: "warning",
        code: "group_by_invalid",
        message: `view "${name}" groupBy needs a property and a direction; ${REJECTED}`,
      });

    const order = normalizeStringArray(view.order);
    const groupBy = normalizeGroupBy(view.groupBy);
    const sort = normalizeSort(view.sort);
    const groupOrder = normalizeGroupOrder(view.groupOrder);
    const columnSize = normalizeColumnSize(view.columnSize);
    const wrapText = normalizeWrapText(view.wrapText);
    const {
      groupBy: _groupBy,
      order: _order,
      sort: _sort,
      groupOrder: _groupOrder,
      columnSize: _columnSize,
      wrapText: _wrapText,
      ...rest
    } = view;
    return [
      {
        ...rest,
        type: typeof view.type === "string" ? view.type : "table",
        name,
        ...(order === undefined ? {} : { order }),
        ...(groupBy === undefined ? {} : { groupBy }),
        ...(sort === undefined ? {} : { sort }),
        ...(groupOrder === undefined ? {} : { groupOrder }),
        ...(columnSize === undefined ? {} : { columnSize }),
        ...(wrapText === undefined ? {} : { wrapText }),
      } satisfies BaseView,
    ];
  });

  return views.length > 0 ? views : [defaultView];
}

/** Obsidian's own rule: an object with both `property` and `direction`. */
const isObsidianGroupBy = (value: unknown) =>
  isRecord(value) &&
  Object.hasOwn(value, "property") &&
  Object.hasOwn(value, "direction");

function normalizeGroupBy(value: unknown): BaseGroupBy | undefined {
  if (typeof value === "string" && value.trim()) {
    return { property: value.trim() };
  }
  if (!isRecord(value)) return undefined;
  const property = value.property;
  const direction = value.direction;
  if (typeof property !== "string" || !property.trim()) return undefined;
  return {
    property: property.trim(),
    ...(direction === "ASC" || direction === "DESC" ? { direction } : {}),
  };
}

/** `{ property, direction }` entries; the legacy `column` key names the property too. */
function normalizeSort(value: unknown): BaseSort[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.flatMap((item): BaseSort[] => {
    if (!isRecord(item)) return [];
    const property =
      typeof item.property === "string" ? item.property : item.column;
    if (typeof property !== "string" || !property.trim()) return [];
    return [
      {
        property: property.trim(),
        direction: item.direction === "DESC" ? "DESC" : "ASC",
      },
    ];
  });
}

const isFrontmatterValue = (value: unknown): value is FrontmatterValue =>
  value === null ||
  typeof value === "string" ||
  typeof value === "number" ||
  typeof value === "boolean" ||
  (Array.isArray(value) && value.every(isFrontmatterValue));

function normalizeGroupOrder(value: unknown): FrontmatterValue[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter(isFrontmatterValue);
}

function normalizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeColumnSize(
  value: unknown,
): Record<string, number> | undefined {
  if (!isRecord(value)) return undefined;
  const entries = Object.entries(value).flatMap(
    ([key, raw]): [string, number][] =>
      typeof raw === "number" && Number.isFinite(raw) && raw > 0
        ? [[key, raw]]
        : [],
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function normalizeWrapText(value: unknown): string[] | undefined {
  const list = normalizeStringArray(value);
  if (!list || list.length === 0) return undefined;
  return [...new Set(list)];
}

function isBaseFilter(value: unknown): value is BaseFilter {
  return typeof value === "string" || isRecord(value);
}

function isRecord(value: unknown): value is BaseRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
