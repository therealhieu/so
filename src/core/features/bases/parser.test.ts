import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { type ParsedBase, parseBase } from "./parser";
import { type Base, KANBAN_TYPE } from "./types";

const fixture = (name: string) =>
  readFileSync(
    new URL(`../../../../test/fixtures/bases/alfred/${name}`, import.meta.url),
    "utf8",
  );

const ok = (r: ParsedBase): Base => {
  if (!r.ok) throw new Error(r.diagnostic.message);
  return r.base;
};

describe("parseBase", () => {
  test("parses Obsidian base YAML", () => {
    const base = ok(parseBase(fixture("books.base")));
    expect(base.views[0]?.name).toBe("Reading");
    expect(base.formulas.ppu).toBe("price / pages");
    expect(base.filters).toEqual({ and: ['file.hasTag("book")'] });
    expect(base.diagnostics).toEqual([]);
  });

  test("invalid YAML fails with a diagnostic", () => {
    const r = parseBase(fixture("broken.base"));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.diagnostic).toMatchObject({
      severity: "error",
      code: "invalid_yaml",
    });
  });

  test("creates a default table view when views are missing", () => {
    expect(ok(parseBase(fixture("no-views.base"))).views).toEqual([
      { type: "table", name: "Table" },
    ]);
  });

  test("normalizes string groupBy to object form and warns that Obsidian rejects it", () => {
    const base = ok(parseBase(fixture("string-group-by.base")));
    expect(base.views[0]).toMatchObject({
      groupBy: { property: "status" },
      name: "Board",
      type: "board",
    });
    expect(base.diagnostics.map((d) => d.code)).toEqual(["group_by_invalid"]);
  });

  test("strips malformed groupBy values from normalized views", () => {
    const base = ok(parseBase(fixture("malformed-group-by.base")));
    expect(base.views[0]).toEqual({ name: "Board", type: "board" });
    expect(base.diagnostics.map((d) => d.code)).toEqual(["group_by_invalid"]);
  });

  test("normalizes columnSize and wrapText on a view", () => {
    const [view] = ok(parseBase(fixture("column-size.base"))).views;
    expect(view?.columnSize).toEqual({ "file.name": 240, "note.age": 120 });
    expect(view?.wrapText).toEqual(["file.name"]);
  });

  test("drops non-positive columnSize widths and dedups wrapText", () => {
    const [view] = ok(parseBase(fixture("column-size-invalid.base"))).views;
    expect(view?.columnSize).toEqual({ c: 120 });
    expect(view?.wrapText).toEqual(["file.name"]);
  });

  test("views Obsidian rejects still render with warnings", () => {
    const base = ok(
      parseBase(
        "views:\n  - type: table\n    order: [file.name]\n  - type: table\n    name: Grouped\n    groupBy: status\n",
      ),
    );
    expect(base.views.map((v) => v.name)).toEqual(["Table", "Grouped"]);
    expect(base.diagnostics).toEqual([
      expect.objectContaining({
        severity: "warning",
        code: "view_name_missing",
      }),
      expect.objectContaining({
        severity: "warning",
        code: "group_by_invalid",
      }),
    ]);
    expect(base.diagnostics[1]?.message).toContain('"Grouped"');
  });

  test("a legacy sort column names the sort property", () => {
    const base = ok(
      parseBase(
        "views:\n  - type: table\n    name: T\n    sort:\n      - column: note.due\n        direction: DESC\n      - property: status\n        direction: ASC\n",
      ),
    );
    expect(base.views[0]?.sort).toEqual([
      { property: "note.due", direction: "DESC" },
      { property: "status", direction: "ASC" },
    ]);
  });

  test("groupOrder keeps typed values with null for the group without a value", () => {
    const base = ok(
      parseBase(
        "views:\n  - type: table\n    name: T\n    groupBy:\n      property: status\n      direction: ASC\n    groupOrder:\n      - todo\n      - 3\n      - null\n",
      ),
    );
    expect(base.views[0]?.groupOrder).toEqual(["todo", 3, null]);
    expect(base.diagnostics).toEqual([]);
  });
});

test("no view type selects the Kanban board until an Obsidian-saved file confirms it", () => {
  expect(KANBAN_TYPE).toBeUndefined();
});
