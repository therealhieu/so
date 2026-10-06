import type { Stats } from "node:fs";
import {
  link,
  lstat,
  mkdir,
  open,
  readdir,
  readFile,
  realpath,
  rename,
  rm,
  stat,
} from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import type { DirEntry, Stamp, TextFile } from "../core/state/types";
import type { ExclusionMatcher } from "./ignore";

const MAX_TEXT_BYTES = 16 * 1024 * 1024;
const SNIFF_BYTES = 8192;

/** A file-system failure whose message is the reason shown to the user. */
export class FsError extends Error {
  /** errno errors keep "CODE: description" without the paths node appends. */
  static from(e: unknown): FsError {
    if (e instanceof FsError) return e;
    if (e instanceof Error) {
      const code = (e as NodeJS.ErrnoException).code;
      return new FsError(code ? (e.message.split(", ")[0] ?? code) : e.message);
    }
    return new FsError(String(e));
  }
}

export const sameStamp = (a: Stamp | undefined, b: Stamp): boolean =>
  a !== undefined &&
  a.mtimeMs === b.mtimeMs &&
  a.size === b.size &&
  a.hash === b.hash;

const stampOfBytes = (st: Stats, bytes: Uint8Array): Stamp => ({
  mtimeMs: st.mtimeMs,
  size: bytes.byteLength,
  hash: Bun.hash(bytes).toString(16),
});

/** The stamp of the file at `path` as it is now; `st` is its current stat. */
export async function stampOfFile(path: string, st: Stats): Promise<Stamp> {
  return stampOfBytes(st, await readFile(path));
}

/**
 * Open policy: over 16 MiB → tooLarge; a NUL in the first 8 KiB or invalid
 * UTF-8 → binary; any read error → io. The BOM is stripped and reported.
 */
export async function readTextFile(
  path: string,
): Promise<TextFile | { refused: "binary" | "tooLarge" | "io" }> {
  let st: Stats;
  let bytes: Uint8Array;
  try {
    const fd = await open(path, "r");
    try {
      st = await fd.stat();
      if (st.size > MAX_TEXT_BYTES) return { refused: "tooLarge" };
      bytes = await fd.readFile();
    } finally {
      await fd.close();
    }
  } catch {
    return { refused: "io" };
  }
  if (bytes.byteLength > MAX_TEXT_BYTES) return { refused: "tooLarge" };
  if (bytes.subarray(0, SNIFF_BYTES).includes(0)) return { refused: "binary" };
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
      bytes,
    );
  } catch {
    return { refused: "binary" };
  }
  const bom = text.startsWith("﻿");
  return {
    text: bom ? text.slice(1) : text,
    bom,
    eol: text.includes("\r\n") ? "\r\n" : "\n",
    stamp: stampOfBytes(st, bytes),
    createdMs: st.birthtimeMs > 0 ? st.birthtimeMs : st.mtimeMs,
  };
}

const statOrNull = (p: string) => stat(p).catch(() => null);
const realpathOrSelf = (p: string) => realpath(p).catch(() => p);

/**
 * Replace `path` with `text` atomically: old or new file on any failure, and
 * no temp file left behind. With `expected`, a file that changed since it was
 * seen is not overwritten (`FsError("conflict")`). The temp file is private
 * until it takes the original file's mode.
 */
export async function atomicWrite(
  path: string,
  text: string,
  expected?: Stamp,
): Promise<Stamp> {
  const target = await realpathOrSelf(path);
  const cur = await statOrNull(target);
  if (expected && cur && !sameStamp(await stampOfFile(target, cur), expected))
    throw new FsError("conflict");
  const tmp = join(
    dirname(target),
    `.${basename(target)}.so-tmp-${process.pid}`,
  );
  const bytes = new TextEncoder().encode(text);
  try {
    // A leftover temp (crash, reused pid) or a planted link is removed, and
    // "wx" refuses any entry that reappears, so the temp is always new and private.
    await rm(tmp, { force: true });
    const fd = await open(tmp, "wx", 0o600);
    let st: Stats;
    try {
      await fd.writeFile(bytes);
      await fd.sync();
      await fd.chmod(cur ? cur.mode & 0o7777 : 0o644);
      st = await fd.stat();
    } finally {
      await fd.close();
    }
    await rename(tmp, target);
    return stampOfBytes(st, bytes);
  } catch (e) {
    await rm(tmp, { force: true });
    throw FsError.from(e);
  }
}

/** Whether anything, even a dangling link, is at `p`. */
export const exists = (p: string) =>
  lstat(p).then(
    () => true,
    () => false,
  );

const e13 = (rel: string) => new FsError(`E13: File exists (${rel})`);

/**
 * One folder's entries without excluded ones, folders first; symlinks report
 * their target's kind. `dotfiles` lists dot entries other than `.git`.
 */
export async function listDir(
  root: string,
  rel: string,
  matcher: ExclusionMatcher,
  dotfiles = false,
): Promise<DirEntry[]> {
  const dir = join(root, rel);
  const entries: DirEntry[] = [];
  for (const d of await readdir(dir, { withFileTypes: true })) {
    const isDir = d.isSymbolicLink()
      ? ((await statOrNull(join(dir, d.name)))?.isDirectory() ?? false)
      : d.isDirectory();
    const path = rel ? `${rel}/${d.name}` : d.name;
    if (matcher.isExcluded(path, isDir, dotfiles)) continue;
    entries.push({ name: d.name, kind: isDir ? "dir" : "file" });
  }
  return entries.sort((a, b) =>
    a.kind !== b.kind
      ? a.kind === "dir"
        ? -1
        : 1
      : a.name < b.name
        ? -1
        : a.name > b.name
          ? 1
          : 0,
  );
}

/** Create an empty file or a folder, with missing parents; never replaces an entry (E13). */
export async function createEntry(
  root: string,
  rel: string,
  dir: boolean,
): Promise<void> {
  const p = join(root, rel);
  await mkdir(dirname(p), { recursive: true });
  try {
    if (dir) await mkdir(p);
    else await (await open(p, "wx")).close();
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "EEXIST") throw e13(rel);
    throw FsError.from(e);
  }
}

/** Errors of `link()` on a file system without hard links. */
const NO_HARD_LINKS = new Set(["EPERM", "ENOTSUP", "EXDEV", "EOPNOTSUPP"]);

const errCode = (e: unknown) => (e as NodeJS.ErrnoException).code;

/**
 * Create `rel` with `text`, with missing parents, never replacing an entry:
 * a private temp file is written and synced, then published with `link()`,
 * which fails with EEXIST when anything exists at the target (on a
 * case-insensitive volume, also a case variant). A file system without hard
 * links falls back to an exclusive open of the target (`fallback`), which is
 * still exclusive but not atomic against a crash mid-write. No temp file
 * remains on any path.
 */
export async function createExclusive(
  root: string,
  rel: string,
  text: string,
): Promise<
  { created: true; stamp: Stamp; fallback?: true } | { created: false }
> {
  const target = join(root, rel);
  const tmp = join(
    dirname(target),
    `.${basename(target)}.so-new-${process.pid}`,
  );
  const bytes = new TextEncoder().encode(text);
  try {
    await mkdir(dirname(target), { recursive: true });
    await rm(tmp, { force: true });
    const fd = await open(tmp, "wx", 0o600);
    let st: Stats;
    try {
      await fd.writeFile(bytes);
      await fd.sync();
      await fd.chmod(0o644);
      st = await fd.stat();
    } finally {
      await fd.close();
    }
    try {
      await link(tmp, target);
      return { created: true, stamp: stampOfBytes(st, bytes) };
    } catch (e) {
      if (errCode(e) === "EEXIST") return { created: false };
      if (!NO_HARD_LINKS.has(errCode(e) ?? "")) throw e;
    }
    return await createByOpen(target, bytes);
  } catch (e) {
    throw FsError.from(e);
  } finally {
    await rm(tmp, { force: true });
  }
}

/** Exclusive create without hard links; a target this call made is removed when its write fails. */
async function createByOpen(
  target: string,
  bytes: Uint8Array,
): Promise<
  { created: true; stamp: Stamp; fallback: true } | { created: false }
> {
  let fd: Awaited<ReturnType<typeof open>>;
  try {
    fd = await open(target, "wx", 0o644);
  } catch (e) {
    if (errCode(e) === "EEXIST") return { created: false };
    throw e;
  }
  try {
    await fd.writeFile(bytes);
    await fd.sync();
    const st = await fd.stat();
    return { created: true, stamp: stampOfBytes(st, bytes), fallback: true };
  } catch (e) {
    await rm(target, { force: true });
    throw e;
  } finally {
    await fd.close();
  }
}

/**
 * Rename or move, creating missing parents; refuses an existing target (E13).
 * A concurrent external create of the target between check and rename is an
 * accepted race: POSIX rename cannot refuse to replace portably.
 */
export async function moveEntry(
  root: string,
  from: string,
  to: string,
): Promise<void> {
  if (await exists(join(root, to))) throw e13(to);
  try {
    await mkdir(dirname(join(root, to)), { recursive: true });
    await rename(join(root, from), join(root, to));
  } catch (e) {
    throw FsError.from(e);
  }
}

/** Permanent deletion of a file or a whole folder. */
export async function removeEntry(root: string, rel: string): Promise<void> {
  try {
    await rm(join(root, rel), { recursive: true });
  } catch (e) {
    throw FsError.from(e);
  }
}
