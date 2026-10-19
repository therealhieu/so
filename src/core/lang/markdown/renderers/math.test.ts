import { expect, test } from "bun:test";
import {
  layoutNote,
  noteView,
  rowText,
  stubCtx,
} from "../../../../../test/support/markdown";
import { registerBlockRenderer } from "../live-preview";
import { mathRenderer, mathRuns, mathText } from "./math";

test("simple formulas become unicode text", () => {
  expect(mathText("E = mc^2")).toEqual({ kind: "unicode", text: "E = mc²" });
  expect(mathText("\\sum_{i=1}^{n} x_i \\le \\frac{a}{b}")).toEqual({
    kind: "unicode",
    text: "∑ᵢ₌₁ⁿ xᵢ ≤ a/b",
  });
});

test("a formula with an unknown command stays source", () => {
  expect(mathText("\\unknowncmd x")).toEqual({
    kind: "source",
    tex: "\\unknowncmd x",
  });
});

test("a math block renders as one row of unicode text", () => {
  registerBlockRenderer("math", mathRenderer);
  const rows = layoutNote(
    noteView("Intro\n\n$$\n\\alpha + \\beta\n$$\n", {
      cursor: { line: 0, col: 0 },
    }),
  );
  expect(rows.map(rowText)).toEqual(["Intro", "", "α + β", ""]);
});

test("a math block with unsupported TeX keeps its source under a label", () => {
  registerBlockRenderer("math", mathRenderer);
  const rows = layoutNote(
    noteView("Intro\n\n$$\n\\unknowncmd x\n$$\n", {
      cursor: { line: 0, col: 0 },
    }),
  );
  expect(rows[2]?.widget?.data).toEqual([
    [{ text: "math: unsupported TeX shown as source", style: "mdMarker" }],
  ]);
  expect(rows.slice(3).map(rowText)).toEqual([
    "$$",
    "\\unknowncmd x",
    "$$",
    "",
  ]);
});

test("math runs keep any script character apart from the text, flattening nested scripts", () => {
  expect(mathRuns("Q_{w} + Q_{r} > N")).toEqual([
    { text: "Q" },
    { text: "w", place: "sub" },
    { text: " + Q" },
    { text: "r", place: "sub" },
    { text: " > N" },
  ]);
  expect(mathRuns("x^{a_b}")).toEqual([
    { text: "x" },
    { text: "ab", place: "sup" },
  ]);
  expect(mathRuns("\\unknowncmd x")).toBeNull();
});

test("with sized text a math block draws its scripts as half-size pairs", () => {
  registerBlockRenderer("math", mathRenderer);
  const note = "Intro\n\n$$\nT_{timeout}\n$$\n";
  const row = (sizedText: boolean) =>
    layoutNote(
      noteView(note, { cursor: { line: 0, col: 0 } }),
      "live",
      stubCtx({ sizedText }),
    )[2];
  expect(
    row(true)?.spans.map(({ text, style, script }) =>
      script === undefined ? { text, style } : { text, style, script },
    ),
  ).toEqual([
    { text: "T", style: "mdCode" },
    { text: "t", style: "mdCode", script: { text: "ti", place: "sub" } },
    { text: "m", style: "mdCode", script: { text: "me", place: "sub" } },
    { text: "o", style: "mdCode", script: { text: "ou", place: "sub" } },
    { text: "t", style: "mdCode", script: { text: "t", place: "sub" } },
  ]);
  expect(rowText(row(false))).toBe("Tₜᵢₘₑₒᵤₜ");
});
