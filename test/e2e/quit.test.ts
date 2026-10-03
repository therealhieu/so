import { expect, test } from "bun:test";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ready, runInPty } from "./pty";

const MAIN = join(import.meta.dir, "../../src/app/main.ts");

async function note(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "so-quit-"));
  await writeFile(join(root, "note.md"), "# Note\n");
  return join(root, "note.md");
}

test("SIGTERM right after typing writes the text and exits 0", async () => {
  const path = await note();
  const r = await runInPty([process.execPath, MAIN, path], {
    async script(p) {
      await ready(p);
      p.type("Gohello");
      await p.waitFor(() => p.screen().includes("hello"));
      p.proc.kill("SIGTERM");
    },
  });
  expect(r.exitCode).toBe(0);
  expect(await readFile(path, "utf8")).toBe("# Note\nhello\n");
});

test("a hung write delays exit by the flush bound and reports the unsaved file", async () => {
  const path = await note();
  let elapsed = 0;
  const r = await runInPty([process.execPath, MAIN, path], {
    env: { SO_TEST: "1", SO_TEST_SLOW_WRITE: "3000" },
    async script(p) {
      await ready(p);
      p.type("Gohello");
      await p.waitFor(() => p.screen().includes("hello"));
      const start = performance.now();
      p.proc.kill("SIGTERM");
      await p.proc.exited;
      elapsed = performance.now() - start;
    },
  });
  expect(r.exitCode).toBe(0);
  expect(elapsed).toBeLessThan(2500);
  expect(r.screen.buffer).toBe("normal");
  expect(r.probe.lastCursor).toBe("h");
  expect(r.screen.text).toContain("so: unsaved: note.md");
  expect(await readFile(path, "utf8")).toBe("# Note\n");
});
