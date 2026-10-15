import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ready, runInPty, statusRow } from "./pty";

const MAIN = join(import.meta.dir, "../../src/app/main.ts");

let root = "";

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "so-browser-e2e-"));
  await writeFile(join(root, "index.html"), "<h1>Hello page</h1>\n");
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

test("without Chrome an HTML file says what to install, and <leader>m flips to its source and back", async () => {
  const r = await runInPty([process.execPath, MAIN, join(root, "index.html")], {
    config: '[browser]\nchrome = "/nonexistent/chrome"\n',
    async script(p) {
      await ready(p);
      await p.waitFor(
        () => p.screen().includes("needs Chrome or Chromium"),
        10_000,
      );
      expect(p.screen()).toContain(
        '[browser] chrome = "/nonexistent/chrome" does not exist.',
      );
      expect(statusRow(p)).toContain("WEB");
      p.type(" m");
      await p.waitFor(() => p.screen().includes("<h1>Hello page</h1>"));
      expect(statusRow(p)).toContain("NORMAL");
      p.type(" m");
      await p.waitFor(() => p.screen().includes("needs Chrome or Chromium"));
      expect(p.screen()).not.toContain("<h1>Hello page</h1>");
      p.type(":q\r");
    },
  });
  expect(r.exitCode).toBe(0);
}, 30_000);
