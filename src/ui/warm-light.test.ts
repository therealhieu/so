import { expect, test } from "bun:test";
import { TOKENS, themes } from "./theme";
import { PAPER, ROSE_PINE_DAWN, SEPIA } from "./warm-light";

const PALETTES = {
  paper: PAPER,
  sepia: SEPIA,
  "rose-pine-dawn": ROSE_PINE_DAWN,
};

const hex = (s: { toInts(): number[] }) =>
  `#${s
    .toInts()
    .slice(0, 3)
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")}`;

test("every warm palette defines each palette key a token uses", () => {
  const used = new Set(Object.values(TOKENS).flatMap(([fg, bg]) => [fg, bg]));
  for (const palette of Object.values(PALETTES)) {
    expect([...used].filter((key) => !(key in palette))).toEqual([]);
  }
});

test("warm themes paint text from their palette", () => {
  for (const [name, palette] of Object.entries(PALETTES)) {
    const text = themes[name as keyof typeof PALETTES].style("text");
    expect(palette.fg).toBe(hex(text.fg));
    expect(palette.bg).toBe(hex(text.bg));
  }
});

test("paper and sepia headings carry no background band", () => {
  for (const palette of [PAPER, SEPIA]) {
    for (const level of [1, 2, 3]) {
      expect(palette[`h${level}-bg`]).toBe(palette.bg);
    }
  }
});
