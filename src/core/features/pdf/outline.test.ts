import { expect, test } from "bun:test";
import { parsePdfOutline } from "./outline";

test("the outline keeps its order and nesting and decodes titles", () => {
  const xml = `<?xml version="1.0"?>
<pdf2xml producer="poppler" version="26.04.0">
<page number="1"><text top="1" left="1" width="1" height="1" font="0">Intro</text></page>
<outline>
<item page="1">Introduction</item>
<item page="3">Methods &amp; <b>data</b></item>
<outline>
<item page="4">Data &#40;sub&#x29;</item>
<item>Elsewhere</item>
</outline>
<item page="9">  Results
  table  </item>
</outline>
</pdf2xml>`;
  expect(parsePdfOutline(xml)).toEqual([
    { title: "Introduction", page: 1, depth: 0 },
    { title: "Methods & data", page: 3, depth: 0 },
    { title: "Data (sub)", page: 4, depth: 1 },
    { title: "Results table", page: 9, depth: 0 },
  ]);
});

test("a PDF without an outline has no entries", () => {
  expect(
    parsePdfOutline('<pdf2xml><page number="1"></page></pdf2xml>'),
  ).toEqual([]);
});
