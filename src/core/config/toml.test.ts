import { expect, test } from "bun:test";
import { defaults } from "./schema";
import { parseConfig } from "./toml";

const lines = (...ls: string[]) => ls.join("\n");

test("a syntax error names its line", () => {
  const r = parseConfig(
    lines(
      'theme = "dark"',
      "",
      "[autosave]",
      "enabled = true",
      "",
      "[editor]",
      "e = = 5",
    ),
  );
  expect(r.ok).toBe(false);
  if (r.ok) return;
  expect(r.errors).toHaveLength(1);
  expect(r.errors[0]?.line).toBe(7);
});

test("unknown keys and bad values name their lines in order", () => {
  const r = parseConfig(
    lines(
      'leader = "ab"',
      "[editor]",
      "tabwidth = 4",
      "tabWidth = 0",
      "[autosave]",
      'delayMs = "x"',
    ),
  );
  expect(r.ok).toBe(false);
  if (r.ok) return;
  expect(r.errors.map((e) => e.line)).toEqual([1, 3, 4, 6]);
  expect(r.errors[0]?.message).toContain("leader");
  expect(r.errors[1]?.message).toBe('unknown key "editor.tabwidth"');
  expect(r.errors[2]?.message).toContain("editor.tabWidth");
  expect(r.errors[3]?.message).toContain("autosave.delayMs");
});

test("unknown top-level tables and dotted keys name their lines", () => {
  const r = parseConfig(
    lines(
      "escTimeoutMs = 10",
      "calendar.week = 'x'",
      "[export]",
      "port = 1",
      "[filetypes.markdown]",
      "keys.normal.x = 'file.save'",
      "colour = 1",
    ),
  );
  expect(r.ok).toBe(false);
  if (r.ok) return;
  expect(r.errors).toEqual([
    { line: 2, message: 'unknown key "calendar"' },
    { line: 3, message: 'unknown key "export"' },
    { line: 7, message: 'unknown key "filetypes.markdown.colour"' },
  ]);
});

test("a valid file parses with binding lines", () => {
  const r = parseConfig(
    lines(
      'leader = ","',
      "escTimeoutMs = 30",
      'theme = "light"',
      'color = "never"',
      "[autosave]",
      "enabled = false",
      "delayMs = 500",
      "[editor]",
      "tabWidth = 4",
      "wrap = false",
      "relativeNumbers = false",
      "[keys.normal]",
      '"<leader>w" = "file.save"',
      "[filetypes.markdown.keys.normal]",
      '"<leader>w" = "link.backlinks"',
    ),
  );
  expect(r).toEqual({
    ok: true,
    config: {
      leader: ",",
      escTimeoutMs: 30,
      autosave: { enabled: false, delayMs: 500 },
      theme: "light",
      color: "never",
      mouse: true,
      editor: { tabWidth: 4, wrap: false, relativeNumbers: false },
      preview: { mode: "live", embedMaxRows: 10, images: "auto" },
      daily: {
        folder: "daily",
        format: "YYYY-MM-DD",
        template: "templates/daily.md",
      },
      templates: { folder: "templates" },
      keys: { normal: { "<leader>w": "file.save" } },
      filetypes: {
        markdown: { keys: { normal: { "<leader>w": "link.backlinks" } } },
      },
    },
    bindings: [
      { mode: "normal", seq: "<leader>w", id: "file.save", line: 13 },
      {
        mode: "normal",
        filetype: "markdown",
        seq: "<leader>w",
        id: "link.backlinks",
        line: 15,
      },
    ],
  });
});

test("an empty file gives the defaults", () => {
  expect(parseConfig("")).toEqual({ ok: true, config: defaults, bindings: [] });
  expect(defaults.editor).toEqual({
    tabWidth: 8,
    wrap: true,
    relativeNumbers: true,
  });
  expect(defaults.leader).toBe(" ");
});

test("a named leader key is stored as that key", () => {
  const r = parseConfig('leader = "<space>"');
  expect(r.ok && r.config.leader).toBe(" ");
});
