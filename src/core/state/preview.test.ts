import { expect, test } from "bun:test";
import { previewUrl } from "./preview";

test("the preview address is on the loopback host and encodes each path segment", () => {
  expect(previewUrl(8731)).toBe("http://127.0.0.1:8731/");
  expect(previewUrl(8731, "notes/my plan#1.md")).toBe(
    "http://127.0.0.1:8731/notes/my%20plan%231.md",
  );
});
