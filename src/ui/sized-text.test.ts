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

test("an H1 row is one 2× chunk after a cursor move and its colours, in one synchronized update", () => {
  const bytes = frameBytes(
    blockBytes(
      {
        scale: 2,
        rows: [[{ text: "█ Raft", style: "mdHeading1", cells: 12 }]],
      },
      3,
      1,
      () => HEADING,
    ),
  );
  expect(bytes).toBe(
    `\x1b[?2026h\x1b7\x1b[2;4H${HEADING_SGR}\x1b]66;s=2;█ Raft\x1b\\\x1b8\x1b[?2026l`,
  );
  expect(
    chunkBytes({ text: "Hi 👍🏽", style: "mdHeading1", cells: 10 }, 2),
  ).toBe("\x1b]66;s=2;Hi \x1b\\\x1b]66;s=2:w=2;👍🏽\x1b\\");
});

test("an H2 chunk is drawn at three quarters of 2× in half its cells", () => {
  expect(chunkBytes({ text: "Guar", style: "mdHeading2", cells: 6 }, 1.5)).toBe(
    "\x1b]66;s=2:w=3:n=3:d=4:v=2;Guar\x1b\\",
  );
  expect(
    frameBytes(
      blockBytes(
        {
          scale: 1.5,
          rows: [
            [
              { text: "▊ Gu", style: "mdHeading2", cells: 6 },
              { text: "ar", style: "mdHeading2", cells: 4 },
            ],
            [{ text: "x", style: "mdHeading2", cells: 2 }],
          ],
        },
        0,
        0,
        () => HEADING,
      ),
    ),
  ).toBe(
    `\x1b[?2026h\x1b7\x1b[1;1H${HEADING_SGR}\x1b]66;s=2:w=3:n=3:d=4:v=2;▊ Gu\x1b\\` +
      `\x1b[1;7H${HEADING_SGR}\x1b]66;s=2:w=2:n=3:d=4:v=2;ar\x1b\\` +
      `\x1b[3;1H${HEADING_SGR}\x1b]66;s=2:w=1:n=3:d=4:v=2;x\x1b\\\x1b8\x1b[?2026l`,
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
    chunkBytes({ text: "a\x1b\\b\x07", style: "mdHeading1", cells: 10 }, 2),
  ).toBe("\x1b]66;s=2;a \\b \x1b\\");
});
