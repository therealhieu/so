import { type AST, parseTOML } from "toml-eslint-parser";
import { parseConfig } from "./toml";

export type SettingValue = string | boolean;
export type ConfigEdit =
  | { ok: true; text: string }
  | { ok: false; reason: string };

/** A key and the table it sits in, by full key path. */
type Entry = { path: string[]; base: string[]; kv: AST.TOMLKeyValue };

const names = (key: AST.TOMLKey) =>
  key.keys.map((k) => (k.type === "TOMLBare" ? k.name : k.value));
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((x, i) => x === b[i]);
const under = (path: readonly string[], prefix: readonly string[]) =>
  path.length > prefix.length && prefix.every((x, i) => x === path[i]);

/**
 * config.toml `text` with the key at `path` set to `value`, changing only that
 * value: an existing value is replaced in place (comments and layout kept);
 * a missing key joins its table, inline table, or dotted siblings, and a
 * missing table is added at the end. A file with errors is never edited.
 */
export function setConfigValue(
  text: string,
  path: readonly string[],
  value: SettingValue,
): ConfigEdit {
  const before = parseConfig(text);
  if (!before.ok)
    return {
      ok: false,
      reason: `config.toml:${before.errors[0]?.line ?? 1} has an error; fix it before changing settings`,
    };
  const next = edit(text, path, toml(value));
  const after = parseConfig(next);
  return after.ok && valueAt(after.config, path) === value
    ? { ok: true, text: next }
    : { ok: false, reason: "config.toml could not be updated safely" };
}

const toml = (value: SettingValue) =>
  typeof value === "string" ? JSON.stringify(value) : String(value);

function valueAt(config: unknown, path: readonly string[]): unknown {
  let at = config;
  for (const k of path)
    at =
      typeof at === "object" && at !== null
        ? (at as Record<string, unknown>)[k]
        : undefined;
  return at;
}

function edit(text: string, path: readonly string[], literal: string): string {
  const ast = parseTOML(text);
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const entries: Entry[] = [];
  const tables: AST.TOMLTable[] = [];
  const topLevel: AST.TOMLKeyValue[] = [];
  const visit = (base: string[], scope: string[], kv: AST.TOMLKeyValue) => {
    const full = [...base, ...names(kv.key)];
    entries.push({ path: full, base: scope, kv });
    if (kv.value.type === "TOMLInlineTable")
      for (const child of kv.value.body) visit(full, full, child);
  };
  for (const node of ast.body[0].body)
    if (node.type === "TOMLKeyValue") {
      topLevel.push(node);
      visit([], [], node);
    } else {
      tables.push(node);
      const key = node.resolvedKey.map(String);
      for (const kv of node.body) visit(key, key, kv);
    }

  const splice = (at: number, end: number, s: string) =>
    text.slice(0, at) + s + text.slice(end);
  /** Insert `line` as a new line after the line holding offset `at`. */
  const lineAfter = (at: number, line: string) => {
    const nl = text.indexOf("\n", at);
    if (nl >= 0) return splice(nl + 1, nl + 1, `${line}${eol}`);
    return `${text}${eol}${line}${eol}`;
  };

  const hit = entries.find((e) => same(e.path, path));
  if (hit !== undefined)
    return splice(hit.kv.value.range[0], hit.kv.value.range[1], literal);

  const section = path.slice(0, -1);
  const key = path.at(-1) ?? "";
  const line = `${key} = ${literal}`;
  if (section.length === 0) {
    const last = topLevel.at(-1);
    if (last !== undefined) return lineAfter(last.range[1], line);
    return text.trim() === "" ? `${line}${eol}` : `${line}${eol}${eol}${text}`;
  }

  const table = tables.find(
    (t) => t.kind === "standard" && same(t.resolvedKey.map(String), section),
  );
  if (table !== undefined)
    return lineAfter((table.body.at(-1) ?? table.key).range[1], line);

  const inline = entries.find(
    (e) => same(e.path, section) && e.kv.value.type === "TOMLInlineTable",
  );
  if (inline !== undefined && inline.kv.value.type === "TOMLInlineTable") {
    const body = inline.kv.value.body;
    const last = body.at(-1);
    return last === undefined
      ? splice(
          inline.kv.value.range[0],
          inline.kv.value.range[1],
          `{ ${line} }`,
        )
      : splice(last.range[1], last.range[1], `, ${line}`);
  }

  const sibling = entries.filter((e) => under(e.path, section)).at(-1);
  if (sibling !== undefined)
    return lineAfter(
      sibling.kv.range[1],
      `${path.slice(sibling.base.length).join(".")} = ${literal}`,
    );

  const head = text === "" || text.endsWith("\n") ? text : `${text}${eol}`;
  const gap = head.trim() === "" ? "" : eol;
  return `${head}${gap}[${section.join(".")}]${eol}${line}${eol}`;
}
