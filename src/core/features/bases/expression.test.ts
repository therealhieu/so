import { describe, expect, test } from "bun:test";
import { evaluateExpression } from "./expression";

const context = {
  note: { status: "reading", price: 20, pages: 400, tags: ["book"] },
  file: {
    path: "Books/Dune.md",
    name: "Dune.md",
    basename: "Dune",
    folder: "Books",
    ext: "md",
    size: 120,
    tags: ["book"],
  },
  formula: { ppu: 0.05 },
};

const at = (folder: string, tags: string[]) => ({
  ...context,
  file: { ...context.file, folder, tags },
});

describe("evaluateExpression", () => {
  test("evaluates comparisons and boolean expressions", () => {
    expect(
      evaluateExpression('status != "done" && file.ext == "md"', context),
    ).toEqual({ value: true, diagnostics: [] });
  });

  test("evaluates file helper methods", () => {
    expect(
      evaluateExpression(
        'file.hasTag("book") && file.inFolder("Books")',
        context,
      ),
    ).toEqual({ value: true, diagnostics: [] });
  });

  test("parses valid right hand side for truthy OR expressions", () => {
    expect(
      evaluateExpression('status == "reading" || file.ext == "md"', context),
    ).toEqual({ value: true, diagnostics: [] });
  });

  test("parses valid right hand side for falsy AND expressions", () => {
    expect(
      evaluateExpression('status == "done" && file.ext == "md"', context),
    ).toEqual({ value: false, diagnostics: [] });
  });

  test("returns a diagnostic for unsupported function syntax", () => {
    const result = evaluateExpression('unknown("book")', context);
    expect(result.value).toBeNull();
    expect(result.diagnostics[0]).toMatchObject({
      code: "unsupported_expression",
    });
  });

  test("does not execute arbitrary JavaScript", () => {
    const result = evaluateExpression("process.exit()", context);
    expect(result.value).toBeNull();
    expect(result.diagnostics[0]).toMatchObject({
      code: "unsupported_expression",
    });
  });

  test("inFolder matches the folder and its subfolders", () => {
    const value = (folder: string, arg: string) =>
      evaluateExpression(`file.inFolder("${arg}")`, at(folder, [])).value;
    expect(value("Projects/2026", "Projects")).toBe(true);
    expect(value("Projects", "Projects")).toBe(true);
    expect(value("Projects", "Projects/")).toBe(true);
    expect(value("ProjectsOld", "Projects")).toBe(false);
    expect(value("Other/Projects", "Projects")).toBe(false);
  });

  test("hasTag matches any argument and nested tags", () => {
    const value = (tags: string[]) =>
      evaluateExpression('file.hasTag("a", "b")', at("", tags)).value;
    expect(value(["b"])).toBe(true);
    expect(value(["a/x"])).toBe(true);
    expect(value(["A"])).toBe(true);
    expect(value(["ab", "c"])).toBe(false);
    expect(
      evaluateExpression('file.hasTag("#a")', at("", ["a/x/y"])).value,
    ).toBe(true);
  });

  test("single- and double-quoted strings compare equal", () => {
    const single = evaluateExpression("status == 'reading'", context);
    const double = evaluateExpression('status == "reading"', context);
    expect(single).toEqual({ value: true, diagnostics: [] });
    expect(single).toEqual(double);
    expect(evaluateExpression(`'say "hi"' == 'say "hi"'`, context).value).toBe(
      true,
    );
  });

  test("an unterminated single-quoted string is unsupported", () => {
    expect(
      evaluateExpression("status == 'reading", context).diagnostics[0],
    ).toMatchObject({ code: "unsupported_expression" });
  });

  test("functions outside the subset stay unsupported", () => {
    for (const expr of [
      'if(status == "done", 1, 0)',
      "today()",
      'status.contains("x")',
      'note["status"]',
    ])
      expect(evaluateExpression(expr, context).diagnostics[0]).toMatchObject({
        code: "unsupported_expression",
      });
  });
});
