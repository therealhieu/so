import { expect, test } from "bun:test";
import {
  createTextBuffer,
  type TextBuffer,
} from "../../kernel/text/text-buffer";
import { type Doc, parseDoc } from "./doc";

/** A small deterministic generator (mulberry32). */
function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Run `body` with a fixed seed; a failure names the seed so it can be replayed. */
function withSeed(seed: number, body: (next: () => number) => void) {
  try {
    body(random(seed));
  } catch (e) {
    throw new Error(`failed with seed ${seed}: ${String(e)}`);
  }
}

const NOTES = [
  [
    "---",
    "tags: [a, b/c]",
    "aliases: Plan",
    'related: "[[plan]]"',
    "---",
    "# Plan",
    "",
    "Intro with [[note|alias]] and #tag.",
    "",
    "```ts",
    "const x = '[[not]]';",
    "```",
    "",
    "- one [[a]]",
    "  - nested #b",
    "",
    "- two ^item",
    "",
    "$$",
    "x",
    "$$",
  ].join("\n"),
  [
    "Title",
    "=====",
    "",
    "> [!note] A callout with ![[embed.png]]",
    "> and [md](other.md#Heading)",
    "",
    "%%",
    "hidden [[x]]",
    "%%",
    "",
    "| a | b |",
    "|---|---|",
    "| [[t\\|alias]] | `code` |",
    "",
    "    indented [[y]]",
    "",
    "Last line ^end",
  ].join("\n"),
];

const PIECES = [
  "\n",
  "\n\n",
  "x",
  "[[",
  "]]",
  "#",
  "# ",
  "- ",
  "```",
  "$$",
  "%%",
  "---",
  "> ",
  "    ",
  "^id",
  "<div>",
];

/** One random insert or delete at a random position. */
function randomEdit(buf: TextBuffer, next: () => number): TextBuffer {
  const pick = (n: number) => Math.floor(next() * n);
  const line = pick(buf.lineCount);
  const col = pick(buf.line(line).length + 1);
  const start = { line, col };
  if (next() < 0.6) {
    const text = PIECES[pick(PIECES.length)] ?? "x";
    return buf.apply({ range: { start, end: start }, text }).buffer;
  }
  const endLine = Math.min(buf.lineCount - 1, line + pick(3));
  const endCol =
    endLine === line
      ? Math.min(buf.line(line).length, col + pick(8))
      : pick(buf.line(endLine).length + 1);
  return buf.apply({
    range: { start, end: { line: endLine, col: endCol } },
    text: "",
  }).buffer;
}

test("incremental parse equals a fresh parse", () => {
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
    withSeed(seed, (next) => {
      for (const note of NOTES) {
        let buf = createTextBuffer(note);
        let doc = parseDoc(buf);
        for (let step = 0; step < 150; step++) {
          buf = randomEdit(buf, next);
          const incremental = parseDoc(buf, doc);
          expect(incremental).toEqual(parseDoc(buf));
          doc = incremental;
        }
      }
    });
  }
});

test("incremental parse of a long note equals a fresh parse", () => {
  const long = [...NOTES, ...NOTES, ...NOTES, ...NOTES].join("\n\n");
  for (const seed of [11, 12, 13, 14, 15, 16]) {
    withSeed(seed, (next) => {
      let buf = createTextBuffer(long);
      const docs = [parseDoc(buf)];
      for (let step = 0; step < 120; step++) {
        buf = randomEdit(buf, next);
        const prev =
          docs[Math.max(0, docs.length - 1 - Math.floor(next() * 3))];
        const incremental = parseDoc(buf, prev);
        expect(incremental).toEqual(parseDoc(buf));
        docs.push(incremental);
      }
    });
  }
});

const paragraphs = (n: number) =>
  Array.from(
    { length: n },
    (_, i) => `Paragraph ${i} with [[link-${i}]] and #tag${i}.`,
  );

test("one edited paragraph re-scans one block", () => {
  let buf = createTextBuffer(paragraphs(200).join("\n\n"));
  const before = parseDoc(buf);
  expect(before.blocks).toHaveLength(200);
  buf = buf.apply({
    range: { start: { line: 200, col: 9 }, end: { line: 200, col: 9 } },
    text: " edited",
  }).buffer;
  const after = parseDoc(buf, before);
  const reused = after.blocks.filter((b, i) => b === before.blocks[i]);
  expect(reused).toHaveLength(199);
  expect(after.blocks[100]).not.toBe(before.blocks[100]);
  expect(after.blocks[100]?.scan.links[0]?.range.start.line).toBe(200);
  expect(after).toEqual(parseDoc(buf));
});

const idsOf = (doc: Doc) => doc.blocks.map((b) => b.id);

test("block ids survive inserts above them", () => {
  let buf = createTextBuffer(paragraphs(20).join("\n\n"));
  const before = parseDoc(buf);
  buf = buf.apply({
    range: { start: { line: 20, col: 0 }, end: { line: 20, col: 0 } },
    text: "A new paragraph.\n\n",
  }).buffer;
  const after = parseDoc(buf, before);
  expect(after).toEqual(parseDoc(buf));
  const kept = [...idsOf(after).slice(0, 10), ...idsOf(after).slice(11)];
  expect(kept).toEqual(idsOf(before));
  expect(after.blocks[11]?.startLine).toBe(22);
  expect(after.blocks[11]?.scan.links[0]?.range.start.line).toBe(22);
});

// Two paragraphs whose block hashes share a 32-bit FNV-1a value.
const COLLIDING = ["Collision 0004089", "Collision 0038243"] as const;

test("colliding block hashes get distinct ids in document order", () => {
  const [a, b] = COLLIDING;
  const alone = (p: string) =>
    parseDoc(createTextBuffer(`${p}\n`)).blocks[0]?.id;
  expect(a).not.toBe(b);
  expect(alone(a)).toBe(alone(b));
  const value = alone(a) ?? 0;

  const ab = createTextBuffer(`${a}\n\n${b}\n`);
  expect(idsOf(parseDoc(ab))).toEqual([value, value + 1]);
  const ba = createTextBuffer(`${b}\n\n${a}\n`);
  expect(idsOf(parseDoc(ba))).toEqual([value, value + 1]);
  expect(parseDoc(ba, parseDoc(ab))).toEqual(parseDoc(ba));
  expect(parseDoc(ab, parseDoc(ba))).toEqual(parseDoc(ab));
});

test("the document version is the buffer version", () => {
  const buf = createTextBuffer("a").apply({
    range: { start: { line: 0, col: 1 }, end: { line: 0, col: 1 } },
    text: "b",
  }).buffer;
  expect(parseDoc(buf).version).toBe(buf.version);
});
