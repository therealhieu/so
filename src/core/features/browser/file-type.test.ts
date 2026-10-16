import { expect, test } from "bun:test";
import { FileTypeRegistry, textFileType } from "../../filetypes/registry";
import { codeFileTypes } from "../../lang/code/file-types";
import { htmlFileType, pageSize } from "./file-type";

test("HTML files open in the browser view; XML stays code", () => {
  const registry = new FileTypeRegistry(textFileType);
  for (const ft of codeFileTypes) registry.register(ft);
  registry.register(htmlFileType);
  const of = (path: string) => registry.forPath(path);
  expect(of("site/index.html")).toMatchObject({
    id: "html",
    editor: "browser",
  });
  expect(of("site/old.htm").id).toBe("html");
  expect(of("feed.xml")).toMatchObject({ id: "xml", editor: "text" });
  expect(htmlFileType.highlighter?.language).toBe("xml");
});

test("page text is about one terminal row tall, and zoom changes only the viewport", () => {
  const px = { width: 1600, height: 900, cellHeight: 36 };
  expect(pageSize(px, 1)).toEqual({ width: 800, height: 450, dpr: 2 });
  expect(pageSize(px, 2)).toEqual({ width: 400, height: 225, dpr: 2 });
  expect(pageSize({ ...px, cellHeight: 10 }, 1).dpr).toBe(1);
  expect(pageSize({ ...px, cellHeight: 90 }, 1).dpr).toBe(3);
  expect(pageSize({ ...px, cellHeight: 30 }, 1).dpr).toBe(1.75);
});
