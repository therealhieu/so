import { expect, test } from "bun:test";
import { codeFileTypes } from "../lang/code/file-types";
import { markdownFileType } from "../lang/markdown/file-type";
import { EditorKindRegistry, FileTypeRegistry, textFileType } from "./registry";

function startupRegistry() {
  const registry = new FileTypeRegistry(textFileType);
  for (const ft of codeFileTypes) registry.register(ft);
  registry.register(markdownFileType);
  return registry;
}

test("forPath matches extension, then file name, then falls back to text", () => {
  const registry = startupRegistry();
  const id = (path: string) => registry.forPath(path).id;
  expect(id("scripts/sync.ts")).toBe("typescript");
  expect(id("config.yaml")).toBe("yaml");
  expect(id("notes.txt")).toBe("text");
  expect(id("Makefile")).toBe("makefile");
  expect(id("a.md")).toBe("markdown");
  expect(registry.forPath("a.md").views.map((v) => v.id)).toEqual([
    "reading",
    "live",
    "source",
  ]);
  expect(id("run.sh")).toBe("bash");
  expect(id("pyproject.toml")).toBe("ini");
  expect(id("Dockerfile")).toBe("dockerfile");
  expect(id("Containerfile")).toBe("dockerfile");
  expect(id("app.dockerfile")).toBe("dockerfile");
  expect(id("Dockerfile.dev")).toBe("text");
});

test("forPath ignores extension case and directories", () => {
  const registry = startupRegistry();
  expect(registry.forPath("src/App.TSX").id).toBe("typescript");
  expect(registry.forPath("build.d/Makefile").id).toBe("makefile");
  expect(registry.forPath(".bashrc").id).toBe("text");
});

test("duplicate id, extension, or file name throws", () => {
  const registry = startupRegistry();
  const base = { editor: "text", views: [{ id: "source", decorations: [] }] };
  expect(() => registry.register({ ...base, id: "yaml", match: {} })).toThrow();
  expect(() =>
    registry.register({ ...base, id: "other", match: { extensions: [".ts"] } }),
  ).toThrow();
  expect(() =>
    registry.register({ ...base, id: "other", match: { names: ["Makefile"] } }),
  ).toThrow();
  expect(registry.get("text")).toBe(textFileType);
  expect(registry.get("missing")).toBeUndefined();
});

test("editor kinds register once", () => {
  const kinds = new EditorKindRegistry();
  const spec = {
    id: "base",
    open: (_path: string, text: string) => text.length,
  };
  kinds.register(spec);
  expect(kinds.get("base")).toBe(spec);
  expect(() => kinds.register(spec)).toThrow();
});
