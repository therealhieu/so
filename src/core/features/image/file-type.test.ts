import { expect, test } from "bun:test";
import { FileTypeRegistry, textFileType } from "../../filetypes/registry";
import { codeFileTypes } from "../../lang/code/file-types";
import { imageFileType, svgFileType } from "./file-type";

test("pictures open as read-only binary images; SVG opens drawn with an XML source", () => {
  const registry = new FileTypeRegistry(textFileType);
  for (const ft of codeFileTypes) registry.register(ft);
  registry.register(imageFileType);
  registry.register(svgFileType);
  const of = (path: string) => registry.forPath(path);
  for (const path of ["a.png", "b.JPG", "c.jpeg", "d.webp", "e.gif"])
    expect(of(path)).toMatchObject({
      id: "image",
      editor: "image",
      readOnly: true,
      binary: true,
    });
  expect(of("icon.svg")).toMatchObject({ id: "svg", editor: "image" });
  expect(of("icon.svg").binary).toBeUndefined();
  expect(svgFileType.highlighter?.language).toBe("xml");
  expect(of("feed.xml").id).toBe("xml");
});
