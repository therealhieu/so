import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readPropertyTypes } from "./property-types";

let root = "";

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "so-types-"));
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

const write = async (body: string) => {
  await mkdir(join(root, ".obsidian"), { recursive: true });
  await writeFile(join(root, ".obsidian/types.json"), body);
};

test("a missing types.json gives no assignments and is not reported", async () => {
  const invalid: string[] = [];
  expect(
    await readPropertyTypes(join(root, "nowhere"), (r) => invalid.push(r)),
  ).toEqual({});
  expect(invalid).toEqual([]);
});

test("types.json assignments are read", async () => {
  await write('{ "types": { "Status": "number", "tags": "tags" } }');
  expect(await readPropertyTypes(root)).toEqual({
    status: "number",
    tags: "tags",
  });
});

test("a malformed types.json gives no assignments and is reported", async () => {
  for (const body of ["{ not json", '{ "types": [] }', "[]"]) {
    await write(body);
    const invalid: string[] = [];
    expect(await readPropertyTypes(root, (r) => invalid.push(r))).toEqual({});
    expect(invalid).toHaveLength(1);
  }
});
