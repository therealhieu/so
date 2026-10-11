/**
 * Catppuccin flavors (https://catppuccin.com/palette/), mapped to the theme's
 * palette keys the way catppuccin/nvim colours the same Neovim groups.
 */

type Colors = Record<
  | "rosewater"
  | "flamingo"
  | "pink"
  | "mauve"
  | "red"
  | "maroon"
  | "peach"
  | "yellow"
  | "green"
  | "teal"
  | "sky"
  | "sapphire"
  | "blue"
  | "lavender"
  | "text"
  | "subtext1"
  | "subtext0"
  | "overlay2"
  | "overlay1"
  | "overlay0"
  | "surface2"
  | "surface1"
  | "surface0"
  | "base"
  | "mantle"
  | "crust",
  string
>;

export type Flavor = "latte" | "frappe" | "macchiato" | "mocha";

// Values from catppuccin/palette palette.json (v1).
export const FLAVORS: Readonly<Record<Flavor, Colors>> = {
  latte: {
    rosewater: "#dc8a78",
    flamingo: "#dd7878",
    pink: "#ea76cb",
    mauve: "#8839ef",
    red: "#d20f39",
    maroon: "#e64553",
    peach: "#fe640b",
    yellow: "#df8e1d",
    green: "#40a02b",
    teal: "#179299",
    sky: "#04a5e5",
    sapphire: "#209fb5",
    blue: "#1e66f5",
    lavender: "#7287fd",
    text: "#4c4f69",
    subtext1: "#5c5f77",
    subtext0: "#6c6f85",
    overlay2: "#7c7f93",
    overlay1: "#8c8fa1",
    overlay0: "#9ca0b0",
    surface2: "#acb0be",
    surface1: "#bcc0cc",
    surface0: "#ccd0da",
    base: "#eff1f5",
    mantle: "#e6e9ef",
    crust: "#dce0e8",
  },
  frappe: {
    rosewater: "#f2d5cf",
    flamingo: "#eebebe",
    pink: "#f4b8e4",
    mauve: "#ca9ee6",
    red: "#e78284",
    maroon: "#ea999c",
    peach: "#ef9f76",
    yellow: "#e5c890",
    green: "#a6d189",
    teal: "#81c8be",
    sky: "#99d1db",
    sapphire: "#85c1dc",
    blue: "#8caaee",
    lavender: "#babbf1",
    text: "#c6d0f5",
    subtext1: "#b5bfe2",
    subtext0: "#a5adce",
    overlay2: "#949cbb",
    overlay1: "#838ba7",
    overlay0: "#737994",
    surface2: "#626880",
    surface1: "#51576d",
    surface0: "#414559",
    base: "#303446",
    mantle: "#292c3c",
    crust: "#232634",
  },
  macchiato: {
    rosewater: "#f4dbd6",
    flamingo: "#f0c6c6",
    pink: "#f5bde6",
    mauve: "#c6a0f6",
    red: "#ed8796",
    maroon: "#ee99a0",
    peach: "#f5a97f",
    yellow: "#eed49f",
    green: "#a6da95",
    teal: "#8bd5ca",
    sky: "#91d7e3",
    sapphire: "#7dc4e4",
    blue: "#8aadf4",
    lavender: "#b7bdf8",
    text: "#cad3f5",
    subtext1: "#b8c0e0",
    subtext0: "#a5adcb",
    overlay2: "#939ab7",
    overlay1: "#8087a2",
    overlay0: "#6e738d",
    surface2: "#5b6078",
    surface1: "#494d64",
    surface0: "#363a4f",
    base: "#24273a",
    mantle: "#1e2030",
    crust: "#181926",
  },
  mocha: {
    rosewater: "#f5e0dc",
    flamingo: "#f2cdcd",
    pink: "#f5c2e7",
    mauve: "#cba6f7",
    red: "#f38ba8",
    maroon: "#eba0ac",
    peach: "#fab387",
    yellow: "#f9e2af",
    green: "#a6e3a1",
    teal: "#94e2d5",
    sky: "#89dceb",
    sapphire: "#74c7ec",
    blue: "#89b4fa",
    lavender: "#b4befe",
    text: "#cdd6f4",
    subtext1: "#bac2de",
    subtext0: "#a6adc8",
    overlay2: "#9399b2",
    overlay1: "#7f849c",
    overlay0: "#6c7086",
    surface2: "#585b70",
    surface1: "#45475a",
    surface0: "#313244",
    base: "#1e1e2e",
    mantle: "#181825",
    crust: "#11111b",
  },
};

/** `fg` laid over `bg` at `alpha` (0–1), as `#rrggbb`. */
export function blend(fg: string, bg: string, alpha: number): string {
  const channel = (hex: string, i: number) =>
    Number.parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16);
  const mixed = [0, 1, 2].map((i) =>
    Math.round(alpha * channel(fg, i) + (1 - alpha) * channel(bg, i))
      .toString(16)
      .padStart(2, "0"),
  );
  return `#${mixed.join("")}`;
}

/** The theme palette for one flavor. */
export function catppuccin(flavor: Flavor): Record<string, string> {
  const c = FLAVORS[flavor];
  const tint = (color: string, alpha: number) => blend(color, c.base, alpha);
  // Yellow text on Latte's light base is unreadable (2.3:1), so Latte keeps its
  // text colour for highlights and darkens yellow for bold.
  const light = flavor === "latte";
  return {
    bg: c.base,
    "bg-dark": c.mantle,
    "bg-float": c.mantle,
    "bg-hl": c.surface0,
    "bg-sel": c.surface1,
    fg: c.text,
    bold: light ? blend(c.yellow, c.text, 0.4) : c.yellow,
    "fg-dim": c.overlay0,
    "fg-muted": c.subtext0,
    border: c.surface1,
    "border-hl": c.blue,
    h1: c.red,
    h2: c.peach,
    // Bold text is yellow, so H3 and H4 take the next rainbow colours.
    h3: c.green,
    h4: c.sapphire,
    "h1-bg": tint(c.red, 0.15),
    "h2-bg": tint(c.peach, 0.15),
    "h3-bg": tint(c.green, 0.15),
    link: c.blue,
    wikilink: c.lavender,
    code: c.green,
    "code-bg": c.mantle,
    note: c.blue,
    tip: c.teal,
    warning: c.yellow,
    danger: c.red,
    quote: c.overlay2,
    "hl-bg": tint(c.yellow, light ? 0.25 : 0.18),
    "hl-fg": light ? c.text : c.yellow,
    kw: c.mauve,
    str: c.green,
    num: c.peach,
    fn: c.blue,
    cmt: c.overlay2,
    type: c.yellow,
    tag: c.pink,
    "mode-normal": c.blue,
    "mode-insert": c.green,
    "mode-visual": c.mauve,
    "mode-cmd": c.peach,
    "mode-fg": c.mantle,
    error: c.red,
    warn: c.yellow,
    ok: c.green,
    info: c.sky,
    cursorline: tint(c.surface0, 0.64),
    "match-bg": tint(c.sky, 0.3),
    "add-bg": tint(c.green, 0.18),
    "add-fg": c.green,
    "del-bg": tint(c.red, 0.18),
    "del-fg": c.red,
  };
}
