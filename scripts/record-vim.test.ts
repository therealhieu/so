import { expect, test } from "bun:test";
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("recorder refuses Neovim 0.12", async () => {
  const dir = await mkdtemp(join(tmpdir(), "so-nvim-stub-"));
  try {
    const stub = join(dir, "nvim");
    await writeFile(stub, '#!/bin/sh\necho "NVIM v0.12.4"\n');
    await chmod(stub, 0o755);
    const proc = Bun.spawn(["bun", "scripts/record-vim.ts"], {
      env: { ...process.env, NVIM: stub },
      stdout: "pipe",
      stderr: "pipe",
    });
    const [code, stderr] = await Promise.all([
      proc.exited,
      new Response(proc.stderr).text(),
    ]);
    expect(code).toBe(1);
    expect(stderr).toContain("requires Neovim 0.11.x");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
