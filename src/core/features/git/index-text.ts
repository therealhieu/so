/**
 * The index side of a file in the buffer's line model ("\n"-split, no BOM,
 * final newline split off), with the form needed to write it back. A
 * zero-byte entry has no lines, so a buffer's text against it is all added.
 */
export type IndexText = {
  lines: string[];
  finalNewline: boolean;
  bom: boolean;
  eol: "\n" | "\r\n";
};

const BOM = "﻿";

/**
 * Split index text the way a file becomes buffer lines, so equal content
 * compares equal whatever the line endings. `eolAttr` is the index-side
 * ending from `git ls-files --eol`.
 */
export function normalizeIndexText(
  text: string,
  eolAttr: "lf" | "crlf" | "mixed" | "none",
): IndexText {
  const bom = text.startsWith(BOM);
  const lf = (bom ? text.slice(BOM.length) : text).replaceAll("\r\n", "\n");
  const finalNewline = lf.endsWith("\n");
  return {
    lines: text === "" ? [] : (finalNewline ? lf.slice(0, -1) : lf).split("\n"),
    finalNewline,
    bom,
    eol: eolAttr === "crlf" ? "\r\n" : "\n",
  };
}
