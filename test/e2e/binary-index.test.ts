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
  root = await mkdtemp(join(tmpdir(), "so-bin-"));
  for (let i = 1; i <= 50; i++)
    await writeFile(
      join(root, `note-${i}.md`),
      `# Note ${i}\n\nSee [[note-${(i % 50) + 1}]].\n`,
    );
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
