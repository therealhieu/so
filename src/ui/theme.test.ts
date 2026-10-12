import { expect, test } from "bun:test";
import { RGBA, TextAttributes } from "@opentui/core";
import { type Style, type Theme, TOKENS, themes } from "./theme";

const { BOLD, DIM, UNDERLINE } = TextAttributes;

/** The palette colours the git tokens use, per colour theme. */
const PALETTE: Record<"dark" | "light", Record<string, string>> = {
  dark: {
    ok: "#9ece6a",
    fn: "#7aa2f7",
    error: "#f7768e",
    "fg-muted": "#737aa2",
    "mode-visual": "#bb9af7",
    kw: "#bb9af7",
    warn: "#e0af68",
    "fg-dim": "#565f89",
    bg: "#1a1b26",
    "bg-dark": "#16161e",
  },
  light: {
    ok: "#587539",
    fn: "#2e7de9",
    error: "#c64343",
    "fg-muted": "#6172b0",
    "mode-visual": "#7847bd",
    kw: "#7847bd",
    warn: "#8c6c3e",
    "fg-dim": "#8990b3",
    bg: "#e1e2e7",
    "bg-dark": "#d0d5e3",
  },
};

/** token, foreground and background palette keys, attributes, NO_COLOR attributes. */
const GIT_TOKENS: [string, string, string, number, number][] = [
  ["gitAdd", "ok", "bg", 0, 0],
  ["gitChange", "fn", "bg", 0, 0],
  ["gitDelete", "error", "bg", 0, 0],
  ["gitTopDelete", "error", "bg", 0, 0],
  ["gitChangeDelete", "fn", "bg", 0, 0],
  ["gitUntracked", "fg-muted", "bg", 0, 0],
  ["statusGitRef", "mode-visual", "bg-dark", 0, 0],
  ["statusGitOp", "warn", "bg-dark", BOLD, BOLD | UNDERLINE],
  ["statusGitAdd", "ok", "bg-dark", 0, 0],
  ["statusGitChange", "fn", "bg-dark", 0, 0],
  ["statusGitDelete", "error", "bg-dark", 0, 0],
  ["explorerGitModified", "warn", "bg-dark", 0, 0],
  ["explorerGitStaged", "ok", "bg-dark", 0, 0],
  ["explorerGitUntracked", "kw", "bg-dark", 0, 0],
  ["explorerGitConflict", "error", "bg-dark", BOLD, BOLD | UNDERLINE],
  ["messageWarn", "warn", "bg", 0, 0],
];

const plain = (s: Style) => ({
  fg: s.fg.intent === "default" ? "default" : s.fg.toInts().join(","),
  bg: s.bg.intent === "default" ? "default" : s.bg.toInts().join(","),
  attrs: s.attrs,
});

const ints = (hex: string | undefined) =>
  RGBA.fromHex(hex ?? "")
    .toInts()
    .join(",");

test("git tokens resolve to their palette colours in every theme", () => {
  for (const [name, fg, bg, attrs, noColor] of GIT_TOKENS) {
    expect(Object.hasOwn(TOKENS, name)).toBe(true);
    for (const t of ["dark", "light"] as const)
      expect({ name, ...plain(themes[t].style(name)) }).toEqual({
        name,
        fg: ints(PALETTE[t][fg]),
        bg: ints(PALETTE[t][bg]),
        attrs,
      });
    expect({ name, ...plain(themes.nocolor.style(name)) }).toEqual({
      name,
      fg: "default",
      bg: "default",
      attrs: noColor,
    });
  }
});

test("existing tokens keep their values", () => {
  const git = new Set(GIT_TOKENS.map(([name]) => name));
  const resolve = (t: Theme) =>
    Object.fromEntries(
      Object.keys(TOKENS)
        .filter((name) => !git.has(name))
        .map((name) => [name, plain(t.style(name))]),
    );
  expect({
    dark: resolve(themes.dark),
    light: resolve(themes.light),
    nocolor: resolve(themes.nocolor),
  }).toMatchSnapshot();
});
