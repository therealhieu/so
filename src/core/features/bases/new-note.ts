import type { FrontmatterValue } from "../../lang/markdown/frontmatter-patch";
import type { PropertyTypes } from "./property-types";
import type { Base, BaseFilter, BasePin, BaseView } from "./types";

/** Where a note made from a base goes, and the properties it starts with. */
export type NoteSeed = {
  folder: string;
  properties: Record<string, FrontmatterValue>;
};

export type SeedInput = {
  base: Base;
  view: BaseView | undefined;
  /** `false` when the window ignores the view's own filters. */
  viewFilters: boolean;
  /** The `.base` file's workspace path. */
  basePath: string;
  pins?: readonly BasePin[];
  /** The focused group or lane: its note property and key. */
  group?: { property: string; key: FrontmatterValue };
  types: PropertyTypes;
};

const STRING = /^"((?:[^"\\]|\\.)*)"$|^'((?:[^'\\]|\\.)*)'$/;
const NUMBER = /^-?\d+(?:\.\d+)?$/;
const NOTE_PROPERTY = /^(?:note\.)?([A-Za-z_][\w-]*)$/;
const FILE_CALL = /^file\.(inFolder|hasTag|hasProperty)\((.*)\)$/s;

/** A note property a filter or a group names, without `note.`; `undefined` for `file.*`, `formula.*`, and the like. */
const noteProperty = (name: string): string | undefined =>
  NOTE_PROPERTY.exec(name.trim())?.[1];

const unquote = (text: string): string | undefined => {
  const m = STRING.exec(text.trim());
  const body = m?.[1] ?? m?.[2];
  return body?.replace(/\\(.)/g, "$1");
};

/** A literal's value: a quoted string, a number, `true`, or `false`. */
function literal(text: string): FrontmatterValue | undefined {
  const t = text.trim();
  const s = unquote(t);
  if (s !== undefined) return s;
  if (NUMBER.test(t)) return Number(t);
  if (t === "true" || t === "false") return t === "true";
  return undefined;
}

/**
 * `text` split at each `sep` outside quotes and parentheses; `undefined`
 * when it also has a top-level `||`, so no part must hold on its own.
 */
function splitTop(text: string, sep: string): string[] | undefined {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | undefined;
  let from = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote !== undefined) {
      if (c === "\\") i++;
      else if (c === quote) quote = undefined;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (depth === 0 && text.startsWith("||", i)) return undefined;
    else if (depth === 0 && text.startsWith(sep, i)) {
      parts.push(text.slice(from, i));
      from = i + sep.length;
      i += sep.length - 1;
    }
  }
  parts.push(text.slice(from));
  return parts.map((p) => p.trim());
}

/** The expressions that must all hold: `and` lists flattened, `&&` split; `or` and `not` hold nothing on their own. */
function conjuncts(filter: BaseFilter | undefined): string[] {
  if (filter === undefined) return [];
  if (typeof filter === "string") return splitTop(filter, "&&") ?? [];
  return "and" in filter ? filter.and.flatMap(conjuncts) : [];
}

/** The string arguments of a call, or `undefined` when one is not a string. */
function stringArgs(args: string): string[] | undefined {
  const parts = splitTop(args, ",") ?? [];
  const out = parts.map(unquote);
  return out.every((a) => a !== undefined) ? (out as string[]) : undefined;
}

/** A pin's keys as the value a new note needs to match it. */
function pinValue(
  property: string,
  keys: readonly string[],
  types: PropertyTypes,
): FrontmatterValue | undefined {
  const values = keys.filter((k) => k !== "");
  if (values.length === 0) return undefined;
  const type = types[property.toLowerCase()];
  if (type === "list" || type === "tags" || type === "aliases") return values;
  if (values.length > 1) return values;
  const [v = ""] = values;
  if (type === "number" && Number.isFinite(Number(v))) return Number(v);
  if (type === "checkbox" && (v === "true" || v === "false"))
    return v === "true";
  return v;
}

const folderOf = (path: string) => {
  const i = path.lastIndexOf("/");
  return i < 0 ? "" : path.slice(0, i);
};

/**
 * The folder and properties a note made from a base needs to show in the
 * view: from the filters in effect, `file.inFolder` (the first; else the
 * base's own folder), `file.hasTag`, `file.hasProperty`, and `property ==
 * literal`; then the window's pins and the focused group. Filters that hold
 * no single value (`or`, `not`, `!=`, comparisons, formulas) add nothing.
 */
export function newNoteSeed(input: SeedInput): NoteSeed {
  let folder: string | undefined;
  const properties: Record<string, FrontmatterValue> = {};
  const tags: string[] = [];
  const filters = [
    ...conjuncts(input.base.filters),
    ...(input.viewFilters ? conjuncts(input.view?.filters) : []),
  ];
  for (const expr of filters) {
    const call = FILE_CALL.exec(expr);
    if (call !== null) {
      const args = stringArgs(call[2] ?? "");
      if (args === undefined) continue;
      if (call[1] === "inFolder") {
        const f = args[0]?.replace(/^\/+|\/+$/g, "");
        if (folder === undefined && f !== undefined && f !== "") folder = f;
      } else if (call[1] === "hasTag") {
        for (const t of args.map((a) => a.replace(/^#/, "")))
          if (t !== "" && !tags.includes(t)) tags.push(t);
      } else {
        for (const p of args)
          if (properties[p] === undefined) properties[p] = null;
      }
      continue;
    }
    const sides = splitTop(expr, "==");
    if (sides?.length !== 2) continue;
    const [left = "", right = ""] = sides;
    const [name, value] =
      noteProperty(left) !== undefined
        ? [noteProperty(left), literal(right)]
        : [noteProperty(right), literal(left)];
    if (name !== undefined && value !== undefined) properties[name] = value;
  }
  for (const pin of input.pins ?? []) {
    const name = noteProperty(pin.property);
    const value =
      name === undefined ? undefined : pinValue(name, pin.keys, input.types);
    if (name !== undefined && value !== undefined) properties[name] = value;
  }
  const group = input.group;
  const groupName = group && noteProperty(group.property);
  if (group !== undefined && groupName !== undefined && group.key !== null)
    properties[groupName] = group.key;
  if (tags.length > 0) {
    const had = properties.tags;
    const list = Array.isArray(had) ? had : had == null ? [] : [had];
    properties.tags = [...list, ...tags.filter((t) => !list.includes(t))];
  }
  return { folder: folder ?? folderOf(input.basePath), properties };
}
