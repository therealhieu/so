import { expect, test } from "bun:test";
import { fileIcon, folderIcon } from "./icons";

test("file types get their own Nerd Font icon and colour", () => {
  expect(fileIcon("notes/plan.md", "nerd")).toEqual({
    glyph: "",
    token: "iconNote",
  });
  expect(fileIcon("tasks.base", "nerd").token).toBe("iconBase");
  expect(fileIcon("photo.PNG", "nerd").token).toBe("iconImage");
  expect(fileIcon("config.yaml", "nerd").token).toBe("iconConfig");
  expect(fileIcon("scripts/sync.ts", "nerd").token).toBe("iconCode");
  expect(fileIcon("keep.log", "nerd").token).toBe("iconText");
});

test("an exact file name wins over the extension", () => {
  expect(fileIcon("Makefile", "nerd")).toEqual({
    glyph: "",
    token: "iconConfig",
  });
  expect(fileIcon(".gitignore", "nerd").glyph).toBe("");
});

test("unknown and dot-only names fall back to the generic file icon", () => {
  expect(fileIcon("data.xyz", "nerd").glyph).toBe("");
  expect(fileIcon(".env", "nerd").glyph).toBe("");
});

test("the unicode set uses symbols every font has", () => {
  expect(fileIcon("plan.md", "unicode").glyph).toBe("◇");
  expect(fileIcon("tasks.base", "unicode").glyph).toBe("▦");
  expect(fileIcon("photo.png", "unicode").glyph).toBe("◩");
  expect(fileIcon("config.yaml", "unicode").glyph).toBe("≡");
  expect(folderIcon(false, "unicode")).toBe("▸");
  expect(folderIcon(true, "unicode")).toBe("▾");
});

test("folders show closed and open Nerd Font folders", () => {
  expect(folderIcon(false, "nerd")).toBe("");
  expect(folderIcon(true, "nerd")).toBe("");
});
