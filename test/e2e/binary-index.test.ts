import { Database } from "bun:sqlite";
import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ready, runInPty } from "./pty";

const REPO = join(import.meta.dir, "../..");
const BINARY = join(REPO, "dist/so");

let root = "";

beforeAll(async () => {
  const build = Bun.spawnSync(["bun", "run", "build"], {
    cwd: REPO,
    stdout: "pipe",
    stderr: "pipe",
  });
  if (build.exitCode !== 0)
    throw new Error(`bun run build failed: ${build.stderr.toString()}`);
  // The first launch of a freshly written binary waits for the OS to assess
  // it (about 0.75 s on macOS, more on a busy host). Pay that here, inside the
  // setup budget, so the first-frame wait below times only the app.
  const warm = Bun.spawnSync([BINARY, "--version"], { stdout: "pipe" });
  if (warm.exitCode !== 0)
    throw new Error(`dist/so --version exited ${warm.exitCode}`);
  root = await mkdtemp(join(tmpdir(), "so-bin-"));
  for (let i = 1; i <= 50; i++)
    await writeFile(
      join(root, `note-${i}.md`),
      `# Note ${i}\n\nSee [[note-${(i % 50) + 1}]].\n`,
    );
  const db = new Database(join(root, "app.db"));
  db.run("CREATE TABLE t (x); INSERT INTO t VALUES (1), (2)");
  db.close();
}, 120_000);

afterAll(async () => {
  if (root !== "") await rm(root, { recursive: true, force: true });
});

test("the compiled binary reaches index ready", async () => {
  let elapsed = 0;
  const r = await runInPty([BINARY, root], {
    async script(p) {
      const start = performance.now();
      await ready(p);
      await p.waitFor(() => p.screen().includes("index ready"), 10_000);
      elapsed = performance.now() - start;
      p.type(":q\r");
    },
  });
  expect(elapsed).toBeLessThan(10_000);
  expect(r.exitCode).toBe(0);
}, 30_000);

test("the compiled binary reads a database in its SQLite worker", async () => {
  const r = await runInPty([BINARY, join(root, "app.db")], {
    async script(p) {
      await ready(p);
      await p.waitFor(() => p.screen().includes("rows 1–2 of 2"), 10_000);
      p.type(":q\r");
    },
  });
  expect(r.exitCode).toBe(0);
}, 30_000);
