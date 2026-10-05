import { expect, test } from "bun:test";
import { parsePropertyTypes, propertyType, validates } from "./property-types";

test("an assigned type applies only when the value validates", () => {
  expect(propertyType("Status", "x", { status: "number" })).toBe("text");
  expect(propertyType("Status", 3, { status: "number" })).toBe("number");
  expect(propertyType("due", null, { due: "date" })).toBe("date");
  expect(propertyType("due", "soon", { due: "date" })).toBe("text");
});

test("without an assignment the type is inferred from the value", () => {
  const types = {};
  expect(propertyType("due", "2026-10-05", types)).toBe("date");
  expect(propertyType("at", "2026-10-05T09:30", types)).toBe("datetime");
  expect(propertyType("at", "2026-10-05T09:30:00", types)).toBe("text");
  expect(propertyType("n", 4, types)).toBe("number");
  expect(propertyType("done", false, types)).toBe("checkbox");
  expect(propertyType("people", ["a", "b"], types)).toBe("list");
  expect(propertyType("title", "hello", types)).toBe("text");
  expect(propertyType("empty", null, types)).toBe("text");
  expect(propertyType("tags", ["a"], types)).toBe("tags");
  expect(propertyType("aliases", ["A"], types)).toBe("aliases");
});

test("values validate against their type", () => {
  expect(validates("number", 3)).toBe(true);
  expect(validates("number", "3")).toBe(false);
  expect(validates("checkbox", true)).toBe(true);
  expect(validates("date", "2026-13-40")).toBe(false);
  expect(validates("datetime", "2026-10-05T09:30:15")).toBe(true);
  expect(validates("list", ["a"])).toBe(true);
  expect(validates("text", "a")).toBe(true);
  expect(validates("text", 1)).toBe(false);
});

test("types.json assignments are read by lower-cased name", () => {
  expect(
    parsePropertyTypes({
      types: {
        Status: "number",
        due: "date",
        people: "multitext",
        bad: "colour",
        n: 3,
      },
    }),
  ).toEqual({ status: "number", due: "date", people: "list" });
});

test("malformed types.json shapes give no assignments", () => {
  for (const json of [null, 3, "x", [], { types: [] }, { types: "x" }, {}])
    expect(parsePropertyTypes(json)).toEqual({});
});
