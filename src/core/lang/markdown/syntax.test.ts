import { expect, test } from "bun:test";
import { type ScanOut, scanLine } from "./syntax";

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
