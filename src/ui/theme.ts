import { type OptimizedBuffer, RGBA, TextAttributes } from "@opentui/core";
import type { AppState } from "../core/state/types";

/** Terminal attributes for one token. */
export type Style = { fg: RGBA; bg: RGBA; attrs: number };

export type Theme = {
  name: "dark" | "light" | "nocolor";
  /** Kernel style tokens ("codeKeyword", "selection") and chrome tokens ("modeNormal"). */
  style(token: string): Style;
};

type Palette = Record<string, string>;

// Values from the accepted mockups' shared theme tokens (terminal.css).
const DARK: Palette = {
  bg: "#1a1b26",
  "bg-dark": "#16161e",
  "bg-float": "#1f2335",
  "bg-hl": "#292e42",
  "bg-sel": "#2d3f76",
  fg: "#c0caf5",
  "fg-dim": "#565f89",
  "fg-muted": "#737aa2",
  border: "#3b4261",
  "border-hl": "#7aa2f7",
  h1: "#7aa2f7",
  h2: "#e0af68",
  link: "#7dcfff",
  kw: "#bb9af7",
  str: "#9ece6a",
  num: "#ff9e64",
  fn: "#7aa2f7",
  cmt: "#565f89",
  type: "#2ac3de",
  tag: "#ff9e64",
  "mode-normal": "#7aa2f7",
  "mode-insert": "#9ece6a",
  "mode-visual": "#bb9af7",
  "mode-cmd": "#e0af68",
  "mode-fg": "#15161e",
  error: "#f7768e",
  warn: "#e0af68",
  ok: "#9ece6a",
  info: "#7dcfff",
  cursorline: "#232433",
  "match-bg": "#3d59a1",
  "add-bg": "#20303b",
  "add-fg": "#9ece6a",
  "del-bg": "#37222c",
  "del-fg": "#f7768e",
};

const LIGHT: Palette = {
  bg: "#e1e2e7",
  "bg-dark": "#d0d5e3",
  "bg-float": "#d6d8e2",
  "bg-hl": "#c4c8da",
  "bg-sel": "#b7c5f0",
  fg: "#3760bf",
  "fg-dim": "#8990b3",
  "fg-muted": "#6172b0",
  border: "#a8aecb",
  "border-hl": "#2e7de9",
  h1: "#2e7de9",
  h2: "#8c6c3e",
  link: "#007197",
  kw: "#7847bd",
  str: "#587539",
  num: "#b15c00",
  fn: "#2e7de9",
  cmt: "#848cb5",
  type: "#118c74",
  tag: "#b15c00",
  "mode-normal": "#2e7de9",
  "mode-insert": "#587539",
  "mode-visual": "#7847bd",
  "mode-cmd": "#8c6c3e",
  "mode-fg": "#e9e9ed",
  error: "#c64343",
  warn: "#8c6c3e",
  ok: "#587539",
  info: "#007197",
  cursorline: "#d5d7e1",
  "match-bg": "#a8c0f5",
  "add-bg": "#cfe3c5",
  "add-fg": "#2d5a1a",
  "del-bg": "#f0cccc",
  "del-fg": "#8a1f1f",
};

const { BOLD, DIM, ITALIC, UNDERLINE, INVERSE } = TextAttributes;

/**
 * token → [fg, bg, attributes, NO_COLOR attributes]. Under NO_COLOR every
 * colour is the terminal default, so each state keeps a non-colour mark
 * (reverse, bold, underline, dim) or a glyph.
 */
const TOKENS: Readonly<Record<string, [string, string, number, number]>> = {
  text: ["fg", "bg", 0, 0],
  dim: ["fg-dim", "bg", 0, DIM],
  gutter: ["fg-dim", "bg", 0, DIM],
  gutterCursor: ["h2", "cursorline", BOLD, BOLD | UNDERLINE],
  cursorline: ["fg", "cursorline", 0, 0],
  selection: ["fg", "bg-sel", 0, INVERSE],
  searchMatch: ["fg", "match-bg", 0, UNDERLINE],
  codeKeyword: ["kw", "bg", BOLD, BOLD],
  codeBuiltin: ["type", "bg", 0, 0],
  codeType: ["type", "bg", 0, 0],
  codeLiteral: ["num", "bg", 0, 0],
  codeNumber: ["num", "bg", 0, 0],
  codeString: ["str", "bg", 0, 0],
  codeComment: ["cmt", "bg", ITALIC, DIM | ITALIC],
  codeMeta: ["fg-muted", "bg", 0, 0],
  codeTitle: ["fn", "bg", 0, 0],
  codeAttribute: ["h2", "bg", 0, 0],
  codeVariable: ["fg", "bg", 0, 0],
  codeProperty: ["link", "bg", 0, 0],
  codeParams: ["fg", "bg", 0, 0],
  codeTag: ["kw", "bg", 0, 0],
  codeBullet: ["h2", "bg", 0, 0],
  codeLink: ["link", "bg", UNDERLINE, UNDERLINE],
  codeAddition: ["add-fg", "bg", 0, 0],
  codeDeletion: ["del-fg", "bg", 0, 0],
  bufferline: ["fg-muted", "bg-dark", 0, 0],
  bufferActive: ["fg", "bg", BOLD, BOLD | UNDERLINE],
  bufferDirty: ["warn", "bg-dark", 0, 0],
  statusline: ["fg", "bg-dark", 0, 0],
  statusDim: ["fg-dim", "bg-dark", 0, DIM],
  statusError: ["error", "bg-dark", BOLD, BOLD],
  statusDirty: ["warn", "bg-dark", 0, 0],
  modeNormal: ["mode-fg", "mode-normal", BOLD, BOLD | INVERSE],
  modeInsert: ["mode-fg", "mode-insert", BOLD, BOLD | INVERSE],
  modeVisual: ["mode-fg", "mode-visual", BOLD, BOLD | INVERSE],
  modeCmd: ["mode-fg", "mode-cmd", BOLD, BOLD | INVERSE],
  message: ["fg", "bg", 0, 0],
  messageError: ["error", "bg", BOLD, BOLD],
  explorer: ["fg", "bg-dark", 0, 0],
  explorerDim: ["fg-dim", "bg-dark", 0, DIM],
  explorerTitle: ["fg-muted", "bg-dark", BOLD, BOLD],
  explorerDir: ["h1", "bg-dark", 0, 0],
  explorerDirty: ["warn", "bg-dark", 0, 0],
  explorerWarn: ["warn", "bg-dark", 0, 0],
  explorerError: ["error", "bg-dark", BOLD, BOLD],
  treeSel: ["fg", "bg-hl", 0, UNDERLINE],
  treeSelFocus: ["fg", "bg-sel", 0, INVERSE],
  treeField: ["fg", "bg-sel", UNDERLINE, INVERSE | UNDERLINE],
  separator: ["border", "bg", 0, 0],
  winbar: ["fg-dim", "bg-dark", 0, DIM],
  winbarActive: ["fg", "bg-dark", BOLD, BOLD],
  float: ["fg", "bg-float", 0, 0],
  floatDim: ["fg-dim", "bg-float", 0, DIM],
  floatBorder: ["border-hl", "bg-float", 0, 0],
  floatTitle: ["border-hl", "bg-float", BOLD, BOLD],
  floatSel: ["fg", "bg-sel", 0, INVERSE],
  floatWarn: ["warn", "bg-float", 0, 0],
  floatError: ["error", "bg-float", BOLD, BOLD],
  toastInfo: ["ok", "bg-float", 0, 0],
  toastError: ["error", "bg-float", BOLD, BOLD],
  diffAdd: ["add-fg", "add-bg", 0, 0],
  diffDel: ["del-fg", "del-bg", 0, 0],
};

function colorTheme(name: "dark" | "light", p: Palette): Theme {
  const cache = new Map<string, Style>();
  return {
    name,
    style(token) {
      const hit = cache.get(token);
      if (hit !== undefined) return hit;
      const [fg, bg, attrs] = TOKENS[token] ?? TOKENS.text ?? ["fg", "bg", 0];
      const s = {
        fg: RGBA.fromHex(p[fg] ?? "#ffffff"),
        bg: RGBA.fromHex(p[bg] ?? "#000000"),
        attrs,
      };
      cache.set(token, s);
      return s;
    },
  };
}

const nocolorTheme: Theme = {
  name: "nocolor",
  style(token) {
    return {
      fg: RGBA.defaultForeground(),
      bg: RGBA.defaultBackground(),
      attrs: (TOKENS[token] ?? [0, 0, 0, 0])[3],
    };
  },
};

export const themes: Readonly<Record<Theme["name"], Theme>> = {
  dark: colorTheme("dark", DARK),
  light: colorTheme("light", LIGHT),
  nocolor: nocolorTheme,
};

/** The one place colour is decided: `NO_COLOR` (resolved at boot) wins over the theme. */
export const resolveTheme = (o: {
  color: "color" | "nocolor";
  theme: "dark" | "light";
}): Theme => (o.color === "nocolor" ? themes.nocolor : themes[o.theme]);

/** The theme for the state's colour mode and configured theme; `color = "never"` turns colour off. */
export const themeOf = (s: AppState): Theme =>
  resolveTheme({
    color: s.config.color === "never" ? "nocolor" : s.terminal.color,
    theme: s.config.theme,
  });

/** Cut the middle of `text` to `width` cells with `…`, keeping both ends. */
export function middle(text: string, width: number): string {
  const c = [...text];
  if (c.length <= width) return text;
  if (width <= 1) return "…".slice(0, width);
  const head = Math.ceil((width - 1) / 2);
  return `${c.slice(0, head).join("")}…${c.slice(c.length - (width - 1 - head)).join("")}`;
}

/**
 * Draw `text` at (x, y), cut or padded to `width` cells. Every painter uses
 * this instead of `fillRect`, so NO_COLOR output carries default colours only.
 */
export function drawCells(
  buf: OptimizedBuffer,
  s: Style,
  x: number,
  y: number,
  text: string,
  width?: number,
): void {
  if (width !== undefined && width <= 0) return;
  const cells = [...text];
  const fitted =
    width === undefined
      ? text
      : cells.length >= width
        ? cells.slice(0, width).join("")
        : text + " ".repeat(width - cells.length);
  if (fitted !== "") buf.drawText(fitted, x, y, s.fg, s.bg, s.attrs);
}
