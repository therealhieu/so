import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import { splitKeys } from "../kernel/vim/keys";
import type { Action, AppState, Effect } from "./types";
import { createUpdate, type Registries } from "./update";
import { WHICH_KEY_MS, whichKeyRows } from "./whichkey";

const base = testRegistries();
const reg: Registries = {
  ...base,
  bindings: [
    ...base.bindings,
    { scope: { mode: "normal" }, seq: "<leader>ff", id: "jump.list" },
    { scope: { mode: "normal" }, seq: "<leader>fr", id: "jump.back" },
    { scope: { mode: "normal" }, seq: "<leader>sx", id: "jump.forward" },
    { scope: { mode: "normal" }, seq: "<leader>a", id: "window.split" },
  ],
};
const update = createUpdate(reg);
const ARM: Effect = { kind: "startTimer", id: "whichKey", ms: WHICH_KEY_MS };
const TIMER: Action = { type: "timer", id: "whichKey", now: 300 };

const opened = (): AppState =>
  update(fresh(), {
    type: "fileLoaded",
    path: "a.md",
    file: textFile("hello world\n"),
  }).state;
function keys(s: AppState, seq: string) {
  const effects: Effect[] = [];
  for (const key of splitKeys(seq)) {
    const r = update(s, { type: "key", key, now: 0 });
    s = r.state;
    effects.push(...r.effects);
  }
  return { state: s, effects };
}

test("which-key opens only after the prefix idles 300 ms", () => {
  const space = keys(opened(), " ");
  expect(space.effects).toContainEqual(ARM);
  expect(space.state.overlay.kind).toBe("none");
  const shown = update(space.state, TIMER).state;
  expect(shown.overlay).toEqual({
    kind: "whichKey",
    whichKey: {
      prefix: [" "],
      scope: { mode: "normal", filetype: "markdown" },
    },
  });

  // A key before the timer completes the sequence; the late timer shows nothing.
  const fast = keys(space.state, "f");
  expect(fast.effects).toContainEqual(ARM);
  const done = keys(fast.state, "f").state;
  expect(done.notifications.message?.text).toBe("jump list is empty");
  expect(update(done, TIMER).state.overlay.kind).toBe("none");
});

test("direct actions list before groups and backspace pops a key", () => {
  let s = update(keys(opened(), " ").state, TIMER).state;
  expect(whichKeyRows(s, reg)).toEqual([
    { key: "a", label: "Split window", group: false },
    { key: "e", label: "Toggle explorer", group: false },
    { key: "f", label: "+find", group: true },
    { key: "s", label: "+search", group: true },
  ]);

  s = keys(s, "f").state;
  expect(s.overlay).toMatchObject({ whichKey: { prefix: [" ", "f"] } });
  expect(whichKeyRows(s, reg).map((r) => r.key)).toEqual(["f", "r"]);

  s = keys(s, "<BS>").state;
  expect(s.overlay).toMatchObject({ whichKey: { prefix: [" "] } });
  expect(s.vim.pending).toEqual([" "]);

  s = keys(s, "<BS>").state;
  expect(s.overlay.kind).toBe("none");
  expect(s.vim.pending).toEqual([]);

  s = update(keys(s, " ").state, TIMER).state;
  s = keys(s, "<Esc>").state;
  expect(s.overlay.kind).toBe("none");
  expect(s.vim.pending).toEqual([]);
});

test("a key in the overlay runs its command and closes it", () => {
  let s = update(keys(opened(), " ").state, TIMER).state;
  s = keys(s, "fr").state;
  expect(s.overlay.kind).toBe("none");
  expect(s.vim.pending).toEqual([]);
});

test("an unmapped key closes with a notice", () => {
  const open = update(keys(opened(), " ").state, TIMER).state;
  const s = keys(open, "q").state;
  expect(s.overlay.kind).toBe("none");
  expect(s.vim.pending).toEqual([]);
  expect(s.notifications.message?.text).toBe("no mapping for <leader>q");

  const early = keys(opened(), " q").state;
  expect(early.notifications.message?.text).toBe("no mapping for <leader>q");
  expect(early.vim.mode).toBe("normal");
  expect(early.vim.pending).toEqual([]);
});

test("groups without bindings in the scope are not shown", () => {
  const s = update(keys(opened(), " ").state, TIMER).state;
  expect(whichKeyRows(s, reg).some((r) => r.label === "+buffer")).toBe(false);
});
