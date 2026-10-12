import { expect, test } from "bun:test";
import { deepFreeze, fresh, testRegistries } from "../../../test/support/state";
import { defaults } from "../config/schema";
import { parseConfig } from "../config/toml";
import { validateBindings } from "./config";
import { keymapFor } from "./keymap";
import type { AppState } from "./types";
import { createUpdate } from "./update";

const reg = testRegistries();
const update = createUpdate(reg);
const lines = (...ls: string[]) => ls.join("\n");

const BAD_BINDINGS = lines(
  'theme = "light"',
  "",
  "[keys.normal]",
  '"<leader>x" = "no.such.command"',
  "",
  "[filetypes.cobol.keys.normal]",
  '"<leader>y" = "buffer.next"',
  "[keys.sideways]",
  '"z" = "buffer.prev"',
);

const VALID = lines(
  'leader = ","',
  'theme = "light"',
  "[keys.normal]",
  '"<leader>w" = "file.save"',
);

const load = (s: AppState, text: string, reload: boolean) =>
  update(deepFreeze(s), {
    type: "configLoaded",
    result: parseConfig(text),
    reload,
  });

test("a valid config replaces the current one", () => {
  const r = load(fresh(), VALID, false);
  expect(r.state.config.leader).toBe(",");
  expect(r.state.config.theme).toBe("light");
  expect(r.state.notifications.toasts).toEqual([]);
  expect(r.effects).toEqual([]);
});

test("invalid bindings toast the first line; startup applies defaults", () => {
  const custom = {
    ...fresh(),
    config: { ...defaults, theme: "light" as const },
  };
  const r = load(custom, BAD_BINDINGS, false);
  expect(r.state.config).toBe(defaults);
  expect(r.state.notifications.toasts).toEqual([
    {
      id: 1,
      level: "error",
      text: 'config.toml:4: unknown command id "no.such.command" (+2 more)',
    },
  ]);
});

test("an invalid reload keeps the current config", () => {
  const loaded = load(fresh(), VALID, false).state;
  const r = load(loaded, BAD_BINDINGS, true);
  expect(r.state.config).toBe(loaded.config);
  expect(r.state.notifications.toasts.map((t) => t.text)).toEqual([
    'config.toml:4: unknown command id "no.such.command" (+2 more)',
  ]);
});

test("each binding problem names its line", () => {
  const result = parseConfig(BAD_BINDINGS);
  if (!result.ok) throw new Error("expected a parsed config");
  expect(validateBindings(reg, result.bindings)).toEqual([
    { line: 4, message: 'unknown command id "no.such.command"' },
    { line: 7, message: 'unknown file type "cobol"' },
    { line: 9, message: 'unknown mode "sideways"' },
  ]);
});

test("a key-sequence binding is valid in a vim mode and an error elsewhere", () => {
  const result = parseConfig(
    lines(
      "[keys.insert]",
      'jj = "<Esc>"',
      "[keys.normal]",
      '"<leader>d" = "<C-d>"',
      "[keys.explorer]",
      'jj = "<Esc>"',
      "[keys.visual]",
      'x = "no.such"',
    ),
  );
  if (!result.ok) throw new Error("expected a parsed config");
  expect(validateBindings(reg, result.bindings)).toEqual([
    { line: 6, message: 'key sequence "<Esc>" needs a vim mode' },
    { line: 8, message: 'unknown command id "no.such"' },
  ]);
});

test("an empty value unbinds a built-in binding", () => {
  const s = load(
    fresh(),
    lines("[keys.normal]", '"<leader>ff" = ""'),
    false,
  ).state;
  expect(s.notifications.toasts).toEqual([]);
  expect(
    keymapFor(reg, s.config).lookup({ mode: "normal" }, [" ", "f", "f"]).kind,
  ).toBe("none");
  expect(
    keymapFor(reg, s.config).lookup({ mode: "normal" }, [" ", "f", "r"]),
  ).toEqual({ kind: "command", id: "file.recent" });
});

test("a syntax error at startup applies defaults and names the line", () => {
  const r = load(fresh(), lines("a = 1", "", "", "", "", "", "e = = 5"), false);
  expect(r.state.config).toBe(defaults);
  expect(r.state.notifications.toasts[0]?.text).toStartWith("config.toml:7: ");
});

test("the loaded leader drives the keymap", () => {
  const s = load(fresh(), VALID, false).state;
  expect(
    keymapFor(reg, s.config).lookup({ mode: "normal" }, [",", "w"]),
  ).toEqual({ kind: "command", id: "file.save" });
});

test("leader comma maps ,ff to find files", () => {
  const s = load(fresh(), VALID, false).state;
  expect(
    keymapFor(reg, s.config).lookup({ mode: "normal" }, [",", "f", "f"]),
  ).toEqual({ kind: "command", id: "file.find" });
});

test("preview options default to reading view, ten embed rows, automatic images, a 100-column text, and ragged prose", () => {
  const result = parseConfig("");
  if (!result.ok) throw new Error("expected a parsed config");
  expect(result.config.preview).toEqual({
    mode: "reading",
    embedMaxRows: 10,
    images: "auto",
    readable: false,
    readableWidth: 100,
    justify: false,
  });
  expect(defaults.preview).toEqual(result.config.preview);
});

test("an out-of-range embed row limit names its line", () => {
  const r = load(
    fresh(),
    lines("[editor]", "[preview]", "embedMaxRows = 0"),
    false,
  );
  expect(r.state.config).toBe(defaults);
  expect(r.state.notifications.toasts[0]?.text).toStartWith("config.toml:3: ");
});

test("an unknown preview key is rejected", () => {
  const result = parseConfig(lines("[preview]", "zoom = 1"));
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.errors).toEqual([
    { line: 2, message: 'unknown key "preview.zoom"' },
  ]);
});
