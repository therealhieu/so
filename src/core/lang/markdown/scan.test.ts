import { expect, test } from "bun:test";
import type { Range } from "../../kernel/text/pos";
import { scanDoc } from "./scan";

const sliceOf = (text: string, r: Range) => {
  const lines = text.split("\n");
  expect(r.start.line).toBe(r.end.line);
  return (lines[r.start.line] ?? "").slice(r.start.col, r.end.col);
};

const EVERY_SYNTAX = [
  "# Every syntax",
  "",
  "Links [[note]], [[note|alias]], [[note#H]] and [[note#H1#H2]].",
  "A block link [[note#^id]] and an embed ![[embed]].",
  "A file link [x](a%20b.md) and tags #tag, #tag/sub.",
  "",
  "## heading",
  "",
  "A paragraph with an id ^block-id",
].join("\n");

test("every Obsidian link, tag, heading, and block id is found with exact ranges", () => {
  const scan = scanDoc(EVERY_SYNTAX);
  for (const l of scan.links)
    expect(sliceOf(EVERY_SYNTAX, l.range)).toBe(l.raw);
  expect(
    scan.links.map(({ kind, target, subpath, alias, raw }) => ({
      kind,
      target,
      subpath,
      alias,
      raw,
    })),
  ).toEqual([
    {
      kind: "wiki",
      target: "note",
      subpath: undefined,
      alias: undefined,
      raw: "[[note]]",
    },
    {
      kind: "wiki",
      target: "note",
      subpath: undefined,
      alias: "alias",
      raw: "[[note|alias]]",
    },
    {
      kind: "wiki",
      target: "note",
      subpath: "#H",
      alias: undefined,
      raw: "[[note#H]]",
    },
    {
      kind: "wiki",
      target: "note",
      subpath: "#H1#H2",
      alias: undefined,
      raw: "[[note#H1#H2]]",
    },
    {
      kind: "wiki",
      target: "note",
      subpath: "#^id",
      alias: undefined,
      raw: "[[note#^id]]",
    },
    {
      kind: "embed",
      target: "embed",
      subpath: undefined,
      alias: undefined,
      raw: "![[embed]]",
    },
    {
      kind: "md",
      target: "a b.md",
      subpath: undefined,
      alias: undefined,
      raw: "[x](a%20b.md)",
    },
  ]);
  expect(scan.tags.map((t) => [t.tag, sliceOf(EVERY_SYNTAX, t.range)])).toEqual(
    [
      ["tag", "#tag"],
      ["tag/sub", "#tag/sub"],
    ],
  );
  expect(scan.headings).toEqual([
    { text: "Every syntax", level: 1, line: 0 },
    { text: "heading", level: 2, line: 6 },
  ]);
  expect(scan.blockIds).toEqual([{ id: "block-id", line: 8 }]);
  expect(scan.frontmatter).toBeUndefined();
});

const HIDDEN = [
  "Inline `[[a]] #a` code and $[[b]] #b$ math.", // 0
  "A %%[[c]] #c%% comment and <!-- [[d]] #d --> html.", // 1
  "Not tags: #123 and a#tag.", // 2
  "", // 3
  "```", // 4
  "[[e]] #e", // 5
  "```", // 6
  "", // 7
  "    [[f]] #f", // 8
  "", // 9
  "$$", // 10
  "[[g]] #g", // 11
  "$$", // 12
  "", // 13
  "%%", // 14
  "[[h]] #h", // 15
  "%%", // 16
  "", // 17
  "<!--", // 18
  "[[i]] #i", // 19
  "-->", // 20
].join("\n");

test("code, math, comments, and html hide syntax", () => {
  const scan = scanDoc(HIDDEN);
  expect(scan.links).toEqual([]);
  expect(scan.tags).toEqual([]);
  const covers = (line: number, col: number) =>
    scan.excluded.some(
      (r) =>
        (r.start.line < line ||
          (r.start.line === line && r.start.col <= col)) &&
        (r.end.line > line || (r.end.line === line && col < r.end.col)),
    );
  const at = (line: number, needle: string) =>
    (HIDDEN.split("\n")[line] ?? "").indexOf(needle);
  expect(covers(0, at(0, "[[a]]"))).toBe(true);
  expect(covers(0, at(0, "[[b]]"))).toBe(true);
  expect(covers(1, at(1, "[[c]]"))).toBe(true);
  expect(covers(1, at(1, "[[d]]"))).toBe(true);
  for (const line of [5, 8, 11, 15, 19]) expect(covers(line, 0)).toBe(true);
  expect(covers(2, 0)).toBe(false);
});

const FRONTMATTER = [
  "---",
  "tags: [a, b/c]",
  "aliases: Plan",
  'related: "[[plan]]"',
  "---",
  "Body #body",
].join("\n");

test("frontmatter tags, aliases, and links", () => {
  const scan = scanDoc(FRONTMATTER);
  expect(scan.frontmatter).toEqual({
    data: { tags: ["a", "b/c"], aliases: "Plan", related: "[[plan]]" },
    tags: ["a", "b/c"],
    aliases: ["Plan"],
  });
  expect(scan.links).toEqual([
    {
      kind: "wiki",
      target: "plan",
      raw: "[[plan]]",
      range: { start: { line: 3, col: 10 }, end: { line: 3, col: 18 } },
      inFrontmatter: true,
    },
  ]);
  expect(scan.tags.map((t) => t.tag)).toEqual(["body"]);
});

test("invalid frontmatter keeps its links and yields no data", () => {
  const scan = scanDoc("---\n: [[x]] : [\n---\n");
  expect(scan.frontmatter).toEqual({ data: {}, tags: [], aliases: [] });
  expect(scan.links.map((l) => l.target)).toEqual(["x"]);
});

test("setext headings, quoted headings, and fences inside quotes and lists", () => {
  const text = [
    "Title",
    "=====",
    "",
    "> ## Quoted",
    "> ```",
    "> [[hidden]]",
    "> ```",
    "",
    "- item [[shown]]",
    "  ```",
    "  #include",
    "  ```",
  ].join("\n");
  const scan = scanDoc(text);
  expect(scan.headings).toEqual([
    { text: "Title", level: 1, line: 0 },
    { text: "Quoted", level: 2, line: 3 },
  ]);
  expect(scan.links.map((l) => l.target)).toEqual(["shown"]);
  expect(scan.tags).toEqual([]);
});

test("external and in-note Markdown links", () => {
  const scan = scanDoc(
    '[web](https://x.org) [mail](mailto:a@b.c) [h](#Top) [p](<a b.md> "t")',
  );
  expect(scan.links.map((l) => [l.target, l.subpath])).toEqual([
    ["", "#Top"],
    ["a b.md", undefined],
  ]);
});
