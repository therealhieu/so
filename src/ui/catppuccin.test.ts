import { expect, test } from "bun:test";
import { blend, catppuccin, FLAVORS, type Flavor } from "./catppuccin";
import { TOKENS, themes } from "./theme";

const hex = (s: { toInts(): number[] }) =>
  `#${s
    .toInts()
    .slice(0, 3)
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")}`;

test("blend mixes each channel by alpha", () => {
  expect(blend("#ffffff", "#000000", 0)).toBe("#000000");
  expect(blend("#ffffff", "#000000", 1)).toBe("#ffffff");
  expect(blend("#ff8000", "#000000", 0.5)).toBe("#804000");
});

test("every flavor defines each palette key a token uses", () => {
  const used = new Set(Object.values(TOKENS).flatMap(([fg, bg]) => [fg, bg]));
  for (const flavor of Object.keys(FLAVORS) as Flavor[]) {
    const palette = catppuccin(flavor);
    expect([...used].filter((key) => !(key in palette))).toEqual([]);
  }
});

test("catppuccin themes paint from their flavor", () => {
  for (const flavor of ["latte", "mocha"] as const) {
    const c = FLAVORS[flavor];
    const theme = themes[`catppuccin-${flavor}`];
    const style = (token: string) => {
      const s = theme.style(token);
      return { fg: hex(s.fg), bg: hex(s.bg) };
    };
    expect(style("text")).toEqual({ fg: c.text, bg: c.base });
    expect(style("modeNormal")).toEqual({ fg: c.mantle, bg: c.blue });
    expect(style("codeKeyword")).toEqual({ fg: c.mauve, bg: c.base });
    expect(style("diffAdd")).toEqual({
      fg: c.green,
      bg: blend(c.green, c.base, 0.18),
    });
  }
});

const contrast = (s: {
  fg: { toInts(): number[] };
  bg: { toInts(): number[] };
}) => {
  const luminance = (h: string) => {
    const [r = 0, g = 0, b = 0] = [0, 1, 2]
      .map((i) => Number.parseInt(h.slice(1 + 2 * i, 3 + 2 * i), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [fg, bg] = [luminance(hex(s.fg)), luminance(hex(s.bg))];
  return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
};

test("highlighted text is warm on dark flavors and readable on all", () => {
  for (const flavor of Object.keys(FLAVORS) as Flavor[]) {
    const c = FLAVORS[flavor];
    const s = themes[`catppuccin-${flavor}`].style("mdHighlight");
    expect(contrast(s)).toBeGreaterThanOrEqual(4.5);
    expect(hex(s.fg)).toBe(flavor === "latte" ? c.text : c.yellow);
  }
});

test("bold text is warm, readable, and unlike every heading", () => {
  for (const flavor of Object.keys(FLAVORS) as Flavor[]) {
    const c = FLAVORS[flavor];
    const s = themes[`catppuccin-${flavor}`].style("mdBold");
    expect(contrast(s)).toBeGreaterThanOrEqual(4.5);
    for (const level of [1, 2, 3, 4])
      expect(hex(s.fg)).not.toBe(
        hex(themes[`catppuccin-${flavor}`].style(`mdHeading${level}`).fg),
      );
    expect(hex(s.fg)).toBe(
      flavor === "latte" ? blend(c.yellow, c.text, 0.4) : c.yellow,
    );
  }
});
