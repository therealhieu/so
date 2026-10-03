import { expect, test } from "bun:test";
import { createTextBuffer } from "../text/text-buffer";
import type { Decoration, DecorationProvider } from "./decorations";
import { highlightMarks, searchMarks, selectionMarks } from "./marks";
import { layoutText } from "./text-view";
import type { Highlighter, LineRange, TextView } from "./types";

function view(
  lines: string[],
  visible: LineRange = { from: 0, to: lines.length },
): TextView {
  return {
    buf: createTextBuffer(lines.join("\n")),
    width: 80,
    topRow: visible.from,
    rows: visible.to - visible.from,
    cursor: { line: 0, col: 0 },
    folds: new Set(),
    visible,
  };
}

const fixed =
  (...decos: Decoration[]): DecorationProvider =>
  () =>
    decos;

test("no providers lays out raw lines", () => {
  expect(layoutText(view(["one", "", "two"]), [], undefined)).toEqual([
    { sourceLine: 0, spans: [{ text: "one", style: "text" }] },
    { sourceLine: 1, spans: [] },
    { sourceLine: 2, spans: [{ text: "two", style: "text" }] },
  ]);
});

test("mark styles a range and keeps span offsets equal to source columns", () => {
  const rows = layoutText(
    view(["let x = 1;"]),
    [
      fixed({
        kind: "mark",
        range: { start: { line: 0, col: 0 }, end: { line: 0, col: 3 } },
        style: "codeKeyword",
      }),
    ],
    undefined,
  );
  expect(rows[0]?.spans).toEqual([
    { text: "let", style: "codeKeyword" },
    { text: " x = 1;", style: "text" },
  ]);
  expect(rows[0]?.spans.map((s) => s.text).join("")).toBe("let x = 1;");
});

test("later providers win where marks overlap", () => {
  const range = { start: { line: 0, col: 0 }, end: { line: 0, col: 4 } };
  const rows = layoutText(
    view(["abcdef"]),
    [
      fixed({ kind: "mark", range, style: "codeString" }),
      fixed({
        kind: "mark",
        range: { ...range, start: { line: 0, col: 2 } },
        style: "selection",
      }),
    ],
    undefined,
  );
  expect(rows[0]?.spans).toEqual([
    { text: "ab", style: "codeString" },
    { text: "cd", style: "selection" },
    { text: "ef", style: "text" },
  ]);
});

test("inline replace hides text and inserts its spans", () => {
  const rows = layoutText(
    view(["a **b** c"]),
    [
      fixed(
        {
          kind: "replace",
          range: { start: { line: 0, col: 2 }, end: { line: 0, col: 4 } },
          block: false,
        },
        {
          kind: "replace",
          range: { start: { line: 0, col: 5 }, end: { line: 0, col: 7 } },
          block: false,
          spans: [{ text: "†", style: "footnote" }],
        },
      ),
    ],
    undefined,
  );
  expect(rows[0]?.spans).toEqual([
    { text: "a ", style: "text" },
    { text: "b", style: "text" },
    { text: "†", style: "footnote" },
    { text: " c", style: "text" },
  ]);
});

test("block replace swaps whole lines for a widget row", () => {
  const widget = { type: "rule", data: null, rows: 1 };
  const rows = layoutText(
    view(["above", "| a |", "| b |", "below"]),
    [
      fixed({
        kind: "replace",
        range: { start: { line: 1, col: 0 }, end: { line: 2, col: 5 } },
        block: true,
        widget,
      }),
    ],
    undefined,
  );
  expect(rows).toEqual([
    { sourceLine: 0, spans: [{ text: "above", style: "text" }] },
    { sourceLine: 1, spans: [], widget },
    { sourceLine: 3, spans: [{ text: "below", style: "text" }] },
  ]);
});

test("block widget inserts rows below its line", () => {
  const widget = { type: "image", data: { src: "a.png" }, rows: 3 };
  const rows = layoutText(
    { ...view(["![a](a.png)", "next"]), rows: 10 },
    [fixed({ kind: "widget", at: { line: 0, col: 11 }, block: true, widget })],
    undefined,
  );
  expect(rows).toEqual([
    { sourceLine: 0, spans: [{ text: "![a](a.png)", style: "text" }] },
    { sourceLine: 0, spans: [], widget },
    { sourceLine: 1, spans: [{ text: "next", style: "text" }] },
  ]);
});

test("widget rows count toward the visible rows", () => {
  const widget = { type: "image", data: null, rows: 3 };
  const rows = layoutText(
    { ...view(["a", "b", "c", "d", "e"]), rows: 4 },
    [fixed({ kind: "widget", at: { line: 0, col: 1 }, block: true, widget })],
    undefined,
  );
  expect(rows.map((r) => [r.sourceLine, r.widget?.rows ?? 1])).toEqual([
    [0, 1],
    [0, 3],
  ]);
});

test("line decoration sets the line style and sign", () => {
  const sign = { text: "▕", style: "revealSign" };
  const rows = layoutText(
    view(["code", "plain"]),
    [fixed({ kind: "line", line: 0, style: "codeBlock", sign })],
    undefined,
  );
  expect(rows).toEqual([
    { sourceLine: 0, spans: [{ text: "code", style: "codeBlock" }], sign },
    { sourceLine: 1, spans: [{ text: "plain", style: "text" }] },
  ]);
});

test("viewport only", () => {
  const lines = Array.from({ length: 5000 }, (_, i) => `line ${i}`);
  const v = view(lines, { from: 100, to: 130 });
  const requested: LineRange[] = [];
  const highlighter: Highlighter = {
    language: "test",
    highlight(buf, range) {
      requested.push(range);
      return Array.from({ length: range.to - range.from }, (_, i) => [
        { text: buf.line(range.from + i), style: "codeString" },
      ]);
    },
  };
  const seen: LineRange[] = [];
  const spy: DecorationProvider = (tv) => {
    seen.push(tv.visible);
    return [];
  };
  const rows = layoutText(v, [highlightMarks(highlighter), spy], undefined);
  expect(requested).toEqual([{ from: 100, to: 130 }]);
  expect(seen).toEqual([{ from: 100, to: 130 }]);
  expect(rows.map((r) => r.sourceLine)).toEqual(
    Array.from({ length: 30 }, (_, i) => 100 + i),
  );
  expect(rows[0]?.spans).toEqual([{ text: "line 100", style: "codeString" }]);
});

test("a failing highlighter yields no marks", () => {
  const broken: Highlighter = {
    language: "test",
    highlight() {
      throw new Error("grammar failed");
    },
  };
  expect(highlightMarks(broken)(view(["x"]), undefined)).toEqual([]);
  expect(highlightMarks(undefined)(view(["x"]), undefined)).toEqual([]);
});

test("search and selection marks cover visible lines only", () => {
  const v = view(["cat", "a cat", "cat"], { from: 1, to: 2 });
  expect(searchMarks({ pattern: "cat", dir: 1 })(v, undefined)).toEqual([
    {
      kind: "mark",
      range: { start: { line: 1, col: 2 }, end: { line: 1, col: 5 } },
      style: "searchMatch",
    },
  ]);
  expect(searchMarks(undefined)(v, undefined)).toEqual([]);
  const selection = { start: { line: 0, col: 1 }, end: { line: 2, col: 1 } };
  expect(selectionMarks(selection)(v, undefined)).toEqual([
    {
      kind: "mark",
      range: { start: { line: 1, col: 0 }, end: { line: 1, col: 5 } },
      style: "selection",
    },
  ]);
  expect(selectionMarks(undefined)(v, undefined)).toEqual([]);
});
