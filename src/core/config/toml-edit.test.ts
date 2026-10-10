import { expect, test } from "bun:test";
import { removeConfigValue, setConfigValue } from "./toml-edit";

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

test("a number is written as a TOML integer", () => {
  expect(
    setConfigValue("[editor]\nwrap = true\n", ["editor", "keyTimeout"], 300),
  ).toEqual({
    ok: true,
    text: "[editor]\nwrap = true\nkeyTimeout = 300\n",
  });
});

const remove = (text: string, path: string[]) => {
  const r = removeConfigValue(text, path);
  if (!r.ok) throw new Error(r.reason);
  return r.text;
};

test("a key that is not a bare TOML key is written quoted, in its table and in a new one", () => {
  expect(set("", ["keys", "normal", "<leader>w"], "file.save")).toBe(
    '[keys.normal]\n"<leader>w" = "file.save"\n',
  );
  expect(
    set('[keys.insert]\njj = "<Esc>"\n', ["keys", "insert", "<C-s>"], ""),
  ).toBe('[keys.insert]\njj = "<Esc>"\n"<C-s>" = ""\n');
  expect(
    set("", ["filetypes", "markdown", "keys", "normal", "gd"], "link.follow"),
  ).toBe('[filetypes.markdown.keys.normal]\ngd = "link.follow"\n');
});

test("removing a key drops its line and keeps the rest", () => {
  const text =
    '# keys\n[keys.insert]\njj = "<Esc>"  # escape\n"<C-s>" = "file.save"\n\n[editor]\nwrap = false\n';
  expect(remove(text, ["keys", "insert", "jj"])).toBe(
    '# keys\n[keys.insert]\n"<C-s>" = "file.save"\n\n[editor]\nwrap = false\n',
  );
  expect(remove(text, ["keys", "insert", "<C-s>"])).toBe(
    '# keys\n[keys.insert]\njj = "<Esc>"  # escape\n\n[editor]\nwrap = false\n',
  );
  expect(remove(text, ["keys", "insert", "kk"])).toBe(text);
});

test("removing a key from an inline table keeps the table valid", () => {
  const text = 'keys = { insert = { jj = "<Esc>", kj = "<Esc>" } }\n';
  expect(remove(text, ["keys", "insert", "jj"])).toBe(
    'keys = { insert = { kj = "<Esc>" } }\n',
  );
  expect(remove(text, ["keys", "insert", "kj"])).toBe(
    'keys = { insert = { jj = "<Esc>" } }\n',
  );
  expect(
    remove('keys = { insert = { jj = "<Esc>" } }\n', ["keys", "insert", "jj"]),
  ).toBe("keys = { insert = { } }\n");
});

test("a broken config.toml is never edited by a removal", () => {
  const r = removeConfigValue('[explorer]\nposition = "up"\n', ["theme"]);
  expect(r).toEqual({
    ok: false,
    reason: "config.toml:2 has an error; fix it before changing settings",
  });
});
