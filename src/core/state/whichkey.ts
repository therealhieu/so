import type { KeyScope } from "../kernel/commands/keymap";
import { type Key, splitKeys } from "../kernel/vim/keys";
import { parseKeys } from "../kernel/vim/parser";
import { runCommand } from "./commands";
import { isKeySequence, keymapFor, keyScope } from "./keymap";
import { message, none } from "./result";
import type { AppState, Result } from "./types";
import type { Registries } from "./update";

/** How long a prefix must stay pending before the popup opens. */
export const WHICH_KEY_MS = 300;

export type WhichKeyRow = { key: Key; label: string; group: boolean };

/** A key sequence as the user writes it: the leader as `<leader>`. */
export const seqLabel = (keys: readonly Key[], leader: Key): string =>
  keys
    .map((k) => (k === leader ? "<leader>" : k === " " ? "<Space>" : k))
    .join("");

const withPending = (s: AppState, pending: Key[]): AppState => ({
  ...s,
  vim: { ...s.vim, pending },
});

/** A key extended a prefix: (re)start the idle timer; the popup, if open, follows the prefix. */
export function armWhichKey(s: AppState, scope: KeyScope): Result {
  const state: AppState =
    s.overlay.kind === "whichKey"
      ? {
          ...s,
          overlay: {
            kind: "whichKey",
            whichKey: { prefix: s.vim.pending, scope },
          },
        }
      : s;
  return {
    state,
    effects: [{ kind: "startTimer", id: "whichKey", ms: WHICH_KEY_MS }],
  };
}

/** The prefix idled: open the popup when it is still a pending prefix. */
export function onWhichKeyTimer(s: AppState, reg: Registries): Result {
  const prefix = s.vim.pending;
  if (s.overlay.kind !== "none" || prefix.length === 0) return none(s);
  const scope = keyScope(s);
  if (keymapFor(reg, s.config).lookup(scope, prefix).kind !== "prefix")
    return none(s);
  return none({
    ...s,
    overlay: { kind: "whichKey", whichKey: { prefix, scope } },
  });
}

const close = (s: AppState): AppState => ({
  ...withPending(s, []),
  overlay: { kind: "none" },
});

/** The unbound continuation of a prefix: nothing runs, and the message says so. */
export const noMapping = (s: AppState, seq: readonly Key[]): Result =>
  message(close(s), `no mapping for ${seqLabel(seq, s.config.leader)}`);

/**
 * Whether the engine accepts `seq` in `mode` as a command or the start of
 * one. Insert and command-line modes consume every key; the explorer has no
 * engine.
 */
function vimContinues(mode: string, seq: readonly Key[]): boolean {
  if (mode === "insert" || mode === "cmdline") return true;
  if (mode !== "normal" && mode !== "visual" && mode !== "visualLine")
    return false;
  return parseKeys(seq, mode).kind !== "invalid";
}

/**
 * Keys while the popup is open: descend, run, `<BS>` up a level, `<Esc>` close.
 * `undefined` hands the key back with the prefix still pending: outside a
 * leader prefix, an unbound key that Vim understands (`gg` after `g`) belongs
 * to the engine, as if the popup had never opened.
 */
export function whichKeyKey(
  s: AppState,
  a: { key: Key; now: number },
  reg: Registries,
): Result | undefined {
  if (s.overlay.kind !== "whichKey") return none(s);
  const { prefix, scope } = s.overlay.whichKey;
  if (a.key === "<Esc>") return none(close(s));
  if (a.key === "<BS>") {
    const up = prefix.slice(0, -1);
    return up.length === 0
      ? none(close(s))
      : none({
          ...withPending(s, up),
          overlay: { kind: "whichKey", whichKey: { prefix: up, scope } },
        });
  }
  const seq = [...prefix, a.key];
  const hit = keymapFor(reg, s.config).lookup(scope, seq);
  // A bound key sequence goes back to the keymap, which types it into the engine.
  if (hit.kind === "command" && isKeySequence(hit.id)) return undefined;
  if (hit.kind === "command") return runCommand(close(s), hit.id, a.now, reg);
  if (hit.kind === "prefix")
    return none({
      ...withPending(s, seq),
      overlay: { kind: "whichKey", whichKey: { prefix: seq, scope } },
    });
  if (prefix[0] !== s.config.leader && vimContinues(scope.mode, seq))
    return undefined;
  return noMapping(s, seq);
}

const TAB_COMMAND = /^buffer\.goto\d$/;

/**
 * The popup's rows: direct actions (command titles) first, then `+groups`,
 * each alphabetical by key; the keys that go to the Nth tab share one row.
 * Only keys bound in the popup's scope appear.
 */
export function whichKeyRows(s: AppState, reg: Registries): WhichKeyRow[] {
  if (s.overlay.kind !== "whichKey") return [];
  const { prefix, scope } = s.overlay.whichKey;
  const { leader } = s.config;
  const hit = keymapFor(reg, s.config).lookup(scope, prefix);
  if (hit.kind !== "prefix") return [];
  const groups = new Map(
    Object.entries(reg.groups).map(([seq, label]) => [
      splitKeys(seq, leader).join("\u0000"),
      label,
    ]),
  );
  // The nine tab keys read as one row.
  const tabKeys = hit.next.filter((i) => i.id?.match(TAB_COMMAND) != null);
  const tabRow: WhichKeyRow[] =
    tabKeys.length > 1
      ? [
          {
            key: `${tabKeys[0]?.key}-${tabKeys.at(-1)?.key}`,
            label: "Go to buffer N",
            group: false,
          },
        ]
      : [];
  const rest =
    tabRow.length > 0 ? hit.next.filter((i) => !tabKeys.includes(i)) : hit.next;
  const rows = rest.map((item): WhichKeyRow => {
    if (item.id !== undefined)
      return {
        key: item.key,
        label: isKeySequence(item.id)
          ? `→ ${item.id}`
          : (reg.commands.get(item.id)?.title ?? item.id),
        group: false,
      };
    const label = groups.get([...prefix, item.key].join("\u0000")) ?? "…";
    return { key: item.key, label: `+${label}`, group: true };
  });
  return [...rows, ...tabRow].sort(
    (a, b) =>
      Number(a.group) - Number(b.group) ||
      (a.key < b.key ? -1 : a.key > b.key ? 1 : 0),
  );
}
