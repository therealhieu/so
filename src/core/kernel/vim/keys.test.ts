import { expect, test } from "bun:test";
import { splitKeys } from "./keys";

test("named keys split as one key each, whatever their case", () => {
  expect(splitKeys("a<Left><right><Del><Home><End>")).toEqual([
    "a",
    "<Left>",
    "<Right>",
    "<Del>",
    "<Home>",
    "<End>",
  ]);
  expect(splitKeys("<Up><Down><PageUp><PageDown>")).toEqual([
    "<Up>",
    "<Down>",
    "<PageUp>",
    "<PageDown>",
  ]);
});

test("an unknown name stays as its characters", () => {
  expect(splitKeys("<Foo>")).toEqual(["<", "F", "o", "o", ">"]);
});
