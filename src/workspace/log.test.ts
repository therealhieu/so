import { afterAll, beforeAll, expect, test } from "bun:test";
import { existsSync, statSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLogger } from "./log";

let base = "";

beforeAll(async () => {
  base = await mkdtemp(join(tmpdir(), "so-log-"));
});

afterAll(async () => {
  await rm(base, { recursive: true, force: true });
});

test("without SO_LOG=debug no log file is written", () => {
  const state = join(base, "off");
  const log = createLogger({ XDG_STATE_HOME: state }, "/nonexistent");
  log.info("startup", { ms: 5 });
  log.error("effect failed", { reason: "EACCES" });
  expect(existsSync(state)).toBe(false);
  createLogger({ XDG_STATE_HOME: state, SO_LOG: "info" }, "/x").info("a");
  expect(existsSync(state)).toBe(false);
});

test("SO_LOG=debug appends JSON lines to so.log in the state directory", async () => {
  const state = join(base, "on");
  const log = createLogger({ XDG_STATE_HOME: state, SO_LOG: "debug" }, "/x");
  log.info("startup", { ms: 5, path: "notes/a.md" });
  log.error("effect failed", { reason: "EACCES", retry: false });
  const file = join(state, "so/so.log");
  const lines = (await readFile(file, "utf8")).trimEnd().split("\n");
  expect(lines.map((l) => JSON.parse(l))).toEqual([
    {
      time: expect.any(String),
      level: "info",
      event: "startup",
      ms: 5,
      path: "notes/a.md",
    },
    {
      time: expect.any(String),
      level: "error",
      event: "effect failed",
      reason: "EACCES",
      retry: false,
    },
  ]);
  expect(statSync(file).mode & 0o777).toBe(0o600);
});

test("a relative XDG_STATE_HOME falls back to ~/.local/state", async () => {
  const home = join(base, "home");
  createLogger({ XDG_STATE_HOME: "rel", SO_LOG: "debug" }, home).info("x");
  expect(existsSync(join(home, ".local/state/so/so.log"))).toBe(true);
});
