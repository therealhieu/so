import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import type { FakeScript } from "../fixtures/fake-lsp";
import { fakeServerConfig, killServers, lspConfig } from "../support/lsp";
import { type PtyProcess, ready, runInPty, statusRow } from "./pty";

const MAIN = join(import.meta.dir, "../../src/app/main.ts");

const MAIN_RS = "fn main() {\n    let x = 1;\n    let y = z;\n}\n";
const LIB_RS = "pub fn helper() {}\n";

/** An error on `z` in main.rs (line 3, column 13). */
const ERROR = {
  range: { start: { line: 2, character: 12 }, end: { line: 2, character: 13 } },
  severity: 1,
  source: "rustc",
  message: "cannot find value `z` in this scope",
};

let dirs: string[] = [];
let logs: string[] = [];

afterEach(async () => {
  killServers(logs);
  for (const d of dirs) await rm(d, { recursive: true, force: true });
  dirs = [];
  logs = [];
});

/**
 * A workspace with main.rs and lib.rs, and a config folder whose
 * `config.toml` runs the fake server for Rust files with `script`. The log's
 * file name is unique per run, so it tags the server's command line.
 */
function setup(script: (ws: string) => FakeScript) {
  const ws = realpathSync(mkdtempSync(join(tmpdir(), "so-lsp-e2e-")));
  const config = realpathSync(mkdtempSync(join(tmpdir(), "so-lsp-config-")));
  dirs.push(ws, config);
  writeFileSync(join(ws, "main.rs"), MAIN_RS);
  writeFileSync(join(ws, "lib.rs"), LIB_RS);
  const log = join(config, `server-${crypto.randomUUID()}.jsonl`);
  logs.push(log);
  mkdirSync(join(config, "so"));
  writeFileSync(
    join(config, "so/config.toml"),
    lspConfig(
      true,
      fakeServerConfig({
        name: "fake",
        script: script(ws),
        log,
        fileTypes: ["rust"],
      }),
    ),
  );
  return {
    argv: [process.execPath, MAIN, join(ws, "main.rs")],
    env: { XDG_CONFIG_HOME: config },
    /** The argument `fakeServerConfig` adds to tell this server's process apart. */
    tag: `fake-lsp-${basename(log)}`,
  };
}

/** Whether a process whose command line contains `tag` is running. */
const running = (tag: string) =>
  Bun.spawnSync(["pgrep", "-f", tag]).exitCode === 0;

/** The cell left of `text` on the screen row that shows it: the gutter's sign cell. */
function signBefore(p: PtyProcess, text: string): string | undefined {
  const row = p
    .screen()
    .split("\n")
    .find((l) => l.includes(text));
  if (row === undefined) return undefined;
  return [...row][[...row.slice(0, row.indexOf(text))].length - 1];
}

/** Esc as a kitty keyboard key, so it is never read as the start of a sequence. */
const ESC = "\x1b[27u";
/** Long enough for a few process starts on a loaded CI host. */
const TIMEOUT = 20_000;

/** Waits for `pred`; a timeout names `what` and shows the screen. */
async function until(
  p: PtyProcess,
  what: string,
  pred: () => boolean,
): Promise<void> {
  try {
    await p.waitFor(pred);
  } catch {
    throw new Error(`timed out waiting for ${what}:\n${p.screen()}`);
  }
}

/**
 * Opens `:Diagnostics` until it lists `row`. The picker lists what is known
 * when it opens, and the server publishes after `didOpen`, which follows
 * the ready state, so an early picker can be empty.
 */
async function openDiagnosticsWith(p: PtyProcess, row: string): Promise<void> {
  const until = performance.now() + 15_000;
  for (;;) {
    p.type(":Diagnostics\r");
    await p.waitFor(() => p.screen().includes("─ Diagnostics ─"));
    try {
      await p.waitFor(() => p.screen().includes(row), 1000);
      return;
    } catch {
      if (performance.now() > until)
        throw new Error(`timed out waiting for "${row}":\n${p.screen()}`);
    }
    p.type(ESC);
    await p.waitFor(() => !p.screen().includes("─ Diagnostics ─"));
  }
}

/** Quit from Normal mode and wait for the process to exit. */
async function quit(p: PtyProcess): Promise<void> {
  p.type(":q\r");
  await p.proc.exited;
}

test(
  "the statusline shows the server starting and then ready",
  async () => {
    const app = setup(() => ({}));
    const r = await runInPty(app.argv, {
      env: app.env,
      // Wide enough for whole picker rows.
      cols: 160,
      async script(p) {
        await ready(p);
        await until(p, "the server", () => statusRow(p).includes("◆ fake"));
        await quit(p);
      },
    });
    expect(r.exitCode).toBe(0);
    expect(r.statusRows.some((row) => row.includes("◌ fake"))).toBe(true);
  },
  TIMEOUT,
);

test(
  "a published diagnostic shows in the gutter, ]d reaches it, and :Diagnostics lists it",
  async () => {
    const app = setup(() => ({ diagnostics: [ERROR] }));
    const r = await runInPty(app.argv, {
      env: app.env,
      // Wide enough for whole picker rows.
      cols: 160,
      async script(p) {
        await ready(p);
        await until(
          p,
          "the sign",
          () => signBefore(p, "    let y = z;") === "E",
        );
        expect(signBefore(p, "    let x = 1;")).toBe(" ");
        p.type("]d");
        await until(p, "the cursor at 3:13", () =>
          statusRow(p).trimEnd().endsWith("3:13"),
        );
        p.type(":Diagnostics\r");
        await until(p, "the main.rs row", () =>
          p
            .screen()
            .includes("E main.rs:3:13 cannot find value `z` in this scope"),
        );
        p.type(ESC);
        await until(
          p,
          "the picker to close",
          () => !p.screen().includes("Diagnostics"),
        );
        await quit(p);
      },
    });
    expect(r.exitCode).toBe(0);
  },
  TIMEOUT,
);

test(
  "a diagnostic for an unopened file opens from :Diagnostics",
  async () => {
    const app = setup((ws) => ({
      otherDiagnostics: [
        {
          path: join(ws, "lib.rs"),
          diagnostics: [
            {
              range: {
                start: { line: 0, character: 7 },
                end: { line: 0, character: 13 },
              },
              severity: 2,
              message: "function `helper` is never used",
            },
          ],
        },
      ],
    }));
    const r = await runInPty(app.argv, {
      env: app.env,
      // Wide enough for whole picker rows.
      cols: 160,
      async script(p) {
        await ready(p);
        await until(p, "the server", () => statusRow(p).includes("◆ fake"));
        await openDiagnosticsWith(
          p,
          "W lib.rs:1:8 function `helper` is never used",
        );
        p.type("\r");
        await until(p, "lib.rs to open", () => statusRow(p).includes("lib.rs"));
        expect(statusRow(p).trimEnd().endsWith("1:8")).toBe(true);
        await quit(p);
      },
    });
    expect(r.exitCode).toBe(0);
  },
  TIMEOUT,
);

test(
  "quitting leaves no language server running",
  async () => {
    const app = setup(() => ({}));
    let before = false;
    const r = await runInPty(app.argv, {
      env: app.env,
      // Wide enough for whole picker rows.
      cols: 160,
      async script(p) {
        await ready(p);
        await until(p, "the server", () => statusRow(p).includes("◆ fake"));
        before = running(app.tag);
        await quit(p);
      },
    });
    expect(r.exitCode).toBe(0);
    expect(before).toBe(true);
    expect(running(app.tag)).toBe(false);
  },
  TIMEOUT,
);
