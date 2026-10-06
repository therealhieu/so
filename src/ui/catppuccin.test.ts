import { expect, test } from "bun:test";
import { blend, catppuccin, FLAVORS } from "./catppuccin";
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
  for (const colors of Object.values(FLAVORS)) {
    const palette = catppuccin(colors);
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
