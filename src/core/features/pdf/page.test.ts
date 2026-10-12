import { expect, test } from "bun:test";
import { pageOf, pageWidth, parsePdfPageRef, pdfPageRef } from "./page";

test("a page subpath names its page; anything else is page 1", () => {
  expect(pageOf("#page=4")).toBe(4);
  expect(pageOf("page=2")).toBe(2);
  expect(pageOf("#page=0")).toBe(1);
  expect(pageOf("#Intro")).toBe(1);
  expect(pageOf(undefined)).toBe(1);
});

test("a page reference round-trips and only matches PDFs", () => {
  expect(parsePdfPageRef(pdfPageRef("docs/a b.pdf", 3))).toEqual({
    path: "docs/a b.pdf",
    page: 3,
  });
  expect(parsePdfPageRef("img.png#page=3")).toBeUndefined();
  expect(parsePdfPageRef("docs/a.pdf")).toBeUndefined();
});

test("widths snap to 64 pixels within the limits", () => {
  expect(pageWidth(10)).toBe(64);
  expect(pageWidth(700)).toBe(704);
  expect(pageWidth(9000)).toBe(2048);
});
