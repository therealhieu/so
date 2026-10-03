import type { AppState, Effect, Result } from "./types";

export const dirname = (path: string): string => {
  const i = path.lastIndexOf("/");
  return i < 0 ? "" : path.slice(0, i);
};

const under = (path: string, root: string) =>
  path === root || path.startsWith(`${root}/`);

/** The root is always listed; other folders while expanded. */
const isListed = (s: AppState, dir: string) =>
  dir === "" || s.panels.explorer.expanded.includes(dir);

/** List again every given folder the explorer shows, once each. */
export function relist(s: AppState, dirs: string[]): Result {
  const effects: Effect[] = [...new Set(dirs)]
    .filter((d) => isListed(s, d))
    .map((dir) => ({ kind: "listDir", dir }));
  return { state: s, effects };
}

/** Forget the listing and expansion of a removed folder and everything below it. */
export function pruneTree(s: AppState, path: string): AppState {
  const ex = s.panels.explorer;
  if (!ex.expanded.some((d) => under(d, path))) return s;
  const entries = Object.fromEntries(
    Object.entries(ex.entries).filter(([d]) => !under(d, path)),
  );
  const expanded = ex.expanded.filter((d) => !under(d, path));
  return {
    ...s,
    panels: { ...s.panels, explorer: { ...ex, entries, expanded } },
  };
}
