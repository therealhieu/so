import { expect, test } from "bun:test";
import { inlineCssVars } from "./svg-css";

test("custom properties become their values, with fallbacks and colour mixes", () => {
  const svg = [
    '<svg style="--bg:#000000;--fg:#ffffff">',
    "<style>svg { --_line: var(--line, color-mix(in srgb, var(--fg) 25%, var(--bg))); }</style>",
    '<path stroke="var(--_line)" fill="var(--fg)"/>',
    '<rect fill="var(--accent, #3b82f6)"/>',
    '<rect fill="color-mix(in srgb, var(--bg) 75%, var(--fg) 25%)"/>',
    '<rect fill="var(--missing)" stroke="color-mix(in oklch, red, blue)"/>',
    "</svg>",
  ].join("\n");
  const out = inlineCssVars(svg);
  expect(out).toContain('<path stroke="#404040" fill="#ffffff"/>');
  expect(out).toContain('<rect fill="#3b82f6"/>');
  expect(out).toContain('<rect fill="#404040"/>');
  // What cannot be resolved stays as written.
  expect(out).toContain(
    '<rect fill="var(--missing)" stroke="color-mix(in oklch, red, blue)"/>',
  );
});
