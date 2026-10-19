import { expect, test } from "bun:test";
import { RGBA, TextAttributes } from "@opentui/core";
import { blockBytes, chunkBytes, frameBytes, scriptBytes } from "./sized-text";
import type { Style } from "./theme";

const HEADING: Style = {
  fg: RGBA.fromHex("#7aa2f7"),
  bg: RGBA.fromHex("#23284a"),
  attrs: TextAttributes.BOLD,
};
const HEADING_SGR = "\x1b[0;1;38;2;122;162;247;48;2;35;40;74m";
const H1 = { n: 7, d: 8 };
const H2 = { n: 4, d: 5 };

test("a chunk is drawn at n/d of double size in half its cells, centred vertically", () => {
  expect(
    chunkBytes({ text: "Markdown", style: "mdHeading1", cells: 14 }, H1),
  ).toBe("\x1b]66;s=2:w=7:n=7:d=8:v=2;Markdown\x1b\\");
  // A grapheme of several code points stays inside its chunk's cells.
  expect(
    chunkBytes({ text: "Hi 👍🏽", style: "mdHeading2", cells: 8 }, H2),
  ).toBe("\x1b]66;s=2:w=4:n=4:d=5:v=2;Hi 👍🏽\x1b\\");
});

test("a sized block's chunks follow each other, each row two screen rows below the last, in one synchronized update", () => {
  expect(
    frameBytes(
      blockBytes(
        {
          scale: H2,
          rows: [
            [
              { text: "Guara", style: "mdHeading2", cells: 8 },
              { text: "nt", style: "mdHeading2", cells: 4 },
            ],
            [{ text: "x", style: "mdHeading2", cells: 2 }],
          ],
        },
        3,
        1,
        () => HEADING,
      ),
    ),
  ).toBe(
    `\x1b[?2026h\x1b7\x1b[2;4H${HEADING_SGR}\x1b]66;s=2:w=4:n=4:d=5:v=2;Guara\x1b\\` +
      `\x1b[2;12H${HEADING_SGR}\x1b]66;s=2:w=2:n=4:d=5:v=2;nt\x1b\\` +
      `\x1b[4;4H${HEADING_SGR}\x1b]66;s=2:w=1:n=4:d=5:v=2;x\x1b\\\x1b8\x1b[?2026l`,
  );
});

test("a script pair is half size in one cell, lowered or raised", () => {
  const plain: Style = {
    fg: RGBA.defaultForeground(),
    bg: RGBA.defaultBackground(),
    attrs: 0,
  };
  expect(scriptBytes({ text: "ti", place: "sub" }, 4, 2, plain)).toBe(
    "\x1b[3;5H\x1b[0;39;49m\x1b]66;n=1:d=2:v=1:w=1;ti\x1b\\",
  );
  expect(scriptBytes({ text: "no", place: "sup" }, 0, 0, plain)).toBe(
    "\x1b[1;1H\x1b[0;39;49m\x1b]66;n=1:d=2:v=0:w=1;no\x1b\\",
  );
});

test("note text never ends the escape early", () => {
  expect(
    chunkBytes({ text: "a\x1b\\b\x07", style: "mdHeading1", cells: 8 }, H1),
  ).toBe("\x1b]66;s=2:w=4:n=7:d=8:v=2;a \\b \x1b\\");
});
