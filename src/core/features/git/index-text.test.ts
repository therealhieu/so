import { expect, test } from "bun:test";
import { diffLines } from "./diff";
import { type IndexText, normalizeIndexText } from "./index-text";

const BOM = "﻿";

const rejoin = (t: IndexText) =>
  (t.bom ? BOM : "") + t.lines.join(t.eol) + (t.finalNewline ? t.eol : "");

test("index text round-trips CRLF, a missing final newline, and a BOM", () => {
  const crlf = "a\r\nb\r\n";
  expect(normalizeIndexText(crlf, "crlf")).toEqual({
    lines: ["a", "b"],
    finalNewline: true,
    bom: false,
    eol: "\r\n",
  });
  const noFinal = "a\nb";
  expect(normalizeIndexText(noFinal, "lf")).toEqual({
    lines: ["a", "b"],
    finalNewline: false,
    bom: false,
    eol: "\n",
  });
  const bom = `${BOM}title\n\nbody\n`;
  expect(normalizeIndexText(bom, "lf")).toEqual({
    lines: ["title", "", "body"],
    finalNewline: true,
    bom: true,
    eol: "\n",
  });
  expect(normalizeIndexText("", "lf").lines).toEqual([]);
  expect(normalizeIndexText("\n", "lf").lines).toEqual([""]);
  expect(normalizeIndexText(BOM, "lf").lines).toEqual([""]);
  for (const [text, eol] of [
    [crlf, "crlf"],
    [noFinal, "lf"],
    [bom, "lf"],
    ["", "lf"],
    ["\n", "lf"],
    [BOM, "lf"],
  ] as const)
    expect(rejoin(normalizeIndexText(text, eol))).toBe(text);
});

test("mixed or unknown index line endings record LF", () => {
  expect(normalizeIndexText("a\r\nb\n", "mixed")).toEqual({
    lines: ["a", "b"],
    finalNewline: true,
    bom: false,
    eol: "\n",
  });
  expect(normalizeIndexText("", "none").eol).toBe("\n");
});

test("equal content in an LF index and a CRLF buffer has no hunks", () => {
  // The buffer's model of a CRLF file: "\r\n" → "\n", final newline split off.
  const buffer = "a\r\nb\r\nc\r\n"
    .replaceAll("\r\n", "\n")
    .slice(0, -1)
    .split("\n");
  expect(
    diffLines(normalizeIndexText("a\nb\nc\n", "lf").lines, buffer),
  ).toEqual([]);
});
