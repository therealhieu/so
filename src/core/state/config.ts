import { defaults } from "../config/schema";
import type { BindingSource, ConfigError } from "../config/toml";
import type { CommandContext } from "./commands";
import { relistShown } from "./explorer";
import { none, toast } from "./result";
import type { Action, AppState, Result } from "./types";
import type { Registries } from "./update";

/** Modes a config binding may name: the vim modes and the explorer. */
const MODES: ReadonlySet<string> = new Set([
  "normal",
  "insert",
  "visual",
  "visualLine",
  "cmdline",
  "explorer",
]);

/** Each config binding naming an unknown command id, file type, or mode, at its line. */
export function validateBindings(
  reg: Pick<Registries, "commands" | "fileTypes">,
  bindings: readonly BindingSource[],
): ConfigError[] {
  return bindings.flatMap((b) => {
    const errors: ConfigError[] = [];
    if (reg.commands.get(b.id) === undefined)
      errors.push({ line: b.line, message: `unknown command id "${b.id}"` });
    if (b.filetype !== undefined && reg.fileTypes.get(b.filetype) === undefined)
      errors.push({
        line: b.line,
        message: `unknown file type "${b.filetype}"`,
      });
    if (!MODES.has(b.mode))
      errors.push({ line: b.line, message: `unknown mode "${b.mode}"` });
    return errors;
  });
}

/**
 * Apply a loaded config whole, or not at all. On errors one toast names the
 * first and counts the rest; at startup the defaults apply, and a reload
 * keeps the current config.
 */
export function onConfigLoaded(
  s: AppState,
  a: Extract<Action, { type: "configLoaded" }>,
  reg: Registries,
): Result {
  const errors = a.result.ok
    ? validateBindings(reg, a.result.bindings)
    : a.result.errors;
  if (a.result.ok && errors.length === 0) {
    const next = { ...s, config: a.result.config };
    const relisted =
      next.config.explorer.dotfiles !== s.config.explorer.dotfiles &&
      s.panels.explorer.entries[""] !== undefined;
    return relisted ? relistShown(next) : none(next);
  }
  const [first] = errors;
  const more = errors.length > 1 ? ` (+${errors.length - 1} more)` : "";
  const text = `config.toml:${first?.line ?? 1}: ${first?.message ?? "invalid config"}${more}`;
  return toast(a.reload ? s : { ...s, config: defaults }, "error", text);
}

/** `:ConfigReload`: read config.toml again. */
export const reloadConfig = (c: CommandContext): Result => ({
  state: c.state,
  effects: [{ kind: "loadConfig" }],
});
