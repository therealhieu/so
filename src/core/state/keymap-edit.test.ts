import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import { splitKeys } from "../kernel/vim/keys";
import { runCommand } from "./commands";
import { keymapFor } from "./keymap";
import type {
  AppState,
  Effect,
  PickerState,
  PromptState,
  Result,
} from "./types";
import { createUpdate } from "./update";

const reg = testRegistries();
const update = createUpdate(reg);

function keys(s: AppState, seq: string): Result {
  const effects: Effect[] = [];
  for (const key of splitKeys(seq)) {
    const r = update(s, { type: "key", key, now: 0 });
    s = r.state;
    effects.push(...r.effects);
  }
  return { state: s, effects };
}
/** Type `text` literally, one character at a time, as a prompt receives it. */
function type(s: AppState, text: string): AppState {
  for (const key of [...text])
    s = update(s, { type: "key", key, now: 0 }).state;
  return s;
}
const keymap = (s: AppState): PickerState => {
  if (s.overlay.kind !== "help")
    throw new Error(`no keymap: ${s.overlay.kind}`);
  return s.overlay.picker;
};
const prompt = (s: AppState): PromptState => {
  if (s.overlay.kind !== "prompt") throw new Error("no prompt open");
  return s.overlay.prompt;
};
const labels = (s: AppState) => keymap(s).items.map((i) => i.label);
/** The keymap with the row `label` selected. */
function selecting(s: AppState, label: string): AppState {
  const p = keymap(s);
  const selected = p.items.findIndex((i) => i.label === label);
  if (selected < 0) throw new Error(`no row ${label}`);
  return { ...s, overlay: { kind: "help", picker: { ...p, selected } } };
}
const opened = () =>
  runCommand(
    update(fresh(), {
      type: "fileLoaded",
      path: "a.txt",
      file: textFile("\n"),
    }).state,
    "help.keymap",
    0,
    reg,
  ).state;
const lookup = (s: AppState, mode: string, seq: string) =>
  keymapFor(reg, s.config).lookup({ mode }, splitKeys(seq, s.config.leader));

test("C-a adds a binding step by step: mode, keys, then what it runs", () => {
  const start = keys(opened(), "<C-a>").state;
  expect(prompt(start)).toMatchObject({
    title: "New binding: mode",
    value: "normal",
  });
  const mode = keys(
    type(keys(start, "<BS>".repeat(6)).state, "insert"),
    "<CR>",
  ).state;
  expect(prompt(mode).title).toBe("New binding: keys");
  const seq = keys(type(mode, "jj"), "<CR>").state;
  expect(prompt(seq).title).toBe("New binding: runs");
  const r = keys(type(seq, "<Esc>"), "<CR>");

  expect(r.state.config.keys.insert).toEqual({ jj: "<Esc>" });
  expect(r.effects).toContainEqual({
    kind: "writeBindings",
    edits: [{ path: ["keys", "insert", "jj"], id: "<Esc>" }],
    previous: { keys: {}, filetypes: {} },
  });
  expect(r.state.overlay.kind).toBe("help");
  expect(labels(r.state)).toContainEqual("jj  → <Esc>");
  expect(r.state.notifications.message?.text).toBe("jj → <Esc> (insert)");

  const editing = { ...r.state, overlay: { kind: "none" as const } };
  expect(keys(editing, "iajj").state.vim.mode).toBe("normal");
});

test("each step says why an answer cannot be used, and Enter waits for a valid one", () => {
  const start = keys(opened(), "<C-a>").state;
  const badMode = type(keys(start, "<BS>".repeat(6)).state, "sideways");
  expect(prompt(badMode).invalid).toStartWith("one of: normal");
  expect(keys(badMode, "<CR>").state.overlay.kind).toBe("prompt");

  const toExplorer = keys(
    type(
      keys(type(keys(start, "<BS>".repeat(6)).state, "explorer"), "<CR>").state,
      "zz",
    ),
    "<CR>",
  ).state;
  expect(prompt(type(toExplorer, "<Esc>")).invalid).toBe(
    'key sequence "<Esc>" needs a vim mode',
  );
  const unknown = type(toExplorer, "no.such");
  expect(prompt(unknown).invalid).toBe('unknown command id "no.such"');
  const stuck = keys(unknown, "<CR>");
  expect(stuck.state.overlay.kind).toBe("prompt");
  expect(stuck.effects).toEqual([]);
});

/** Add `seq` → `id` in `mode` through the C-a prompts. */
function added(s: AppState, mode: string, seq: string, id: string): AppState {
  let st = keys(keys(s, "<C-a>").state, "<BS>".repeat(6)).state;
  st = keys(type(st, mode), "<CR>").state;
  st = keys(type(st, seq), "<CR>").state;
  return keys(type(st, id), "<CR>").state;
}
/** Unbind the built-in <leader>ff with C-x, confirmed. */
const unboundFindFile = () =>
  keys(selecting(opened(), "<leader>ff  Find file"), "<C-x>y");

test("a change to a built-in binding asks first, saying what changes and how to undo it", () => {
  const s = selecting(opened(), "<leader>ff  Find file");
  const asked = keys(s, "<C-x>");
  expect(asked.effects).toEqual([]);
  expect(asked.state.config.keys).toEqual({});
  expect(prompt(asked.state)).toMatchObject({
    kind: "confirm",
    title: "Change built-in keys?",
    binding: { notice: ['<leader>ff stops running "Find file"'] },
  });

  const cancelled = keys(asked.state, "n");
  expect(cancelled.state.overlay.kind).toBe("help");
  expect(cancelled.effects).toEqual([]);
  expect(cancelled.state.notifications.message?.text).toBe("nothing changed");

  const r = keys(asked.state, "y");
  expect(r.state.config.keys.normal).toEqual({ "<leader>ff": "" });
  expect(r.effects).toContainEqual({
    kind: "writeBindings",
    edits: [{ path: ["keys", "normal", "<leader>ff"], id: "" }],
    previous: { keys: {}, filetypes: {} },
  });
  expect(lookup(r.state, "normal", "<leader>ff").kind).not.toBe("command");
  expect(r.state.notifications.message?.text).toBe(
    "<leader>ff unbound (normal) · C-r on its row in the keymap restores it",
  );
});

test("a switched-off built-in stays listed as off, and C-r brings it back", () => {
  const off = unboundFindFile().state;
  const row = keymap(off).items.find(
    (i) => i.label === "<leader>ff  Find file",
  );
  expect(row?.detail).toBe("file.find  off");
  expect(
    keys(selecting(off, "<leader>ff  Find file"), "<CR>").state.notifications
      .message?.text,
  ).toBe("<leader>ff is off — C-r restores it");

  const r = keys(selecting(off, "<leader>ff  Find file"), "<C-r>");
  expect(r.state.config.keys.normal).toEqual({});
  expect(r.effects).toContainEqual({
    kind: "writeBindings",
    edits: [{ path: ["keys", "normal", "<leader>ff"] }],
    previous: { keys: { normal: { "<leader>ff": "" } }, filetypes: {} },
  });
  expect(lookup(r.state, "normal", "<leader>ff")).toEqual({
    kind: "command",
    id: "file.find",
  });
  expect(r.state.notifications.message?.text).toBe(
    "<leader>ff restored: Find file",
  );
  expect(
    keymap(r.state).items.find((i) => i.label === "<leader>ff  Find file")
      ?.detail,
  ).toBe("file.find");
});

test("C-r also undoes your override of a built-in, and says when there is nothing to restore", () => {
  const overridden = keys(
    added(opened(), "normal", "<leader>ff", "file.recent"),
    "y",
  ).state;
  expect(lookup(overridden, "normal", "<leader>ff")).toEqual({
    kind: "command",
    id: "file.recent",
  });
  const r = keys(
    selecting(overridden, "<leader>ff  Recent files"),
    "<C-r>",
  ).state;
  expect(lookup(r, "normal", "<leader>ff")).toEqual({
    kind: "command",
    id: "file.find",
  });
  expect(
    keys(selecting(r, "<leader>ff  Find file"), "<C-r>").state.notifications
      .message?.text,
  ).toBe("<leader>ff already runs its built-in binding");
  const mine = added(r, "insert", "jj", "<Esc>");
  expect(
    keys(selecting(mine, "jj  → <Esc>"), "<C-r>").state.notifications.message
      ?.text,
  ).toBe("jj has no built-in binding to restore");
});

test("Enter changes a built-in binding's keys after confirming: the old keys go off, the new ones run it", () => {
  const s = selecting(opened(), "<leader>ff  Find file");
  const open = keys(s, "<CR>").state;
  expect(prompt(open)).toMatchObject({
    title: "Change keys",
    value: "<leader>ff",
  });
  const asked = keys(type(keys(open, "<BS>").state, "z"), "<CR>").state;
  expect(prompt(asked).binding?.notice).toEqual([
    '<leader>ff stops running "Find file"',
  ]);
  const r = keys(asked, "y");
  expect(r.effects).toContainEqual({
    kind: "writeBindings",
    edits: [
      { path: ["keys", "normal", "<leader>ff"], id: "" },
      { path: ["keys", "normal", "<leader>fz"], id: "file.find" },
    ],
    previous: { keys: {}, filetypes: {} },
  });
  expect(lookup(r.state, "normal", "<leader>fz")).toEqual({
    kind: "command",
    id: "file.find",
  });
  expect(lookup(r.state, "normal", "<leader>ff").kind).not.toBe("command");
  expect(labels(r.state)).toContainEqual("<leader>fz  Find file");
});

test("new keys that take over a built-in binding ask first; your own bindings save at once", () => {
  const taken = added(opened(), "normal", "<leader>e", "file.find");
  expect(prompt(taken).binding?.notice).toEqual([
    '<leader>e runs Find file instead of "Toggle explorer"',
  ]);
  const own = added(opened(), "insert", "jj", "<Esc>");
  expect(own.overlay.kind).toBe("help");
  const removed = keys(selecting(own, "jj  → <Esc>"), "<C-x>");
  expect(removed.state.overlay.kind).toBe("help");
  expect(removed.state.config.keys.insert).toEqual({});
  expect(removed.effects).toContainEqual({
    kind: "writeBindings",
    edits: [{ path: ["keys", "insert", "jj"] }],
    previous: { keys: { insert: { jj: "<Esc>" } }, filetypes: {} },
  });
});

test("keys another binding holds are flagged while typing", () => {
  const s = selecting(opened(), "<leader>ff  Find file");
  const open = keys(s, "<CR>").state;
  const taken = type(keys(open, "<BS><BS>").state, "e");
  expect(prompt(taken).impact).toBe("replaces Toggle explorer");
});

test("Esc in a binding prompt goes back to the keymap unchanged", () => {
  const s = selecting(opened(), "<leader>ff  Find file");
  const r = keys(type(keys(s, "<CR>").state, "x"), "<Esc>");
  expect(r.state.overlay.kind).toBe("help");
  expect(r.effects).toEqual([]);
  expect(r.state.config.keys).toEqual({});
});

test("a keymap that could not be saved returns to what it was", () => {
  const unbound = unboundFindFile();
  expect(unbound.state.config.keys.normal).toEqual({ "<leader>ff": "" });
  const r = update(unbound.state, {
    type: "bindingsFailed",
    previous: { keys: {}, filetypes: {} },
    reason: "read-only",
  });
  expect(r.state.config.keys).toEqual({});
  expect(lookup(r.state, "normal", "<leader>ff")).toEqual({
    kind: "command",
    id: "file.find",
  });
  expect(r.state.notifications.toasts.at(-1)).toMatchObject({
    level: "error",
    text: "Keymap not saved: read-only",
  });
});
