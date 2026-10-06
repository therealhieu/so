import { expect, test } from "bun:test";
import { FLOAT_RULE, hoverLines } from "./lsp-hover";

const RUST =
  "```rust\ngeo::geo\n```\n\n```rust\npub fn distance(a: Point) -> f64\n```\n\n---\n\nStraight-line distance.";

test("fenced code is highlighted without its fences, and a break is a rule", () => {
  const { lines, spans } = hoverLines(RUST);
  expect(lines).toEqual([
    "geo::geo",
    "",
    "pub fn distance(a: Point) -> f64",
    "",
    "",
    "",
    "Straight-line distance.",
  ]);
  const code = spans[2] ?? [];
  expect(code.map((s) => s.text).join("")).toBe(lines[2] as string);
  expect(code.find((s) => s.text === "pub")?.style).toBe("codeKeyword");
  expect(spans[4]).toEqual([{ text: "", style: FLOAT_RULE }]);
  expect(spans[6]).toBeUndefined();
});

test("prose stays plain, blank runs collapse, and an unknown language is plain", () => {
  expect(hoverLines("\n\nDocs\n\n\n\nMore\n\n")).toEqual({
    lines: ["Docs", "", "More"],
    spans: [undefined, undefined, undefined],
  });
  expect(hoverLines("```nosuchlang\nx y\n```")).toEqual({
    lines: ["x y"],
    spans: [undefined],
  });
});

test("an unclosed fence runs to the end and a longer fence closes it", () => {
  expect(hoverLines("```ts\nlet a = 1;\n").lines).toEqual(["let a = 1;", ""]);
  expect(hoverLines("````ts\nlet a\n````\ntail").lines).toEqual([
    "let a",
    "tail",
  ]);
});
