import { afterAll, beforeAll, expect, test } from "bun:test";
import { copyFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ready, runInPty, statusRow } from "./pty";

const MAIN = join(import.meta.dir, "../../src/app/main.ts");

let root = "";

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "so-media-e2e-"));
  await copyFile(
    join(import.meta.dir, "../fixtures/images/page.png"),
    join(root, "photo.png"),
  );
  await writeFile(
    join(root, "logo.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"/>\n',
  );
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

test("so photo.png opens it in an image window", async () => {
  const r = await runInPty([process.execPath, MAIN, join(root, "photo.png")], {
    async script(p) {
      await ready(p);
      await p.waitFor(() => statusRow(p).includes("IMAGE"));
      p.type(":q\r");
    },
  });
  expect(r.exitCode).toBe(0);
  expect(r.screen.text).not.toContain("binary file");
});

test("so logo.svg opens drawn, and <leader>m shows its source", async () => {
  const r = await runInPty([process.execPath, MAIN, join(root, "logo.svg")], {
    async script(p) {
      await ready(p);
      await p.waitFor(() => statusRow(p).includes("IMAGE"));
      p.type(" m");
      await p.waitFor(() => p.screen().includes("<svg xmlns="));
      p.type(":q\r");
    },
  });
  expect(r.exitCode).toBe(0);
});
