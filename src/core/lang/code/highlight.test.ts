// biome-ignore-all lint/suspicious/noTemplateCurlyInString: these strings are Terraform interpolations, not templates.
import { expect, test } from "bun:test";
import { createTextBuffer } from "../../kernel/text/text-buffer";
import { highlightMarks } from "../../kernel/view/marks";
import type { TextView } from "../../kernel/view/types";
import { lowlightHighlighter } from "./highlight";

const source = Array.from({ length: 5000 }, (_, i) =>
  i % 50 === 0
    ? "/* block"
    : i % 50 === 1
      ? "   comment */"
      : `const v${i}: string = "s${i}"; // n`,
).join("\n");

test("highlights only the requested lines", () => {
  const buf = createTextBuffer(source);
  const h = lowlightHighlighter("typescript");
  const lines = h.highlight(buf, { from: 400, to: 440 });
  expect(lines).toHaveLength(40);
  for (const [i, spans] of lines.entries())
    expect(spans.map((s) => s.text).join("")).toBe(buf.line(400 + i));
  expect(lines[2]?.map((s) => s.style)).toContain("codeKeyword");
  expect(lines[2]?.map((s) => s.style)).toContain("codeString");
  expect(lines[2]?.map((s) => s.style)).toContain("codeComment");
  // Line 401 continues the block comment opened on line 400.
  expect(lines[1]).toEqual([{ text: "   comment */", style: "codeComment" }]);
});

test("Dockerfile instructions highlight, with shell commands as Bash", () => {
  const buf = createTextBuffer(
    'FROM oven/bun:1.4.2\n# deps\nRUN echo "hi" && bun install',
  );
  const lines = lowlightHighlighter("dockerfile").highlight(buf, {
    from: 0,
    to: 3,
  });
  expect(lines[0]?.[0]).toEqual({ text: "FROM", style: "codeKeyword" });
  expect(lines[1]).toEqual([{ text: "# deps", style: "codeComment" }]);
  expect(lines[2]?.[0]).toEqual({ text: "RUN", style: "codeKeyword" });
  expect(lines[2]).toContainEqual({ text: '"hi"', style: "codeString" });
});

const terraform = [
  '# owner: "ops"', //  0
  "/* storage", //  1
  "   for logs */", //  2
  'resource "aws_s3_bucket" "logs" {', //  3
  '  bucket = "${var.name}-logs"', //  4
  "  count  = 2", //  5
  "  policy = <<-EOF", //  6
  '    {"Resource": "${data.x.arn}"}', //  7
  "  EOF", //  8
  "  ids = [for k, v in var.m : k => v if v != null]", //  9
  '  tags = { Name = lookup(local.tags, "k", null) } // why', // 10
  "  lifecycle {", // 11
  "}", // 12
].join("\n");

const terraformLines = (language = "terraform", from = 0, to = 13) =>
  lowlightHighlighter(language).highlight(createTextBuffer(terraform), {
    from,
    to,
  });

test("Terraform blocks, attributes, and values highlight", () => {
  const lines = terraformLines();
  expect(lines[0]).toEqual([{ text: '# owner: "ops"', style: "codeComment" }]);
  expect(lines[3]).toEqual([
    { text: "resource", style: "codeKeyword" },
    { text: " ", style: "text" },
    { text: '"aws_s3_bucket"', style: "codeString" },
    { text: " ", style: "text" },
    { text: '"logs"', style: "codeString" },
    { text: " {", style: "text" },
  ]);
  expect(lines[5]).toContainEqual({ text: "count", style: "codeAttribute" });
  expect(lines[5]).toContainEqual({ text: "2", style: "codeNumber" });
  expect(lines[10]).toContainEqual({ text: "Name", style: "codeAttribute" });
  expect(lines[10]).toContainEqual({ text: "lookup", style: "codeBuiltin" });
  expect(lines[10]).toContainEqual({ text: "null", style: "codeLiteral" });
  expect(lines[10]?.at(-1)).toEqual({ text: "// why", style: "codeComment" });
  expect(lines[11]).toContainEqual({ text: "lifecycle", style: "codeKeyword" });
});

test("Terraform interpolation keeps the string around its references", () => {
  expect(terraformLines()[4]).toEqual([
    { text: "  ", style: "text" },
    { text: "bucket", style: "codeAttribute" },
    { text: " = ", style: "text" },
    { text: '"${', style: "codeString" },
    { text: "var", style: "codeVariable" },
    { text: '.name}-logs"', style: "codeString" },
  ]);
});

test("a for expression's arrow is not an attribute", () => {
  const line = terraformLines()[9];
  expect(line).toContainEqual({ text: "for", style: "codeKeyword" });
  expect(line).toContainEqual({ text: "in", style: "codeKeyword" });
  expect(line).toContainEqual({ text: "if", style: "codeKeyword" });
  expect(line?.filter((s) => s.style === "codeAttribute")).toEqual([
    { text: "ids", style: "codeAttribute" },
  ]);
});

test("Terraform comments and heredocs end at their closing delimiter", () => {
  const lines = terraformLines();
  expect(lines[2]).toEqual([{ text: "   for logs */", style: "codeComment" }]);
  expect(lines[7]).toContainEqual({ text: "data", style: "codeVariable" });
  expect(lines[7]?.[0]?.style).toBe("codeString");
  expect(lines[8]).toEqual([{ text: "  EOF", style: "codeString" }]);
  expect(lines[9]?.[1]).toEqual({ text: "ids", style: "codeAttribute" });
  // A window that starts inside the heredoc still sees it open.
  expect(terraformLines("terraform", 7, 9)).toEqual(lines.slice(7, 9));
});

test("a heredoc opens with blanks after its marker", () => {
  const lines = lowlightHighlighter("terraform").highlight(
    createTextBuffer("p = <<EOF  \n  body = 1\nEOF\nb = 1"),
    { from: 0, to: 4 },
  );
  expect(lines[1]).toEqual([{ text: "  body = 1", style: "codeString" }]);
  expect(lines[3]?.[0]).toEqual({ text: "b", style: "codeAttribute" });
});

test("hcl, terraform, and tf name one grammar", () => {
  const lines = terraformLines("hcl");
  expect(lines[3]?.[0]).toEqual({ text: "resource", style: "codeKeyword" });
  expect(terraformLines("terraform")).toEqual(lines);
  expect(terraformLines("tf")).toEqual(lines);
});

test("look-back carries state from above the window", () => {
  const buf = createTextBuffer(source);
  const h = lowlightHighlighter("typescript");
  expect(h.highlight(buf, { from: 401, to: 402 })).toEqual([
    [{ text: "   comment */", style: "codeComment" }],
  ]);
});

test("highlight marks use code tokens for the visible lines", () => {
  const buf = createTextBuffer(source);
  const view: TextView = {
    buf,
    width: 80,
    topRow: 400,
    rows: 40,
    cursor: { line: 400, col: 0 },
    folds: new Set(),
    visible: { from: 400, to: 440 },
  };
  const marks = highlightMarks(lowlightHighlighter("typescript"))(
    view,
    undefined,
  );
  expect(marks.length).toBeGreaterThan(0);
  for (const m of marks) {
    if (m.kind !== "mark") throw new Error("expected marks only");
    expect(m.range.start.line).toBeGreaterThanOrEqual(400);
    expect(m.range.end.line).toBeLessThan(440);
  }
  expect(
    marks.some((m) => m.kind === "mark" && m.style.startsWith("code")),
  ).toBe(true);
});

test("the same buffer is highlighted once", () => {
  const buf = createTextBuffer(source);
  const h = lowlightHighlighter("typescript");
  const first = h.highlight(buf, { from: 400, to: 440 });
  expect(h.highlight(buf, { from: 400, to: 440 })).toBe(first);
  const edited = buf.apply({
    range: { start: { line: 400, col: 0 }, end: { line: 400, col: 0 } },
    text: "x",
  }).buffer;
  expect(h.highlight(edited, { from: 400, to: 440 })).not.toBe(first);
});

test("a range shifted within the last highlight matches a fresh highlight", () => {
  const buf = createTextBuffer(source);
  const h = lowlightHighlighter("typescript");
  h.highlight(buf, { from: 400, to: 440 });
  const shifted = h.highlight(buf, { from: 410, to: 450 });
  expect(shifted).toHaveLength(40);
  expect(shifted).toEqual(
    lowlightHighlighter("typescript").highlight(buf, { from: 410, to: 450 }),
  );
});

test("an unknown grammar yields no marks", () => {
  const buf = createTextBuffer("const a = 1;");
  const view: TextView = {
    buf,
    width: 80,
    topRow: 0,
    rows: 1,
    cursor: { line: 0, col: 0 },
    folds: new Set(),
    visible: { from: 0, to: 1 },
  };
  expect(
    highlightMarks(lowlightHighlighter("no-such-grammar"))(view, undefined),
  ).toEqual([]);
});
