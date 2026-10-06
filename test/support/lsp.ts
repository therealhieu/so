import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { BUILTIN_SERVERS } from "../../src/core/config/lsp";
import type { FakeScript } from "../fixtures/fake-lsp";

const FAKE = join(import.meta.dir, "../fixtures/fake-lsp.ts");

/** One message the fake server received, or its first line (`argv`, `pid`). */
export type LoggedMessage = {
  method?: string;
  params?: unknown;
  result?: unknown;
  argv?: string[];
  pid?: number;
};

/** `v` as a TOML value; objects become inline tables. */
function toml(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(toml).join(", ")}]`;
  if (typeof v === "object" && v !== null)
    return `{ ${Object.entries(v)
      .map(([k, x]) => `${JSON.stringify(k)} = ${toml(x)}`)
      .join(", ")} }`;
  return JSON.stringify(v);
}

/** Writes the script next to the log and returns its path. */
function writeScript(script: FakeScript, log: string): string {
  const path = `${log}.script.json`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(script));
  return path;
}

/**
 * A `[lsp.servers.<name>]` table that runs the fake server with `script`,
 * logging to `log`. The log's file name is passed as a tag, so each server
 * process has a unique command line.
 */
export function fakeServerConfig(o: {
  name: string;
  script: FakeScript;
  log: string;
  fileTypes?: string[];
  rootMarkers?: unknown[];
  rootSearch?: "nearest" | "topmost";
  settings?: Record<string, unknown>;
  initOptions?: Record<string, unknown>;
}): string {
  const command = [
    process.execPath,
    FAKE,
    writeScript(o.script, o.log),
    o.log,
    `fake-lsp-${basename(o.log)}`,
  ];
  const fields: Record<string, unknown> = {
    command,
    fileTypes: o.fileTypes,
    rootMarkers: o.rootMarkers,
    rootSearch: o.rootSearch,
    settings: o.settings,
    initOptions: o.initOptions,
  };
  const lines = [`[lsp.servers.${JSON.stringify(o.name)}]`];
  for (const [k, v] of Object.entries(fields))
    if (v !== undefined) lines.push(`${k} = ${toml(v)}`);
  return `${lines.join("\n")}\n`;
}

/**
 * A config.toml with `[lsp] enabled` and `servers` (tables from
 * `fakeServerConfig`); every built-in server without a table of its own is
 * disabled, so no installed server starts during a test.
 */
export function lspConfig(enabled: boolean, ...servers: string[]): string {
  const text = servers.join("");
  const off = BUILTIN_SERVERS.filter(
    (s) => !text.includes(`[lsp.servers.${JSON.stringify(s.name)}]`),
  ).map((s) => `[lsp.servers.${JSON.stringify(s.name)}]\nenabled = false\n`);
  return `[lsp]\nenabled = ${enabled}\n${off.join("")}${text}`;
}

/**
 * A `node_modules/.bin/tsc` in `root` that prints `Version <version>` for
 * `--version` and otherwise runs the fake server, passing its own path last.
 * It is run once here: macOS checks a new executable on its first run, one
 * at a time across the system, which under parallel tests can take longer
 * than the version probe's bound.
 */
export function fakeTsc(
  root: string,
  version: string,
  script: FakeScript,
  log: string,
): string {
  const path = join(root, "node_modules/.bin/tsc");
  mkdirSync(dirname(path), { recursive: true });
  const run = [process.execPath, FAKE, writeScript(script, log), log]
    .map((a) => JSON.stringify(a))
    .join(" ");
  writeFileSync(
    path,
    `#!/bin/sh\nif [ "$1" = "--version" ]; then echo "Version ${version}"; exit 0; fi\nexec ${run} "$0"\n`,
  );
  chmodSync(path, 0o755);
  Bun.spawnSync([path, "--version"], { stdout: "ignore", stderr: "ignore" });
  return path;
}

/** Every line of the fake server's log; empty before it starts. */
export function readServerLog(log: string): LoggedMessage[] {
  let text: string;
  try {
    text = readFileSync(log, "utf8");
  } catch {
    return [];
  }
  return text
    .split("\n")
    .filter((l) => l !== "")
    .map((l) => JSON.parse(l) as LoggedMessage);
}

/** Resolves once the server logged `method` (`count` times); throws after `ms`. */
export async function waitForMessage(
  log: string,
  method: string,
  ms = 5000,
  count = 1,
): Promise<void> {
  const until = performance.now() + ms;
  while (readServerLog(log).filter((m) => m.method === method).length < count) {
    if (performance.now() > until)
      throw new Error(`timed out waiting for ${method} in ${basename(log)}`);
    await Bun.sleep(5);
  }
}

const alive = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

/**
 * Kills every fake server process the logs recorded and returns the pids
 * that were still alive before the kill.
 */
export function killServers(logs: string[]): number[] {
  const pids = logs.flatMap((log) =>
    readServerLog(log).flatMap((m) => (m.pid === undefined ? [] : [m.pid])),
  );
  const running = pids.filter(alive);
  for (const pid of running) process.kill(pid, "SIGKILL");
  return running;
}
