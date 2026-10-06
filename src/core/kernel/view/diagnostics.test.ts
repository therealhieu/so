import { expect, test } from "bun:test";
import { createTextBuffer } from "../text/text-buffer";
import type { Decoration } from "./decorations";
import {
  type Diagnostic,
  diagnosticMarks,
  endOfLineDiagnosticMarks,
} from "./diagnostics";
import { layoutText } from "./text-view";
import type { LineRange, TextView } from "./types";

function view(lines: string[], visible?: LineRange): TextView {
  const range = visible ?? { from: 0, to: lines.length };
  return {
    buf: createTextBuffer(lines.join("\n")),
    width: 80,
    topRow: range.from,
    rows: range.to - range.from,
    cursor: { line: 0, col: 0 },
    folds: new Set(),
    visible: range,
  };
}

const diag = (
  severity: Diagnostic["severity"],
  start: [number, number],
  end: [number, number],
): Diagnostic => ({
  range: {
    start: { line: start[0], col: start[1] },
    end: { line: end[0], col: end[1] },
  },
  severity,
  message: `severity ${severity}`,
});

const lineDecos = (decos: Decoration[]) =>
  decos.filter((d) => d.kind === "line");
const marks = (decos: Decoration[]) => decos.filter((d) => d.kind === "mark");

const source = Array.from({ length: 20 }, (_, i) =>
  i === 12 ? "const value = name + 1;" : `line ${i}`,
);

test("a line with an error and a warning shows one error sign and both underlines", () => {
  const v = view(source);
  for (const shown of [
    [diag(1, [12, 13], [12, 16]), diag(2, [12, 14], [12, 18])],
    [diag(2, [12, 14], [12, 18]), diag(1, [12, 13], [12, 16])],
  ]) {
    const decos = diagnosticMarks(shown)(v, undefined);
    expect(lineDecos(decos)).toEqual([
      { kind: "line", line: 12, sign: { text: "E", style: "diagnosticError" } },
    ]);
    expect(marks(decos)).toContainEqual({
      kind: "mark",
      range: { start: { line: 12, col: 13 }, end: { line: 12, col: 16 } },
      style: "diagnosticError",
    });
    expect(marks(decos)).toContainEqual({
      kind: "mark",
      range: { start: { line: 12, col: 14 }, end: { line: 12, col: 18 } },
      style: "diagnosticWarn",
    });
    expect(marks(decos)).toHaveLength(2);
    const row = layoutText(v, [diagnosticMarks(shown)], undefined).find(
      (r) => r.sourceLine === 12,
    );
    expect(row?.sign).toEqual({ text: "E", style: "diagnosticError" });
    expect(row?.spans.find((s) => s.col === 13)?.style).toBe("diagnosticError");
  }
});

test("each severity has its own sign", () => {
  const decos = diagnosticMarks([
    diag(2, [0, 0], [0, 1]),
    diag(3, [1, 0], [1, 1]),
    diag(4, [2, 0], [2, 1]),
  ])(view(["a", "b", "c"]), undefined);
  expect(lineDecos(decos).map((d) => d.kind === "line" && d.sign)).toEqual([
    { text: "W", style: "diagnosticWarn" },
    { text: "I", style: "diagnosticInfo" },
    { text: "H", style: "diagnosticHint" },
  ]);
});

test("ranges past the line end are clamped and ranges on missing lines are skipped", () => {
  const v = view(["short", "end"]);
  const shown = [
    diag(1, [0, 2], [0, 40]),
    diag(1, [1, 1], [9, 3]),
    diag(2, [7, 0], [7, 4]),
    diag(2, [-1, 0], [0, 2]),
    diag(2, [Number.NaN, 0], [0, 2]),
  ];
  let decos: Decoration[] = [];
  expect(() => {
    decos = diagnosticMarks(shown)(v, undefined);
  }).not.toThrow();
  expect(marks(decos)).toEqual([
    {
      kind: "mark",
      range: { start: { line: 0, col: 2 }, end: { line: 0, col: 5 } },
      style: "diagnosticError",
    },
    {
      kind: "mark",
      range: { start: { line: 1, col: 1 }, end: { line: 1, col: 3 } },
      style: "diagnosticError",
    },
  ]);
  expect(lineDecos(decos).map((d) => d.kind === "line" && d.line)).toEqual([
    0, 1,
  ]);
  expect(() =>
    layoutText(v, [diagnosticMarks(shown)], undefined),
  ).not.toThrow();
});

test("a zero-width range still underlines one character", () => {
  const decos = diagnosticMarks([
    diag(1, [0, 2], [0, 2]),
    diag(2, [1, 3], [1, 3]),
  ])(view(["abcd", "xyz"]), undefined);
  expect(marks(decos).map((d) => d.kind === "mark" && d.range)).toEqual([
    { start: { line: 1, col: 2 }, end: { line: 1, col: 3 } },
    { start: { line: 0, col: 2 }, end: { line: 0, col: 3 } },
  ]);
});

test("only diagnostics starting on visible lines are drawn", () => {
  const decos = diagnosticMarks([
    diag(1, [2, 0], [2, 4]),
    diag(1, [8, 0], [8, 4]),
  ])(view(source, { from: 5, to: 10 }), undefined);
  expect(lineDecos(decos).map((d) => d.kind === "line" && d.line)).toEqual([8]);
  expect(marks(decos)).toHaveLength(1);
});

test("the most severe diagnostic of a line follows it, with a count of the rest", () => {
  const v = view(["let y = z;", "ok", "let w = q;"]);
  const worst: Diagnostic = {
    ...diag(1, [0, 8], [0, 9]),
    message: "cannot find value `z`\nhelp: a local variable exists",
  };
  const rows = layoutText(
    v,
    [
      endOfLineDiagnosticMarks([
        diag(4, [0, 4], [0, 5]),
        worst,
        diag(2, [2, 8], [2, 9]),
      ]),
    ],
    undefined,
  );
  const tail = (i: number) => rows[i]?.spans.at(-1);
  expect(tail(0)).toEqual({
    text: "  ● cannot find value `z` (+1)",
    style: "diagnosticTextError",
    virtual: "eol",
    col: 10,
    inserted: true,
  });
  expect(rows[1]?.spans).toEqual([{ text: "ok", style: "text", col: 0 }]);
  expect(tail(2)?.style).toBe("diagnosticTextWarn");
  // The line's own text is unchanged.
  expect(rows[0]?.spans[0]).toEqual({
    text: "let y = z;",
    style: "text",
    col: 0,
  });
});

test("diagnostics outside the visible lines draw no end-of-line text", () => {
  const v = view(["a", "b", "c"], { from: 1, to: 2 });
  expect(
    endOfLineDiagnosticMarks([diag(1, [0, 0], [0, 1])])(v, undefined),
  ).toEqual([]);
});
