import { expect, test } from "bun:test";
import {
  createTextBuffer,
  type TextBuffer,
} from "../../core/kernel/text/text-buffer";
import { lineChange } from "./sync";

const all = (b: TextBuffer) =>
  Array.from({ length: b.lineCount }, (_, i) => b.line(i)).join("\n");

/** A small deterministic generator, so a failure names its seed. */
function random(seed: number): (n: number) => number {
  let a = seed;
  return (n) => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * n);
  };
}

const PIECES = ["", "a", "bc", "\n", "x\ny", "\n\n", "let z = 1;", "é"];

function randomEdit(b: TextBuffer, rnd: (n: number) => number) {
  const pos = () => {
    const line = rnd(b.lineCount);
    return { line, col: rnd(b.line(line).length + 1) };
  };
  let start = pos();
  let end = pos();
  if (end.line < start.line || (end.line === start.line && end.col < start.col))
    [start, end] = [end, start];
  return {
    range: { start, end },
    text: PIECES[rnd(PIECES.length)] as string,
  };
}

test("random edit sequences rebuild the same text from incremental changes", () => {
  for (let seed = 1; seed <= 500; seed++) {
    const rnd = random(seed);
    let prev = createTextBuffer("one\ntwo\n\nfour\nfive");
    for (let step = 0; step < 6; step++) {
      let next = prev;
      for (let k = rnd(3) + 1; k > 0; k--)
        next = next.apply(randomEdit(next, rnd)).buffer;
      const change = lineChange(prev, next);
      const rebuilt = change === undefined ? prev : prev.apply(change).buffer;
      expect({ seed, text: all(rebuilt) }).toEqual({ seed, text: all(next) });
      if (all(prev) === all(next)) expect(change).toBeUndefined();
      prev = next;
    }
  }
});

test("a change covers only the lines that differ", () => {
  const prev = createTextBuffer("a\nb\nc\nd");
  const next = prev.apply({
    range: { start: { line: 1, col: 1 }, end: { line: 1, col: 1 } },
    text: "!",
  }).buffer;
  expect(lineChange(prev, next)).toEqual({
    range: { start: { line: 1, col: 0 }, end: { line: 2, col: 0 } },
    text: "b!\n",
  });
});
