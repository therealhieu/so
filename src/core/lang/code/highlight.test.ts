import { expect, test } from "bun:test";
import { createTextBuffer } from "../../kernel/text/text-buffer";
import { highlightMarks } from "../../kernel/view/marks";
import type { TextView } from "../../kernel/view/types";
import { lowlightHighlighter } from "./highlight";

const source = Array.from({ length: 5000 }, (_, i) =>
  i % 50 === 0
    ? "/* block"
    : i % 50 === 1
      ? "   comment */"
      : `const v${i}: string = "s${i}"; // n`,
).join("\n");

test("highlights only the requested lines", () => {
  const buf = createTextBuffer(source);
  const h = lowlightHighlighter("typescript");
  const lines = h.highlight(buf, { from: 400, to: 440 });
  expect(lines).toHaveLength(40);
  for (const [i, spans] of lines.entries())
    expect(spans.map((s) => s.text).join("")).toBe(buf.line(400 + i));
  expect(lines[2]?.map((s) => s.style)).toContain("codeKeyword");
  expect(lines[2]?.map((s) => s.style)).toContain("codeString");
  expect(lines[2]?.map((s) => s.style)).toContain("codeComment");
  // Line 401 continues the block comment opened on line 400.
  expect(lines[1]).toEqual([{ text: "   comment */", style: "codeComment" }]);
});

test("look-back carries state from above the window", () => {
  const buf = createTextBuffer(source);
  const h = lowlightHighlighter("typescript");
  expect(h.highlight(buf, { from: 401, to: 402 })).toEqual([
    [{ text: "   comment */", style: "codeComment" }],
  ]);
});

test("highlight marks use code tokens for the visible lines", () => {
  const buf = createTextBuffer(source);
  const view: TextView = {
    buf,
    width: 80,
    topRow: 400,
    rows: 40,
    cursor: { line: 400, col: 0 },
    folds: new Set(),
    visible: { from: 400, to: 440 },
  };
  const marks = highlightMarks(lowlightHighlighter("typescript"))(
    view,
    undefined,
  );
  expect(marks.length).toBeGreaterThan(0);
  for (const m of marks) {
    if (m.kind !== "mark") throw new Error("expected marks only");
    expect(m.range.start.line).toBeGreaterThanOrEqual(400);
    expect(m.range.end.line).toBeLessThan(440);
  }
  expect(
    marks.some((m) => m.kind === "mark" && m.style.startsWith("code")),
  ).toBe(true);
});

test("the same buffer is highlighted once", () => {
  const buf = createTextBuffer(source);
  const h = lowlightHighlighter("typescript");
  const first = h.highlight(buf, { from: 400, to: 440 });
  expect(h.highlight(buf, { from: 400, to: 440 })).toBe(first);
  const edited = buf.apply({
    range: { start: { line: 400, col: 0 }, end: { line: 400, col: 0 } },
    text: "x",
  }).buffer;
  expect(h.highlight(edited, { from: 400, to: 440 })).not.toBe(first);
});

test("an unknown grammar yields no marks", () => {
  const buf = createTextBuffer("const a = 1;");
  const view: TextView = {
    buf,
    width: 80,
    topRow: 0,
    rows: 1,
    cursor: { line: 0, col: 0 },
    folds: new Set(),
    visible: { from: 0, to: 1 },
  };
  expect(
    highlightMarks(lowlightHighlighter("no-such-grammar"))(view, undefined),
  ).toEqual([]);
});
