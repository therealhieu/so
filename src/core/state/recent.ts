export const RECENT_LIMIT = 100;

/** `path` first, any older entry for it removed, at most `RECENT_LIMIT` paths. */
export function touchRecent(recent: readonly string[], path: string): string[] {
  return [path, ...recent.filter((p) => p !== path)].slice(0, RECENT_LIMIT);
}
