import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type PtyOptions, type PtyRun, ready, runInPty } from "./pty";

const MAIN = join(import.meta.dir, "../../src/app/main.ts");

const folders: string[] = [];
afterEach(async () => {
  for (const d of folders.splice(0))
    await rm(d, { recursive: true, force: true });
});

async function workspace(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "so-e2e-"));
  folders.push(root);
  await writeFile(join(root, "note.md"), "# Note\n");
  return root;
}

/** Run `so <args>` and wait for its first frame before `script`. */
function so(
  args: string[],
  script: PtyOptions["script"],
  env: Record<string, string> = {},
): Promise<PtyRun> {
  return runInPty([process.execPath, MAIN, ...args], {
    env,
    async script(p) {
      await ready(p);
      await script(p);
    },
  });
}

function expectRestored(r: PtyRun) {
  expect(r.probe.kittyPushed).toBe(true);
  expect(r.screen.buffer).toBe("normal");
  expect(r.screen.mouse).toBe("none");
  expect(r.probe.lastCursor).toBe("h");
  expect(r.probe.lastKitty).toBe("pop");
}

describe("the terminal is restored on every exit path", () => {
  test(":q exits 0", async () => {
    const r = await so([await workspace()], async (p) => p.type(":q\r"));
    expect(r.exitCode).toBe(0);
    expectRestored(r);
  });

  for (const signal of ["SIGTERM", "SIGINT"] as const)
    test(`${signal} exits 0`, async () => {
      const r = await so([await workspace()], async (p) => {
        p.proc.kill(signal);
      });
      expect(r.exitCode).toBe(0);
      expectRestored(r);
    });

  test("an uncaught exception flushes typed text and exits 1", async () => {
    const root = await workspace();
    const r = await so(
      [join(root, "note.md")],
      async (p) => p.type("ggOTHROW"),
      { SO_TEST: "1", SO_TEST_THROW: "1" },
    );
    expect(r.exitCode).toBe(1);
    expectRestored(r);
    expect(await readFile(join(root, "note.md"), "utf8")).toBe(
      "THROW\n# Note\n",
    );
  });

  test("a failure before the first frame restores the terminal and says why", async () => {
    const r = await runInPty([process.execPath, MAIN, await workspace()], {
      env: { SO_TEST: "1", SO_TEST_THROW: "start" },
      script: async () => {},
    });
    expect(r.exitCode).toBe(1);
    expect(r.screen.buffer).toBe("normal");
    expect(r.screen.mouse).toBe("none");
    expect(r.screen.text).toContain("so: Error: injected startup failure");
  });
});

test("NO_COLOR output has no colour escape sequences", async () => {
  const root = await workspace();
  const r = await so(
    [join(root, "note.md")],
    async (p) => {
      p.type("vj");
      await Bun.sleep(100);
      p.type("\x1b[27u:q\r");
    },
    { NO_COLOR: "1" },
  );
  expect(r.exitCode).toBe(0);
  expect(r.probe.colours).toEqual([]);
});

test("Ctrl-C does not quit; :q does", async () => {
  let aliveAfterCtrlC = false;
  const r = await so([await workspace()], async (p) => {
    p.type("\x03");
    await Bun.sleep(500);
    aliveAfterCtrlC = !p.exited();
    p.type(":q\r");
  });
  expect(aliveAfterCtrlC).toBe(true);
  expect(r.exitCode).toBe(0);
});
