import { expect, test } from "bun:test";
import {
  layoutNote,
  noteView,
  rowText,
} from "../../../../../test/support/markdown";
import { registerBlockRenderer } from "../live-preview";
import { mathRenderer, mathText } from "./math";

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
