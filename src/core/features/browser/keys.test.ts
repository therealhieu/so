import { expect, test } from "bun:test";
import { pageKey, type RawKey, rawKeyOf } from "./keys";

const raw = (name: string, o: Partial<RawKey> = {}): RawKey => ({
  name,
  ctrl: false,
  alt: false,
  shift: false,
  meta: false,
  ...o,
});

test("a printable key types its text with its US-layout code", () => {
  expect(pageKey(raw("a", { text: "a" }))).toEqual({
    key: "a",
    code: "KeyA",
    keyCode: 65,
    text: "a",
    modifiers: 0,
  });
  expect(pageKey(raw("a", { text: "A", shift: true }))).toEqual({
    key: "A",
    code: "KeyA",
    keyCode: 65,
    text: "A",
    modifiers: 8,
  });
  expect(pageKey(raw("1", { text: "!", shift: true }))?.code).toBe("Digit1");
  expect(pageKey(raw("/", { text: "?", shift: true }))?.keyCode).toBe(191);
  expect(pageKey(raw("é", { text: "é" }))).toMatchObject({
    key: "é",
    text: "é",
    keyCode: 0,
  });
});

test("Enter and Space type, other named keys only press", () => {
  expect(pageKey(raw("return"))).toMatchObject({
    key: "Enter",
    keyCode: 13,
    text: "\r",
  });
  expect(pageKey(raw("space"))).toMatchObject({ key: " ", text: " " });
  expect(pageKey(raw("tab", { shift: true }))).toEqual({
    key: "Tab",
    code: "Tab",
    keyCode: 9,
    modifiers: 8,
  });
  expect(pageKey(raw("f5"))).toEqual({
    key: "F5",
    code: "F5",
    keyCode: 116,
    modifiers: 0,
  });
});

test("Ctrl and Meta keys carry modifiers and type nothing", () => {
  expect(pageKey(raw("l", { ctrl: true }))).toEqual({
    key: "l",
    code: "KeyL",
    keyCode: 76,
    modifiers: 2,
  });
  expect(pageKey(raw("return", { meta: true }))?.text).toBeUndefined();
  expect(pageKey(raw("left", { alt: true, shift: true }))?.modifiers).toBe(9);
});

test("keys a page cannot get have no page key", () => {
  expect(pageKey(raw("unknownkey"))).toBeUndefined();
});

test("Vim notation maps back to raw keys for keys without a terminal report", () => {
  expect(rawKeyOf("<CR>")).toEqual(raw("return"));
  expect(rawKeyOf("<C-w>")).toEqual(raw("w", { ctrl: true }));
  expect(rawKeyOf("G")).toEqual(raw("g", { text: "G", shift: true }));
  expect(rawKeyOf(" ")).toEqual(raw("space", { text: " " }));
  expect(rawKeyOf("<Nope>")).toBeUndefined();
});
