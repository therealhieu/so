import { beforeEach, expect, test } from "bun:test";
import {
  layoutNote,
  noteView,
  rowText,
  stubCtx,
} from "../../../../../test/support/markdown";
import { registerBlockRenderer } from "../live-preview";
import { imageRenderer, isWebUrl } from "./image";

beforeEach(() => registerBlockRenderer("image", imageRenderer));

const NOTE = "Intro\n\n![[diagram.png]]\n";
const imageRow = (ctx = stubCtx()) =>
  layoutNote(noteView(NOTE, { cursor: { line: 0, col: 0 } }), "live", ctx)[2];

test("an image reserves one row until its size is known", () => {
  expect(imageRow()?.widget).toEqual({
    type: "image",
    data: { path: "diagram.png", name: "diagram.png" },
    rows: 1,
  });
});

test("an image of known size reserves the rows the window computed", () => {
  expect(imageRow(stubCtx({ image: () => ({ rows: 7 }) }))?.widget?.rows).toBe(
    7,
  );
});

test("images turned off or unresolved show a text placeholder", () => {
  expect(rowText(imageRow(stubCtx({ images: "off" })))).toBe(
    "[image: diagram.png]",
  );
  expect(rowText(imageRow(stubCtx({ resolve: () => undefined })))).toBe(
    "[image: diagram.png]",
  );
});

test("a web image keeps its url as the image reference", () => {
  const rows = layoutNote(
    noteView("Intro\n\n![chart](https://example.com/chart.png)\n"),
    "reading",
  );
  expect(rows[2]?.widget?.data).toEqual({
    path: "https://example.com/chart.png",
    name: "chart",
  });
  expect(isWebUrl("ftp://x/a.png")).toBe(false);
});
