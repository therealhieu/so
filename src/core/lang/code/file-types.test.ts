import { expect, test } from "bun:test";
import { common } from "lowlight";
import { FileTypeRegistry, textFileType } from "../../filetypes/registry";
import { markdownFileType } from "../markdown/file-type";
import { CODE_LANGUAGES, codeFileTypes } from "./file-types";

test("language table covers the bundled grammars", () => {
  const ids: string[] = CODE_LANGUAGES.map((l) => l.id);
  expect(ids).toHaveLength(34);
  expect(new Set(ids).size).toBe(34);
  for (const id of ids) expect(Object.keys(common)).toContain(id);
  for (const id of ["shell", "python-repl", "plaintext"])
    expect(ids).not.toContain(id);
  expect(
    Object.keys(common)
      .filter((id) => !ids.includes(id))
      .sort(),
  ).toEqual(["plaintext", "python-repl", "shell"]);
});

test("every file type registers without a clash", () => {
  const registry = new FileTypeRegistry(textFileType);
  for (const ft of codeFileTypes) registry.register(ft);
  registry.register(markdownFileType);
  const fileTypeIds = [...codeFileTypes, markdownFileType]
    .map((ft) => ft.id)
    .sort();
  expect(fileTypeIds).toEqual(CODE_LANGUAGES.map((l) => l.id).sort());
  for (const ft of codeFileTypes) {
    expect(ft.editor).toBe("text");
    expect(ft.views.map((v) => v.id)).toEqual(["source"]);
    expect(ft.highlighter?.language).toBe(ft.id);
  }
});
