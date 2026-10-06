import { expect, test } from "bun:test";
import { fresh, testRegistries } from "../../../test/support/state";
import { splitKeys } from "../kernel/vim/keys";
import type { AppState, Effect, PickerState, Result } from "./types";
import { createUpdate } from "./update";

const update = createUpdate(testRegistries());

function keys(s: AppState, seq: string): Result {
  const effects: Effect[] = [];
  for (const key of splitKeys(seq)) {
    const r = update(s, { type: "key", key, now: 0 });
    s = r.state;
    effects.push(...r.effects);
  }
  return { state: s, effects };
}
const picker = (s: AppState): PickerState => {
  if (s.overlay.kind !== "picker") throw new Error("no picker open");
  return s.overlay.picker;
};
const rows = (s: AppState) =>
  picker(s).items.map((i) => `${i.label} ${i.detail}`);
/** Close the explorer so keys reach the normal-mode keymap. */
const editing = () => keys(fresh(), " e").state;

test("<leader>us, also in the explorer, and :Settings list each setting with its value", () => {
  for (const s of [
    keys(editing(), " us").state,
    keys(editing(), ":Settings<CR>").state,
    keys(fresh(), " us").state,
  ]) {
    expect(picker(s).source).toBe("settings");
    expect(rows(s)).toEqual([
      "explorer.position left",
      "explorer.icons nerd",
      "theme dark",
      "color auto",
      "mouse on",
      "editor.wrap on",
      "editor.relativeNumbers on",
      "preview.mode live",
      "preview.images auto",
      "autosave.enabled on",
    ]);
  }
});

test("Enter applies the next choice, asks to save it, and keeps the picker open", () => {
  const open = keys(editing(), " us").state;
  const r = keys(open, "<CR>");
  expect(r.state.config.explorer.position).toBe("right");
  expect(r.effects).toEqual([
    {
      kind: "writeSetting",
      path: ["explorer", "position"],
      value: "right",
      previous: "left",
    },
  ]);
  expect(picker(r.state).selected).toBe(0);
  expect(rows(r.state)[0]).toBe("explorer.position right");
  // A filtered list keeps the changed row selected, and choices wrap around.
  const wrap = keys(open, "previewmode<CR><CR><CR>").state;
  expect(rows(wrap)).toEqual(["preview.mode live"]);
  const bool = keys(open, "wrap<CR>");
  expect(bool.state.config.editor.wrap).toBe(false);
  expect(rows(bool.state)).toEqual(["editor.wrap off"]);
});

test("a setting that could not be saved returns to its previous value", () => {
  const changed = keys(keys(editing(), " us").state, "<CR>").state;
  const r = update(changed, {
    type: "settingFailed",
    path: ["explorer", "position"],
    previous: "left",
    reason: "config.toml:2 has an error; fix it before changing settings",
  });
  expect(r.state.config.explorer.position).toBe("left");
  expect(rows(r.state)[0]).toBe("explorer.position left");
  expect(r.state.notifications.toasts.at(-1)).toMatchObject({
    level: "error",
    text: "Setting not saved: config.toml:2 has an error; fix it before changing settings",
  });
});
