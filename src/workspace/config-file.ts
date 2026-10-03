import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";

type Env = Record<string, string | undefined>;

/**
 * An XDG base directory: `env[name]` when it is an absolute path, otherwise
 * `fallback` (XDG Base Directory 0.8 ignores empty and relative values).
 */
export function xdgDir(env: Env, name: string, fallback: string): string {
  const value = env[name];
  return value !== undefined && value !== "" && isAbsolute(value)
    ? value
    : fallback;
}

/** `$XDG_CONFIG_HOME/so/config.toml`, or `~/.config/so/config.toml`. */
export function configPath(env: Env, home: string): string {
  return join(
    xdgDir(env, "XDG_CONFIG_HOME", join(home, ".config")),
    "so",
    "config.toml",
  );
}

const missing = (e: unknown) =>
  (e as NodeJS.ErrnoException | undefined)?.code === "ENOENT";

/** The config text, or undefined when there is no file. Other read errors throw. */
export function readConfigTextSync(path: string): string | undefined {
  try {
    return readFileSync(path, "utf8");
  } catch (e) {
    if (missing(e)) return undefined;
    throw e;
  }
}

/** The config text, or undefined when there is no file. Other read errors reject. */
export async function readConfigText(
  path: string,
): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch (e) {
    if (missing(e)) return undefined;
    throw e;
  }
}
