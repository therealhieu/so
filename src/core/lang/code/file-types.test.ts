import { expect, test } from "bun:test";
import { common } from "lowlight";
import { FileTypeRegistry, textFileType } from "../../filetypes/registry";
import { markdownFileType } from "../markdown/file-type";
import { CODE_LANGUAGES, codeFileTypes } from "./file-types";

test("language table covers the bundled grammars", () => {
  const ids: string[] = CODE_LANGUAGES.map((l) => l.id);
  expect(ids).toHaveLength(37);
  expect(new Set(ids).size).toBe(37);
  expect(ids.filter((id) => !(id in common))).toEqual([
    "dockerfile",
    "terraform",
    "hcl",
  ]);
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

test("Terraform files route by their last extension", () => {
  const registry = new FileTypeRegistry(textFileType);
  for (const ft of codeFileTypes) registry.register(ft);
  const id = (path: string) => registry.forPath(path).id;
  expect(id("infra/main.tf")).toBe("terraform");
  expect(id("infra/prod.tfvars")).toBe("terraform");
  expect(id("infra/main.tf.json")).toBe("json");
  expect(id("live/terragrunt.hcl")).toBe("hcl");
  expect(id("infra/.terraform.lock.hcl")).toBe("hcl");
  expect(id("tests/plan.tftest.hcl")).toBe("hcl");
});
