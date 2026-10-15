import { expect, test } from "bun:test";
import { fresh, testRegistries } from "../../../test/support/state";
import { splitKeys } from "../kernel/vim/keys";
import { describeSetting } from "./settings";
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
      "explorer.dotfiles off",
      "explorer.gitignored on",
      "theme dark",
      "color auto",
      "mouse on",
      "editor.wrap on",
      "editor.relativeNumbers on",
      "editor.clipboard off",
      "preview.mode live",
      "preview.images auto",
      "preview.readable off",
      "preview.justify off",
      "autosave.enabled on",
      "autosave.delayMs 1000",
      "editor.tabWidth 8",
      "editor.keyTimeout 1000",
      "explorer.width 30",
      "preview.embedMaxRows 10",
      "preview.readableWidth 100",
      "escTimeoutMs 50",
      "daily.folder daily",
      "daily.format YYYY-MM-DD",
      "daily.template templates/daily.md",
      "templates.folder templates",
      "browser.chrome ",
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

test("cycling explorer.dotfiles lists the shown folders again, and so does a failed save", () => {
  const open = keys(editing(), " us").state;
  const r = keys(open, "dotfiles<CR>");
  expect(r.state.config.explorer.dotfiles).toBe(true);
  expect(r.effects).toEqual([
    {
      kind: "writeSetting",
      path: ["explorer", "dotfiles"],
      value: true,
      previous: false,
    },
    { kind: "listDir", dir: "", dotfiles: true, gitignored: true },
  ]);
  const failed = update(r.state, {
    type: "settingFailed",
    path: ["explorer", "dotfiles"],
    previous: false,
    reason: "read-only",
  });
  expect(failed.state.config.explorer.dotfiles).toBe(false);
  expect(failed.effects).toEqual([
    { kind: "listDir", dir: "", gitignored: true },
  ]);
});

test("cycling explorer.gitignored hides gitignored entries and lists the shown folders again", () => {
  const open = keys(editing(), " us").state;
  const r = keys(open, "gitignored<CR>");
  expect(r.state.config.explorer.gitignored).toBe(false);
  expect(r.effects).toEqual([
    {
      kind: "writeSetting",
      path: ["explorer", "gitignored"],
      value: false,
      previous: true,
    },
    { kind: "listDir", dir: "" },
  ]);
});

test("Enter on theme opens the theme list with the theme in use selected", () => {
  const s = keys(editing(), " ustheme<CR>").state;
  expect(picker(s).source).toBe("themes");
  expect(picker(s).items.map((i) => i.key)).toEqual([
    "dark",
    "light",
    "catppuccin-latte",
    "catppuccin-frappe",
    "catppuccin-macchiato",
    "catppuccin-mocha",
    "paper",
    "sepia",
    "rose-pine-dawn",
  ]);
  expect(picker(s).items[picker(s).selected]?.detail).toBe("current");
});

test("typing filters the theme list and Enter applies, saves, and returns to the settings", () => {
  const r = keys(editing(), " ustheme<CR>sepia<CR>");
  expect(r.state.config.theme).toBe("sepia");
  expect(r.effects).toContainEqual({
    kind: "writeSetting",
    path: ["theme"],
    value: "sepia",
    previous: "dark",
  });
  expect(picker(r.state).source).toBe("settings");
  expect(rows(r.state)).toEqual(["theme sepia"]);
});

test("Esc leaves the theme list for the settings without changing the theme", () => {
  const r = keys(editing(), " ustheme<CR><Down><Down><Esc>");
  expect(r.state.config.theme).toBe("dark");
  expect(r.effects.some((e) => e.kind === "writeSetting")).toBe(false);
  expect(picker(r.state).source).toBe("settings");
  expect(rows(r.state)).toEqual(["theme dark"]);
});

test("Enter on the theme in use returns to the settings without a write", () => {
  const r = keys(editing(), " ustheme<CR><CR>");
  expect(r.effects.some((e) => e.kind === "writeSetting")).toBe(false);
  expect(picker(r.state).source).toBe("settings");
});

const prompt = (s: AppState) => {
  if (s.overlay.kind !== "prompt") throw new Error("no prompt open");
  return s.overlay.prompt;
};

test("Enter on a number setting opens a prompt holding its value; Enter saves a valid number", () => {
  const open = keys(keys(editing(), " uskeyTimeout").state, "<CR>").state;
  expect(prompt(open)).toMatchObject({
    title: "editor.keyTimeout",
    value: "1000",
  });
  const r = keys(open, "<BS><BS><BS><BS>300<CR>");
  expect(r.state.config.editor.keyTimeout).toBe(300);
  expect(r.effects).toEqual([
    {
      kind: "writeSetting",
      path: ["editor", "keyTimeout"],
      value: 300,
      previous: 1000,
    },
  ]);
  expect(picker(r.state).source).toBe("settings");
  expect(rows(r.state)).toEqual(["editor.keyTimeout 300"]);
});

test("a number out of range or not a number says why, and Enter does nothing", () => {
  const open = keys(keys(editing(), " uskeyTimeout").state, "<CR>").state;
  const low = keys(open, "<BS><BS><BS><BS>5").state;
  expect(prompt(low).invalid).toContain("50");
  const stuck = keys(low, "<CR>");
  expect(stuck.state.overlay.kind).toBe("prompt");
  expect(stuck.effects).toEqual([]);
  expect(prompt(keys(open, "x").state).invalid).toBe("must be a whole number");
  expect(prompt(keys(low, "0").state).invalid).toBeUndefined();
});

test("Esc in a setting prompt goes back to the picker unchanged", () => {
  const open = keys(keys(editing(), " ustabWidth").state, "<CR>").state;
  const r = keys(open, "<BS>4<Esc>");
  expect(r.state.config.editor.tabWidth).toBe(8);
  expect(r.effects).toEqual([]);
  expect(rows(r.state)).toEqual(["editor.tabWidth 8"]);
});

test("a text setting saves the value the config holds, and refuses a path outside the workspace", () => {
  const open = keys(keys(editing(), " usdaily.folder").state, "<CR>").state;
  const cleared = keys(open, "<BS>".repeat(5)).state;
  expect(prompt(keys(cleared, "../x").state).invalid).toBe(
    "must be a path inside the workspace",
  );
  const r = keys(cleared, "journal/<CR>");
  expect(r.state.config.daily.folder).toBe("journal");
  expect(r.effects).toContainEqual({
    kind: "writeSetting",
    path: ["daily", "folder"],
    value: "journal",
    previous: "daily",
  });
});

test("saving explorer.width replaces a resized width", () => {
  const resized: AppState = {
    ...editing(),
    panels: {
      ...editing().panels,
      explorer: { ...editing().panels.explorer, width: 50 },
    },
  };
  const open = keys(keys(resized, " usexplorer.width").state, "<CR>").state;
  const r = keys(open, "<BS><BS>40<CR>").state;
  expect(r.config.explorer.width).toBe(40);
  expect(r.panels.explorer.width).toBeUndefined();
});

test("the theme preview wraps its choices so every theme shows", () => {
  const s = fresh();
  const lines = describeSetting(s, {
    key: "theme",
    label: "theme",
    matches: [],
  }).filter((l) => "ranges" in l);
  expect(lines.map((l) => l.text)).toEqual([
    "dark · light · catppuccin-latte",
    "catppuccin-frappe",
    "catppuccin-macchiato",
    "catppuccin-mocha · paper · sepia",
    "rose-pine-dawn",
  ]);
  expect(lines[0]?.ranges).toEqual([{ from: 0, to: 4, style: "floatTitle" }]);
});
