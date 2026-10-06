import { expect, test } from "bun:test";
import { bodyRows, statusRow } from "./layout";

test("the statusline is the last row and the body sits between it and the bufferline", () => {
  expect(statusRow({ rows: 24 })).toBe(23);
  expect(bodyRows({ rows: 24 })).toBe(22);
});

test("a terminal too short for the chrome has no body", () => {
  expect(statusRow({ rows: 1 })).toBe(0);
  expect(bodyRows({ rows: 1 })).toBe(0);
  expect(bodyRows({ rows: 0 })).toBe(0);
});
