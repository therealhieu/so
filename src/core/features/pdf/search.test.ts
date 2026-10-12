import { expect, test } from "bun:test";
import { nextHitPage, pdfHits, pdfQuery } from "./search";

const PAGES = [
  "Attention is all\nyou need",
  "nothing here",
  "attention, again: ATTENTION",
];

test("a lowercase query ignores case; one with capitals does not", () => {
  expect(pdfHits(PAGES, "attention")).toEqual([1, 0, 2]);
  expect(pdfHits(PAGES, "Attention")).toEqual([1, 0, 0]);
});

test("a phrase matches across a line break, and the query is plain text", () => {
  expect(pdfHits(PAGES, "all you")).toEqual([1, 0, 0]);
  expect(pdfHits(["a.b axb"], "a.b")).toEqual([1]);
  expect(pdfQuery("   ")).toBeUndefined();
});

test("the next page with a hit wraps around in either direction", () => {
  const hits = [1, 0, 2, 0];
  expect(nextHitPage(hits, 1, 1, true)).toEqual({ page: 1, wrapped: false });
  expect(nextHitPage(hits, 1, 1, false)).toEqual({ page: 3, wrapped: false });
  expect(nextHitPage(hits, 3, 1, false)).toEqual({ page: 1, wrapped: true });
  expect(nextHitPage(hits, 1, -1, false)).toEqual({ page: 3, wrapped: true });
  expect(nextHitPage(hits, 4, -1, false)).toEqual({ page: 3, wrapped: false });
  expect(nextHitPage([0, 0], 1, 1, true)).toBeUndefined();
});
