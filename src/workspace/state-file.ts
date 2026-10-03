import { createHash } from "node:crypto";
import {
  chmodSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { chmod, mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import type { PersistedState } from "../core/state/types";
import { xdgDir } from "./config-file";

type Env = Record<string, string | undefined>;

/** `$XDG_STATE_HOME/so`, or `~/.local/state/so`: the log and the state files live here. */
export function soStateDir(env: Env, home: string): string {
  return join(xdgDir(env, "XDG_STATE_HOME", join(home, ".local/state")), "so");
}

const inside = (path: string, root: string) => {
  const rel = relative(root, path);
  return rel === "" || !(rel.startsWith("..") || rel.startsWith("/"));
};

/**
 * `<state dir>/so/<sha256(realRoot) first 16 hex>/state.json`. A state
 * directory inside the workspace falls back to `~/.local/state`; when that
 * is inside too (a workspace at or above home), there is no state file.
 */
export function statePath(
  env: Env,
  home: string,
  realRoot: string,
): string | undefined {
  const hash = createHash("sha256").update(realRoot).digest("hex").slice(0, 16);
  for (const dir of [soStateDir(env, home), soStateDir({}, home)]) {
    const path = join(dir, hash, "state.json");
    if (!inside(path, realRoot)) return path;
  }
  return undefined;
}

/** The state file's JSON, or undefined when it is missing, unreadable, or not JSON. */
export function readStateFile(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return undefined;
  }
}

const tmpOf = (path: string) => `${path}.${process.pid}.tmp`;

/** Write the state through a private temp file and a rename; the folder is created `0700`. */
export async function saveStateFile(
  path: string,
  state: PersistedState,
): Promise<void> {
  const tmp = tmpOf(path);
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  try {
    await rm(tmp, { force: true });
    await writeFile(tmp, JSON.stringify(state), { mode: 0o600, flag: "wx" });
    await chmod(tmp, 0o600);
    await rename(tmp, path);
  } catch (e) {
    await rm(tmp, { force: true });
    throw e;
  }
}

/** `saveStateFile` for the shutdown path, which cannot wait for promises. */
export function saveStateFileSync(path: string, state: PersistedState): void {
  const tmp = tmpOf(path);
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  try {
    rmSync(tmp, { force: true });
    writeFileSync(tmp, JSON.stringify(state), { mode: 0o600, flag: "wx" });
    chmodSync(tmp, 0o600);
    renameSync(tmp, path);
  } catch (e) {
    rmSync(tmp, { force: true });
    throw e;
  }
}
