import { afterAll, beforeAll, expect, test } from "bun:test";
import { cp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { makeLargeFile } from "../fixtures/generate";
import { type App, startApp, tmpWorkspace, waitFor } from "./helpers";

let app: App;
const BOM = [0xef, 0xbb, 0xbf];

beforeAll(async () => {
  const root = await tmpWorkspace();
  await cp(join(import.meta.dir, "../fixtures/workspace"), root, {
    recursive: true,
  });
  await makeLargeFile(root);
  await writeFile(
    join(root, "crlf-bom-open-end.md"),
    "﻿# Open end\r\n\r\nLast line without newline",
  );
  app = await startApp(root);
});

afterAll(async () => {
  app.stop();
  await rm(app.root, { recursive: true, force: true });
});

test.each([
  ["photo.png", "binary file — not opened"],
  ["nul-at-100.bin", "binary file — not opened"],
  ["invalid-utf8.txt", "binary file — not opened"],
  ["large.md", "file too large — not opened (limit 16 MiB)"],
])("opening %s is refused without a buffer or a write", async (path, text) => {
  const bytes = await readFile(join(app.root, path));
  const mark = app.actions.length;
  const marked = app.effects.length;
  app.keys(`<Esc>:e ${path}<CR>`);
  await waitFor(() =>
    app.actions
      .slice(mark)
      .some((a) => a.type === "fileRefused" && a.path === path),
  );
  expect(app.store.get().notifications.message).toEqual({
    text,
    level: "error",
  });
  expect(app.buffer(path)).toBeUndefined();
  expect(app.effects.slice(marked).filter((e) => e.kind === "write")).toEqual(
    [],
  );
  expect((await readFile(join(app.root, path))).equals(bytes)).toBe(true);
});

/** Edit the first line, save, and return the bytes on disk. */
async function editAndSave(path: string): Promise<Buffer> {
  await app.open(path);
  const mark = app.actions.length;
  app.keys("ggAx<Esc>");
  await waitFor(() =>
    app.actions.slice(mark).some((a) => a.type === "saved" && a.path === path),
  );
  return readFile(join(app.root, path));
}

const lines = (bytes: Buffer) => bytes.subarray(3).toString("utf8");

test("a saved CRLF file with a BOM keeps its BOM, line endings, and final newline", async () => {
  const bytes = await editAndSave("crlf-bom.md");
  expect([...bytes.subarray(0, 3)]).toEqual(BOM);
  expect(lines(bytes)).toBe("# Titlex\r\n\r\nFirst line\r\nSecond line\r\n");
});

test("a saved CRLF file with a BOM and no final newline still has none", async () => {
  const bytes = await editAndSave("crlf-bom-open-end.md");
  expect([...bytes.subarray(0, 3)]).toEqual(BOM);
  expect(lines(bytes)).toBe("# Open endx\r\n\r\nLast line without newline");
});
