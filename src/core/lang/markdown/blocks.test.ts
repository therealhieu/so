import { expect, test } from "bun:test";
import { type BlockSpan, splitBlocks } from "./blocks";

const lines = (text: string) => {
  const all = text.split("\n");
  return { line: (i: number) => all[i] ?? "", lineCount: all.length };
};

function expectCoverage(spans: BlockSpan[], lineCount: number) {
  let next = 0;
  for (const s of spans) {
    expect(s.startLine).toBe(next);
    expect(s.endLine).toBeGreaterThanOrEqual(s.startLine);
    next = s.endLine + 1;
  }
  expect(next).toBe(lineCount);
}

const kinds = (spans: BlockSpan[]) => spans.map((s) => s.kind);

const NOTE = [
  "---", //  0 frontmatter
  "tags: [a]",
  "---",
  "", //  3
  "# Title", //  4 heading
  "",
  "Intro with [[link]].", //  6 paragraph
  "",
  "```ts", //  8 fence with a blank line inside
  "const a = 1;",
  "",
  "# not a heading",
  "```",
  "",
  "~~~", // 14 tilde fence
  "[[hidden]]",
  "~~~",
  "",
  "$$", // 18 math with a blank line inside
  "x = 1",
  "",
  "$$",
  "",
  "%%", // 23 comment with a blank line inside
  "secret [[hidden]]",
  "",
  "%%",
  "",
  "- one", // 28 nested list with blank lines between items
  "  - nested",
  "",
  "- two",
  "",
  "Between", // 33 paragraph
  "",
  "    indented code", // 35 indented code
  "",
  "    more",
  "",
  "Last paragraph", // 39
];

test("structural blocks stay whole", () => {
  const spans = splitBlocks(lines(NOTE.join("\n")));
  expectCoverage(spans, NOTE.length);
  expect(kinds(spans)).toEqual([
    "frontmatter",
    "heading",
    "paragraph",
    "fence",
    "fence",
    "math",
    "comment",
    "list",
    "paragraph",
    "indentedCode",
    "paragraph",
  ]);
  const at = (line: number) =>
    spans.find((s) => s.startLine <= line && line <= s.endLine);
  expect(at(0)).toMatchObject({ startLine: 0, endLine: 3 });
  expect(at(10)).toMatchObject({ kind: "fence", startLine: 8 });
  expect(at(12)?.kind).toBe("fence");
  expect(at(20)).toMatchObject({ kind: "math", startLine: 18 });
  expect(at(25)).toMatchObject({ kind: "comment", startLine: 23 });
  expect(at(31)).toMatchObject({ kind: "list", startLine: 28 });
  expect(at(37)).toMatchObject({ kind: "indentedCode", startLine: 35 });
});

test("an unclosed fence runs to the end", () => {
  const text = "Before\n\n```\ncode\n\n[[x]]";
  const spans = splitBlocks(lines(text));
  expectCoverage(spans, 6);
  expect(spans.at(-1)).toEqual({ kind: "fence", startLine: 2, endLine: 5 });
});

test("a fence closes only on a matching marker of at least its length", () => {
  const text = "````\n```\n~~~~\n````\nafter";
  const spans = splitBlocks(lines(text));
  expect(spans).toEqual([
    { kind: "fence", startLine: 0, endLine: 3 },
    { kind: "paragraph", startLine: 4, endLine: 4 },
  ]);
});

test("frontmatter needs a closing line at the top of the file", () => {
  expect(kinds(splitBlocks(lines("---\nno close\n")))).not.toContain(
    "frontmatter",
  );
  expect(kinds(splitBlocks(lines("\n---\na: 1\n---")))).not.toContain(
    "frontmatter",
  );
});

test("headings and fences interrupt a paragraph", () => {
  const spans = splitBlocks(lines("text\n# H\nmore\n```\ncode\n```"));
  expect(spans).toEqual([
    { kind: "paragraph", startLine: 0, endLine: 0 },
    { kind: "heading", startLine: 1, endLine: 1 },
    { kind: "paragraph", startLine: 2, endLine: 2 },
    { kind: "fence", startLine: 3, endLine: 5 },
  ]);
});

test("only a bullet or a first item interrupts a paragraph", () => {
  expect(splitBlocks(lines("In\n2024. we shipped\n- item"))).toEqual([
    { kind: "paragraph", startLine: 0, endLine: 1 },
    { kind: "list", startLine: 2, endLine: 2 },
  ]);
});

test("a setext underline stays in its paragraph and a list keeps fenced items whole", () => {
  expect(splitBlocks(lines("Title\n---\nbody"))).toEqual([
    { kind: "paragraph", startLine: 0, endLine: 2 },
  ]);
  const list = splitBlocks(lines("- a\n  ```\n\n  - not an item\n  ```\n- b"));
  expect(list).toEqual([{ kind: "list", startLine: 0, endLine: 5 }]);
});

test("html blocks are recognised and blank-only text is one block", () => {
  expect(kinds(splitBlocks(lines("<div>\n[[x]]\n</div>\n\ntext")))).toEqual([
    "html",
    "paragraph",
  ]);
  expect(splitBlocks(lines("\n\n"))).toEqual([
    { kind: "paragraph", startLine: 0, endLine: 2 },
  ]);
});
