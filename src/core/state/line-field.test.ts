import { expect, test } from "bun:test";
import { editField, promptField } from "./line-field";

const at = (value: string, caret: number) => ({ value, caret });

test("a printable key goes in at the caret", () => {
  expect(editField(at("ac", 1), "b")).toEqual(at("abc", 2));
  expect(editField(at("", 0), "x")).toEqual(at("x", 1));
});

test("Backspace and Delete remove the character before or after the caret", () => {
  expect(editField(at("abc", 2), "<BS>")).toEqual(at("ac", 1));
  expect(editField(at("abc", 0), "<BS>")).toEqual(at("abc", 0));
  expect(editField(at("abc", 1), "<Del>")).toEqual(at("ac", 1));
  expect(editField(at("abc", 3), "<Del>")).toEqual(at("abc", 3));
});

test("arrows move one character and stop at the ends; Home and End jump", () => {
  expect(editField(at("abc", 1), "<Left>")).toEqual(at("abc", 0));
  expect(editField(at("abc", 0), "<Left>")).toEqual(at("abc", 0));
  expect(editField(at("abc", 2), "<Right>")).toEqual(at("abc", 3));
  expect(editField(at("abc", 3), "<Right>")).toEqual(at("abc", 3));
  expect(editField(at("abc", 2), "<Home>")).toEqual(at("abc", 0));
  expect(editField(at("abc", 0), "<End>")).toEqual(at("abc", 3));
});

test("a character outside the basic plane moves and deletes as one", () => {
  const v = "a😀b";
  expect(editField(at(v, 1), "<Right>")).toEqual(at(v, 3));
  expect(editField(at(v, 3), "<Left>")).toEqual(at(v, 1));
  expect(editField(at(v, 3), "<BS>")).toEqual(at("ab", 1));
});

test("other keys are not edits", () => {
  expect(editField(at("abc", 1), "<Up>")).toBeUndefined();
  expect(editField(at("abc", 1), "<C-a>")).toBeUndefined();
});

test("a prompt without a caret has it at the end of its value", () => {
  expect(promptField({ value: "name.md" })).toEqual(at("name.md", 7));
  expect(promptField({ value: "ab", caret: 9 })).toEqual(at("ab", 2));
});
