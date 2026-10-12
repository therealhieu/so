import { expect, test } from "bun:test";
import { createTextBuffer } from "../text/text-buffer";
import type { Decoration } from "./decorations";
import { displayColAt, displayColOf, rowAt, sourceColAt, spanAt } from "./hit";
import { layoutText } from "./text-view";
import type { RenderLine, TextView } from "./types";
import { displayWidth, wrapLine, wrapText } from "./wrap";

function layout(lines: string[], ...decos: Decoration[]): RenderLine[] {
  const v: TextView = {
    buf: createTextBuffer(lines.join("\n")),
    width: 80,
    topRow: 0,
    rows: 100,
    cursor: { line: 0, col: 0 },
    folds: new Set(),
    visible: { from: 0, to: lines.length },
  };
  return layoutText(v, [() => decos], undefined);
}

const range = (line: number, start: number, end: number) => ({
  start: { line, col: start },
  end: { line, col: end },
});

test("a click on a concealed link alias maps to the alias character in the source", () => {
  const text = "See [[Project Plan|plan]] now";
  const aliasAt = text.indexOf("plan]]");
  const [line] = layout(
    [text],
    { kind: "replace", range: range(0, 4, aliasAt), block: false },
    {
      kind: "replace",
      range: range(0, aliasAt + 4, aliasAt + 6),
      block: false,
    },
  );
  if (line === undefined) throw new Error("expected a laid-out line");
  expect(line.spans.map((sp) => sp.text).join("")).toBe("See plan now");
  const dc = "See p".length;
  expect(sourceColAt(line.spans, dc, 4, text.length)).toBe(
    "See [[Project Plan|".length + 1,
  );
  expect(sourceColAt(line.spans, "See plan ".length, 4, text.length)).toBe(
    text.indexOf("now"),
  );
});

test("every cell of replacement text maps to the start of the hidden range", () => {
  const text = "a [[Target]] b";
  const [line] = layout([text], {
    kind: "replace",
    range: range(0, 2, 12),
    block: false,
    spans: [{ text: "Target", style: "mdLink" }],
  });
  if (line === undefined) throw new Error("expected a laid-out line");
  for (let dc = 2; dc < 8; dc++)
    expect(sourceColAt(line.spans, dc, 4, text.length)).toBe(2);
  expect(sourceColAt(line.spans, 9, 4, text.length)).toBe(text.indexOf("b"));
});

test("tabs map every covered cell to the tab and past-end cells to the line length", () => {
  const [line] = layout(["\tab"]);
  if (line === undefined) throw new Error("expected a laid-out line");
  for (let dc = 0; dc < 4; dc++)
    expect(sourceColAt(line.spans, dc, 4, 3)).toBe(0);
  expect(sourceColAt(line.spans, 4, 4, 3)).toBe(1);
  expect(sourceColAt(line.spans, 5, 4, 3)).toBe(2);
  expect(sourceColAt(line.spans, 99, 4, 3)).toBe(3);
  expect(sourceColAt([], 7, 4, 0)).toBe(0);
});

test("past-end cells on a line ending in hidden text map to the full line length", () => {
  const text = "See [[Project Plan]]";
  const [line] = layout(
    [text],
    { kind: "replace", range: range(0, 4, 6), block: false },
    {
      kind: "replace",
      range: range(0, text.length - 2, text.length),
      block: false,
    },
  );
  if (line === undefined) throw new Error("expected a laid-out line");
  expect(line.spans.map((sp) => sp.text).join("")).toBe("See Project Plan");
  const lastShown = "See Project Plan".length - 1;
  expect(sourceColAt(line.spans, lastShown, 4, text.length)).toBe(
    text.length - 3,
  );
  for (const dc of [lastShown + 1, 99])
    expect(sourceColAt(line.spans, dc, 4, text.length)).toBe(text.length);

  const [replaced] = layout(["a [[Target]]"], {
    kind: "replace",
    range: range(0, 2, 12),
    block: false,
    spans: [{ text: "Target", style: "mdLink" }],
  });
  if (replaced === undefined) throw new Error("expected a laid-out line");
  expect(sourceColAt(replaced.spans, 8, 4, 12)).toBe(12);
});

test("undecorated text maps each character's display column back to it", () => {
  const text = "\tab c\td";
  const [line] = layout([text]);
  if (line === undefined) throw new Error("expected a laid-out line");
  for (let c = 0; c <= text.length; c++) {
    const dc = displayWidth(text.slice(0, c), 4);
    expect(sourceColAt(line.spans, dc, 4, text.length)).toBe(c);
  }
});

test("rowAt follows wrapped lines, widget rows, and skipped rows like the painter", () => {
  const long = "alpha beta gamma delta epsilon";
  const widget: Decoration = {
    kind: "widget",
    at: { line: 1, col: 0 },
    block: true,
    widget: { type: "image", data: undefined, rows: 2 },
  };
  const lines = layout([long, "short"], widget);
  const o = { width: 12, tabWidth: 4, wrap: true, skipRows: 0 };
  const starts = wrapLine(long, 12, 4);
  expect(starts.length).toBeGreaterThan(2);

  expect(rowAt(lines, 0, o)).toEqual({
    line: lines[0] as RenderLine,
    startCol: 0,
    indent: 0,
    endCol: starts[1] ?? -1,
  });
  expect(rowAt(lines, 1, o)).toEqual({
    line: lines[0] as RenderLine,
    startCol: starts[1] ?? -1,
    indent: 0,
    endCol: starts[2] ?? -1,
  });
  const afterWrap = starts.length;
  expect(rowAt(lines, afterWrap, o)?.line.widget?.type).toBe("image");
  expect(rowAt(lines, afterWrap + 1, o)?.line.widget?.type).toBe("image");
  expect(rowAt(lines, afterWrap + 2, o)).toEqual({
    line: lines[2] as RenderLine,
    startCol: 0,
    indent: 0,
  });
  expect(rowAt(lines, 99, o)?.line.sourceLine).toBe(1);
  expect(rowAt(lines, 99, o)?.line.widget).toBeUndefined();

  const skipped = rowAt(lines, 0, { ...o, skipRows: 2 });
  expect(skipped).toEqual({
    line: lines[0] as RenderLine,
    startCol: starts[2] ?? -1,
    indent: 0,
  });

  const unwrapped = rowAt(lines, 1, { ...o, wrap: false });
  expect(unwrapped?.line.widget?.type).toBe("image");
  expect(rowAt([], 0, o)).toBeUndefined();
});

test("a cell right of a word-wrapped row maps to that row's last character", () => {
  const text = "alpha bravo charlie";
  const lines = layout([text]);
  const o = { width: 8, tabWidth: 4, wrap: true, skipRows: 0 };
  expect(wrapLine(text, 8, 4)).toEqual([0, 6, 12]);
  const at = (y: number, x: number) => {
    const row = rowAt(lines, y, o);
    if (row === undefined) throw new Error("expected a screen row");
    return sourceColAt(row.line.spans, displayColAt(row, x), 4, text.length);
  };

  // Row 0 shows "alpha " and leaves two blank cells.
  expect(at(0, 4)).toBe(4);
  for (const x of [5, 6, 7]) expect(at(0, x)).toBe(5);
  for (const x of [5, 6, 7]) expect(at(1, x)).toBe(11);
  // The last row keeps the past-end rule.
  expect(at(2, 6)).toBe(18);
  expect(at(2, 7)).toBe(text.length);
  // Without wrapping every cell keeps its column.
  const flat = rowAt(lines, 0, { ...o, wrap: false });
  if (flat === undefined) throw new Error("expected a screen row");
  expect(displayColAt(flat, 12)).toBe(12);
});

test("spanAt finds the span under a display column, counting tabs as cells", () => {
  const spans = [
    { text: "\tab", style: "text" },
    { text: " ▸", style: "text", fold: 7 },
  ];
  expect(spanAt(spans, 0, 4)?.text).toBe("\tab");
  expect(spanAt(spans, 5, 4)?.text).toBe("\tab");
  expect(spanAt(spans, 6, 4)?.fold).toBe(7);
  expect(spanAt(spans, 7, 4)?.fold).toBe(7);
  expect(spanAt(spans, 8, 4)).toBeUndefined();
});

/** Virtual text inserted at `col` of line 0, hiding nothing. */
const virtualAt = (
  col: number,
  text: string,
  virtual: "inline" | "eol",
): Decoration => ({
  kind: "replace",
  range: range(0, col, col),
  block: false,
  spans: [{ text, style: "inlayHint", virtual }],
});

test("inline virtual text pushes the columns after it and maps back to its column", () => {
  const [line] = layout(["let d = f(a);"], virtualAt(5, ": f64", "inline"));
  const spans = line?.spans ?? [];
  expect(wrapText(spans)).toBe("let d: f64 = f(a);");
  // The cursor on `d` stays put; on `=` it moves past the hint.
  expect(displayColOf(spans, 4, 4, false)).toBe(4);
  expect(displayColOf(spans, 6, 4, false)).toBe(11);
  expect(displayColOf(spans, 13, 4, true)).toBe(18);
  // A click on the hint lands on the character it sits before.
  expect(sourceColAt(spans, 7, 4, 13)).toBe(5);
  expect(sourceColAt(spans, 11, 4, 13)).toBe(6);
});

test("end-of-line virtual text neither wraps nor moves the cursor", () => {
  const text = "let y = z;";
  const [line] = layout(
    [text],
    virtualAt(text.length, "  ● cannot find value `z` in this scope", "eol"),
  );
  const spans = line?.spans ?? [];
  expect(wrapText(spans)).toBe(text);
  expect(displayColOf(spans, text.length, 4, true)).toBe(text.length);
  const rows = rowAt([line as RenderLine], 1, {
    width: 12,
    tabWidth: 4,
    wrap: true,
    skipRows: 0,
  });
  // One row only: row 1 does not exist, so the last row is returned.
  expect(rows?.startCol).toBe(0);
});

test("rows after the first make room for the wrap prefix, and its cells map to the row start", () => {
  const text = "alpha bravo charlie";
  const prefixed: Decoration = {
    kind: "line",
    line: 0,
    wrapPrefix: [{ text: "▎ ", style: "mdQuote" }],
  };
  const lines = layout([text], prefixed);
  const o = { width: 8, tabWidth: 4, wrap: true, skipRows: 0 };
  expect(wrapLine(text, 8, 4, 2)).toEqual([0, 6, 12, 18]);
  expect(rowAt(lines, 3, o)).toEqual({
    line: lines[0] as RenderLine,
    startCol: 18,
    indent: 2,
  });
  const at = (y: number, x: number) => {
    const row = rowAt(lines, y, o);
    if (row === undefined) throw new Error("expected a screen row");
    return sourceColAt(row.line.spans, displayColAt(row, x), 4, text.length);
  };
  expect(at(0, 0)).toBe(0);
  for (const x of [0, 1, 2]) expect(at(1, x)).toBe(6);
  expect(at(1, 3)).toBe(7);
});

test("a tab after inline text keeps the cursor on its last cell", () => {
  const [line] = layout(["a\tb"], virtualAt(1, "::", "inline"));
  const spans = line?.spans ?? [];
  // a(0) :: (1-2) tab (3) → b at 4
  expect(displayColOf(spans, 1, 4, false)).toBe(3);
  expect(displayColOf(spans, 1, 4, true)).toBe(3);
  expect(displayColOf(spans, 2, 4, false)).toBe(4);
});
