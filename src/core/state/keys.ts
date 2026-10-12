import type { Binding } from "../kernel/commands/defaults";
import type { Command } from "../kernel/commands/registry";
import type { Register } from "../kernel/editor/registers";
import { handleKey } from "../kernel/vim/engine";
import { exCompletions } from "../kernel/vim/ex";
import { type Key, splitKeys } from "../kernel/vim/keys";
import { searchError } from "../kernel/vim/search";
import type { VimEffect, VimEnv, VimState } from "../kernel/vim/types";
import {
  cellEditKey,
  editingCell,
  searchingBase,
  searchKey,
} from "./base-commands";
import {
  activeBuffer,
  activeWindow,
  readOnlyHint,
  readOnlyView,
  setBuffer,
} from "./buffers";
import { calendarKey } from "./calendar";
import { maybeSignature } from "./code-completion";
import {
  type CommandContext,
  type CommandResult,
  EX_ALIASES,
  executeEx,
  runCommand,
} from "./commands";
import { completionKey, maybeCompletion } from "./completion";
import { resolveConflict } from "./disk";
import { promptKey } from "./explorer";
import { pushJump } from "./jumps";
import { isKeySequence, keymapFor, keyScope } from "./keymap";
import { bindingPromptKey } from "./keymap-edit";
import { bodyRows } from "./layout";
import { withoutFloat } from "./lsp";
import { notePromptKey, pdfMenuKey } from "./pdf-annotate";
import { pdfSearching, pdfSearchKey } from "./pdf-tools";
import { pickerKey, refreshPicker } from "./picker";
import { chain, message, none } from "./result";
import { autosaveNow, scheduleAutosave } from "./save";
import { settingPromptKey } from "./settings";
import { panelFocused, sidePanelKey } from "./side-panel";
import type { Action, AppState, BufferId, Result, WindowState } from "./types";
import type { Registries } from "./update";
import { armWhichKey, noMapping, whichKeyKey } from "./whichkey";
import { zoomKey } from "./zoom";

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
  if (s.overlay.kind === "completion") {
    const r = completionKey(s, a, reg);
    if (r !== undefined) return r;
  }
  // An open info float closes on <Esc>; the key still routes, so Esc also leaves Insert.
  const from = a.key === "<Esc>" ? withoutFloat(s) : s;
  const r = routeKey(from, a, reg);
  return r.state.overlay.kind === "completion" ||
    r.state.vim.mode === "insert" ||
    from.vim.mode === "insert"
    ? maybeSignature(maybeCompletion(r, a.key), a.key)
    : r;
}

function routeKey(
  s: AppState,
  a: { key: Key; now: number },
  reg: Registries,
): Result {
  switch (s.overlay.kind) {
    case "conflict":
      return conflictKey(s, a, reg);
    case "prompt": {
      const p = s.overlay.prompt;
      if (p.binding !== undefined)
        return chain(bindingPromptKey(s, p, a.key, reg), (st) =>
          refreshPicker(st, reg, "help"),
        );
      if (p.pdfNote !== undefined) return notePromptKey(s, p, a.key, a.now);
      return p.setting === undefined
        ? promptKey(s, a.key, a.now, reg)
        : settingPromptKey(s, p, a.key);
    }
    case "whichKey":
      return (
        whichKeyKey(s, a, reg) ??
        bindingOrVim({ ...s, overlay: { kind: "none" } }, a, reg)
      );
    case "picker":
    case "palette":
    case "help":
      return pickerKey(s, a, reg);
    case "calendar":
      return calendarKey(s, a, reg);
    case "zoom":
      return zoomKey(s, a);
    case "gitHunk": {
      // Esc and q only close the float; any other key closes it and runs.
      const closed: AppState = { ...s, overlay: { kind: "none" } };
      return a.key === "<Esc>" || a.key === "q"
        ? none(closed)
        : routeKey(closed, a, reg);
    }
    case "pdfMenu":
      // Its own keys act; any other key closes it and runs.
      return (
        pdfMenuKey(s, a.key, a.now) ??
        routeKey({ ...s, overlay: { kind: "none" } }, a, reg)
      );
  }
  if (editingCell(s)) return cellEditKey(s, a, reg);
  if (searchingBase(s)) return searchKey(s, a);
  if (s.vim.mode === "cmdline" && s.vim.cmdline.startsWith(":"))
    return cmdlineKey(s, a, reg);
  if (pdfSearching(s)) return pdfSearchKey(s, a);
  return bindingOrVim(s, a, reg);
}

/** No overlay and no ":" line: the side panel, then keymap bindings, then the engine. */
function bindingOrVim(
  s: AppState,
  a: { key: Key; now: number },
  reg: Registries,
): Result {
  const inPanel = panelFocused(s);
  if (inPanel && s.vim.pending.length === 0) {
    const r = sidePanelKey(s, a, reg);
    if (r !== undefined) return r;
  }
  const b = activeBuffer(s);
  const inExplorer = s.panels.explorer.focused;
  const scope = keyScope(s);
  const { mode } = scope;
  const keymap = keymapFor(reg, s.config);
  const seq = [...s.vim.pending, a.key];
  const hit = keymap.lookup(scope, seq);
  // Insert mode holds a binding's first keys back from the text until it completes or misses.
  const held = mode === "insert" ? s.vim.pending : [];
  if (hit.kind === "command") {
    const r = runBinding(setVim(s, { pending: [] }), hit.id, a.now, reg);
    return held.length === 0
      ? r
      : { ...r, effects: [CANCEL_KEY_TIMEOUT, ...r.effects] };
  }
  if (hit.kind === "prefix")
    return mode === "insert"
      ? {
          state: setVim(s, { pending: seq }),
          effects: [
            {
              kind: "startTimer",
              id: "keyTimeout",
              ms: s.config.editor.keyTimeout,
            },
          ],
        }
      : armWhichKey(setVim(s, { pending: seq }), scope);
  if (held.length > 0)
    return chain(
      {
        state: setVim(s, { pending: [] }),
        effects: [CANCEL_KEY_TIMEOUT],
      },
      (st) =>
        chain(typeKeys(st, held, a.now, reg), (typed) =>
          bindingOrVim(typed, a, reg),
        ),
    );
  // A leader prefix has no vim meaning, so its unbound continuation stops here.
  if (
    s.vim.pending[0] === s.config.leader &&
    keymap.lookup(scope, s.vim.pending).kind === "prefix"
  )
    return noMapping(s, seq);
  const idle = s.vim.pending.length === 0 && mode !== "insert";
  if (a.key === ":" && idle && (inExplorer || mode === "normal"))
    return none(setVim(s, { mode: "cmdline", cmdline: ":", pending: [] }));
  // A non-text editor kind handles keys only through its bindings.
  if (
    inExplorer ||
    inPanel ||
    b === undefined ||
    activeWindow(s)?.content.editor !== "text"
  )
    return none(setVim(s, { pending: [] }));
  return runVim(s, a.key, a.now, reg);
}

const CANCEL_KEY_TIMEOUT = { kind: "cancelTimer", id: "keyTimeout" } as const;

/** Whether keys typed now reach the vim engine: a text window has focus. */
function engineFocused(s: AppState): boolean {
  return (
    !s.panels.explorer.focused &&
    !panelFocused(s) &&
    activeBuffer(s) !== undefined &&
    activeWindow(s)?.content.editor === "text"
  );
}

/** A bound key sequence types its keys into the engine, past the keymap; any other id runs its command. */
function runBinding(
  s: AppState,
  id: string,
  now: number,
  reg: Registries,
): Result {
  if (!isKeySequence(id)) return runCommand(s, id, now, reg);
  return engineFocused(s)
    ? typeKeys(s, splitKeys(id, s.config.leader), now, reg)
    : none(s);
}

/** The held start of an Insert-mode binding waited too long: it is typed as text. */
export function onKeyTimeout(
  s: AppState,
  now: number,
  reg: Registries,
): Result {
  const held = s.vim.pending;
  if (s.vim.mode !== "insert" || held.length === 0) return none(s);
  const cleared = setVim(s, { pending: [] });
  return s.overlay.kind === "none" || s.overlay.kind === "completion"
    ? typeKeys(cleared, held, now, reg)
    : none(cleared);
}

/** `k` keep, `t` take, `d` toggle the diff, `q` back from the diff; other keys wait. */
function conflictKey(
  s: AppState,
  a: { key: Key; now: number },
  reg: Registries,
): Result {
  const back =
    a.key === "q" && s.overlay.kind === "conflict" && s.overlay.showDiff;
  const choice = back
    ? "diff"
    : ({ k: "keep", t: "take", d: "diff" } as const)[a.key as "k" | "t" | "d"];
  return choice === undefined
    ? none(s)
    : resolveConflict(s, choice, a.now, reg);
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
      const [first] = cmdlineCompletions(s, reg);
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

const EX_NAMES = Object.keys(EX_ALIASES);
const bare = (name: string) => name.replace(/!$/, "");
/** Full ex names only: an abbreviation ("vs") gives way to the name it shortens ("vsplit"). */
const FULL_EX_NAMES = EX_NAMES.filter(
  (n) =>
    !EX_NAMES.some(
      (m) =>
        m.length > n.length &&
        EX_ALIASES[m] === EX_ALIASES[n] &&
        m.endsWith("!") === n.endsWith("!") &&
        bare(m).startsWith(bare(n)),
    ),
);

/**
 * What Tab offers for the ":" line, as Vim does: full ex names first, then
 * the command ids available for the active file type. Empty after a space.
 */
export function cmdlineCompletions(
  s: AppState,
  reg: Pick<Registries, "commands">,
): string[] {
  const typed = s.vim.cmdline.slice(1);
  if (typed.includes(" ")) return [];
  const ids = reg.commands.list(activeBuffer(s)?.fileType).map((c) => c.id);
  return exCompletions(typed, [...FULL_EX_NAMES, ...ids]);
}

/** The active window's viewport (the body between the bufferline and the statusline) and tab width. */
const envOf = (s: AppState, w: WindowState): VimEnv => ({
  topLine: w.content.scroll,
  rows: Math.max(1, bodyRows(s.terminal)),
  tabWidth: s.config.editor.tabWidth,
});

/** Feed keys to the engine one by one, as if typed. */
export function typeKeys(
  s: AppState,
  keys: readonly Key[],
  now: number,
  reg: Registries,
): Result {
  return keys.reduce<Result>(
    (r, key) => chain(r, (st) => runVim(st, key, now, reg)),
    none(s),
  );
}

/** Normal `Enter` where no file type binds it: the next line's first non-blank, as in Vim. */
export const nextLineCommand: Command<CommandContext, CommandResult> = {
  id: "cursor.nextLine",
  title: "Next line",
  run: (c) => typeKeys(c.state, ["j", "^"], c.now, c.reg),
};

export const editorBindings: readonly Binding[] = [
  { scope: { mode: "normal" }, seq: "<CR>", id: "cursor.nextLine" },
];

/** A refused edit leaves no pending operator and ends Visual mode. */
function refusedKey(s: AppState): AppState {
  const { visualAnchor: _, ...vim } = s.vim;
  return s.vim.mode === "visual" || s.vim.mode === "visualLine"
    ? { ...s, vim: { ...vim, mode: "normal", pending: [] } }
    : setVim(s, { pending: [] });
}

/**
 * Feed one key to the engine for the active buffer and apply its effects. In
 * a read-only view a key that would edit the text or enter Insert is dropped
 * whole, with a hint; motions still move.
 */
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
  if (
    (r.s.text !== b.text || r.s.vim.mode === "insert") &&
    readOnlyView(reg, b)
  )
    return message(refusedKey(s), readOnlyHint(b));
  const { line } = r.s.cursor;
  const top = w.content.scroll;
  const scroll =
    line < top ? line : line >= top + env.rows ? line - env.rows + 1 : top;
  const edited = setBuffer(s, b.id, { text: r.s.text, undo: r.s.undo }, reg);
  const next: AppState = {
    ...edited,
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
 * clipboard; "+ puts wait for it; ex lines run; failed searches show E486;
 * jump motions record where they left.
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
          case "searchWrapped":
            return message(
              st,
              e.dir === 1
                ? "search hit BOTTOM, continuing at TOP"
                : "search hit TOP, continuing at BOTTOM",
              "warn",
            );
          case "jumped":
            return none({
              ...st,
              jumps: pushJump(st.jumps, { path: b.path, ...e.from }),
            });
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
