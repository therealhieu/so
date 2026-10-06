import { dirname, join } from "node:path";
import type { RootMarker } from "../../core/config/lsp";

/** `dir` and its ancestors up to `workspaceRoot`, nearest first; none when `dir` is outside it. */
function folders(dir: string, workspaceRoot: string): string[] {
  if (dir !== workspaceRoot && !dir.startsWith(`${workspaceRoot}/`)) return [];
  const out = [dir];
  let d = dir;
  while (d !== workspaceRoot) {
    d = dirname(d);
    out.push(d);
  }
  return out;
}

/**
 * The project root for a file in `dir`, searching only `dir` and its
 * ancestors up to `workspaceRoot`. `nearest`: markers in priority order, the
 * first one found anywhere wins at its nearest folder, and a nested list is
 * one priority level. `topmost`: the highest folder containing any marker.
 * Undefined when no folder in range contains a marker. Paths are absolute.
 */
export function findRoot(
  dir: string,
  markers: readonly RootMarker[],
  search: "nearest" | "topmost",
  workspaceRoot: string,
  exists: (p: string) => boolean,
): string | undefined {
  const range = folders(dir, workspaceRoot);
  const holds = (folder: string, level: RootMarker) =>
    (typeof level === "string" ? [level] : level).some((name) =>
      exists(join(folder, name)),
    );
  if (search === "topmost") {
    let top: string | undefined;
    for (const folder of range)
      if (markers.some((level) => holds(folder, level))) top = folder;
    return top;
  }
  for (const level of markers) {
    const found = range.find((folder) => holds(folder, level));
    if (found !== undefined) return found;
  }
  return undefined;
}
