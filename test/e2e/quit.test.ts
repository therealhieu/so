import { expect, test } from "bun:test";
import { existsSync } from "node:fs";
import {
  chmod,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
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

test(":q saves the session outside the workspace, private to the user", async () => {
  const path = await note();
  const state = await mkdtemp(join(tmpdir(), "so-quit-state-"));
  try {
    const r = await runInPty([process.execPath, MAIN, path], {
      env: { XDG_STATE_HOME: state },
      async script(p) {
        await ready(p);
        p.type(":q\r");
      },
    });
    expect(r.exitCode).toBe(0);
    const [hash] = await readdir(join(state, "so"));
    const file = join(state, "so", hash ?? "", "state.json");
    expect((await stat(file)).mode & 0o777).toBe(0o600);
    expect(JSON.parse(await readFile(file, "utf8")).recent).toEqual([
      "note.md",
    ]);
    expect(await readdir(dirname(path))).toEqual(["note.md"]);
  } finally {
    await rm(state, { recursive: true, force: true });
    await rm(dirname(path), { recursive: true, force: true });
  }
});

/** A folder with `open` and `xdg-open` stand-ins that record the address instead of opening a browser. */
async function fakeLaunchers(): Promise<{ bin: string; opened: string }> {
  const bin = await mkdtemp(join(tmpdir(), "so-quit-bin-"));
  const opened = join(bin, "opened.txt");
  for (const name of ["open", "xdg-open"]) {
    await writeFile(
      join(bin, name),
      `#!/bin/sh\nprintf '%s' "$1" > '${opened}'\n`,
    );
    await chmod(join(bin, name), 0o755);
  }
  return { bin, opened };
}

test("exit tells a connected preview page before restoring the terminal", async () => {
  const path = await note();
  const { bin, opened } = await fakeLaunchers();
  let events = "";
  try {
    const r = await runInPty([process.execPath, MAIN, path], {
      env: { PATH: `${bin}:${process.env.PATH ?? ""}` },
      async script(p) {
        await ready(p);
        p.type(":Preview\r");
        await p.waitFor(() => existsSync(opened));
        const url = new URL(await readFile(opened, "utf8"));
        expect(url.pathname).toBe("/note.md");
        const res = await fetch(new URL("/events", url));
        const reader = (res.body as ReadableStream<Uint8Array>).getReader();
        const decoder = new TextDecoder();
        p.proc.kill("SIGTERM");
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          events += decoder.decode(value, { stream: true });
        }
      },
    });
    expect(events).toContain("event: stopped");
    expect(r.exitCode).toBe(0);
    expect(r.screen.buffer).toBe("normal");
    expect(r.screen.mouse).toBe("none");
    expect(r.probe.lastCursor).toBe("h");
    expect(r.probe.lastKitty).toBe("pop");
  } finally {
    await rm(bin, { recursive: true, force: true });
    await rm(dirname(path), { recursive: true, force: true });
  }
});
