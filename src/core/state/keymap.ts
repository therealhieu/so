import type { AppConfig } from "../config/schema";
import type { Binding } from "../kernel/commands/defaults";
import { Keymap, type KeyScope } from "../kernel/commands/keymap";
import { splitKeys } from "../kernel/vim/keys";
import { activeBuffer } from "./buffers";
import type { AppState } from "./types";
import type { Registries } from "./update";

/** A binding value that starts with `<` is keys typed into the engine (`"<Esc>"`), not a command id. */
export const isKeySequence = (id: string): boolean => id.startsWith("<");

/** The config's `[keys.<mode>]` and `[filetypes.<id>.keys.<mode>]` entries as bindings. */
function configBindings(config: AppConfig): Binding[] {
  const from = (keys: AppConfig["keys"], filetype?: string): Binding[] =>
    Object.entries(keys).flatMap(([mode, table]) =>
      Object.entries(table).map(([seq, id]): Binding => {
        const scope: KeyScope =
          filetype === undefined ? { mode } : { mode, filetype };
        return { scope, seq, id, overridden: true };
      }),
    );
  return [
    ...from(config.keys),
    ...Object.entries(config.filetypes).flatMap(([ft, { keys }]) =>
      from(keys, ft),
    ),
  ];
}

/**
 * The registered bindings with the config's merged in: a config binding
 * replaces a registered one with the same scope and key sequence, and one
 * bound to `""` only removes it.
 */
export function effectiveBindings(
  reg: Pick<Registries, "bindings">,
  config: AppConfig,
): readonly Binding[] {
  const slot = (b: Binding) =>
    [
      b.scope.mode,
      b.scope.filetype ?? "",
      ...splitKeys(b.seq, config.leader),
    ].join("\u0000");
  const own = configBindings(config);
  const replaced = new Set(own.map(slot));
  return [
    ...own.filter((b) => b.id !== ""),
    ...reg.bindings.filter((b) => !replaced.has(slot(b))),
  ];
}

const memo = new WeakMap<Registries, WeakMap<AppConfig, Keymap>>();

/** The key trie for `config`; the same registries and config object give the same trie. */
export function keymapFor(reg: Registries, config: AppConfig): Keymap {
  let byConfig = memo.get(reg);
  if (byConfig === undefined) {
    byConfig = new WeakMap();
    memo.set(reg, byConfig);
  }
  let km = byConfig.get(config);
  if (km === undefined) {
    km = new Keymap({ leader: config.leader });
    for (const b of effectiveBindings(reg, config))
      km.bind(b.scope, b.seq, b.id);
    byConfig.set(config, km);
  }
  return km;
}

/**
 * Where keys resolve now: the explorer's mode, whose leader keys fall back to
 * Normal mode's, or the vim mode and the active buffer's file type. A page
 * in a browser window resolves as file type `browser`, and a drawing in an
 * image window as `image`, so their source, shown as text, keeps the text
 * keys.
 */
export function keyScope(s: AppState): KeyScope {
  if (s.panels.explorer.focused)
    return { mode: "explorer", leaderFrom: "normal" };
  const b = activeBuffer(s);
  const mode = s.vim.mode;
  if (b === undefined) return { mode };
  const editor = s.windows.byId[s.windows.active]?.content.editor;
  const shown = editor === "browser" || editor === "image";
  return { mode, filetype: shown ? editor : b.fileType };
}
