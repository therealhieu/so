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
    { sourceLine: 0, spans: [{ text: "one", style: "text", col: 0 }] },
    { sourceLine: 1, spans: [] },
    { sourceLine: 2, spans: [{ text: "two", style: "text", col: 0 }] },
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
    { text: "let", style: "codeKeyword", col: 0 },
    { text: " x = 1;", style: "text", col: 3 },
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
    { text: "ab", style: "codeString", col: 0 },
    { text: "cd", style: "selection", col: 2 },
    { text: "ef", style: "text", col: 4 },
  ]);
});

test("marked text on a styled line carries the line style beneath it", () => {
  const rows = layoutText(
    view(["let x", "plain"]),
    [
      fixed(
        { kind: "line", line: 0, style: "mdCode" },
        {
          kind: "mark",
          range: { start: { line: 0, col: 0 }, end: { line: 0, col: 3 } },
          style: "codeKeyword",
        },
        {
          kind: "mark",
          range: { start: { line: 1, col: 0 }, end: { line: 1, col: 5 } },
          style: "codeKeyword",
        },
      ),
    ],
    undefined,
  );
  expect(rows.map((r) => r.spans)).toEqual([
    [
      { text: "let", style: "codeKeyword", col: 0, under: "mdCode" },
      { text: " x", style: "mdCode", col: 3 },
    ],
    [{ text: "plain", style: "codeKeyword", col: 0 }],
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
    { text: "a ", style: "text", col: 0 },
    { text: "b", style: "text", col: 4 },
    { text: "†", style: "footnote", col: 5, inserted: true },
    { text: " c", style: "text", col: 7 },
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
    { sourceLine: 0, spans: [{ text: "above", style: "text", col: 0 }] },
    { sourceLine: 1, spans: [], widget },
    { sourceLine: 3, spans: [{ text: "below", style: "text", col: 0 }] },
  ]);
});

test("block replace that starts above the viewport hides its visible lines", () => {
  const widget = { type: "table", data: null, rows: 3 };
  const rows = layoutText(
    {
      ...view(["a", "| t |", "| - |", "| r |", "b"], { from: 2, to: 5 }),
      rows: 10,
    },
    [
      fixed({
        kind: "replace",
        range: { start: { line: 1, col: 0 }, end: { line: 3, col: 5 } },
        block: true,
        widget,
      }),
    ],
    undefined,
  );
  expect(rows).toEqual([
    { sourceLine: 2, spans: [], widget },
    { sourceLine: 4, spans: [{ text: "b", style: "text", col: 0 }] },
  ]);
});

test("inline replace across a line break hides both parts", () => {
  const rows = layoutText(
    view(["one %%note", "still%% two"]),
    [
      fixed({
        kind: "replace",
        range: { start: { line: 0, col: 4 }, end: { line: 1, col: 7 } },
        block: false,
        spans: [{ text: "…", style: "comment" }],
      }),
    ],
    undefined,
  );
  expect(rows).toEqual([
    {
      sourceLine: 0,
      spans: [
        { text: "one ", style: "text", col: 0 },
        { text: "…", style: "comment", col: 4, inserted: true },
      ],
    },
    { sourceLine: 1, spans: [{ text: " two", style: "text", col: 7 }] },
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
    { sourceLine: 0, spans: [{ text: "![a](a.png)", style: "text", col: 0 }] },
    { sourceLine: 0, spans: [], widget },
    { sourceLine: 1, spans: [{ text: "next", style: "text", col: 0 }] },
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
    {
      sourceLine: 0,
      spans: [{ text: "code", style: "codeBlock", col: 0 }],
      sign,
    },
    { sourceLine: 1, spans: [{ text: "plain", style: "text", col: 0 }] },
  ]);
});

test("line decoration gives the line a wrap prefix alongside its style", () => {
  const wrapPrefix = [{ text: "▎ ", style: "mdQuote" }];
  const rows = layoutText(
    view(["quoted", "plain"]),
    [
      fixed({ kind: "line", line: 0, style: "mdQuote" }),
      fixed({ kind: "line", line: 0, wrapPrefix }),
    ],
    undefined,
  );
  expect(rows[0]).toEqual({
    sourceLine: 0,
    spans: [{ text: "quoted", style: "mdQuote", col: 0 }],
    wrapPrefix,
  });
  expect(rows[1]?.wrapPrefix).toBeUndefined();
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
  expect(rows[0]?.spans).toEqual([
    { text: "line 100", style: "codeString", col: 0 },
  ]);
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

test("a block-replaced row carries the last change sign in its range", () => {
  const widget = { type: "table", data: null, rows: 4 };
  const reveal = { text: "▕", style: "revealSign" };
  const add = { text: "+", style: "gitAdd" };
  const change = { text: "~", style: "gitChange" };
  const rows = layoutText(
    view(["a", "b", "c", "| t |", "| - |", "| r |", "| s |", "d"]),
    [
      fixed({
        kind: "replace",
        range: { start: { line: 3, col: 0 }, end: { line: 6, col: 5 } },
        block: true,
        widget,
      }),
      fixed(
        { kind: "line", line: 4, changeSign: add },
        { kind: "line", line: 5, changeSign: change, sign: reveal },
      ),
    ],
    undefined,
  );
  expect(rows[3]).toEqual({
    sourceLine: 3,
    spans: [],
    widget,
    changeSign: change,
  });
  expect(rows[0]).toEqual({
    sourceLine: 0,
    spans: [{ text: "a", style: "text", col: 0 }],
  });
  expect(rows[4]).toEqual({
    sourceLine: 7,
    spans: [{ text: "d", style: "text", col: 0 }],
  });
});

test("sign and change sign merge independently, the later provider winning per channel", () => {
  const reveal = { text: "▕", style: "revealSign" };
  const change = { text: "~", style: "gitChange" };
  const add = { text: "+", style: "gitAdd" };
  const rows = layoutText(
    view(["one", "two"]),
    [
      fixed({ kind: "line", line: 0, sign: reveal }),
      fixed({ kind: "line", line: 0, changeSign: change }),
      fixed({ kind: "line", line: 0, changeSign: add }),
    ],
    undefined,
  );
  expect(rows).toEqual([
    {
      sourceLine: 0,
      spans: [{ text: "one", style: "text", col: 0 }],
      sign: reveal,
      changeSign: add,
    },
    { sourceLine: 1, spans: [{ text: "two", style: "text", col: 0 }] },
  ]);
  expect(Object.keys(rows[1] ?? {})).toEqual(["sourceLine", "spans"]);
});

test("a justify line decoration marks its row, and only its row", () => {
  const justify: DecorationProvider = () => [
    { kind: "line", line: 1, justify: true },
  ];
  const rows = layoutText(view(["one", "two", "three"]), [justify], undefined);
  expect(rows.map((r) => r.justify)).toEqual([undefined, true, undefined]);
});
