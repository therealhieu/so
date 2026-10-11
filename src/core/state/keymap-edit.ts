import type { AppConfig } from "../config/schema";
import type { Binding } from "../kernel/commands/defaults";
import { splitKeys } from "../kernel/vim/keys";
import { activeBuffer } from "./buffers";
import { MODES, validateBindings } from "./config";
import { movedCaret, typed } from "./explorer";
import { effectiveBindings, isKeySequence } from "./keymap";
import { message, none, toast } from "./result";
import type {
  Action,
  AppState,
  PickerItem,
  PickerState,
  PromptState,
  Result,
} from "./types";
import type { Registries } from "./update";

type Scope = { mode: string; filetype?: string };
type Keymaps = Pick<AppConfig, "keys" | "filetypes">;
type BindingPrompt = Extract<PromptState, { binding: object }>;
/** One change to a scope's table: `id` binds `seq`, no `id` removes the line. */
type Entry = { seq: string; id?: string };

const SEP = "\u0000";

const itemKey = (b: Binding) =>
  [b.scope.mode, b.scope.filetype ?? "", b.seq].join(SEP);

const scopeLabel = (b: Binding) =>
  b.scope.filetype ?? (b.scope.mode === "normal" ? "" : b.scope.mode);

/** What a binding runs, as the keymap shows it: a command's title, or `→ <Esc>` for keys. */
const targetLabel = (reg: Registries, id: string) =>
  isKeySequence(id) ? `→ ${id}` : (reg.commands.get(id)?.title ?? id);

/** A keymap row: a binding in effect, or a built-in one your config switched `off`. */
type Row = Binding & { off?: true };

const scopeOf = (b: Binding): Scope =>
  b.scope.filetype === undefined
    ? { mode: b.scope.mode }
    : { mode: b.scope.mode, filetype: b.scope.filetype };

const sameScope = (b: Binding, sc: Scope) =>
  b.scope.mode === sc.mode && b.scope.filetype === sc.filetype;

/** `seq` as the keymap resolves it, so `<leader>w` and `<Space>w` match. */
const slotOf = (s: AppState, seq: string) =>
  splitKeys(seq, s.config.leader).join(SEP);

/** The built-in binding on `seq` in the scope, whatever your config does to it. */
const builtinAt = (s: AppState, reg: Registries, sc: Scope, seq: string) =>
  reg.bindings.find(
    (b) => sameScope(b, sc) && slotOf(s, b.seq) === slotOf(s, seq),
  );

/** Your config's entries on `seq` in the scope, as written: `[keys, value]`. */
function configEntries(
  s: AppState,
  sc: Scope,
  seq: string,
): [string, string][] {
  const table =
    sc.filetype === undefined
      ? s.config.keys[sc.mode]
      : s.config.filetypes[sc.filetype]?.keys[sc.mode];
  return Object.entries(table ?? {}).filter(
    ([k]) => slotOf(s, k) === slotOf(s, seq),
  );
}

/**
 * The keymap's rows: every mode, global bindings and the active file type's,
 * then the built-in ones your config switched off, so they can be restored.
 */
function rows(s: AppState, reg: Registries): Row[] {
  const ft = activeBuffer(s)?.fileType;
  const shown = (b: Binding) =>
    (b.scope.filetype === undefined || b.scope.filetype === ft) &&
    (isKeySequence(b.id) || reg.commands.get(b.id) !== undefined);
  const off = reg.bindings
    .filter(
      (b) =>
        shown(b) &&
        configEntries(s, scopeOf(b), b.seq).some(([, id]) => id === ""),
    )
    .map((b): Row => ({ ...b, off: true }));
  return [...effectiveBindings(reg, s.config).filter(shown), ...off];
}

/** The keymap's items: keys and what they run, then the command id, scope, and `●` for yours or `off`. */
export function keymapCandidates(s: AppState, reg: Registries) {
  return rows(s, reg).map((b) => ({
    key: itemKey(b),
    text: `${b.seq}  ${targetLabel(reg, b.id)}`,
    detail: [
      isKeySequence(b.id) ? "" : b.id,
      scopeLabel(b),
      b.off ? "off" : b.overridden ? "●" : "",
    ]
      .filter((x) => x !== "")
      .join("  "),
  }));
}

const rowOf = (s: AppState, reg: Registries, item: PickerItem) =>
  rows(s, reg).find((b) => itemKey(b) === item.key);

const tablePath = (sc: Scope) =>
  sc.filetype === undefined
    ? ["keys", sc.mode]
    : ["filetypes", sc.filetype, "keys", sc.mode];

/** `config` with `entry` applied to the scope's table. */
function withEntry(config: AppConfig, sc: Scope, entry: Entry): AppConfig {
  const edit = (table: Record<string, string> = {}) => {
    const { [entry.seq]: _, ...rest } = table;
    return entry.id === undefined ? rest : { ...rest, [entry.seq]: entry.id };
  };
  if (sc.filetype === undefined)
    return {
      ...config,
      keys: { ...config.keys, [sc.mode]: edit(config.keys[sc.mode]) },
    };
  const ft = config.filetypes[sc.filetype]?.keys ?? {};
  return {
    ...config,
    filetypes: {
      ...config.filetypes,
      [sc.filetype]: { keys: { ...ft, [sc.mode]: edit(ft[sc.mode]) } },
    },
  };
}

/**
 * How to take `seq` out of the scope: a built-in binding there is bound to
 * `""`, so it stays off; otherwise your own line goes.
 */
function unbindEntry(
  s: AppState,
  reg: Registries,
  sc: Scope,
  seq: string,
): Entry {
  return builtinAt(s, reg, sc, seq) === undefined ? { seq } : { seq, id: "" };
}

/**
 * What `entries` would change about built-in bindings that are in effect
 * now, one line each; removing your own line only brings a built-in back.
 */
function builtinChanges(
  s: AppState,
  reg: Registries,
  sc: Scope,
  entries: readonly Entry[],
): string[] {
  return entries.flatMap((e) => {
    const b = builtinAt(s, reg, sc, e.seq);
    if (
      e.id === undefined ||
      b === undefined ||
      b.id === e.id ||
      configEntries(s, sc, e.seq).length > 0
    )
      return [];
    const was = targetLabel(reg, b.id);
    return [
      e.id === ""
        ? `${b.seq} stops running "${was}"`
        : `${b.seq} runs ${targetLabel(reg, e.id)} instead of "${was}"`,
    ];
  });
}

/** `entries` apply now and are written to config.toml in one go. */
function applyEntries(s: AppState, sc: Scope, entries: Entry[]): Result {
  const previous: Keymaps = {
    keys: s.config.keys,
    filetypes: s.config.filetypes,
  };
  const config = entries.reduce((c, e) => withEntry(c, sc, e), s.config);
  return {
    state: { ...s, config },
    effects: [
      {
        kind: "writeBindings",
        edits: entries.map((e) => ({
          path: [...tablePath(sc), e.seq],
          ...(e.id === undefined ? {} : { id: e.id }),
        })),
        previous,
      },
    ],
  };
}

const scopeText = (sc: Scope) =>
  sc.filetype === undefined ? sc.mode : `${sc.mode}, ${sc.filetype}`;

const pickerIn = (s: AppState): PickerState | undefined =>
  s.overlay.kind === "help" ? s.overlay.picker : undefined;

const prompting = (s: AppState, prompt: PromptState): AppState => ({
  ...s,
  overlay: { kind: "prompt", prompt },
});

/** How to undo a change to a built-in binding, shown when it is confirmed and saved. */
const RESTORE_HINT = "C-r on its row in the keymap restores it";

/**
 * Apply and save `entries`, or, when they change a built-in binding in
 * effect, ask first: the prompt says what changes and how to undo it.
 */
function commit(
  s: AppState,
  reg: Registries,
  sc: Scope,
  entries: Entry[],
  done: string,
  picker: PickerState,
): Result {
  const notice = builtinChanges(s, reg, sc, entries);
  const back = backToKeymap(s, picker);
  if (notice.length === 0) {
    const r = applyEntries(back, sc, entries);
    return { ...message(r.state, done), effects: r.effects };
  }
  return none(
    prompting(s, {
      kind: "confirm",
      title: "Change built-in keys?",
      value: "",
      binding: {
        step: "confirm",
        ...sc,
        entries,
        notice,
        done,
        picker,
      },
    }),
  );
}

/** Enter: type new keys for the selected binding; a switched-off one is restored with C-r. */
export function changeBinding(
  s: AppState,
  item: PickerItem,
  reg: Registries,
): Result {
  const picker = pickerIn(s);
  const b = rowOf(s, reg, item);
  if (picker === undefined || b === undefined) return none(s);
  if (b.off) return message(s, `${b.seq} is off — C-r restores it`);
  return none(
    prompting(s, {
      kind: "input",
      title: "Change keys",
      value: b.seq,
      binding: {
        step: "keys",
        ...scopeOf(b),
        from: b.seq,
        id: b.id,
        picker,
      },
    }),
  );
}

/** `C-a`: add a binding, starting from the selected row's mode. */
export function addBinding(s: AppState, item: PickerItem | undefined): Result {
  const picker = pickerIn(s);
  if (picker === undefined) return none(s);
  const mode = item?.key.split(SEP)[0] ?? "normal";
  return none(
    prompting(s, {
      kind: "input",
      title: "New binding: mode",
      value: mode,
      binding: { step: "mode", mode, picker },
    }),
  );
}

/** `C-x`: the selected keys stop doing anything, saved to config.toml; a built-in asks first. */
export function unbindBinding(
  s: AppState,
  item: PickerItem,
  reg: Registries,
): Result {
  const picker = pickerIn(s);
  const b = rowOf(s, reg, item);
  if (picker === undefined || b === undefined) return none(s);
  if (b.off) return message(s, `${b.seq} is already off — C-r restores it`);
  const sc = scopeOf(b);
  return commit(
    s,
    reg,
    sc,
    [unbindEntry(s, reg, sc, b.seq)],
    `${b.seq} unbound (${scopeText(sc)})`,
    picker,
  );
}

/**
 * `C-r`: the built-in binding on the selected keys comes back, by removing
 * your config's lines for those keys.
 */
export function restoreBinding(
  s: AppState,
  item: PickerItem,
  reg: Registries,
): Result {
  const b = rowOf(s, reg, item);
  if (b === undefined) return none(s);
  const sc = scopeOf(b);
  const builtin = builtinAt(s, reg, sc, b.seq);
  if (builtin === undefined)
    return message(s, `${b.seq} has no built-in binding to restore`);
  const yours = configEntries(s, sc, b.seq);
  if (yours.length === 0)
    return message(s, `${b.seq} already runs its built-in binding`);
  const r = applyEntries(
    s,
    sc,
    yours.map(([seq]) => ({ seq })),
  );
  return {
    ...message(
      r.state,
      `${builtin.seq} restored: ${targetLabel(reg, builtin.id)}`,
    ),
    effects: r.effects,
  };
}

/** Why `value` cannot be this step's answer, or `undefined` when it can. */
function invalidAnswer(
  s: AppState,
  reg: Registries,
  b: BindingPrompt["binding"],
  value: string,
): string | undefined {
  const v = value.trim();
  if (b.step === "mode")
    return MODES.has(v) ? undefined : `one of: ${[...MODES].join(", ")}`;
  if (b.step === "keys")
    return splitKeys(v, s.config.leader).length === 0
      ? "type keys in Vim notation: jj, <leader>w, <C-s>"
      : undefined;
  if (v === "") return "a command id (file.save) or keys (<Esc>)";
  const [error] = validateBindings(reg, [
    {
      mode: b.mode,
      ...(b.filetype === undefined ? {} : { filetype: b.filetype }),
      seq: b.seq ?? "",
      id: v,
      line: 0,
    },
  ]);
  return error?.message;
}

/** The binding typed keys would replace in the scope, as a note under the field. */
function bindingImpact(
  s: AppState,
  reg: Registries,
  b: BindingPrompt["binding"],
  value: string,
): string | undefined {
  if (b.step !== "keys") return undefined;
  const seq = value.trim();
  if (b.from !== undefined && slotOf(s, b.from) === slotOf(s, seq))
    return undefined;
  const sc: Scope =
    b.filetype === undefined
      ? { mode: b.mode }
      : { mode: b.mode, filetype: b.filetype };
  const taken = effectiveBindings(reg, s.config).find(
    (x) => sameScope(x, sc) && slotOf(s, x.seq) === slotOf(s, seq),
  );
  return taken === undefined
    ? undefined
    : `replaces ${targetLabel(reg, taken.id)}`;
}

/** Back to the keymap the prompt came from; the caller lists it again. */
function backToKeymap(s: AppState, picker: PickerState): AppState {
  return { ...s, overlay: { kind: "help", picker } };
}

/**
 * Keys in a binding prompt: typing edits the answer and says why it cannot
 * be used; Enter moves to the next step or saves; Esc goes back unchanged.
 */
export function bindingPromptKey(
  s: AppState,
  p: BindingPrompt,
  key: string,
  reg: Registries,
): Result {
  const b = p.binding;
  const sc: Scope =
    b.filetype === undefined
      ? { mode: b.mode }
      : { mode: b.mode, filetype: b.filetype };
  if (b.step === "confirm") {
    const back = backToKeymap(s, b.picker);
    if (key !== "y") return message(back, "nothing changed");
    const r = applyEntries(back, sc, b.entries ?? []);
    return {
      ...message(r.state, `${b.done ?? "saved"} · ${RESTORE_HINT}`),
      effects: r.effects,
    };
  }
  if (key === "<Esc>") return none(backToKeymap(s, b.picker));
  if (key === "<CR>") {
    const invalid = invalidAnswer(s, reg, b, p.value);
    if (invalid !== undefined) return none(prompting(s, { ...p, invalid }));
    const v = p.value.trim();
    if (b.step === "mode")
      return none(
        prompting(s, {
          kind: "input",
          title: "New binding: keys",
          value: "",
          binding: { ...b, step: "keys", mode: v },
        }),
      );
    if (b.step === "keys" && b.from === undefined)
      return none(
        prompting(s, {
          kind: "input",
          title: "New binding: runs",
          value: "",
          binding: { ...b, step: "target", seq: v },
        }),
      );
    if (b.step === "keys") {
      // Changing: the old keys go, the new ones run the same thing.
      if (b.from === v || b.id === undefined)
        return none(backToKeymap(s, b.picker));
      const from = b.from ?? "";
      return commit(
        s,
        reg,
        sc,
        [unbindEntry(s, reg, sc, from), { seq: v, id: b.id }],
        `${from} → ${v} (${scopeText(sc)})`,
        b.picker,
      );
    }
    const seq = b.seq ?? "";
    return commit(
      s,
      reg,
      sc,
      [{ seq, id: v }],
      `${seq} → ${v} (${scopeText(sc)})`,
      b.picker,
    );
  }
  const f = typed(p, key);
  if (f === undefined) return none(s);
  if (f.value === p.value) return none(movedCaret(s, f.caret));
  const { invalid: _, impact: __, ...rest } = p;
  const invalid = invalidAnswer(s, reg, b, f.value);
  if (invalid !== undefined)
    return none(prompting(s, { ...rest, ...f, invalid }));
  const impact = bindingImpact(s, reg, b, f.value);
  return none(
    prompting(
      s,
      impact === undefined ? { ...rest, ...f } : { ...rest, ...f, impact },
    ),
  );
}

/** The bindings could not be saved: the keymaps return to `previous`, and a toast says why. */
export function onBindingsFailed(
  s: AppState,
  a: Extract<Action, { type: "bindingsFailed" }>,
): Result {
  return toast(
    { ...s, config: { ...s.config, ...a.previous } },
    "error",
    `Keymap not saved: ${a.reason}`,
  );
}
