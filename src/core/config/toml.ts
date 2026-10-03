import { type AST, getStaticTOMLValue, parseTOML } from "toml-eslint-parser";
import type { z } from "zod";
import { type AppConfig, ConfigSchema } from "./schema";

/** A config problem at its 1-based line in config.toml. */
export type ConfigError = { line: number; message: string };
/** One `[keys.<mode>]` or `[filetypes.<id>.keys.<mode>]` entry and its line. */
export type BindingSource = {
  mode: string;
  filetype?: string;
  seq: string;
  id: string;
  line: number;
};
export type ConfigResult =
  | { ok: true; config: AppConfig; bindings: BindingSource[] }
  | { ok: false; errors: ConfigError[] };

type Path = readonly PropertyKey[];
const pathKey = (path: Path) => path.map(String).join("\u0000");
const dotted = (path: Path) => path.map(String).join(".");

/** Parse and validate config.toml; every error names its line, in source order. */
export function parseConfig(text: string): ConfigResult {
  let ast: AST.TOMLProgram;
  try {
    ast = parseTOML(text);
  } catch (e) {
    const line = (e as { lineNumber?: number }).lineNumber ?? 1;
    return {
      ok: false,
      errors: [{ line: Math.max(1, line), message: (e as Error).message }],
    };
  }
  const lineOf = keyLines(ast);
  const parsed = ConfigSchema.safeParse(getStaticTOMLValue(ast));
  if (!parsed.success)
    return {
      ok: false,
      errors: parsed.error.issues
        .flatMap((i) => issueErrors(i, lineOf))
        .sort((a, b) => a.line - b.line),
    };
  return {
    ok: true,
    config: parsed.data,
    bindings: bindingSources(parsed.data, lineOf),
  };
}

/** One error per zod issue, or per key for an unrecognized-keys issue. */
function issueErrors(
  i: z.core.$ZodIssue,
  lineOf: (path: Path) => number,
): ConfigError[] {
  if (i.code === "unrecognized_keys")
    return i.keys.map((k) => {
      const path = [...i.path, k];
      return { line: lineOf(path), message: `unknown key "${dotted(path)}"` };
    });
  return [{ line: lineOf(i.path), message: `${dotted(i.path)}: ${i.message}` }];
}

/**
 * The line of every key and table header, by full key path. A path that is
 * not in the file (a missing table) takes the line of its deepest ancestor.
 */
function keyLines(ast: AST.TOMLProgram): (path: Path) => number {
  const lines = new Map<string, number>();
  const note = (path: Path, line: number) => {
    for (let n = 1; n <= path.length; n++) {
      const k = pathKey(path.slice(0, n));
      if (!lines.has(k)) lines.set(k, line);
    }
  };
  const names = (key: AST.TOMLKey) =>
    key.keys.map((k) => (k.type === "TOMLBare" ? k.name : k.value));
  const visit = (base: Path, kv: AST.TOMLKeyValue) => {
    const path = [...base, ...names(kv.key)];
    note(path, kv.loc.start.line);
    if (kv.value.type === "TOMLInlineTable")
      for (const child of kv.value.body) visit(path, child);
  };
  for (const node of ast.body[0].body) {
    if (node.type === "TOMLKeyValue") {
      visit([], node);
      continue;
    }
    note(node.resolvedKey, node.loc.start.line);
    for (const kv of node.body) visit(node.resolvedKey, kv);
  }
  return (path) => {
    for (let n = path.length; n > 0; n--) {
      const line = lines.get(pathKey(path.slice(0, n)));
      if (line !== undefined) return line;
    }
    return 1;
  };
}

function bindingSources(
  config: AppConfig,
  lineOf: (path: Path) => number,
): BindingSource[] {
  const out: BindingSource[] = [];
  const add = (
    keys: AppConfig["keys"],
    prefix: Path,
    filetype?: string,
  ): void => {
    for (const [mode, table] of Object.entries(keys))
      for (const [seq, id] of Object.entries(table)) {
        const line = lineOf([...prefix, mode, seq]);
        out.push(
          filetype === undefined
            ? { mode, seq, id, line }
            : { mode, filetype, seq, id, line },
        );
      }
  };
  add(config.keys, ["keys"]);
  for (const [ft, { keys }] of Object.entries(config.filetypes))
    add(keys, ["filetypes", ft, "keys"], ft);
  return out.sort((a, b) => a.line - b.line);
}
