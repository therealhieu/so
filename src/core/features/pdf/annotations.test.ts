import { expect, test } from "bun:test";
import {
  annotationAt,
  annotationsPath,
  newAnnotationId,
  type PdfAnnotation,
  parseAnnotations,
  rematch,
  serializeAnnotations,
} from "./annotations";
import { type PdfPageLayout, parsePdfLayout } from "./layout";

const word = (x0: number, y0: number, text: string) =>
  `<word xMin="${x0}" yMin="${y0}" xMax="${x0 + 40}" yMax="${y0 + 10}">${text}</word>`;

const page = (lines: string[][]): PdfPageLayout =>
  parsePdfLayout(
    `<doc><page width="200" height="100">${lines
      .map(
        (l, i) =>
          `<line>${l.map((t, j) => word(j * 50, i * 20, t)).join("")}</line>`,
      )
      .join("")}</page></doc>`,
  );

const pt = (x: number, y: number) => ({ x: x / 200, y: y / 100 });

const item = (over: Partial<PdfAnnotation> = {}): PdfAnnotation => ({
  id: "a1",
  kind: "highlight",
  page: 1,
  anchor: pt(0, 5),
  head: pt(90, 5),
  by: "word",
  quote: "Hello brave",
  created: "2026-10-12T09:00:00Z",
  ...over,
});

test("a PDF's annotations live under .so/annotations at the PDF's own path", () => {
  expect(annotationsPath("docs/paper.pdf")).toBe(
    ".so/annotations/docs/paper.pdf.json",
  );
});

test("ids are six base-36 characters from the time, skipping taken ones", () => {
  const now = Date.UTC(2026, 9, 12);
  const id = newAnnotationId(now, new Set());
  expect(id).toMatch(/^[0-9a-z]{6}$/);
  expect(newAnnotationId(now, new Set([id]))).not.toBe(id);
  expect(newAnnotationId(5, new Set())).toBe("000005");
});

test("annotations round-trip, sorted by page then age, keys in one order", () => {
  const late = item({ id: "b", page: 2, created: "2026-10-12T10:00:00Z" });
  const note = item({
    id: "c",
    kind: "note",
    note: "why?",
    updated: "2026-10-12T09:30:00Z",
  });
  const text = serializeAnnotations("docs/paper.pdf", [late, note]);
  expect(text.endsWith("}\n")).toBe(true);
  expect(Object.keys(JSON.parse(text))).toEqual(["version", "file", "items"]);
  const parsed = parseAnnotations(text);
  expect(parsed).toEqual({ items: [note, late] });
  expect(Object.keys(JSON.parse(text).items[0])).toEqual([
    "id",
    "kind",
    "page",
    "anchor",
    "head",
    "by",
    "quote",
    "note",
    "created",
    "updated",
  ]);
});

test("a file of another version or not JSON is refused; bad items are dropped", () => {
  expect(parseAnnotations("{")).toEqual({ error: "not valid JSON" });
  expect(parseAnnotations('{"version":2,"items":[]}')).toEqual({
    error: "unknown version 2",
  });
  const text = JSON.stringify({
    version: 1,
    items: [item(), { id: "x", kind: "circle" }],
  });
  expect(parseAnnotations(text)).toEqual({ items: [item()] });
});

test("the annotation under a point is the newest whose words it is on", () => {
  const layout = page([
    ["Hello", "brave"],
    ["new", "world"],
  ]);
  const older = item();
  const newer = item({ id: "b", created: "2026-10-12T11:00:00Z" });
  expect(annotationAt(layout, [newer, older], 1, pt(60, 5))?.id).toBe("b");
  expect(annotationAt(layout, [older], 1, pt(60, 25))).toBeUndefined();
  expect(annotationAt(layout, [older], 2, pt(60, 5))).toBeUndefined();
});

test("an annotation still over its quote stays", () => {
  expect(rematch(page([["Hello", "brave"]]), item())).toBe("same");
});

test("an annotation whose quote moved follows it on the page", () => {
  const layout = page([["Intro"], ["Hello", "brave"]]);
  const moved = rematch(layout, item());
  expect(moved).not.toBe("same");
  expect(moved).not.toBe("detached");
  const a = moved as PdfAnnotation;
  expect(a.by).toBeUndefined();
  expect(rematch(layout, a)).toBe("same");
});

test("a quote across lines and inside words is found", () => {
  const layout = page([
    ["xx", "Hello"],
    ["brave", "yy"],
  ]);
  const a = rematch(layout, item({ quote: "llo\nbra" }));
  expect(a).not.toBe("detached");
  expect(rematch(layout, a as PdfAnnotation)).toBe("same");
});

test("an annotation whose quote is gone is detached", () => {
  expect(rematch(page([["Other", "words"]]), item())).toBe("detached");
});
