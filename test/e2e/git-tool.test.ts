import { expect, test } from "bun:test";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gitRepo } from "../support/git-repo";
import { ready, runInPty, statusRow } from "./pty";

const MAIN = join(import.meta.dir, "../../src/app/main.ts");

/**
 * A stand-in for lazygit: it ignores Ctrl-C, turns on any-motion mouse
 * tracking, says it runs, waits for `go`, and then kills itself with
 * SIGKILL, so it never resets the terminal.
 */
const stubTool = (go: string) => `#!/bin/sh
trap '' INT
printf '\\033[?1003h'
echo "stub tool running"
while [ ! -e '${go}' ]; do sleep 0.05; done
kill -9 $$
`;

test("the editor returns intact after the git tool is killed", async () => {
  const repo = await gitRepo({ "note.md": "# Note\n" });
  const dir = await mkdtemp(join(tmpdir(), "so-git-tool-"));
  try {
    const stub = join(dir, "tool.sh");
    const go = join(dir, "go");
    await writeFile(stub, stubTool(go));
    await chmod(stub, 0o755);
    await mkdir(join(dir, "config/so"), { recursive: true });
    await writeFile(
      join(dir, "config/so/config.toml"),
      `[preview]\nmode = "live"\n\n[git]\ntool = [${JSON.stringify(stub)}]\n`,
    );
    const r = await runInPty(
      [process.execPath, MAIN, join(repo.root, "note.md")],
      {
        env: { ...repo.env, XDG_CONFIG_HOME: join(dir, "config") },
        async script(p) {
          await ready(p);
          await p.waitFor(() => statusRow(p).includes("⎇ main"));
          p.type(" gg");
          await p.waitFor(() => p.screen().includes("stub tool running"));
          expect(p.mouse()).toBe("any");
          // Ctrl-C reaches the tool's process group, so included; so stays up.
          p.type("\x03");
          await Bun.sleep(200);
          expect(p.exited()).toBe(false);
          await writeFile(go, "");
          await p.waitFor(
            () =>
              statusRow(p).includes("note.md") &&
              !p.screen().includes("stub tool running"),
          );
          expect(p.mouse()).not.toBe("any");
          expect(statusRow(p)).toContain("NORMAL");
          expect(p.exited()).toBe(false);
          p.type(":q\r");
        },
      },
    );
    expect(r.exitCode).toBe(0);
    expect(r.screen.buffer).toBe("normal");
    expect(r.screen.mouse).toBe("none");
  } finally {
    await rm(dir, { recursive: true, force: true });
    await repo.cleanup();
  }
}, 30_000);
