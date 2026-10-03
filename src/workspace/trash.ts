import { existsSync } from "node:fs";
import { lstat, mkdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

/** The platform trash, chosen once at startup. */
export type Trash = {
  available: boolean;
  move(absPath: string): Promise<void>;
};

/** Runs argv without a shell; only stdout and the exit code are read. */
type Spawn = (argv: string[]) => {
  exited: Promise<number>;
  stdout: ReadableStream<Uint8Array>;
};

const bunSpawn: Spawn = (argv) =>
  Bun.spawn(argv, { stdout: "pipe", stderr: "ignore" });

const unavailable: Trash = {
  available: false,
  move: () => Promise.reject(new Error("trash unavailable")),
};

const pad = (n: number) => String(n).padStart(2, "0");
const localIso = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

/** A freedesktop `.trashinfo`: escaped absolute path and local deletion time. */
export function trashInfo(absPath: string, d: Date): string {
  return `[Trash Info]\nPath=${absPath.split("/").map(encodeURIComponent).join("/")}\nDeletionDate=${localIso(d)}\n`;
}

const code = (e: unknown) => (e as NodeJS.ErrnoException).code;
const exists = (p: string) =>
  lstat(p).then(
    () => true,
    () => false,
  );

/**
 * Freedesktop home trash at `home`: the info file is created first and
 * exclusively under a free name, then the item is renamed into `files/`.
 * A failed rename removes the info file, so no orphan is left.
 */
export function freedesktopTrash(home: string, now: () => Date): Trash {
  return {
    available: true,
    async move(abs) {
      const base = basename(abs);
      let name = base;
      for (let n = 2; ; n++) {
        const info = join(home, "info", `${name}.trashinfo`);
        try {
          await writeFile(info, trashInfo(abs, now()), { flag: "wx" });
          if (!(await exists(join(home, "files", name)))) break;
          await rm(info, { force: true });
        } catch (e) {
          if (code(e) !== "EEXIST") throw e;
        }
        name = `${base}.${n}`;
      }
      try {
        await rename(abs, join(home, "files", name));
      } catch (e) {
        await rm(join(home, "info", `${name}.trashinfo`), { force: true });
        throw e;
      }
    },
  };
}

/** The path is `argv[0]` of the script, never part of its source. */
const JXA = `function run(argv){ObjC.import('Foundation');return $.NSFileManager.defaultManager.trashItemAtURLResultingItemURLError($.NSURL.fileURLWithPath(argv[0]),null,null)?'ok':'failed'}`;

/**
 * macOS trash without a permission prompt: `/usr/bin/trash` when present,
 * else NSFileManager through JXA, whose success is read from stdout because
 * `osascript` exits 0 on failure.
 */
export function macTrash(hasTrashCli: boolean, spawn = bunSpawn): Trash {
  return {
    available: true,
    async move(abs) {
      if (hasTrashCli) {
        if ((await spawn(["/usr/bin/trash", abs]).exited) !== 0)
          throw new Error("trash failed");
        return;
      }
      const p = spawn(["osascript", "-l", "JavaScript", "-e", JXA, abs]);
      const out = (await new Response(p.stdout).text()).trim();
      await p.exited;
      if (out !== "ok") throw new Error("trash failed");
    },
  };
}

/**
 * Linux: the home trash folders exist or can be made, on the workspace's
 * device. macOS: `/usr/bin/trash` or `osascript`. Otherwise unavailable.
 */
export async function detectTrash(d: {
  platform: string;
  env: Record<string, string | undefined>;
  root: string;
}): Promise<Trash> {
  if (d.platform === "darwin") {
    if (existsSync("/usr/bin/trash")) return macTrash(true);
    return Bun.which("osascript") !== null ? macTrash(false) : unavailable;
  }
  if (d.platform !== "linux") return unavailable;
  const data =
    d.env.XDG_DATA_HOME ??
    (d.env.HOME ? join(d.env.HOME, ".local/share") : undefined);
  if (data === undefined) return unavailable;
  const home = join(data, "Trash");
  try {
    await mkdir(join(home, "files"), { recursive: true });
    await mkdir(join(home, "info"), { recursive: true });
    const [r, t] = await Promise.all([stat(d.root), stat(home)]);
    return r.dev === t.dev
      ? freedesktopTrash(home, () => new Date())
      : unavailable;
  } catch {
    return unavailable;
  }
}
