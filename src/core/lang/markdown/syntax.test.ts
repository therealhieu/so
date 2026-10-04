import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { type DocScan, scanDoc } from "./scan";
import { type ScanOut, scanLine, syntaxExtensions } from "./syntax";

const scan = (text: string): ScanOut => {
  const out: ScanOut = { links: [], tags: [], blockIds: [], excluded: [] };
  scanLine(text, 0, out);
  return out;
};

test("inline code hides links and tags from later scanners", () => {
  const out = scan("see `[[x]] #tag` and [[y]]");
  expect(out.links.map((l) => l.target)).toEqual(["y"]);
  expect(out.tags).toEqual([]);
  expect(out.excluded).toHaveLength(1);
});

test("an embed is not also counted as a wikilink", () => {
  const out = scan("![[photo.png]] [[note]]");
  expect(out.links.map((l) => [l.kind, l.target])).toEqual([
    ["embed", "photo.png"],
    ["wiki", "note"],
  ]);
});

test("a comment opener inside a code span does not start a comment", () => {
  const out = scan("use `%%` to hide %% [[secret]] %% but [[shown]]");
  expect(out.links.map((l) => l.target)).toEqual(["shown"]);
});

/** `scanDoc(text)` with every scanner run on every line, ignoring `triggers`. */
function scanDocUntriggered(text: string): DocScan {
  const saved = [...syntaxExtensions];
  syntaxExtensions.splice(
    0,
    saved.length,
    ...saved.map(({ triggers: _, ...ext }) => ext),
  );
  try {
    return scanDoc(text);
  } finally {
    syntaxExtensions.splice(0, syntaxExtensions.length, ...saved);
  }
}

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

/** Trigger strings, their near misses, and the syntax that hides them. */
const PIECES = [
  "word ",
  "[[",
  "]]",
  "![[",
  "!",
  "[",
  "]",
  "(",
  ")",
  "](",
  "#",
  "# ",
  "#tag",
  "^",
  "^id",
  " ^id",
  "%%",
  "%",
  "<!--",
  "<!-",
  "-->",
  "`",
  "$",
  "\\",
  "|",
  "note.md",
  "\n",
  "\n\n",
  "- ",
  "> ",
  "```",
  "$$",
  "---",
  "    ",
];

test("skipping scanners by trigger leaves every scan unchanged", () => {
  const files = [
    "test/fixtures/tour.md",
    ...[
      ...new Bun.Glob("test/fixtures/markdown-corpus/*.md").scanSync(),
    ].sort(),
  ];
  const texts = files.map((f) => readFileSync(f, "utf8"));
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    const next = random(seed);
    for (let doc = 0; doc < 20; doc++) {
      let text = "";
      for (let i = 0; i < 80; i++)
        text += PIECES[Math.floor(next() * PIECES.length)];
      texts.push(text);
    }
  }
  expect(texts.length).toBeGreaterThan(200);
  for (const text of texts)
    expect(scanDoc(text)).toEqual(scanDocUntriggered(text));
});
