import { expect, test } from "bun:test";
import { diffLines } from "./diff";
import { normalizeIndexText } from "./index-text";
import { hunkPatch } from "./patch";

const HEADER =
  "diff --git a/notes/a.md b/notes/a.md\nindex 0000000..0000000 100644\n--- a/notes/a.md\n+++ b/notes/a.md\n";
const cur = (lines: string[], finalNewline = true, bom = false) => ({
  lines,
  finalNewline,
  bom,
});

test("an insert hunk uses git-diff numbering", () => {
  const index = normalizeIndexText("l0\nl1\nl2\nl3\nl4\n", "lf");
  const now = cur(["l0", "l1", "l2", "l3", "new", "l4"]);
  const [h] = diffLines(index.lines, now.lines);
  if (h === undefined) throw new Error("no hunk");
  expect(hunkPatch("notes/a.md", "100644", h, index, now)).toBe(
    `${HEADER}@@ -4,0 +5,1 @@\n+new\n`,
  );
});

test("a delete hunk counts the new side from the line before the gap", () => {
  const index = normalizeIndexText("a\nb\nc\n", "lf");
  const now = cur(["a", "c"]);
  const [h] = diffLines(index.lines, now.lines);
  if (h === undefined) throw new Error("no hunk");
  expect(hunkPatch("notes/a.md", "100644", h, index, now)).toBe(
    `${HEADER}@@ -2,1 +1,0 @@\n-b\n`,
  );
});

test("an EOF change without a final newline marks the side that lacks it", () => {
  const index = normalizeIndexText("a\nb", "lf");
  const both = cur(["a", "B"], false);
  const [h] = diffLines(index.lines, both.lines);
  if (h === undefined) throw new Error("no hunk");
  expect(hunkPatch("notes/a.md", "100644", h, index, both)).toBe(
    `${HEADER}@@ -2,1 +2,1 @@\n-b\n\\ No newline at end of file\n+B\n\\ No newline at end of file\n`,
  );
  expect(hunkPatch("notes/a.md", "100644", h, index, cur(["a", "B"]))).toBe(
    `${HEADER}@@ -2,1 +2,1 @@\n-b\n\\ No newline at end of file\n+B\n`,
  );
});

test("lines added after an index line without a final newline replace that line", () => {
  const index = normalizeIndexText("a", "lf");
  const now = cur(["a", "b"]);
  const [h] = diffLines(index.lines, now.lines);
  if (h === undefined) throw new Error("no hunk");
  expect(h.old.count).toBe(0);
  expect(hunkPatch("notes/a.md", "100644", h, index, now)).toBe(
    `${HEADER}@@ -1,1 +1,2 @@\n-a\n\\ No newline at end of file\n+a\n+b\n`,
  );
});

test("CRLF index lines end with CRLF on both sides", () => {
  const index = normalizeIndexText("one\r\nold\r\nthree\r\n", "crlf");
  const now = cur(["one", "new", "three"]);
  const [h] = diffLines(index.lines, now.lines);
  if (h === undefined) throw new Error("no hunk");
  expect(hunkPatch("notes/a.md", "100644", h, index, now)).toBe(
    `${HEADER}@@ -2,1 +2,1 @@\n-old\r\n+new\r\n`,
  );
});

test("line 0 carries the BOM on each side that has one", () => {
  const index = normalizeIndexText("﻿title\nbody\n", "lf");
  const now = cur(["Title", "body"], true, true);
  const [h] = diffLines(index.lines, now.lines);
  if (h === undefined) throw new Error("no hunk");
  expect(hunkPatch("notes/a.md", "100755", h, index, now)).toBe(
    "diff --git a/notes/a.md b/notes/a.md\nindex 0000000..0000000 100755\n--- a/notes/a.md\n+++ b/notes/a.md\n" +
      "@@ -1,1 +1,1 @@\n-﻿title\n+﻿Title\n",
  );
});

test("an untracked file adds every line to an empty index entry", () => {
  const index = normalizeIndexText("", "none");
  const now = cur(["a", "b"]);
  const [h] = diffLines([], now.lines, { untracked: true });
  if (h === undefined) throw new Error("no hunk");
  expect(hunkPatch("notes/a.md", "100644", h, index, now)).toBe(
    `${HEADER}@@ -0,0 +1,2 @@\n+a\n+b\n`,
  );
});

test("a note committed empty gains lines with an empty old side", () => {
  const index = normalizeIndexText("", "lf");
  const bare = cur(["hello"], false);
  const [h] = diffLines(index.lines, bare.lines);
  if (h === undefined) throw new Error("no hunk");
  expect(hunkPatch("notes/a.md", "100644", h, index, bare)).toBe(
    `${HEADER}@@ -0,0 +1,1 @@\n+hello\n\\ No newline at end of file\n`,
  );
  expect(hunkPatch("notes/a.md", "100644", h, index, cur(["hello"]))).toBe(
    `${HEADER}@@ -0,0 +1,1 @@\n+hello\n`,
  );
});
