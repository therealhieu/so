import { expect, test } from "bun:test";
import { setConfigValue } from "./toml-edit";

const set = (text: string, path: string[], value: string | boolean) => {
  const r = setConfigValue(text, path, value);
  if (!r.ok) throw new Error(r.reason);
  return r.text;
};

test("an existing value changes in place, keeping comments and layout", () => {
  const text =
    '# my config\ntheme = "dark"\n\n[explorer]\nposition = "left"  # my pick\nicons = "nerd"\n';
  expect(set(text, ["explorer", "position"], "right")).toBe(
    '# my config\ntheme = "dark"\n\n[explorer]\nposition = "right"  # my pick\nicons = "nerd"\n',
  );
  expect(set(text, ["theme"], "light")).toBe(
    '# my config\ntheme = "light"\n\n[explorer]\nposition = "left"  # my pick\nicons = "nerd"\n',
  );
});

test("a missing key joins the end of its table", () => {
  const text =
    '[explorer]\nicons = "nerd" # font\n\n[preview]\nmode = "live"\n';
  expect(set(text, ["explorer", "position"], "left")).toBe(
    '[explorer]\nicons = "nerd" # font\nposition = "left"\n\n[preview]\nmode = "live"\n',
  );
  expect(set("[explorer]\n", ["explorer", "position"], "left")).toBe(
    '[explorer]\nposition = "left"\n',
  );
});

test("a missing table is added at the end, and an empty file gets one", () => {
  expect(set('theme = "light"\n', ["editor", "wrap"], false)).toBe(
    'theme = "light"\n\n[editor]\nwrap = false\n',
  );
  expect(set('theme = "light"', ["editor", "wrap"], false)).toBe(
    'theme = "light"\n\n[editor]\nwrap = false\n',
  );
  expect(set("", ["explorer", "position"], "left")).toBe(
    '[explorer]\nposition = "left"\n',
  );
});

test("a missing top-level key goes after the other top-level keys", () => {
  expect(
    set("mouse = true\n\n[editor]\nwrap = true\n", ["theme"], "light"),
  ).toBe('mouse = true\ntheme = "light"\n\n[editor]\nwrap = true\n');
  expect(set("[editor]\nwrap = true\n", ["theme"], "light")).toBe(
    'theme = "light"\n\n[editor]\nwrap = true\n',
  );
});

test("inline tables and dotted keys are edited where they are", () => {
  expect(
    set(
      'explorer = { position = "left" }\n',
      ["explorer", "position"],
      "right",
    ),
  ).toBe('explorer = { position = "right" }\n');
  expect(
    set('explorer = { icons = "nerd" }\n', ["explorer", "position"], "left"),
  ).toBe('explorer = { icons = "nerd", position = "left" }\n');
  expect(set("explorer = {}\n", ["explorer", "position"], "left")).toBe(
    'explorer = { position = "left" }\n',
  );
  expect(
    set('explorer.icons = "nerd"\n', ["explorer", "position"], "left"),
  ).toBe('explorer.icons = "nerd"\nexplorer.position = "left"\n');
});

test("CRLF files keep CRLF", () => {
  expect(
    set("[editor]\r\nwrap = true\r\n", ["editor", "relativeNumbers"], false),
  ).toBe("[editor]\r\nwrap = true\r\nrelativeNumbers = false\r\n");
});

test("a file with errors is never edited", () => {
  const broken = '[explorer]\nposition = "up"\n';
  expect(setConfigValue(broken, ["theme"], "light")).toEqual({
    ok: false,
    reason: "config.toml:2 has an error; fix it before changing settings",
  });
  expect(setConfigValue("[explorer\n", ["theme"], "light").ok).toBe(false);
});
