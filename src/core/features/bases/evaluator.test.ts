import { describe, expect, test } from "bun:test";

import { evaluateBase, pinKeys } from "./evaluator";
import { parseBase } from "./parser";

const duneCandidate = {
  path: "Books/Dune.md",
  name: "Dune.md",
  basename: "Dune",
  folder: "Books",
  ext: "md",
  size: 120,
  mtime: 1777593600000,
  ctime: 1777593600000,
  properties: { status: "reading", price: 20, pages: 400, tags: ["book"] },
  tags: ["book"],
  links: [],
  embeds: [],
};

const candidates = [
  duneCandidate,
  {
    path: "Books/Done.md",
    name: "Done.md",
    basename: "Done",
    folder: "Books",
    ext: "md",
    size: 80,
    mtime: 1777680000000,
    ctime: 1777680000000,
    properties: { status: "done", price: 10, pages: 200, tags: ["book"] },
    tags: ["book"],
    links: [],
    embeds: [],
  },
];

describe("evaluateBase", () => {
  test("filters rows, computes formulas, and marks editable columns", () => {
    const result = evaluateBase({
      base: {
        filters: { and: ['file.hasTag("book")'] },
        formulas: { ppu: "price / pages" },
        properties: {
          status: { displayName: "Status" },
          "formula.ppu": { displayName: "Price/page" },
        },
        summaries: {},
        views: [
          {
            type: "table",
            name: "Reading",
            filters: { and: ['status != "done"'] },
            order: ["file.name", "status", "formula.ppu"],
          },
        ],
        diagnostics: [],
      },
      candidates,
    });

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.file.path).toBe("Books/Dune.md");
    expect(
      result.columns.map((column) => [
        column.property,
        column.source,
        column.editable,
      ]),
    ).toEqual([
      ["file.name", "fileProperty", false],
      ["status", "noteProperty", true],
      ["formula.ppu", "formula", false],
    ]);
    expect(result.columns[2]).toMatchObject({
      formulaExpression: "price / pages",
    });
    expect(result.rows[0]?.cells["formula.ppu"]).toEqual({
      type: "number",
      value: 0.05,
    });
  });

  test("includes array tags and rejects a comma-containing scalar under exact hasTag filters", () => {
    const result = evaluateBase({
      base: {
        filters: {
          and: [
            'file.inFolder("2-wiki/2-tech/1-notes")',
            'file.hasTag("tech-notes")',
          ],
        },
        formulas: {},
        properties: { tags: { displayName: "Tags" } },
        summaries: {},
        views: [
          {
            type: "table",
            name: "Tech Notes",
            order: ["file.name", "tags"],
          },
        ],
        diagnostics: [],
      },
      candidates: [
        {
          ...duneCandidate,
          path: "2-wiki/2-tech/1-notes/webhook.md",
          name: "webhook.md",
          basename: "webhook",
          folder: "2-wiki/2-tech/1-notes",
          properties: { tags: ["tech-notes", "api", "backend"] },
          tags: ["tech-notes", "api", "backend"],
        },
        {
          ...duneCandidate,
          path: "2-wiki/2-tech/1-notes/legacy.md",
          name: "legacy.md",
          basename: "legacy",
          folder: "2-wiki/2-tech/1-notes",
          properties: { tags: "tech-notes, api, backend" },
          tags: ["tech-notes, api, backend"],
        },
      ],
    });

    expect(result.rows.map((row) => row.file.path)).toEqual([
      "2-wiki/2-tech/1-notes/webhook.md",
    ]);
  });

  test("projects declared semantic types and options into evaluated columns", () => {
    const result = evaluateBase({
      base: {
        formulas: { ppu: "price / pages" },
        properties: {
          status: {
            displayName: "Status",
            type: "select",
            options: [
              { name: "reading", color: "blue" },
              { name: "queued", color: "gray" },
              { name: "done", color: "green" },
            ],
          },
          tags: {
            displayName: "Tags",
            type: "multi_select",
            options: [
              { name: "book", color: "purple" },
              { name: "classic", color: "pink" },
            ],
          },
          owned: { displayName: "Owned", type: "checkbox" },
          "formula.ppu": { displayName: "Price/page", type: "formula" },
        },
        summaries: {},
        views: [
          {
            type: "table",
            name: "Reading",
            order: ["file.name", "status", "tags", "owned", "formula.ppu"],
          },
        ],
        diagnostics: [],
      },
      candidates: [
        {
          ...duneCandidate,
          properties: {
            ...duneCandidate.properties,
            status: "reading",
            tags: ["book", "classic"],
            owned: true,
          },
        },
      ],
    });

    expect(
      result.columns.find((column) => column.property === "status"),
    ).toMatchObject({
      semanticType: "select",
      options: [
        { name: "reading", color: "blue" },
        { name: "queued", color: "gray" },
        { name: "done", color: "green" },
      ],
    });
    expect(
      result.columns.find((column) => column.property === "tags"),
    ).toMatchObject({
      semanticType: "multi_select",
      options: [
        { name: "book", color: "purple" },
        { name: "classic", color: "pink" },
      ],
    });
    expect(
      result.columns.find((column) => column.property === "owned"),
    ).toMatchObject({
      semanticType: "checkbox",
    });
    expect(
      result.columns.find((column) => column.property === "formula.ppu"),
    ).toMatchObject({
      semanticType: "formula",
      formulaExpression: "price / pages",
    });
    expect(result.diagnostics).not.toContainEqual(
      expect.objectContaining({ code: "base_declared_type_mismatch" }),
    );
  });

  test("ignores malformed semantic metadata while preserving valid column metadata", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {
          status: {
            displayName: "Status",
            type: "unsupported",
            options: [
              { name: "reading", color: "blue", group: "invalid" },
              { name: "done", color: "green", group: "done" },
              { name: "missing color" },
              { name: "bad color", color: "teal" },
              { name: "", color: "red" },
              "not an option",
            ],
          },
          tags: {
            displayName: "Tags",
            type: "multi_select",
            options: "book",
          },
        },
        summaries: {},
        views: [
          {
            type: "table",
            name: "Reading",
            order: ["file.name", "status", "tags"],
          },
        ],
        diagnostics: [],
      },
      candidates: [duneCandidate],
    });

    expect(result.rows).toHaveLength(1);
    expect(
      result.columns.find((column) => column.property === "status"),
    ).toEqual(
      expect.objectContaining({
        property: "status",
        displayName: "Status",
        options: [
          { name: "reading", color: "blue" },
          { name: "done", color: "green", group: "done" },
        ],
      }),
    );
    expect(
      result.columns.find((column) => column.property === "status"),
    ).not.toHaveProperty("semanticType");
    expect(
      result.columns.find((column) => column.property === "tags"),
    ).toMatchObject({
      property: "tags",
      semanticType: "multi_select",
    });
    expect(
      result.columns.find((column) => column.property === "tags"),
    ).not.toHaveProperty("options");
    expect(result.diagnostics).not.toContainEqual(
      expect.objectContaining({ code: "base_declared_type_mismatch" }),
    );
  });

  test("diagnoses note values that violate declared semantic types", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {
          status: {
            displayName: "Status",
            type: "select",
            options: [{ name: "reading", color: "blue" }],
          },
          rating: { displayName: "Rating", type: "number" },
          owned: { displayName: "Owned", type: "checkbox" },
        },
        summaries: {},
        views: [
          {
            type: "table",
            name: "Reading",
            order: ["file.name", "status", "rating", "owned"],
          },
        ],
        diagnostics: [],
      },
      candidates: [
        {
          ...duneCandidate,
          properties: {
            ...duneCandidate.properties,
            status: "archived",
            rating: "five",
            owned: "yes",
          },
        },
      ],
    });

    expect(result.rows[0]?.cells.status).toEqual({
      type: "string",
      value: "archived",
    });
    expect(result.rows[0]?.cells.rating).toEqual({
      type: "string",
      value: "five",
    });
    expect(result.rows[0]?.cells.owned).toEqual({
      type: "string",
      value: "yes",
    });
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "base_declared_type_mismatch",
          message:
            "Books/Dune.md status must match one of the configured select options: archived",
          path: "Books/Dune.md",
          severity: "warning",
        }),
        expect.objectContaining({
          code: "base_declared_type_mismatch",
          message: "Books/Dune.md rating must be a number",
          path: "Books/Dune.md",
          severity: "warning",
        }),
        expect.objectContaining({
          code: "base_declared_type_mismatch",
          message: "Books/Dune.md owned must be a boolean",
          path: "Books/Dune.md",
          severity: "warning",
        }),
      ]),
    );
  });

  test("keeps file name labels and links aligned with the resolved file name", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {},
        summaries: {},
        views: [
          {
            type: "table",
            name: "Reading",
            order: ["file.name"],
          },
        ],
        diagnostics: [],
      },
      candidates: [duneCandidate],
    });

    expect(result.columns[0]?.displayName).toBe("name");
    expect(result.rows[0]?.cells["file.name"]).toEqual({
      type: "link",
      value: "Dune.md",
      display: "Dune.md",
    });
  });

  test("reports formula diagnostics for rows excluded by filters", () => {
    const result = evaluateBase({
      base: {
        filters: { and: ['file.hasTag("book")'] },
        formulas: { ppu: "price / pages" },
        properties: { "formula.ppu": { displayName: "Price/page" } },
        summaries: {},
        views: [
          {
            type: "table",
            name: "Reading",
            filters: { and: ['status != "done"'] },
            order: ["file.name", "formula.ppu"],
          },
        ],
        diagnostics: [],
      },
      candidates: [
        duneCandidate,
        {
          path: "Projects/Alpha.md",
          name: "Alpha.md",
          basename: "Alpha",
          folder: "Projects",
          ext: "md",
          size: 80,
          mtime: 1777766400000,
          ctime: 1777766400000,
          properties: { status: "active", tags: ["project"] },
          tags: ["project"],
          links: [],
          embeds: [],
        },
      ],
    });

    expect(result.rows.map((row) => row.file.path)).toEqual(["Books/Dune.md"]);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "invalid_formula_value",
        path: "Projects/Alpha.md",
      }),
    );
  });

  test("evaluates formulas after later dependencies", () => {
    const result = evaluateBase({
      base: {
        formulas: { a: "formula.b + 1", b: "1" },
        properties: {
          "formula.a": { displayName: "A" },
          "formula.b": { displayName: "B" },
        },
        summaries: {},
        views: [
          {
            type: "table",
            name: "Reading",
            order: ["file.name", "formula.a", "formula.b"],
          },
        ],
        diagnostics: [],
      },
      candidates: [duneCandidate],
    });

    expect(result.rows[0]?.cells["formula.a"]).toEqual({
      type: "number",
      value: 2,
    });
    expect(result.rows[0]?.cells["formula.b"]).toEqual({
      type: "number",
      value: 1,
    });
    expect(result.diagnostics).not.toContainEqual(
      expect.objectContaining({ code: "formula_cycle" }),
    );
  });

  test("ignores formula references inside string literals", () => {
    const result = evaluateBase({
      base: {
        formulas: { a: '"formula.a"' },
        properties: { "formula.a": { displayName: "A" } },
        summaries: {},
        views: [
          {
            type: "table",
            name: "Reading",
            order: ["file.name", "formula.a"],
          },
        ],
        diagnostics: [],
      },
      candidates: [duneCandidate],
    });

    expect(result.rows[0]?.cells["formula.a"]).toEqual({
      type: "string",
      value: "formula.a",
    });
    expect(result.diagnostics).not.toContainEqual(
      expect.objectContaining({ code: "formula_cycle" }),
    );
  });

  test("sets direct cyclic formula cells to null", () => {
    const result = evaluateBase({
      base: {
        formulas: { ppu: "formula.ppu + 1" },
        properties: { "formula.ppu": { displayName: "Price/page" } },
        summaries: {},
        views: [
          {
            type: "table",
            name: "Reading",
            order: ["file.name", "formula.ppu"],
          },
        ],
        diagnostics: [],
      },
      candidates: [duneCandidate],
    });

    expect(result.rows[0]?.cells["formula.ppu"]).toEqual({
      type: "null",
      value: null,
    });
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "formula_cycle" }),
    );
  });

  test("sets indirect cyclic formula cells to null", () => {
    const result = evaluateBase({
      base: {
        formulas: { a: "formula.b + 1", b: "formula.a + 1" },
        properties: {
          "formula.a": { displayName: "A" },
          "formula.b": { displayName: "B" },
        },
        summaries: {},
        views: [
          {
            type: "table",
            name: "Reading",
            order: ["file.name", "formula.a", "formula.b"],
          },
        ],
        diagnostics: [],
      },
      candidates: [duneCandidate],
    });

    expect(result.rows[0]?.cells["formula.a"]).toEqual({
      type: "null",
      value: null,
    });
    expect(result.rows[0]?.cells["formula.b"]).toEqual({
      type: "null",
      value: null,
    });
    expect(
      result.diagnostics.filter(
        (diagnostic) => diagnostic.code === "formula_cycle",
      ),
    ).toHaveLength(2);
  });

  test("turns non-finite formula numbers into null cells", () => {
    const result = evaluateBase({
      base: {
        formulas: { ratio: "price / 0" },
        properties: { "formula.ratio": { displayName: "Ratio" } },
        summaries: {},
        views: [
          {
            type: "table",
            name: "Reading",
            order: ["file.name", "formula.ratio"],
          },
        ],
        diagnostics: [],
      },
      candidates: [duneCandidate],
    });

    expect(result.rows[0]?.cells["formula.ratio"]).toEqual({
      type: "null",
      value: null,
    });
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "invalid_formula_value" }),
    );
  });

  test("diagnoses later unsupported OR filters after a matching branch", () => {
    const result = evaluateBase({
      base: {
        filters: { or: ['status == "reading"', 'unknown("bad")'] },
        formulas: {},
        properties: {},
        summaries: {},
        views: [
          {
            type: "table",
            name: "Reading",
            order: ["file.name"],
          },
        ],
        diagnostics: [],
      },
      candidates: [duneCandidate],
    });

    expect(result.rows).toHaveLength(1);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "unsupported_expression" }),
    );
  });

  test("diagnoses later unsupported AND filters after a failing branch", () => {
    const result = evaluateBase({
      base: {
        filters: { and: ['status == "done"', 'unknown("bad")'] },
        formulas: {},
        properties: {},
        summaries: {},
        views: [
          {
            type: "table",
            name: "Reading",
            order: ["file.name"],
          },
        ],
        diagnostics: [],
      },
      candidates: [duneCandidate],
    });

    expect(result.rows).toHaveLength(0);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "unsupported_expression" }),
    );
  });

  test("diagnoses all unsupported NOT filter children before combining", () => {
    const result = evaluateBase({
      base: {
        filters: { not: ['status == "reading"', 'unknown("bad")'] },
        formulas: {},
        properties: {},
        summaries: {},
        views: [
          {
            type: "table",
            name: "Reading",
            order: ["file.name"],
          },
        ],
        diagnostics: [],
      },
      candidates: [duneCandidate],
    });

    expect(result.rows).toHaveLength(0);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "unsupported_expression" }),
    );
  });

  test("diagnoses view filter failures when composed with global filters", () => {
    const result = evaluateBase({
      base: {
        filters: { and: ['file.hasTag("book")'] },
        formulas: {},
        properties: {},
        summaries: {},
        views: [
          {
            type: "table",
            name: "Reading",
            filters: { and: ['unknown("book")'] },
            order: ["file.name"],
          },
        ],
        diagnostics: [],
      },
      candidates: [duneCandidate],
    });

    expect(result.rows).toHaveLength(0);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "unsupported_expression" }),
    );
  });

  test("diagnoses view filter failures when global filter excludes a row", () => {
    const result = evaluateBase({
      base: {
        filters: { and: ['status == "done"'] },
        formulas: {},
        properties: {},
        summaries: {},
        views: [
          {
            type: "table",
            name: "Reading",
            filters: { and: ['unknown("bad")'] },
            order: ["file.name"],
          },
        ],
        diagnostics: [],
      },
      candidates: [duneCandidate],
    });

    expect(result.rows).toHaveLength(0);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "unsupported_expression" }),
    );
  });

  test("propagates cyclic formula dependency failures", () => {
    const result = evaluateBase({
      base: {
        formulas: { a: "formula.b + 1", b: "formula.b + 1" },
        properties: {
          "formula.a": { displayName: "A" },
          "formula.b": { displayName: "B" },
        },
        summaries: {},
        views: [
          {
            type: "table",
            name: "Reading",
            order: ["file.name", "formula.a", "formula.b"],
          },
        ],
        diagnostics: [],
      },
      candidates: [duneCandidate],
    });

    expect(result.rows[0]?.cells["formula.a"]).toEqual({
      type: "null",
      value: null,
    });
    expect(result.rows[0]?.cells["formula.b"]).toEqual({
      type: "null",
      value: null,
    });
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "formula_cycle" }),
    );
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "formula_dependency_error" }),
    );
  });

  test("propagates unsupported formula dependency failures", () => {
    const result = evaluateBase({
      base: {
        formulas: { a: "formula.b + 1", b: 'unknown("x")' },
        properties: {
          "formula.a": { displayName: "A" },
          "formula.b": { displayName: "B" },
        },
        summaries: {},
        views: [
          {
            type: "table",
            name: "Reading",
            order: ["file.name", "formula.a", "formula.b"],
          },
        ],
        diagnostics: [],
      },
      candidates: [duneCandidate],
    });

    expect(result.rows[0]?.cells["formula.a"]).toEqual({
      type: "null",
      value: null,
    });
    expect(result.rows[0]?.cells["formula.b"]).toEqual({
      type: "null",
      value: null,
    });
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "unsupported_expression" }),
    );
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "formula_dependency_error" }),
    );
  });

  test("sanitizes non-finite numbers inside list cells", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {},
        summaries: {},
        views: [
          {
            type: "table",
            name: "Reading",
            order: ["file.name", "ratings"],
          },
        ],
        diagnostics: [],
      },
      candidates: [
        {
          ...duneCandidate,
          properties: {
            ...duneCandidate.properties,
            ratings: [1, Infinity, NaN],
          },
        },
      ],
    });

    expect(result.rows[0]?.cells.ratings).toEqual({
      type: "list",
      value: [1, null, null],
    });
  });

  test("sorts rows with persisted view sort before applying limit", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {},
        summaries: {},
        views: [
          {
            type: "table",
            name: "Reading",
            order: ["file.name", "status", "price"],
            sort: [{ property: "price", direction: "ASC" }],
            limit: 1,
          },
        ],
        diagnostics: [],
      },
      candidates,
    });

    expect(result.rows.map((row) => row.file.path)).toEqual(["Books/Done.md"]);
  });

  test("groups final rows by persisted group property", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {},
        summaries: {},
        views: [
          {
            type: "table",
            name: "Reading",
            order: ["file.name", "status"],
            groupBy: { property: "status", direction: "DESC" },
          },
        ],
        diagnostics: [],
      },
      candidates,
    });

    expect(result.rows.map((row) => row.file.path)).toEqual([
      "Books/Dune.md",
      "Books/Done.md",
    ]);
    expect(result.groups).toEqual([
      { key: "reading", value: "reading", rowIndexes: [0] },
      { key: "done", value: "done", rowIndexes: [1] },
    ]);
  });

  test("does not group rows when a malformed groupBy reaches evaluation", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {},
        summaries: {},
        views: [
          {
            type: "board",
            name: "Board",
            groupBy: { property: ["status"] } as unknown as {
              readonly property: string;
            },
            order: ["file.name"],
          },
        ],
        diagnostics: [],
      },
      candidates,
    });

    expect(result.rows).toHaveLength(2);
    expect(result.selectedView).toEqual({ name: "Board", type: "board" });
    expect(result.groups).toBeUndefined();
  });

  test("includes board group columns even when the view order omits them", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {
          status: {
            displayName: "Status",
            type: "select",
            options: [
              { name: "queued", color: "gray" },
              { name: "reading", color: "blue" },
              { name: "done", color: "green" },
            ],
          },
        },
        summaries: {},
        views: [
          {
            type: "board",
            name: "Board",
            groupBy: { property: "status" },
            order: ["file.name"],
          },
        ],
        diagnostics: [],
      },
      candidates,
    });

    expect(result.columns.map((column) => column.property)).toEqual([
      "file.name",
      "status",
    ]);
    expect(
      result.columns.find((column) => column.property === "status"),
    ).toMatchObject({
      options: [
        { name: "queued", color: "gray" },
        { name: "reading", color: "blue" },
        { name: "done", color: "green" },
      ],
    });
  });

  test("splits list group values into separate board lanes", () => {
    const doneCandidate = candidates.at(1);
    if (!doneCandidate) throw new Error("Expected done candidate fixture");

    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {
          tags: {
            displayName: "Tags",
            type: "multi_select",
            options: [
              { name: "book", color: "purple" },
              { name: "classic", color: "pink" },
            ],
          },
        },
        summaries: {},
        views: [
          {
            type: "board",
            name: "Board",
            groupBy: { property: "tags" },
            order: ["file.name"],
          },
        ],
        diagnostics: [],
      },
      candidates: [
        {
          ...duneCandidate,
          properties: {
            ...duneCandidate.properties,
            tags: ["book", "classic"],
          },
        },
        doneCandidate,
      ],
    });

    expect(result.groups).toEqual([
      { key: "book", value: "book", rowIndexes: [0, 1] },
      { key: "classic", value: "classic", rowIndexes: [0] },
    ]);
  });

  test("evaluates board gallery and list views as supported views", () => {
    const base = {
      formulas: {},
      properties: {
        status: {
          displayName: "Status",
          type: "select",
          options: [
            { name: "reading", color: "blue" },
            { name: "done", color: "green" },
          ],
        },
      },
      summaries: {},
      views: [
        { type: "table", name: "Table", order: ["file.name", "status"] },
        {
          type: "board",
          name: "Board",
          groupBy: { property: "status" },
          order: ["file.name", "status"],
        },
        { type: "gallery", name: "Gallery", order: ["file.name", "status"] },
        { type: "list", name: "List", order: ["file.name", "status"] },
      ],
      diagnostics: [],
    };

    const board = evaluateBase({ base, candidates, view: "Board" });
    const gallery = evaluateBase({ base, candidates, view: "Gallery" });
    const list = evaluateBase({ base, candidates, view: "List" });

    expect(board.selectedView).toMatchObject({
      type: "board",
      name: "Board",
      groupBy: { property: "status" },
    });
    expect(board.groups).toEqual([
      { key: "done", value: "done", rowIndexes: [1] },
      { key: "reading", value: "reading", rowIndexes: [0] },
    ]);
    expect(gallery.selectedView).toMatchObject({
      type: "gallery",
      name: "Gallery",
    });
    expect(gallery.rows).toHaveLength(2);
    expect(list.selectedView).toMatchObject({ type: "list", name: "List" });
    expect(list.rows).toHaveLength(2);
    expect(board.availableViews).toEqual([
      { type: "table", name: "Table" },
      { type: "board", name: "Board" },
      { type: "gallery", name: "Gallery" },
      { type: "list", name: "List" },
    ]);
  });

  test("evaluates rows for view types without a layout", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {},
        summaries: {},
        views: [{ type: "cards", name: "Cards" }],
        diagnostics: [],
      },
      candidates,
    });

    expect(result.selectedView).toEqual({ name: "Cards", type: "cards" });
    expect(result.rows).toHaveLength(2);
    expect(result.diagnostics).toEqual([]);
  });

  test("attaches column width and wrap from the selected view", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {},
        summaries: {},
        diagnostics: [],
        views: [
          {
            type: "table",
            name: "Table",
            order: ["file.name", "note.age"],
            columnSize: { "file.name": 240 },
            wrapText: ["file.name"],
          },
        ],
      },
      candidates,
    });

    const nameColumn = result.columns.find((c) => c.property === "file.name");
    const ageColumn = result.columns.find((c) => c.property === "note.age");
    expect(nameColumn?.width).toBe(240);
    expect(nameColumn?.wrap).toBe(true);
    expect(ageColumn?.width).toBeUndefined();
    expect(ageColumn?.wrap).toBe(false);
  });
});

describe("readSemanticType (legacy alias)", () => {
  test("created_time aliases to created_at", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {
          created: { type: "created_time", displayName: "Created" },
        },
        summaries: {},
        views: [{ type: "table", name: "Table", order: ["created"] }],
        diagnostics: [],
      },
      candidates: [duneCandidate],
    });

    const col = result.columns.find((c) => c.property === "created");
    expect(col?.semanticType).toBe("created_at");
  });

  test("last_edited aliases to updated_at", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {
          updated: { type: "last_edited", displayName: "Updated" },
        },
        summaries: {},
        views: [{ type: "table", name: "Table", order: ["updated"] }],
        diagnostics: [],
      },
      candidates: [duneCandidate],
    });

    const col = result.columns.find((c) => c.property === "updated");
    expect(col?.semanticType).toBe("updated_at");
  });

  test("canonical names still work after rename", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {
          created: {
            type: "created_at",
            displayName: "Created",
          },
        },
        summaries: {},
        views: [{ type: "table", name: "Table", order: ["created"] }],
        diagnostics: [],
      },
      candidates: [duneCandidate],
    });

    const col = result.columns.find((c) => c.property === "created");
    expect(col?.semanticType).toBe("created_at");
  });
});

describe("readSemanticType (Obsidian type-string aliases)", () => {
  test("tags YAML alias maps to multi_select", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {
          tags: { type: "tags", displayName: "Tags" },
        },
        summaries: {},
        views: [{ type: "table", name: "Table", order: ["tags"] }],
        diagnostics: [],
      },
      candidates: [duneCandidate],
    });

    const col = result.columns.find((c) => c.property === "tags");
    expect(col?.semanticType).toBe("multi_select");
  });

  test("legacy created_time alias still maps to created_at", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {
          created: { type: "created_time", displayName: "Created" },
        },
        summaries: {},
        views: [{ type: "table", name: "Table", order: ["created"] }],
        diagnostics: [],
      },
      candidates: [duneCandidate],
    });

    const col = result.columns.find((c) => c.property === "created");
    expect(col?.semanticType).toBe("created_at");
  });
});

describe("buildColumns property-name defaults", () => {
  test("file.name resolves to title even without an explicit type", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {},
        summaries: {},
        diagnostics: [],
        views: [{ type: "table", name: "T", order: ["file.name"] }],
      },
      candidates: [duneCandidate],
    });
    const col = result.columns.find((c) => c.property === "file.name");
    expect(col?.semanticType).toBe("title");
  });

  test("file.tags resolves to multi_select even without an explicit type", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {},
        summaries: {},
        diagnostics: [],
        views: [{ type: "table", name: "T", order: ["file.tags"] }],
      },
      candidates: [duneCandidate],
    });
    const col = result.columns.find((c) => c.property === "file.tags");
    expect(col?.semanticType).toBe("multi_select");
  });

  test("file.ctime resolves to created_at even without an explicit type", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {},
        summaries: {},
        diagnostics: [],
        views: [{ type: "table", name: "T", order: ["file.ctime"] }],
      },
      candidates: [duneCandidate],
    });
    const col = result.columns.find((c) => c.property === "file.ctime");
    expect(col?.semanticType).toBe("created_at");
  });

  test("file.mtime resolves to updated_at even without an explicit type", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {},
        summaries: {},
        diagnostics: [],
        views: [{ type: "table", name: "T", order: ["file.mtime"] }],
      },
      candidates: [duneCandidate],
    });
    const col = result.columns.find((c) => c.property === "file.mtime");
    expect(col?.semanticType).toBe("updated_at");
  });

  test("convention property 'created_at' resolves to created_at", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {},
        summaries: {},
        diagnostics: [],
        views: [{ type: "table", name: "T", order: ["created_at"] }],
      },
      candidates: [duneCandidate],
    });
    const col = result.columns.find((c) => c.property === "created_at");
    expect(col?.semanticType).toBe("created_at");
  });

  test("file.name is always resolved to title (file.* override beats YAML type: text)", () => {
    // The user's daily-notes.base has `type: text` for file.name (the
    // Obsidian default for an unclassified property). The property-name
    // override is an *override*, not a fallback, for file.* properties —
    // the semantic meaning of `file.name` is fixed by Obsidian's file
    // metadata, not by the user's YAML.
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {
          "file.name": { type: "text" },
        },
        summaries: {},
        diagnostics: [],
        views: [{ type: "table", name: "T", order: ["file.name"] }],
      },
      candidates: [duneCandidate],
    });
    const col = result.columns.find((c) => c.property === "file.name");
    expect(col?.semanticType).toBe("title");
  });

  test("file.tags is always resolved to multi_select (file.* override beats YAML type: select)", () => {
    // Symmetric to the file.name override test: file.* properties override
    // the YAML type: because their semantic meaning is fixed by Obsidian's
    // file metadata, not by the user's YAML.
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {
          "file.tags": { type: "select" },
        },
        summaries: {},
        diagnostics: [],
        views: [{ type: "table", name: "T", order: ["file.tags"] }],
      },
      candidates: [duneCandidate],
    });
    const col = result.columns.find((c) => c.property === "file.tags");
    expect(col?.semanticType).toBe("multi_select");
  });

  test("convention property 'updated_at' resolves to updated_at", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {},
        summaries: {},
        diagnostics: [],
        views: [{ type: "table", name: "T", order: ["updated_at"] }],
      },
      candidates: [duneCandidate],
    });
    const col = result.columns.find((c) => c.property === "updated_at");
    expect(col?.semanticType).toBe("updated_at");
  });

  test("arbitrary note property without explicit type has no semanticType", () => {
    // A property not in PROPERTY_SEMANTIC_TYPE_DEFAULTS and not file.* —
    // should resolve to undefined (no fuzzy matching).
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {},
        summaries: {},
        diagnostics: [],
        views: [{ type: "table", name: "T", order: ["priority"] }],
      },
      candidates: [duneCandidate],
    });
    const col = result.columns.find((c) => c.property === "priority");
    expect(col?.semanticType).toBeUndefined();
  });
});

describe("daily-notes.base end-to-end resolution", () => {
  // A typical daily-note row: frontmatter tags as a list.
  const dailyNoteCandidate = {
    path: "2-wiki/7-daily/x.md",
    name: "x.md",
    basename: "x",
    folder: "2-wiki/7-daily",
    ext: "md",
    size: 0,
    mtime: 1781481600000,
    ctime: 1781481600000,
    properties: { tags: ["a", "b"] },
    tags: ["a", "b"],
    links: [],
    embeds: [],
  };

  function evaluateDailyNotes() {
    return evaluateBase({
      base: {
        formulas: {},
        properties: {
          "file.name": { type: "text", displayName: "Title" },
          tags: { type: "tags", displayName: "Tags" },
          plan: { type: "text", displayName: "Plan" },
          retrospective: { type: "text", displayName: "Retrospective" },
          created_at: { displayName: "Created" },
          updated_at: { displayName: "Updated" },
        },
        summaries: {},
        diagnostics: [],
        views: [
          {
            type: "table",
            name: "All Notes",
            order: [
              "file.name",
              "tags",
              "plan",
              "retrospective",
              "created_at",
              "updated_at",
            ],
          },
        ],
      },
      candidates: [dailyNoteCandidate],
    });
  }

  test("file.name resolves to title", () => {
    const result = evaluateDailyNotes();
    const col = result.columns.find((c) => c.property === "file.name");
    expect(col?.semanticType).toBe("title");
  });

  test("tags resolves to multi_select", () => {
    const result = evaluateDailyNotes();
    const col = result.columns.find((c) => c.property === "tags");
    expect(col?.semanticType).toBe("multi_select");
  });

  test("plan resolves to text", () => {
    const result = evaluateDailyNotes();
    const col = result.columns.find((c) => c.property === "plan");
    expect(col?.semanticType).toBe("text");
  });

  test("retrospective resolves to text", () => {
    const result = evaluateDailyNotes();
    const col = result.columns.find((c) => c.property === "retrospective");
    expect(col?.semanticType).toBe("text");
  });

  test("created_at resolves to created_at", () => {
    const result = evaluateDailyNotes();
    const col = result.columns.find((c) => c.property === "created_at");
    expect(col?.semanticType).toBe("created_at");
  });

  test("updated_at resolves to updated_at", () => {
    const result = evaluateDailyNotes();
    const col = result.columns.find((c) => c.property === "updated_at");
    expect(col?.semanticType).toBe("updated_at");
  });

  test("created_at cell falls back to file ctime when frontmatter is empty", () => {
    const result = evaluateDailyNotes();
    expect(result.rows[0]?.cells.created_at).toEqual({
      type: "date",
      value: 1781481600000,
    });
  });

  test("updated_at cell falls back to file mtime when frontmatter is empty", () => {
    const result = evaluateDailyNotes();
    expect(result.rows[0]?.cells.updated_at).toEqual({
      type: "date",
      value: 1781481600000,
    });
  });

  test("frontmatter created_at overrides the file ctime fallback", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: { created_at: { displayName: "Created" } },
        summaries: {},
        diagnostics: [],
        views: [{ type: "table", name: "T", order: ["created_at"] }],
      },
      candidates: [
        {
          ...dailyNoteCandidate,
          properties: {
            ...dailyNoteCandidate.properties,
            created_at: "2020-01-01T00:00:00.000Z",
          },
        },
      ],
    });
    expect(result.rows[0]?.cells.created_at).toEqual({
      type: "date",
      value: "2020-01-01T00:00:00.000Z",
    });
  });
});

describe("buildColumns valueType inference", () => {
  const candidateWithRating = {
    path: "Books/Rated.md",
    name: "Rated.md",
    basename: "Rated",
    folder: "Books",
    ext: "md",
    size: 100,
    mtime: 1777593600000,
    ctime: 1777593600000,
    properties: { rating: 5 },
    tags: [],
    links: [],
    embeds: [],
  };

  test("explicit semanticType 'number' sets valueType to 'number'", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {
          rating: { type: "number", displayName: "Rating" },
        },
        summaries: {},
        diagnostics: [],
        views: [{ type: "table", name: "T", order: ["rating"] }],
      },
      candidates: [candidateWithRating],
    });
    const col = result.columns.find((c) => c.property === "rating");
    expect(col?.valueType).toBe("number");
  });

  test("file.name property default sets valueType to 'string'", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {},
        summaries: {},
        diagnostics: [],
        views: [{ type: "table", name: "T", order: ["file.name"] }],
      },
      candidates: [duneCandidate],
    });
    const col = result.columns.find((c) => c.property === "file.name");
    expect(col?.valueType).toBe("string");
  });

  test("file.tags property default sets valueType to 'list'", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {},
        summaries: {},
        diagnostics: [],
        views: [{ type: "table", name: "T", order: ["file.tags"] }],
      },
      candidates: [duneCandidate],
    });
    const col = result.columns.find((c) => c.property === "file.tags");
    expect(col?.valueType).toBe("list");
  });

  test("file.ctime property default sets valueType to 'date'", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {},
        summaries: {},
        diagnostics: [],
        views: [{ type: "table", name: "T", order: ["file.ctime"] }],
      },
      candidates: [duneCandidate],
    });
    const col = result.columns.find((c) => c.property === "file.ctime");
    expect(col?.valueType).toBe("date");
  });

  test("convention 'created_at' property default sets valueType to 'date'", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {},
        summaries: {},
        diagnostics: [],
        views: [{ type: "table", name: "T", order: ["created_at"] }],
      },
      candidates: [duneCandidate],
    });
    const col = result.columns.find((c) => c.property === "created_at");
    expect(col?.valueType).toBe("date");
  });

  test("arbitrary note property samples the first candidate's cell value", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {
          rating: { displayName: "Rating" },
        },
        summaries: {},
        diagnostics: [],
        views: [{ type: "table", name: "T", order: ["rating"] }],
      },
      candidates: [candidateWithRating],
    });
    const col = result.columns.find((c) => c.property === "rating");
    expect(col?.valueType).toBe("number");
  });

  test("no candidate and no defaults leaves valueType as 'unknown'", () => {
    const result = evaluateBase({
      base: {
        formulas: {},
        properties: {
          mystery: { displayName: "Mystery" },
        },
        summaries: {},
        diagnostics: [],
        views: [{ type: "table", name: "T", order: ["mystery"] }],
      },
      candidates: [],
    });
    const col = result.columns.find((c) => c.property === "mystery");
    expect(col?.valueType).toBe("unknown");
  });
});

describe("Obsidian semantics", () => {
  const note = (
    path: string,
    properties: Record<string, unknown>,
    tags: string[] = [],
  ) => {
    const name = path.slice(path.lastIndexOf("/") + 1);
    return {
      path,
      name,
      basename: name.replace(/\.[^.]*$/, ""),
      folder: path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "",
      ext: "md",
      size: 10,
      mtime: 1,
      ctime: 1,
      properties,
      tags,
      links: [],
      embeds: [],
    };
  };
  const notes = [
    note("Projects/2026/a.md", { status: "todo", due: 3 }, ["b"]),
    note("Projects/b.md", { status: "done", due: 1 }, ["a/x"]),
    note("Other/c.md", { status: "todo", due: 2 }, ["c"]),
  ];
  const parsed = (source: string) => {
    const r = parseBase(source);
    if (!r.ok) throw new Error(r.diagnostic.message);
    return r.base;
  };
  const rows = (source: string) =>
    evaluateBase({ base: parsed(source), candidates: notes }).rows.map(
      (r) => r.file.path,
    );

  test("inFolder includes subfolders", () => {
    expect(
      rows(
        "filters: 'file.inFolder(\"Projects\")'\nviews:\n  - type: table\n    name: T\n",
      ),
    ).toEqual(["Projects/2026/a.md", "Projects/b.md"]);
  });

  test("hasTag matches any argument and nested tags", () => {
    expect(
      rows(
        'filters: \'file.hasTag("a", "b")\'\nviews:\n  - type: table\n    name: T\n',
      ),
    ).toEqual(["Projects/2026/a.md", "Projects/b.md"]);
  });

  test("single- and double-quoted strings select the same rows", () => {
    const single = rows(
      "filters: \"status == 'todo'\"\nviews:\n  - type: table\n    name: T\n",
    );
    expect(single).toEqual(["Projects/2026/a.md", "Other/c.md"]);
    expect(
      rows(
        "filters: 'status == \"todo\"'\nviews:\n  - type: table\n    name: T\n",
      ),
    ).toEqual(single);
  });

  test("a formula outside the subset keeps the other columns", () => {
    const result = evaluateBase({
      base: parsed(
        'formulas:\n  late: \'if(due > 2, "late", "")\'\nviews:\n  - type: table\n    name: T\n    order: [file.name, status, formula.late]\n',
      ),
      candidates: notes,
    });
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0]?.cells.status).toEqual({
      type: "string",
      value: "todo",
    });
    expect(result.rows[0]?.cells["formula.late"]).toEqual({
      type: "null",
      value: null,
    });
    expect(result.diagnostics).toEqual([
      expect.objectContaining({ code: "unsupported_expression" }),
    ]);
  });

  test("an unsupported filter hides its rows with a diagnostic", () => {
    const result = evaluateBase({
      base: parsed(
        "filters: \"status.contains('x')\"\nviews:\n  - type: table\n    name: T\n",
      ),
      candidates: notes,
    });
    expect(result.rows).toEqual([]);
    const hiding = result.diagnostics.filter(
      (d) => d.code === "filter_hides_rows",
    );
    expect(hiding).toHaveLength(1);
    expect(hiding[0]?.severity).toBe("warning");
    expect(hiding[0]?.message).toContain("status.contains('x')");
  });

  test("an unsupported filter under not hides its rows as its diagnostic says", () => {
    const result = evaluateBase({
      base: parsed(
        "filters:\n  not:\n    - \"status.contains('x')\"\nviews:\n  - type: table\n    name: T\n",
      ),
      candidates: notes,
    });
    expect(result.rows).toEqual([]);
    const hiding = result.diagnostics.filter(
      (d) => d.code === "filter_hides_rows",
    );
    expect(hiding.map((d) => d.message)).toEqual([
      "filter \"status.contains('x')\" is not supported; rows it guards are hidden",
    ]);
  });

  test("views Obsidian rejects still render with warnings", () => {
    const result = evaluateBase({
      base: parsed(
        "views:\n  - type: table\n    order: [file.name]\n  - type: table\n    name: Grouped\n    groupBy: status\n",
      ),
      candidates: notes,
      view: "Grouped",
    });
    expect(result.rows).toHaveLength(3);
    expect(result.groups?.map((g) => g.key)).toEqual(["done", "todo"]);
    expect(result.diagnostics.map((d) => d.code)).toEqual([
      "view_name_missing",
      "group_by_invalid",
    ]);
  });

  test("a legacy sort column sorts like a sort property", () => {
    const by = (key: string) =>
      rows(
        `views:\n  - type: table\n    name: T\n    sort:\n      - ${key}: due\n        direction: DESC\n`,
      );
    expect(by("column")).toEqual([
      "Projects/2026/a.md",
      "Other/c.md",
      "Projects/b.md",
    ]);
    expect(by("column")).toEqual(by("property"));
  });

  test("the window's overrides change sort, grouping, and view filters only", () => {
    const base = parsed(
      "filters: 'file.ext == \"md\"'\nviews:\n  - type: table\n    name: T\n    filters: 'status == \"todo\"'\n    groupBy:\n      property: status\n      direction: ASC\n",
    );
    const plain = evaluateBase({ base, candidates: notes });
    expect(plain.rows).toHaveLength(2);
    expect(plain.groups).toHaveLength(1);
    const ui = evaluateBase({
      base,
      candidates: notes,
      ui: {
        sort: { property: "due", direction: "ASC" },
        grouped: false,
        filtered: false,
      },
    });
    expect(ui.rows.map((r) => r.file.path)).toEqual([
      "Projects/b.md",
      "Other/c.md",
      "Projects/2026/a.md",
    ]);
    expect(ui.groups).toBeUndefined();
    expect(base.views[0]?.filters).toBe('status == "todo"');
  });

  test("groups keep typed values and groupOrder passes through", () => {
    const result = evaluateBase({
      base: parsed(
        "views:\n  - type: table\n    name: T\n    groupBy:\n      property: due\n      direction: ASC\n    groupOrder: [3, null]\n",
      ),
      candidates: [...notes, note("x.md", {})],
    });
    expect(result.selectedView.groupOrder).toEqual([3, null]);
    expect(result.groups?.map((g) => [g.key, g.value])).toEqual([
      ["", null],
      ["1", 1],
      ["2", 2],
      ["3", 3],
    ]);
  });

  test("a text filter keeps rows with a cell containing it, ignoring case, before the limit", () => {
    const base = parsed(
      "views:\n  - type: table\n    name: T\n    order: [file.name, status]\n    limit: 1\n    sort:\n      - property: due\n        direction: ASC\n",
    );
    const paths = (query: string) =>
      evaluateBase({ base, candidates: notes, ui: { query } }).rows.map(
        (r) => r.file.path,
      );
    expect(paths("")).toEqual(["Projects/b.md"]);
    expect(paths("TODO")).toEqual(["Other/c.md"]);
    expect(paths("a.md")).toEqual(["Projects/2026/a.md"]);
    // A value outside the shown columns does not match.
    expect(paths("3")).toEqual([]);
  });

  test("pins keep rows holding every pinned value and stack across properties", () => {
    const base = parsed("views:\n  - type: table\n    name: T\n");
    const candidates = [
      ...notes,
      note("x.md", { status: "todo", labels: ["red", "blue"] }),
      note("y.md", { labels: ["red"] }),
    ];
    const paths = (pins: { property: string; keys: string[] }[]) =>
      evaluateBase({ base, candidates, ui: { pins } }).rows.map(
        (r) => r.file.path,
      );
    expect(paths([{ property: "status", keys: ["todo"] }])).toEqual([
      "Projects/2026/a.md",
      "Other/c.md",
      "x.md",
    ]);
    expect(paths([{ property: "note.labels", keys: ["red"] }])).toEqual([
      "x.md",
      "y.md",
    ]);
    expect(
      paths([
        { property: "status", keys: ["todo"] },
        { property: "labels", keys: ["red", "blue"] },
      ]),
    ).toEqual(["x.md"]);
    expect(paths([{ property: "status", keys: [""] }])).toEqual(["y.md"]);
    expect(paths([{ property: "due", keys: ["2"] }])).toEqual(["Other/c.md"]);
    expect(paths([{ property: "missing", keys: [""] }])).toHaveLength(5);
    expect(paths([{ property: "missing", keys: ["x"] }])).toEqual([]);
  });

  test("pin keys are a value's group keys, empty for none", () => {
    expect(pinKeys("todo")).toEqual(["todo"]);
    expect(pinKeys(2)).toEqual(["2"]);
    expect(pinKeys(["a", "b"])).toEqual(["a", "b"]);
    expect(pinKeys([])).toEqual([""]);
    expect(pinKeys(null)).toEqual([""]);
  });
});
