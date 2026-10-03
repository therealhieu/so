import type { KeyScope } from "../kernel/commands/keymap";
import type { Register } from "../kernel/editor/registers";
import { handleKey } from "../kernel/vim/engine";
import { exCompletions } from "../kernel/vim/ex";
import type { Key } from "../kernel/vim/keys";
import { searchError } from "../kernel/vim/search";
import type { VimEffect, VimState } from "../kernel/vim/types";
import { activeBuffer, activeWindow, setBuffer } from "./buffers";
import { EX_ALIASES, executeEx, runCommand } from "./commands";
import { resolveConflict } from "./disk";
import { promptKey } from "./explorer";
import { chain, message, none } from "./result";
import { autosaveNow, scheduleAutosave } from "./save";
import type { Action, AppState, BufferId, Result, WindowState } from "./types";
import type { Registries } from "./update";

const setVim = (s: AppState, patch: Partial<AppState["vim"]>): AppState => ({
  ...s,
  vim: { ...s.vim, ...patch },
});

/**
 * Route a key: an open overlay takes it; the ":" command line is edited here;
 * otherwise keymap bindings win over the vim engine. The explorer resolves
 * keys in its own mode and never passes them to the engine.
 */
export function handleKeyAction(
  s: AppState,
  a: { key: Key; now: number },
  reg: Registries,
): Result {
  if (s.overlay.kind === "conflict") return conflictKey(s, a);
  if (s.overlay.kind === "prompt") return promptKey(s, a.key, a.now);
  if (s.vim.mode === "cmdline" && s.vim.cmdline.startsWith(":"))
    return cmdlineKey(s, a, reg);
  const b = activeBuffer(s);
  const inExplorer = s.panels.explorer.focused;
  const mode = inExplorer ? "explorer" : s.vim.mode;
  const scope: KeyScope =
    b === undefined || inExplorer ? { mode } : { mode, filetype: b.fileType };
  const seq = [...s.vim.pending, a.key];
  const hit = reg.keymap.lookup(scope, seq);
  if (hit.kind === "command")
    return runCommand(setVim(s, { pending: [] }), hit.id, a.now, reg);
  if (hit.kind === "prefix") return none(setVim(s, { pending: seq }));
  const idle = s.vim.pending.length === 0 && mode !== "insert";
  if (a.key === ":" && idle && (inExplorer || mode === "normal"))
    return none(setVim(s, { mode: "cmdline", cmdline: ":", pending: [] }));
  if (inExplorer || b === undefined) return none(setVim(s, { pending: [] }));
  return runVim(s, a.key, a.now, reg);
}

function conflictKey(s: AppState, a: { key: Key; now: number }): Result {
  const choice = ({ k: "keep", t: "take", d: "diff" } as const)[
    a.key as "k" | "t" | "d"
  ];
  return choice === undefined ? none(s) : resolveConflict(s, choice, a.now);
}

/** Edit the ":" command line; Tab completes ex names, then command ids. */
function cmdlineKey(
  s: AppState,
  a: { key: Key; now: number },
  reg: Registries,
): Result {
  const line = s.vim.cmdline;
  const normal = (st: AppState) => setVim(st, { mode: "normal", cmdline: "" });
  switch (a.key) {
    case "<Esc>":
      return none(normal(s));
    case "<BS>":
      return none(
        line.length <= 1
          ? normal(s)
          : setVim(s, { cmdline: line.slice(0, -1) }),
      );
    case "<CR>":
      return executeEx(normal(s), line.slice(1), a.now, reg);
    case "<Tab>": {
      const typed = line.slice(1);
      const ft = activeBuffer(s)?.fileType;
      const ids = reg.commands.list(ft).map((c) => c.id);
      const [first] = typed.includes(" ")
        ? []
        : exCompletions(typed, [...Object.keys(EX_ALIASES), ...ids]);
      return none(
        first === undefined ? s : setVim(s, { cmdline: `:${first}` }),
      );
    }
    default:
      return none(
        [...a.key].length === 1 ? setVim(s, { cmdline: line + a.key }) : s,
      );
  }
}

/** The active window's viewport: the statusline and command line take two rows. */
const envOf = (s: AppState, w: WindowState) => ({
  topLine: w.content.scroll,
  rows: Math.max(1, s.terminal.rows - 2),
});

/** Feed one key to the engine for the active buffer and apply its effects. */
function runVim(
  s: AppState,
  key: Key,
  now: number,
  reg: Registries,
  registers = s.vim.registers,
): Result {
  const w = activeWindow(s);
  const b = w && s.buffers[w.content.bufferId];
  if (w === undefined || b === undefined) return none(s);
  const { registers: _, pendingPaste, ...vim } = s.vim;
  const env = envOf(s, w);
  const r = handleKey(
    { text: b.text, cursor: w.content.cursor, undo: b.undo, registers, vim },
    key,
    env,
  );
  const { line } = r.s.cursor;
  const top = w.content.scroll;
  const scroll =
    line < top ? line : line >= top + env.rows ? line - env.rows + 1 : top;
  const next: AppState = {
    ...s,
    buffers: { ...s.buffers, [b.id]: { ...b, text: r.s.text, undo: r.s.undo } },
    windows: {
      ...s.windows,
      byId: {
        ...s.windows.byId,
        [w.id]: { ...w, content: { ...w.content, cursor: r.s.cursor, scroll } },
      },
    },
    vim: withVim(r.s.vim, r.s.registers, pendingPaste),
  };
  return applyVimEffects(next, r.effects, {
    bufferId: b.id,
    mode: s.vim.mode,
    now,
    reg,
  });
}

const withVim = (
  vim: VimState,
  registers: AppState["vim"]["registers"],
  pendingPaste: AppState["vim"]["pendingPaste"],
): AppState["vim"] =>
  pendingPaste === undefined
    ? { ...vim, registers }
    : { ...vim, registers, pendingPaste };

/**
 * Turn engine effects into state and effects: edits mark the buffer dirty
 * and schedule autosave; leaving Insert saves; "+ yanks copy to the
 * clipboard; "+ puts wait for it; ex lines run; failed searches show E486.
 */
function applyVimEffects(
  s: AppState,
  effects: VimEffect[],
  ctx: { bufferId: BufferId; mode: string; now: number; reg: Registries },
): Result {
  let mode = ctx.mode;
  return effects.reduce<Result>(
    (r, e) =>
      chain(r, (st) => {
        const b = st.buffers[ctx.bufferId];
        if (b === undefined) return none(st);
        switch (e.kind) {
          case "changed": {
            const dirty = b.text.version !== b.savedVersion;
            const marked = setBuffer(st, b.id, { dirty });
            return dirty
              ? scheduleAutosave(marked, b.id, ctx.now)
              : none(marked);
          }
          case "yank":
            return e.register === "+"
              ? {
                  state: st,
                  effects: [{ kind: "clipboardWrite", text: e.text }],
                }
              : none(st);
          case "paste":
            return {
              state: setVim(st, {
                pendingPaste: { bufferId: b.id, before: e.before },
              }),
              effects: [{ kind: "clipboardRead" }],
            };
          case "modeChanged": {
            const left = mode === "insert" && e.mode !== "insert";
            mode = e.mode;
            return left ? autosaveNow(st, b.id, ctx.now) : none(st);
          }
          case "ex":
            return executeEx(st, e.line, ctx.now, ctx.reg);
          case "search": {
            const error = searchError(b.text, e.pattern);
            return error === undefined ? none(st) : message(st, error, "error");
          }
        }
      }),
    none(s),
  );
}

/**
 * The clipboard answered. A pending "+ put inserts its text, or
 * `registers["+"]` when the clipboard failed or was empty; a failure is shown.
 */
export function onClipboardText(
  s: AppState,
  a: Extract<Action, { type: "clipboardText" }>,
  reg: Registries,
): Result {
  const failed =
    a.error === undefined
      ? none(s)
      : message(s, "clipboard unavailable", "error");
  const pending = s.vim.pendingPaste;
  if (pending === undefined) return failed;
  const { pendingPaste: _, ...vim } = failed.state.vim;
  const cleared: AppState = { ...failed.state, vim };
  const value: Register | undefined =
    a.text !== ""
      ? { text: a.text, linewise: a.text.endsWith("\n") }
      : s.vim.registers.get("+");
  const b = activeBuffer(cleared);
  if (
    value === undefined ||
    b?.id !== pending.bufferId ||
    cleared.vim.mode !== "normal"
  )
    return none(cleared);
  return paste(cleared, value, pending.before, reg);
}

/**
 * Put `value` with the engine's own `p`/`P` through a scratch unnamed
 * register; the registers are left as they were. The clipboard reply has
 * no time, so the autosave is due at the next timer (now = 0).
 */
function paste(
  s: AppState,
  value: Register,
  before: boolean,
  reg: Registries,
): Result {
  const key = before ? "P" : "p";
  const r = runVim(s, key, 0, reg, s.vim.registers.yank('"', value));
  const vim = {
    ...r.state.vim,
    registers: s.vim.registers,
    lastChange: { keys: ['"', "+", key] },
  };
  return { state: { ...r.state, vim }, effects: r.effects };
}
