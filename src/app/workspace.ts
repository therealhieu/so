import { existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { codeFileTypes } from "../core/lang/code/file-types";

/** The code file type `file` opens in, if any. */
function codeFileType(file: string): string | undefined {
  const ext = extname(file).toLowerCase();
  const name = basename(file);
  return codeFileTypes.find(
    (ft) =>
      (ft.match.extensions ?? []).includes(ext) ||
      (ft.match.names ?? []).includes(name),
  )?.id;
}

/**
 * The nearest folder from `dir` up that holds `.git` (a folder, or a file in
 * a worktree). The home folder and the file-system root are never chosen, so
 * a dotfiles repository does not make the whole home folder a workspace.
 */
export function gitRoot(
  dir: string,
  exists: (p: string) => boolean = existsSync,
  home: string = homedir(),
): string | undefined {
  for (let d = dir; ; d = dirname(d)) {
    if (d === home || dirname(d) === d) return undefined;
    if (exists(join(d, ".git"))) return d;
  }
}

/**
 * The workspace folder, and the file to open when `path` names one. A file
 * a language server serves (its file type is in `served`) opens in its
 * repository, so the server sees the whole project; any other file opens in
 * its own folder.
 */
export async function resolveWorkspace(
  path: string,
  served: ReadonlySet<string>,
  root: (dir: string) => string | undefined = gitRoot,
): Promise<{ root: string; file?: string } | undefined> {
  const abs = resolve(path);
  const st = await stat(abs).catch(() => undefined);
  if (st === undefined) return undefined;
  if (st.isDirectory()) return { root: abs };
  const dir = dirname(abs);
  const type = codeFileType(abs);
  const repo = type !== undefined && served.has(type) ? root(dir) : undefined;
  return repo === undefined
    ? { root: dir, file: basename(abs) }
    : { root: repo, file: relative(repo, abs) };
}
