import { expect, test } from "bun:test";
import {
  charEdges,
  type PdfSelection,
  parsePdfLayout,
  selectedWords,
  selectionText,
  wordAt,
} from "./layout";

const word = (x0: number, y0: number, text: string) =>
  `<word xMin="${x0}" yMin="${y0}" xMax="${x0 + 40}" yMax="${y0 + 10}">${text}</word>`;

// Two lines in a left column, one in a right column beside the first.
const XML = `<!DOCTYPE html><html><head><title></title></head><body><doc>
  <page width="200.000000" height="100.000000">
    <flow><block>
      <line>${word(0, 0, "Hello")}${word(50, 0, "brave")}</line>
      <line>${word(0, 20, "new")}${word(50, 20, "world&amp;co")}</line>
    </block></flow>
    <flow><block>
      <line>${word(120, 0, "Right")}<word xMin="x">bad</word></line>
    </block></flow>
  </page>
</doc></body></html>`;

const layout = parsePdfLayout(XML);
const pt = (x: number, y: number) => ({ x: x / 200, y: y / 100 });
const sel = (a: [number, number], h: [number, number], by?: "word" | "line") =>
  ({
    page: 1,
    anchor: pt(...a),
    head: pt(...h),
    ...(by === undefined ? {} : { by }),
  }) as PdfSelection;
const text = (s: PdfSelection) => selectionText(selectedWords(layout, s));

test("a page's words parse line by line, decoded, skipping words without a box", () => {
  expect(layout.width).toBe(200);
  expect(layout.height).toBe(100);
  expect(layout.lines.map((l) => l.map((w) => w.text))).toEqual([
    ["Hello", "brave"],
    ["new", "world&co"],
    ["Right"],
  ]);
  expect(parsePdfLayout("<doc></doc>").lines).toEqual([]);
});

test("the word at a point is the one under it, else the nearest", () => {
  expect(wordAt(layout, pt(60, 5))).toEqual({ line: 0, word: 1 });
  // Between the two lines, nearer the second.
  expect(wordAt(layout, pt(5, 17))).toEqual({ line: 1, word: 0 });
  // Columns side by side: the line across from the pointer.
  expect(wordAt(layout, pt(170, 5))).toEqual({ line: 2, word: 0 });
  expect(wordAt(layout, pt(105, 5))).toEqual({ line: 0, word: 1 });
  // Below everything: the nearest line.
  expect(wordAt(layout, pt(20, 90))).toEqual({ line: 1, word: 0 });
  expect(wordAt(parsePdfLayout(""), pt(0, 0))).toBeUndefined();
});

test("characters split a word's width by their Helvetica widths", () => {
  // n, e, and w are 556, 556, and 722 thousandths of an em.
  const edges = charEdges({ text: "new", x0: 0, y0: 0, x1: 1834, y1: 1 });
  expect(edges).toEqual([0, 556, 1112, 1834]);
});

test("a drag selects the characters between its ends, in reading order, either way", () => {
  // "brave" spans 50..90 with edges near 50, 58.9, 64.2, 73.1, 81.1, 90.
  expect(text(sel([50, 5], [24, 25]))).toBe("brave\nne");
  expect(text(sel([24, 25], [50, 5]))).toBe("brave\nne");
  expect(text(sel([59, 5], [74, 5]))).toBe("ra");
  expect(text(sel([0, 5], [95, 5]))).toBe("Hello brave");
  expect(selectedWords(layout, sel([59, 5], [74, 5]))[0]?.[0]).toMatchObject({
    x0: expect.closeTo(58.89, 1),
    x1: expect.closeTo(73.12, 1),
  });
});

test("a press alone selects nothing; a double click a word, a triple click a line", () => {
  expect(text(sel([5, 5], [5, 5]))).toBe("");
  expect(text(sel([60, 25], [60, 25], "word"))).toBe("world&co");
  expect(text(sel([60, 25], [60, 25], "line"))).toBe("new world&co");
  expect(text(sel([60, 5], [5, 25], "line"))).toBe("Hello brave\nnew world&co");
});
