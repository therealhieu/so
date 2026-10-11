import { expect, test } from "bun:test";
import { createTextBuffer } from "../../kernel/text/text-buffer";
import { markdownHighlighter } from "./highlight";

const NOTE = [
  "# One",
  "## Two **bold**",
  "### Three",
  "##### Five",
  "Setext one",
  "===",
  "Setext two",
  "---",
  "Text with [a](b)",
].join("\n");

test("heading text takes its level's style, capped at four", () => {
  const buf = createTextBuffer(NOTE);
  const lines = markdownHighlighter().highlight(buf, { from: 0, to: 9 });
  const styles = lines.map((spans) => spans.map((s) => s.style));
  expect(styles[0]).toEqual(["mdHeading1"]);
  expect(styles[1]).toEqual(["mdHeading2", "codeStrong"]);
  expect(styles[2]).toEqual(["mdHeading3"]);
  expect(styles[3]).toEqual(["mdHeading4"]);
  expect(styles.slice(4, 8)).toEqual([
    ["mdHeading1"],
    ["mdHeading1"],
    ["mdHeading2"],
    ["mdHeading2"],
  ]);
  expect(styles[8]).not.toContain("codeTitle");
});

test("the same range twice gets the same spans", () => {
  const buf = createTextBuffer(NOTE);
  const h = markdownHighlighter();
  expect(h.highlight(buf, { from: 0, to: 9 })).toBe(
    h.highlight(buf, { from: 0, to: 9 }),
  );
});

test("raw HTML takes the colour around it", () => {
  const buf = createTextBuffer(
    [
      "<How the snippet shows the problem.>",
      'A <b class="x">b</b> c',
      "### CR-1 — <Major | Minor> — <Category>",
    ].join("\n"),
  );
  const [tag, inline, heading] = markdownHighlighter().highlight(buf, {
    from: 0,
    to: 3,
  });
  expect(tag).toEqual([
    { text: "<How the snippet shows the problem.>", style: "text" },
  ]);
  expect(inline).toEqual([{ text: 'A <b class="x">b</b> c', style: "text" }]);
  expect(heading).toEqual([
    { text: "### CR-1 — <Major | Minor> — <Category>", style: "mdHeading3" },
  ]);
});
