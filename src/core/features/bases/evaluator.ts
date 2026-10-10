import type { FrontmatterValue } from "../../lang/markdown/frontmatter-patch";
import { type ExpressionContext, evaluateExpression } from "./expression";
import type {
  Base,
  BaseCandidate,
  BaseCell,
  BaseColumn,
  BaseColumnOption,
  BaseColumnOptionColor,
  BaseColumnOptionGroup,
  BaseDiagnostic,
  BaseEvaluation,
  BaseFilter,
  BaseGroup,
  BaseSemanticType,
  BaseUi,
  BaseView,
} from "./types";

type FormulaEvaluationStatus = "ok" | "failed" | "cyclic";

type FormulaState = {
  readonly values: Record<string, unknown>;
  readonly diagnostics: readonly BaseDiagnostic[];
};

type FormulaCycleState = {
  readonly cyclicFormulas: ReadonlySet<string>;
  readonly diagnostics: readonly BaseDiagnostic[];
};

type EvaluatedBaseRow = {
  readonly candidate: BaseCandidate;
  readonly formulas: Readonly<Record<string, unknown>>;
  readonly row: BaseEvaluation["rows"][number];
};

const SEMANTIC_TYPE_ALIASES: Readonly<Record<string, BaseSemanticType>> = {
  // Legacy type names.
  created_time: "created_at",
  last_edited: "updated_at",
  // Obsidian type names.
  tags: "multi_select",
};

const PROPERTY_SEMANTIC_TYPE_DEFAULTS: Readonly<
  Record<string, BaseSemanticType>
> = {
  "file.name": "title",
  "file.tags": "multi_select",
  "file.ctime": "created_at",
  "file.mtime": "updated_at",
  created_at: "created_at",
  updated_at: "updated_at",
};

function defaultSemanticTypeForProperty(
  property: string,
): BaseSemanticType | undefined {
  return PROPERTY_SEMANTIC_TYPE_DEFAULTS[property];
}

const PROPERTY_VALUE_TYPE_DEFAULTS: Readonly<
  Record<string, BaseColumn["valueType"]>
> = {
  "file.name": "string",
  "file.tags": "list",
  "file.ctime": "date",
  "file.mtime": "date",
  "file.size": "number",
  "file.ext": "string",
  "file.folder": "string",
  "file.path": "string",
  created_at: "date",
  updated_at: "date",
};

function inferValueType(
  property: string,
  semanticType: BaseSemanticType | undefined,
  firstCellValue: BaseCell | undefined,
): BaseColumn["valueType"] {
  // 1. Explicit semantic type wins (strongest signal).
  switch (semanticType) {
    case "number":
      return "number";
    case "checkbox":
      return "boolean";
    case "date":
      return "date";
    case "multi_select":
      return "list";
    case "url":
    case "email":
    case "phone":
    case "relation":
      return "link";
    case "created_at":
    case "updated_at":
      return "date";
  }

  // 2. Property-name default (handles "file.*" and convention properties).
  const propertyDefault = PROPERTY_VALUE_TYPE_DEFAULTS[property];
  if (propertyDefault !== undefined) return propertyDefault;

  // 3. Sample the first matching candidate's cell value.
  if (firstCellValue === undefined) return "unknown";
  switch (firstCellValue.type) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "date":
      return "date";
    case "list":
      return "list";
    case "link":
      return "link";
    case "null":
      return "unknown";
  }
}

const semanticTypes = new Set<BaseSemanticType>([
  "title",
  "text",
  "number",
  "select",
  "multi_select",
  "status",
  "date",
  "checkbox",
  "url",
  "email",
  "phone",
  "relation",
  "formula",
  "rollup",
  "created_at",
  "updated_at",
]);

const optionColors = new Set<BaseColumnOptionColor>([
  "gray",
  "brown",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
  "red",
]);

const optionGroups = new Set<BaseColumnOptionGroup>([
  "not_started",
  "in_progress",
  "done",
]);

export type EvaluateBaseInput = {
  readonly base: Base;
  readonly candidates: readonly BaseCandidate[];
  /** The view name; an unknown or absent name selects the first view. */
  readonly view?: string;
  readonly ui?: BaseUi;
};

/**
 * Evaluate one view of a base over the candidates. Every view type evaluates
 * rows; which layout shows them is decided by the caller. Never throws: every
 * unsupported construct becomes a diagnostic.
 */
export function evaluateBase(input: EvaluateBaseInput): BaseEvaluation {
  const selectedView = applyUi(
    normalizeEvaluationView(selectView(input.base, input.view)),
    input.ui,
  );
  const diagnostics: BaseDiagnostic[] = [...input.base.diagnostics];
  const availableViews = input.base.views.map((view) => ({
    name: view.name,
    type: view.type,
  }));
  const hiding = new Set<string>();

  const formulaCycleState = detectFormulaCycles(input.base.formulas);
  const columns = buildColumns(input.base, selectedView, input.candidates);
  const evaluatedRows = input.candidates.flatMap(
    (candidate): EvaluatedBaseRow[] => {
      const formulaState = evaluateFormulas(
        input.base.formulas,
        candidate,
        formulaCycleState.cyclicFormulas,
      );
      diagnostics.push(...formulaState.diagnostics);
      const context = createExpressionContext(candidate, formulaState.values);
      const globalMatches = matchesFilter(
        input.base.filters,
        context,
        diagnostics,
        hiding,
      );
      const viewMatches = matchesFilter(
        selectedView.filters,
        context,
        diagnostics,
        hiding,
      );
      if (globalMatches !== true || viewMatches !== true) {
        return [];
      }

      return [
        {
          candidate,
          formulas: formulaState.values,
          row: {
            file: {
              path: candidate.path,
              name: candidate.name,
              ext: candidate.ext,
            },
            cells: Object.fromEntries(
              columns.map((column) => {
                const rawValue = resolveColumnValue(
                  column.property,
                  candidate,
                  formulaState.values,
                );
                validateDeclaredCellValue({
                  column,
                  rawValue,
                  candidate,
                  diagnostics,
                });
                return [column.id, toCellValue(rawValue, column)];
              }),
            ),
          },
        },
      ];
    },
  );
  const sortedRows = sortRows(evaluatedRows, selectedView.sort);
  const rows = sortedRows
    .slice(0, selectedView.limit ?? sortedRows.length)
    .map((evaluatedRow) => evaluatedRow.row);
  const groups = buildGroups(sortedRows, rows.length, selectedView.groupBy);
  for (const expression of hiding)
    diagnostics.push({
      severity: "warning",
      code: "filter_hides_rows",
      message: `filter "${expression}" is not supported; rows it guards are hidden`,
    });

  return {
    selectedView: {
      name: selectedView.name,
      type: selectedView.type,
      ...(selectedView.groupBy === undefined
        ? {}
        : { groupBy: selectedView.groupBy }),
      ...(selectedView.groupOrder === undefined
        ? {}
        : { groupOrder: selectedView.groupOrder }),
      ...(selectedView.sort === undefined || selectedView.sort.length === 0
        ? {}
        : { sort: selectedView.sort }),
      ...(selectedView.summaries === undefined
        ? {}
        : { summaries: selectedView.summaries }),
    },
    availableViews,
    columns,
    rows,
    ...(groups === undefined ? {} : { groups }),
    diagnostics: unique([...diagnostics, ...formulaCycleState.diagnostics]),
  };
}

/** The window's overrides: a replacement sort, no grouping, no view filters. */
function applyUi(view: BaseView, ui: BaseUi | undefined): BaseView {
  if (ui === undefined) return view;
  const { groupBy, filters, sort, ...rest } = view;
  const keepGroup = ui.grouped !== false && groupBy !== undefined;
  const keepFilters = ui.filtered !== false && filters !== undefined;
  const nextSort = ui.sort === undefined ? sort : [ui.sort];
  return {
    ...rest,
    ...(keepGroup ? { groupBy } : {}),
    ...(keepFilters ? { filters } : {}),
    ...(nextSort === undefined ? {} : { sort: nextSort }),
  };
}

/** Each diagnostic once: per-row evaluation repeats the same finding. */
function unique(diagnostics: readonly BaseDiagnostic[]): BaseDiagnostic[] {
  const seen = new Set<string>();
  return diagnostics.filter((d) => {
    const key = `${d.severity}\u0000${d.code}\u0000${d.message}\u0000${d.path ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sortRows(
  rows: readonly EvaluatedBaseRow[],
  sort: BaseView["sort"],
): readonly EvaluatedBaseRow[] {
  if (sort === undefined || sort.length === 0) return rows;
  return [...rows].sort((left, right) => {
    for (const item of sort) {
      const comparison = compareValues(
        resolveColumnValue(item.property, left.candidate, left.formulas),
        resolveColumnValue(item.property, right.candidate, right.formulas),
      );
      if (comparison !== 0) {
        return item.direction === "DESC" ? -comparison : comparison;
      }
    }
    return left.candidate.path.localeCompare(right.candidate.path);
  });
}

function buildGroups(
  rows: readonly EvaluatedBaseRow[],
  rowCount: number,
  groupBy: BaseView["groupBy"],
): readonly BaseGroup[] | undefined {
  if (groupBy === undefined) return undefined;
  const groups = new Map<
    string,
    { value: FrontmatterValue; rowIndexes: number[] }
  >();
  for (const [index, row] of rows.slice(0, rowCount).entries()) {
    for (const { key, value } of groupKeys(
      resolveColumnValue(groupBy.property, row.candidate, row.formulas),
    )) {
      const group = groups.get(key) ?? { value, rowIndexes: [] };
      group.rowIndexes.push(index);
      groups.set(key, group);
    }
  }
  return [...groups.entries()]
    .map(([key, { value, rowIndexes }]) => ({ key, value, rowIndexes }))
    .sort((left, right) => {
      const comparison =
        compareValues(left.value, right.value) ||
        compareValues(left.key, right.key);
      return groupBy.direction === "DESC" ? -comparison : comparison;
    });
}

/** The groups a value falls in: each item of a list, else the value; "" (value `null`) when empty. */
function groupKeys(
  value: unknown,
): readonly { key: string; value: FrontmatterValue }[] {
  const keyed = (v: unknown) => ({
    key: stringifyGroupKey(v),
    value: groupValue(v),
  });
  if (!Array.isArray(value)) return [keyed(value)];
  const keys = value.map(keyed).filter(({ key }) => key.length > 0);
  return keys.length > 0 ? keys : [{ key: "", value: null }];
}

/** The typed value a group stands for, so a move can write it back as written. */
function groupValue(value: unknown): FrontmatterValue {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  return stringifyGroupKey(value);
}

/** A value as its group key: the text it groups under, "" for no value. */
export function stringifyGroupKey(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number")
    return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return String(value);
  return JSON.stringify(value) ?? String(value);
}

function compareValues(left: unknown, right: unknown): number {
  const leftRank = valueRank(left);
  const rightRank = valueRank(right);
  if (leftRank !== rightRank) return leftRank - rightRank;
  if (typeof left === "number" && typeof right === "number") {
    return left === right ? 0 : left < right ? -1 : 1;
  }
  if (typeof left === "boolean" && typeof right === "boolean") {
    return Number(left) - Number(right);
  }
  return stringifyGroupKey(left).localeCompare(stringifyGroupKey(right));
}

function valueRank(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? 1 : 0;
  if (typeof value === "boolean") return 2;
  if (typeof value === "string") return 3;
  return 4;
}

function selectView(base: Base, viewName: string | undefined): BaseView {
  return (
    base.views.find((view) => view.name === viewName) ??
    base.views[0] ?? { type: "table", name: "Table" }
  );
}

function normalizeEvaluationView(view: BaseView): BaseView {
  const groupBy = normalizeGroupBy(view.groupBy);
  const { groupBy: _groupBy, ...rest } = view;
  return {
    ...rest,
    ...(groupBy === undefined ? {} : { groupBy }),
  };
}

function normalizeGroupBy(value: unknown): BaseView["groupBy"] {
  if (!isRecord(value)) return undefined;
  const property = value.property;
  const direction = value.direction;
  if (typeof property !== "string" || !property.trim()) return undefined;
  return {
    property: property.trim(),
    ...(direction === "ASC" || direction === "DESC" ? { direction } : {}),
  };
}

/**
 * Whether a candidate passes `filter`: `true`, `false`, or `undefined` when the
 * answer depends on an expression that cannot be evaluated. That expression is
 * added to `hiding`; only `true` keeps the row, so negation cannot show rows a
 * failing expression guards, while a decided `and`/`or` branch still wins.
 */
function matchesFilter(
  filter: BaseFilter | undefined,
  context: ExpressionContext,
  diagnostics: BaseDiagnostic[],
  hiding: Set<string>,
): boolean | undefined {
  if (filter === undefined) return true;
  if (typeof filter === "string") {
    const result = evaluateExpression(filter, context);
    diagnostics.push(...result.diagnostics);
    if (result.diagnostics.length > 0) {
      hiding.add(filter);
      return undefined;
    }
    return Boolean(result.value);
  }
  const children = (list: readonly BaseFilter[]) =>
    list.map((child) => matchesFilter(child, context, diagnostics, hiding));
  if ("and" in filter) {
    const matches = children(filter.and);
    if (matches.includes(false)) return false;
    return matches.includes(undefined) ? undefined : true;
  }
  if ("or" in filter) {
    const matches = children(filter.or);
    if (matches.includes(true)) return true;
    return matches.includes(undefined) ? undefined : false;
  }
  if ("not" in filter) {
    const matches = children(filter.not);
    if (matches.includes(true)) return false;
    return matches.includes(undefined) ? undefined : true;
  }
  return false;
}

function evaluateFormulas(
  formulas: Readonly<Record<string, string>>,
  candidate: BaseCandidate,
  cyclicFormulas: ReadonlySet<string>,
): FormulaState {
  const dependencies = buildFormulaDependencies(formulas);
  const values: Record<string, unknown> = {};
  const statuses: Record<string, FormulaEvaluationStatus> = {};
  const diagnostics: BaseDiagnostic[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const evaluateFormula = (key: string): void => {
    if (visited.has(key)) return;
    if (cyclicFormulas.has(key)) {
      values[key] = null;
      statuses[key] = "cyclic";
      visited.add(key);
      return;
    }
    if (visiting.has(key)) {
      values[key] = null;
      statuses[key] = "cyclic";
      visited.add(key);
      return;
    }

    visiting.add(key);
    const formulaDependencies = dependencies.get(key) ?? [];
    for (const dependency of formulaDependencies) {
      evaluateFormula(dependency);
    }
    visiting.delete(key);

    const failedDependency = formulaDependencies.find(
      (dependency) => statuses[dependency] !== "ok",
    );
    if (failedDependency !== undefined) {
      values[key] = null;
      statuses[key] = "failed";
      visited.add(key);
      diagnostics.push({
        severity: "warning",
        code: "formula_dependency_error",
        message: `Formula ${key} depends on failed formula ${failedDependency}`,
        path: candidate.path,
      });
      return;
    }

    const expression = formulas[key];
    if (expression === undefined) return;
    const result = evaluateExpression(
      expression,
      createExpressionContext(candidate, values),
    );
    diagnostics.push(...result.diagnostics);
    if (result.diagnostics.length > 0) {
      values[key] = null;
      statuses[key] = "failed";
      visited.add(key);
      return;
    }
    if (typeof result.value === "number" && !Number.isFinite(result.value)) {
      diagnostics.push({
        severity: "warning",
        code: "invalid_formula_value",
        message: `Formula ${key} evaluated to a non-finite number`,
        path: candidate.path,
      });
      values[key] = null;
      statuses[key] = "failed";
      visited.add(key);
      return;
    }
    values[key] = result.value;
    statuses[key] = "ok";
    visited.add(key);
  };

  for (const key of Object.keys(formulas)) {
    evaluateFormula(key);
  }

  return { values, diagnostics };
}

function buildColumns(
  base: Base,
  view: BaseView,
  candidates: readonly BaseCandidate[],
): BaseColumn[] {
  const orderedProperties = view.order ?? [
    "file.name",
    ...Object.keys(base.properties),
    ...Object.keys(base.formulas).map((key) => `formula.${key}`),
  ];
  const properties = [
    ...orderedProperties,
    ...(view.type === "board" && view.groupBy !== undefined
      ? [view.groupBy.property]
      : []),
  ];

  return [...new Set(properties)].map((property) => {
    const source = getColumnSource(property);
    const formulaKey =
      source === "formula" ? property.slice("formula.".length) : undefined;
    const formulaExpression =
      formulaKey === undefined ? undefined : base.formulas[formulaKey];
    const propertyConfig = base.properties[property];
    // file.* properties are an *override* (the property name is the strongest
    // signal). Convention properties (created_at, updated_at) are a *fallback*
    // after the explicit YAML type:.
    const isFileProperty = property.startsWith("file.");
    const semanticType =
      (isFileProperty
        ? defaultSemanticTypeForProperty(property)
        : readSemanticType(propertyConfig?.type)) ??
      defaultSemanticTypeForProperty(property);
    const options = readColumnOptions(propertyConfig?.options);
    const width =
      view.columnSize?.[property] ?? view.columnSize?.[`note.${property}`];
    const wrap = view.wrapText?.includes(property) ?? false;
    const firstSample = candidates.find((c) => {
      if (property === "file.name") return true;
      if (property.startsWith("file.")) {
        // file.* properties are read from the candidate itself, not from frontmatter.
        return c.path !== undefined;
      }
      return c.properties[property] !== undefined;
    });
    const firstCellValue: BaseCell | undefined = firstSample
      ? readCellValueForProperty(firstSample, property)
      : undefined;
    return {
      id: property,
      property,
      displayName: propertyConfig?.displayName ?? defaultDisplayName(property),
      valueType: inferValueType(property, semanticType, firstCellValue),
      source,
      editable: source === "noteProperty",
      wrap,
      ...(width === undefined ? {} : { width }),
      ...(semanticType === undefined ? {} : { semanticType }),
      ...(options === undefined ? {} : { options }),
      ...(formulaExpression === undefined ? {} : { formulaExpression }),
    };
  });
}

function readCellValueForProperty(
  candidate: BaseCandidate,
  property: string,
): BaseCell | undefined {
  if (property === "file.name") {
    return { type: "string", value: candidate.name };
  }
  if (property === "file.ctime") {
    return { type: "date", value: candidate.ctime };
  }
  if (property === "file.mtime") {
    return { type: "date", value: candidate.mtime };
  }
  if (property === "file.ext") {
    return { type: "string", value: candidate.ext };
  }
  if (property === "file.folder") {
    return { type: "string", value: candidate.folder };
  }
  if (property === "file.path") {
    return { type: "string", value: candidate.path };
  }
  if (property === "file.size") {
    return { type: "number", value: candidate.size };
  }
  if (property === "file.tags") {
    return { type: "list", value: candidate.tags };
  }
  const frontmatter = candidate.properties[property];
  if (frontmatter === undefined) return undefined;
  if (typeof frontmatter === "string")
    return { type: "string", value: frontmatter };
  if (typeof frontmatter === "number")
    return { type: "number", value: frontmatter };
  if (typeof frontmatter === "boolean")
    return { type: "boolean", value: frontmatter };
  if (Array.isArray(frontmatter)) return { type: "list", value: frontmatter };
  return { type: "null", value: null };
}

function readSemanticType(value: unknown): BaseSemanticType | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = SEMANTIC_TYPE_ALIASES[value] ?? value;
  return semanticTypes.has(normalized as BaseSemanticType)
    ? (normalized as BaseSemanticType)
    : undefined;
}

function readColumnOptions(value: unknown): BaseColumnOption[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const options = value.flatMap((item): BaseColumnOption[] => {
    if (!isRecord(item)) return [];
    const name = item.name;
    const color = item.color;
    const group = item.group;
    if (typeof name !== "string" || !name.trim()) return [];
    if (
      typeof color !== "string" ||
      !optionColors.has(color as BaseColumnOptionColor)
    ) {
      return [];
    }
    return [
      {
        name,
        color: color as BaseColumnOptionColor,
        ...(typeof group === "string" &&
        optionGroups.has(group as BaseColumnOptionGroup)
          ? { group: group as BaseColumnOptionGroup }
          : {}),
      },
    ];
  });
  return options.length > 0 ? options : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getColumnSource(property: string): BaseColumn["source"] {
  if (property.startsWith("file.")) return "fileProperty";
  if (property.startsWith("formula.")) return "formula";
  return "noteProperty";
}

function validateDeclaredCellValue(input: {
  readonly column: BaseColumn;
  readonly rawValue: unknown;
  readonly candidate: BaseCandidate;
  readonly diagnostics: BaseDiagnostic[];
}): void {
  const { column, rawValue, candidate, diagnostics } = input;
  if (column.source !== "noteProperty") return;
  if (column.semanticType === undefined) return;
  if (rawValue === null || rawValue === undefined) return;

  const message = declaredTypeViolationMessage(
    column,
    rawValue,
    candidate.path,
  );
  if (message === null) return;
  diagnostics.push({
    severity: "warning",
    code: "base_declared_type_mismatch",
    message,
    path: candidate.path,
  });
}

function declaredTypeViolationMessage(
  column: BaseColumn,
  rawValue: unknown,
  path: string,
): string | null {
  switch (column.semanticType) {
    case "title":
    case "text":
    case "url":
    case "email":
    case "phone":
    case "relation":
      return typeof rawValue === "string"
        ? null
        : `${path} ${column.property} must be a string`;
    case "number":
      return typeof rawValue === "number" && Number.isFinite(rawValue)
        ? null
        : `${path} ${column.property} must be a number`;
    case "checkbox":
      return typeof rawValue === "boolean"
        ? null
        : `${path} ${column.property} must be a boolean`;
    case "date":
      return typeof rawValue === "string" &&
        Number.isFinite(Date.parse(rawValue))
        ? null
        : `${path} ${column.property} must be a valid date string`;
    case "select":
    case "status": {
      if (typeof rawValue !== "string") {
        return `${path} ${column.property} must be a string`;
      }
      const names = optionNames(column);
      return names.size === 0 || names.has(rawValue)
        ? null
        : `${path} ${column.property} must match one of the configured select options: ${rawValue}`;
    }
    case "multi_select": {
      if (
        !Array.isArray(rawValue) ||
        rawValue.some((item) => typeof item !== "string")
      ) {
        return `${path} ${column.property} must be an array of strings`;
      }
      const names = optionNames(column);
      if (names.size === 0) return null;
      for (const item of rawValue) {
        if (!names.has(item)) {
          return `${path} ${column.property} must match one of the configured select options: ${item}`;
        }
      }
      return null;
    }
    case "formula":
    case "rollup":
    case "created_at":
    case "updated_at":
    case undefined:
      return null;
  }
  return null;
}

function optionNames(column: BaseColumn): ReadonlySet<string> {
  return new Set((column.options ?? []).map((option) => option.name));
}

function resolveColumnValue(
  property: string,
  candidate: BaseCandidate,
  formulas: Readonly<Record<string, unknown>>,
): unknown {
  if (property.startsWith("file.")) {
    return candidate[property.slice("file.".length) as keyof BaseCandidate];
  }
  if (property.startsWith("formula.")) {
    return formulas[property.slice("formula.".length)];
  }
  if (property.startsWith("note.")) {
    return candidate.properties[property.slice("note.".length)];
  }
  const value = candidate.properties[property];
  if (value !== undefined) return value;
  // Convention properties named `created_at` / `updated_at` carry the same
  // semantic intent as `file.ctime` / `file.mtime`. When a note has no
  // explicit frontmatter value (the common case for freshly-created rows),
  // fall back to the file's ctime/mtime so the cell isn't rendered as Empty.
  if (property === "created_at") return candidate.ctime;
  if (property === "updated_at") return candidate.mtime;
  return undefined;
}

function toCellValue(value: unknown, column: BaseColumn): BaseCell {
  if (column.property === "file.name") {
    return {
      type: "link",
      value: String(value ?? ""),
      display: String(value ?? ""),
    };
  }
  if (value === null || value === undefined)
    return { type: "null", value: null };
  if (
    column.valueType === "date" &&
    (typeof value === "string" ||
      (typeof value === "number" && Number.isFinite(value)))
  ) {
    return { type: "date", value };
  }
  if (typeof value === "string") return { type: "string", value };
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? { type: "number", value }
      : { type: "null", value: null };
  }
  if (typeof value === "boolean") return { type: "boolean", value };
  if (Array.isArray(value)) {
    return { type: "list", value: value.map(toJsonSafeListValue) };
  }
  return { type: "string", value: String(value) };
}

function toJsonSafeListValue(value: unknown): unknown {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (Array.isArray(value)) return value.map(toJsonSafeListValue);
  return value;
}

function createExpressionContext(
  candidate: BaseCandidate,
  formula: Readonly<Record<string, unknown>>,
): ExpressionContext {
  return {
    note: candidate.properties,
    file: {
      path: candidate.path,
      name: candidate.name,
      basename: candidate.basename,
      folder: candidate.folder,
      ext: candidate.ext,
      size: candidate.size,
      mtime: candidate.mtime,
      ctime: candidate.ctime,
      tags: candidate.tags,
      links: candidate.links,
      embeds: candidate.embeds,
    },
    formula,
  };
}

function detectFormulaCycles(
  formulas: Readonly<Record<string, string>>,
): FormulaCycleState {
  const dependencies = buildFormulaDependencies(formulas);
  const cyclicFormulas = new Set<string>();
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];

  for (const key of Object.keys(formulas)) {
    detectFormulaCycle(
      key,
      dependencies,
      visiting,
      visited,
      stack,
      cyclicFormulas,
    );
  }

  return {
    cyclicFormulas,
    diagnostics: [...cyclicFormulas].sort().map((key) => ({
      severity: "error",
      code: "formula_cycle",
      message: `Formula cycle detected for ${key}`,
    })),
  };
}

function buildFormulaDependencies(
  formulas: Readonly<Record<string, string>>,
): ReadonlyMap<string, readonly string[]> {
  const formulaKeys = new Set(Object.keys(formulas));
  const dependencies = new Map<string, string[]>();
  const formulaReferencePattern = /\bformula\.([A-Za-z_][A-Za-z0-9_]*)\b/g;

  for (const [key, expression] of Object.entries(formulas)) {
    const referencedFormulas = new Set<string>();
    for (const match of stripStringLiterals(expression).matchAll(
      formulaReferencePattern,
    )) {
      const referencedFormula = match[1];
      if (
        referencedFormula !== undefined &&
        formulaKeys.has(referencedFormula)
      ) {
        referencedFormulas.add(referencedFormula);
      }
    }
    dependencies.set(key, [...referencedFormulas]);
  }

  return dependencies;
}

function stripStringLiterals(expression: string): string {
  let stripped = "";
  let index = 0;
  while (index < expression.length) {
    const character = expression[index];
    if (character !== '"' && character !== "'") {
      stripped += character ?? "";
      index += 1;
      continue;
    }

    stripped += " ";
    index += 1;
    while (index < expression.length) {
      const stringCharacter = expression[index];
      stripped += " ";
      index += 1;
      if (stringCharacter === character) break;
    }
  }
  return stripped;
}

function detectFormulaCycle(
  key: string,
  dependencies: ReadonlyMap<string, readonly string[]>,
  visiting: Set<string>,
  visited: Set<string>,
  stack: string[],
  cyclicFormulas: Set<string>,
): void {
  if (visited.has(key)) return;
  if (visiting.has(key)) {
    markFormulaCycle(key, stack, cyclicFormulas);
    return;
  }

  visiting.add(key);
  stack.push(key);
  for (const dependency of dependencies.get(key) ?? []) {
    detectFormulaCycle(
      dependency,
      dependencies,
      visiting,
      visited,
      stack,
      cyclicFormulas,
    );
  }
  stack.pop();
  visiting.delete(key);
  visited.add(key);
}

function markFormulaCycle(
  key: string,
  stack: readonly string[],
  cyclicFormulas: Set<string>,
): void {
  const cycleStart = stack.indexOf(key);
  if (cycleStart === -1) return;
  for (const formula of stack.slice(cycleStart)) {
    cyclicFormulas.add(formula);
  }
}

function defaultDisplayName(property: string): string {
  if (property.startsWith("file.")) return property.slice("file.".length);
  if (property.startsWith("formula.")) return property.slice("formula.".length);
  return property;
}
