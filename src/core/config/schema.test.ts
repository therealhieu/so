import { expect, test } from "bun:test";
import { defaults } from "./schema";
import { type ConfigError, parseConfig } from "./toml";

const lines = (...ls: string[]) => ls.join("\n");

function errors(text: string): ConfigError[] {
  const r = parseConfig(text);
  if (r.ok) throw new Error("expected config errors");
  return r.errors;
}

test("daily and templates sections default when absent", () => {
  const r = parseConfig("");
  if (!r.ok) throw new Error("expected a parsed config");
  expect(r.config.daily).toEqual({
    folder: "daily",
    format: "YYYY-MM-DD",
    template: "templates/daily.md",
  });
  expect(r.config.templates).toEqual({ folder: "templates" });
  expect(defaults.daily).toEqual(r.config.daily);
  expect(defaults.templates).toEqual(r.config.templates);
});

test("configured daily and templates paths are normalized", () => {
  const r = parseConfig(
    lines(
      "[daily]",
      'folder = "journal/days/"',
      'format = "YYYY/MM/YYYY-MM-DD"',
      'template = "./tpl/../templates/day.md"',
      "[templates]",
      'folder = "meta/templates/"',
    ),
  );
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  expect(r.config.daily).toEqual({
    folder: "journal/days",
    format: "YYYY/MM/YYYY-MM-DD",
    template: "templates/day.md",
  });
  expect(r.config.templates).toEqual({ folder: "meta/templates" });
});

test("daily notes may live at the workspace root", () => {
  for (const folder of ["", ".", "./"]) {
    const r = parseConfig(lines("[daily]", `folder = "${folder}"`));
    expect(r.ok && r.config.daily.folder).toBe("");
  }
});

test("paths outside the workspace are refused with their line", () => {
  expect(errors(lines("[daily]", 'folder = "/abs"'))).toEqual([
    { line: 2, message: "daily.folder: must be a path inside the workspace" },
  ]);
  expect(errors(lines("[daily]", "", 'template = "../x"'))).toEqual([
    { line: 3, message: "daily.template: must be a path inside the workspace" },
  ]);
  expect(errors(lines("[daily]", 'folder = "a/../../x"'))).toHaveLength(1);
  expect(errors(lines("[daily]", 'folder = "a\\\\b"'))).toHaveLength(1);
});

test("an empty daily format is refused with its line", () => {
  const [e, ...rest] = errors(lines("[daily]", 'format = ""'));
  expect(rest).toEqual([]);
  expect(e?.line).toBe(2);
  expect(e?.message).toStartWith("daily.format: ");
});

test("the templates folder may not be the workspace root", () => {
  for (const folder of [".", ""])
    expect(errors(lines("[templates]", `folder = "${folder}"`))).toEqual([
      {
        line: 2,
        message: "templates.folder: must not be the workspace root",
      },
    ]);
});

test("an unknown daily key names its line", () => {
  expect(errors(lines("[daily]", 'folder = "d"', "weekStart = 1"))).toEqual([
    { line: 3, message: 'unknown key "daily.weekStart"' },
  ]);
});

test("mouse defaults to on and rejects a non-boolean", () => {
  const r = parseConfig("");
  if (!r.ok) throw new Error("expected a parsed config");
  expect(r.config.mouse).toBe(true);
  expect(defaults.mouse).toBe(true);
  const off = parseConfig("mouse = false");
  expect(off.ok && off.config.mouse).toBe(false);
  const [e, ...rest] = errors('mouse = "yes"');
  expect(rest).toEqual([]);
  expect(e?.line).toBe(1);
  expect(e?.message).toStartWith("mouse: ");
});

test("the explorer draws Nerd Font icons unless configured to plain symbols", () => {
  const r = parseConfig(lines("[explorer]", 'icons = "unicode"'));
  expect(r.ok && r.config.explorer.icons).toBe("unicode");
  const [e] = errors(lines("[explorer]", 'icons = "emoji"'));
  expect(e?.message).toStartWith("explorer.icons: ");
});

test("the explorer hides dot entries unless dotfiles is on", () => {
  const r = parseConfig(lines("[explorer]", "dotfiles = true"));
  expect(r.ok && r.config.explorer.dotfiles).toBe(true);
  const [e] = errors(lines("[explorer]", 'dotfiles = "yes"'));
  expect(e?.message).toStartWith("explorer.dotfiles: ");
});

test("the explorer docks left unless configured right", () => {
  expect(defaults.explorer).toEqual({
    position: "right",
    icons: "nerd",
    width: 30,
    dotfiles: false,
    gitignored: true,
  });
  const r = parseConfig(lines("[explorer]", 'position = "right"'));
  expect(r.ok && r.config.explorer.position).toBe("right");
  const [e, ...rest] = errors(lines("[explorer]", 'position = "top"'));
  expect(rest).toEqual([]);
  expect(e?.line).toBe(2);
  expect(e?.message).toStartWith("explorer.position: ");
});

test("git.tool takes a non-empty list of strings and defaults to lazygit", () => {
  const r = parseConfig('[git]\ntool = ["gitui"]\n');
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  expect(r.config.git.tool).toEqual(["gitui"]);
  expect(errors("[git]\ntool = []\n")).toHaveLength(1);
  expect(errors("[git]\ntool = [1]\n")).toHaveLength(1);
  expect(errors('[git]\ntool = [""]\n')).toHaveLength(1);
  expect(errors('[git]\ncommand = "lazygit"\n')).toHaveLength(1);
  const empty = parseConfig("");
  if (!empty.ok) throw new Error("expected a parsed config");
  expect(empty.config.git.tool).toEqual(["lazygit"]);
  expect(defaults.git.tool).toEqual(["lazygit"]);
});

test("theme accepts the catppuccin flavors and rejects unknown names", () => {
  const r = parseConfig('theme = "catppuccin-mocha"');
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  expect(r.config.theme).toBe("catppuccin-mocha");
  const [e, ...rest] = errors('theme = "catppuccin"');
  expect(rest).toEqual([]);
  expect(e?.message).toStartWith("theme: ");
});
