import { afterAll, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type PtyProcess, ready, runInPty, statusRow } from "./pty";

const MAIN = join(import.meta.dir, "../../src/app/main.ts");
const ESC = String.fromCharCode(0x1b);
const TEXT = "alpha\nbravo\ncharlie delta\n";

const temps: string[] = [];
afterAll(async () => {
  for (const dir of temps) await rm(dir, { recursive: true, force: true });
});

async function temp(prefix: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  temps.push(dir);
  return dir;
}

/** A workspace with one note, and a config folder whose config.toml is `config`. */
async function setup(config?: string) {
  const root = await temp("so-mouse-");
  const path = join(root, "note.md");
  await writeFile(path, TEXT);
  const xdg = await temp("so-mouse-config-");
  if (config !== undefined) {
    await mkdir(join(xdg, "so"));
    await writeFile(join(xdg, "so", "config.toml"), config);
  }
  return { path, env: { XDG_CONFIG_HOME: xdg } };
}

/** A left click at screen cell (x, y), 0-based, as SGR press and release reports. */
function click(p: PtyProcess, x: number, y: number) {
  p.type(`${ESC}[<0;${x + 1};${y + 1}M${ESC}[<0;${x + 1};${y + 1}m`);
}

/** Screen cell of the first `text` on the screen. */
function cellOf(p: PtyProcess, text: string) {
  const lines = p.screen().split("\n");
  const y = lines.findIndex((l) => l.includes(text));
  return { x: (lines[y] ?? "").indexOf(text), y };
}

test("with mouse off the terminal reports no mouse and clicks do nothing", async () => {
  const { path, env } = await setup("mouse = false\n");
  let tracking: string | undefined;
  let status = "";
  const r = await runInPty([process.execPath, MAIN, path], {
    env,
    async script(p) {
      await ready(p);
      tracking = p.mouse();
      const at = cellOf(p, "delta");
      click(p, at.x, at.y);
      // A key after the click shows the click was read and moved nothing.
      p.type("l");
      await p.waitFor(() => statusRow(p).includes("1:2"));
      status = statusRow(p);
      p.type(":q\r");
    },
  });
  expect(tracking).toBe("none");
  expect(status).toContain("1:2");
  expect(r.exitCode).toBe(0);
  expect(r.screen.mouse).toBe("none");
});

test("by default the terminal reports every pointer move and a click moves the cursor", async () => {
  const { path, env } = await setup();
  let tracking: string | undefined;
  const r = await runInPty([process.execPath, MAIN, path], {
    env,
    async script(p) {
      await ready(p);
      tracking = p.mouse();
      const at = cellOf(p, "delta");
      click(p, at.x + 1, at.y);
      // Line 3, column 10: the "e" of "delta".
      await p.waitFor(() => statusRow(p).includes("3:10"));
      p.type(":q\r");
    },
  });
  expect(tracking).toBe("any");
  expect(r.exitCode).toBe(0);
  expect(r.screen.mouse).toBe("none");
});
