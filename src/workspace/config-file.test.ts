import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { configPath, readConfigText, readConfigTextSync } from "./config-file";

let base = "";

beforeAll(async () => {
  base = await mkdtemp(join(tmpdir(), "so-config-"));
});

afterAll(async () => {
  await rm(base, { recursive: true, force: true });
});

test("config path follows XDG and ignores relative values", () => {
  const home = "/home/u";
  const fallback = "/home/u/.config/so/config.toml";
  expect(configPath({}, home)).toBe(fallback);
  expect(configPath({ XDG_CONFIG_HOME: "" }, home)).toBe(fallback);
  expect(configPath({ XDG_CONFIG_HOME: "relative/path" }, home)).toBe(fallback);
  expect(configPath({ XDG_CONFIG_HOME: "/abs" }, home)).toBe(
    "/abs/so/config.toml",
  );
});

test("a missing config file reads as undefined", async () => {
  const missing = join(base, "none/so/config.toml");
  expect(readConfigTextSync(missing)).toBeUndefined();
  expect(await readConfigText(missing)).toBeUndefined();
});

test("an existing config file reads as its text", async () => {
  const path = configPath({ XDG_CONFIG_HOME: base }, "/home/u");
  await mkdir(join(base, "so"), { recursive: true });
  await writeFile(path, 'theme = "light"\n');
  expect(readConfigTextSync(path)).toBe('theme = "light"\n');
  expect(await readConfigText(path)).toBe('theme = "light"\n');
});
