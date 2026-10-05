import { existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { codeFileTypes } from "../core/lang/code/file-types";

/** Whether `file` opens in a code file type. */
function isCode(file: string): boolean {
  const ext = extname(file).toLowerCase();
  const name = basename(file);
  return codeFileTypes.some(
    (ft) =>
      (ft.match.extensions ?? []).includes(ext) ||
      (ft.match.names ?? []).includes(name),
  );
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
 * The workspace folder, and the file to open when `path` names one. A code
 * file opens in its repository, so language servers see the whole project;
 * any other file opens in its own folder.
 */
export async function resolveWorkspace(
  path: string,
  root: (dir: string) => string | undefined = gitRoot,
): Promise<{ root: string; file?: string } | undefined> {
  const abs = resolve(path);
  const st = await stat(abs).catch(() => undefined);
  if (st === undefined) return undefined;
  if (st.isDirectory()) return { root: abs };
  const dir = dirname(abs);
  const repo = isCode(abs) ? root(dir) : undefined;
  return repo === undefined
    ? { root: dir, file: basename(abs) }
    : { root: repo, file: relative(repo, abs) };
}
