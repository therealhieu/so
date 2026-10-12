import { describe, expect, test } from "bun:test";
import type { FrontmatterValue } from "../../lang/markdown/frontmatter-patch";
import { newNoteSeed, type SeedInput } from "./new-note";
import type { Base, BaseFilter } from "./types";

const base = (filters?: BaseFilter, view?: BaseFilter): Base => ({
  ...(filters === undefined ? {} : { filters }),
  formulas: {},
  properties: {},
  summaries: {},
  views: [
    {
      type: "table",
      name: "T",
      ...(view === undefined ? {} : { filters: view }),
    },
  ],
  diagnostics: [],
});

const seed = (
  filters?: BaseFilter,
  { view, ...o }: Omit<Partial<SeedInput>, "view"> & { view?: BaseFilter } = {},
) => {
  const b = base(filters, view);
  return newNoteSeed({
    base: b,
    view: b.views[0],
    viewFilters: true,
    basePath: "bases/tasks.base",
    types: {},
    ...o,
  });
};

describe("the folder", () => {
  test("is the first inFolder", () => {
    expect(
      seed({ and: ['file.inFolder("notes/")', 'file.inFolder("other")'] })
        .folder,
    ).toBe("notes");
  });

  test("is the base's folder without inFolder", () => {
    expect(seed().folder).toBe("bases");
    expect(
      newNoteSeed({
        base: base(),
        view: undefined,
        viewFilters: true,
        basePath: "tasks.base",
        types: {},
      }).folder,
    ).toBe("");
  });
});

describe("the properties", () => {
  test.each<[string, Record<string, FrontmatterValue>]>([
    ['status == "todo"', { status: "todo" }],
    ["note.status == 'todo'", { status: "todo" }],
    ['"todo" == status', { status: "todo" }],
    ["rating == 3", { rating: 3 }],
    ["done == false", { done: false }],
    ['file.hasTag("reading", "#books")', { tags: ["reading", "books"] }],
    ['file.hasProperty("due")', { due: null }],
    ['done == false && status == "todo"', { done: false, status: "todo" }],
  ])("%p seeds %p", (filter, expected) => {
    expect(seed(filter).properties).toEqual(expected);
  });

  test.each([
    'status != "done"',
    "rating > 3",
    "formula.late == true",
    'file.name == "x"',
    'status == "a" || status == "b"',
    "done",
  ])("%p seeds nothing", (filter) => {
    expect(seed(filter).properties).toEqual({});
  });

  test("or and not seed nothing; and lists nest", () => {
    expect(
      seed({
        and: [
          { or: ['status == "a"'] },
          { not: ['status == "b"'] },
          { and: ['kind == "book"'] },
        ],
      }).properties,
    ).toEqual({ kind: "book" });
  });

  test("view filters count unless the window turned them off", () => {
    expect(seed(undefined, { view: 'status == "todo"' }).properties).toEqual({
      status: "todo",
    });
    expect(
      seed(undefined, { view: 'status == "todo"', viewFilters: false })
        .properties,
    ).toEqual({});
  });

  test("pins seed their values, typed by the property's type", () => {
    expect(
      seed(undefined, {
        pins: [
          { property: "note.status", keys: ["doing"] },
          { property: "rating", keys: ["4"] },
          { property: "tags", keys: ["a", "b"] },
          { property: "file.folder", keys: ["x"] },
          { property: "empty", keys: [""] },
        ],
        types: { rating: "number" },
      }).properties,
    ).toEqual({ status: "doing", rating: 4, tags: ["a", "b"] });
  });

  test("the focused group seeds its key, but not the None group", () => {
    expect(
      seed('status == "todo"', { group: { property: "status", key: "doing" } })
        .properties,
    ).toEqual({ status: "doing" });
    expect(
      seed(undefined, { group: { property: "status", key: null } }).properties,
    ).toEqual({});
    expect(
      seed(undefined, { group: { property: "formula.late", key: true } })
        .properties,
    ).toEqual({});
  });

  test("hasTag adds to tags another filter set", () => {
    expect(
      seed({ and: ['tags == "a"', 'file.hasTag("b")'] }).properties,
    ).toEqual({ tags: ["a", "b"] });
  });
});

describe("the view's columns", () => {
  const withColumns = (
    order: string[],
    properties: Base["properties"] = {},
  ) => {
    const b: Base = {
      ...base('status == "todo"'),
      properties,
      views: [{ type: "table", name: "T", order }],
    };
    return newNoteSeed({
      base: b,
      view: b.views[0],
      viewFilters: true,
      basePath: "daily/0-daily.base",
      types: { cssclasses: "list" },
    });
  };

  test("start empty, lists as [], after what the filters seed", () => {
    const s = withColumns([
      "file.name",
      "tags",
      "note.plan",
      "status",
      "cssclasses",
      "formula.late",
    ]);
    expect(s.properties).toEqual({
      status: "todo",
      tags: [],
      plan: null,
      cssclasses: [],
    });
    expect(Object.keys(s.properties)).toEqual([
      "status",
      "tags",
      "plan",
      "cssclasses",
    ]);
    expect(s.stamp).toEqual([]);
  });

  test("created_at, by name or by base type, takes the creation time; updated_at is left to the file's", () => {
    const s = withColumns(
      ["created_at", "updated_at", "made", "edited", "status"],
      { made: { type: "created_time" }, edited: { type: "last_edited" } },
    );
    expect(s.properties).toEqual({
      status: "todo",
      created_at: null,
      made: null,
    });
    expect(s.stamp).toEqual(["created_at", "made"]);
  });
});
