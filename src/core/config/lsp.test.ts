import { expect, test } from "bun:test";
import { BUILTIN_SERVERS, gateAllows, resolveServers } from "./lsp";
import { defaults } from "./schema";
import { type ConfigError, parseConfig } from "./toml";

const lines = (...ls: string[]) => ls.join("\n");

function parsed(text: string) {
  const r = parseConfig(text);
  if (!r.ok) throw new Error(`unexpected errors: ${JSON.stringify(r.errors)}`);
  return r.config;
}

function errors(text: string): ConfigError[] {
  const r = parseConfig(text);
  if (r.ok) throw new Error("expected config errors");
  return r.errors;
}

const builtin = (name: string) => {
  const spec = BUILTIN_SERVERS.find((s) => s.name === name);
  if (spec === undefined) throw new Error(`no built-in ${name}`);
  return spec;
};

test("language servers are on when the config has no lsp section", () => {
  expect(parsed("").lsp).toEqual({
    enabled: true,
    formatOnSave: false,
    inlayHints: true,
    endOfLineDiagnostics: true,
    servers: {},
  });
  expect(defaults.lsp.enabled).toBe(true);
  expect(defaults.lsp.formatOnSave).toBe(false);
});

test("inlay hints and end-of-line diagnostics can be turned off", () => {
  const lsp = parsed(
    "[lsp]\ninlayHints = false\nendOfLineDiagnostics = false\n",
  ).lsp;
  expect(lsp.inlayHints).toBe(false);
  expect(lsp.endOfLineDiagnostics).toBe(false);
});

test("without overrides the built-in servers resolve in table order", () => {
  expect(resolveServers(defaults.lsp).map((s) => s.name)).toEqual([
    "tsc",
    "typescript",
    "pyright",
    "gopls",
    "rust-analyzer",
    "clangd",
    "json",
    "yaml",
    "terraform-ls",
  ]);
});

test("an added server can serve Terraform files", () => {
  const config = parsed(
    lines(
      "[lsp.servers.tflint]",
      `command = ["tflint", "--langserver"]`,
      `fileTypes = ["terraform"]`,
    ),
  );
  expect(resolveServers(config.lsp).at(-1)).toMatchObject({
    name: "tflint",
    fileTypes: ["terraform"],
  });
});

test("overrides change only the fields they set and additions follow the built-ins", () => {
  const config = parsed(
    lines(
      "[lsp]",
      "enabled = true",
      "[lsp.servers.rust-analyzer.settings.rust-analyzer]",
      'check.command = "clippy"',
      "[lsp.servers.pyright]",
      "enabled = false",
      "[lsp.servers.eslint]",
      'command = ["vscode-eslint-language-server", "--stdio"]',
      'fileTypes = ["typescript", "javascript"]',
      'rootMarkers = [["eslint.config.js", ".eslintrc.json"], ".git"]',
    ),
  );
  const servers = resolveServers(config.lsp);
  expect(servers.map((s) => s.name)).toEqual([
    "tsc",
    "typescript",
    "gopls",
    "rust-analyzer",
    "clangd",
    "json",
    "yaml",
    "terraform-ls",
    "eslint",
  ]);
  const rust = servers.find((s) => s.name === "rust-analyzer");
  const base = builtin("rust-analyzer");
  const settings = { "rust-analyzer": { check: { command: "clippy" } } };
  expect(rust).toEqual({
    ...base,
    settings,
    initOptions: settings["rust-analyzer"],
  });
  expect(servers.at(-1)).toEqual({
    name: "eslint",
    command: ["vscode-eslint-language-server", "--stdio"],
    fileTypes: ["typescript", "javascript"],
    rootMarkers: [["eslint.config.js", ".eslintrc.json"], ".git"],
    rootSearch: "nearest",
    settings: {},
    snippets: false,
    localBin: false,
  });
});

test("an explicit initOptions is kept over rust-analyzer settings", () => {
  const config = parsed(
    lines(
      "[lsp.servers.rust-analyzer]",
      'settings = { rust-analyzer = { cargo = { features = "all" } } }',
      "initOptions = { checkOnSave = false }",
    ),
  );
  const rust = resolveServers(config.lsp).find(
    (s) => s.name === "rust-analyzer",
  );
  expect(rust?.initOptions).toEqual({ checkOnSave: false });
});

test("an added server without a command is an error on its line", () => {
  const errs = errors(
    lines(
      "[lsp]",
      "enabled = true",
      "",
      "[lsp.servers.marksman]",
      'fileTypes = ["go"]',
    ),
  );
  expect(errs).toHaveLength(1);
  expect(errs[0]?.line).toBe(4);
  expect(errs[0]?.message).toContain("needs command and fileTypes");
});

test("exactly one TypeScript server passes the version gate for any major", () => {
  const tsc = builtin("tsc").gate;
  const ts = builtin("typescript").gate;
  if (tsc === undefined || ts === undefined) throw new Error("missing gates");
  const majors = [undefined, 5, 6, 7, 8];
  expect(majors.map((m) => gateAllows(tsc, m))).toEqual([
    false,
    false,
    false,
    true,
    true,
  ]);
  expect(majors.map((m) => gateAllows(ts, m))).toEqual([
    true,
    true,
    true,
    false,
    false,
  ]);
});

test("fileTypes naming a note, base, text, or unknown type is an error on its line", () => {
  for (const type of ["markdown", "base", "text", "rustt"]) {
    const errs = errors(
      lines(
        "[lsp.servers.gopls]",
        `command = ["gopls"]`,
        `fileTypes = ["${type}"]`,
      ),
    );
    expect(errs).toHaveLength(1);
    expect(errs[0]?.line).toBe(3);
    expect(errs[0]?.message).toContain("lsp.servers.gopls.fileTypes");
  }
});

test("unknown keys under the lsp section are errors", () => {
  expect(errors(lines("[lsp]", "enable = true"))).toEqual([
    { line: 2, message: 'unknown key "lsp.enable"' },
  ]);
  expect(
    errors(lines("[lsp.servers.gopls]", "localBin = true"))[0]?.message,
  ).toBe('unknown key "lsp.servers.gopls.localBin"');
});
