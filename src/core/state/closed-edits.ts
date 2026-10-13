import { bufferForPath } from "./buffers";
import { summarizeWritten } from "./index";
import { sameStamp } from "./pdf";
import { none } from "./result";
import type { AppState, Result, Stamp } from "./types";

/** A batch of closed-file writes: files still to write, written, and skipped. */
type EditProgress = {
  pending: string[];
  updated: string[];
  skipped: { path: string; reason: string }[];
};

type FileWritten = {
  path: string;
  ok: boolean;
  text?: string;
  stamp?: Stamp;
  reason?: string;
};

/**
 * A closed file's write answered. The index takes the written text, and a
 * buffer opened for the file while it was being written (it holds the text
 * from before) reads it back, so a clean buffer reloads and a dirty one
 * raises the conflict instead of its next save overwriting the write.
 */
export function onClosedFileWritten(s: AppState, a: FileWritten): Result {
  if (!a.ok) return none(s);
  const written =
    a.text === undefined ? s : summarizeWritten(s, a.path, a.text, a.stamp);
  const b = bufferForPath(written, a.path);
  return b === undefined || sameStamp(a.stamp, b.stamp)
    ? none(written)
    : { state: written, effects: [{ kind: "read", path: a.path }] };
}

/** One closed file's result moves it from `pending` to `updated` or `skipped`. */
export function settle<T extends EditProgress>(e: T, a: FileWritten): T {
  return {
    ...e,
    pending: e.pending.filter((p) => p !== a.path),
    updated: a.ok ? [...e.updated, a.path] : e.updated,
    skipped: a.ok
      ? e.skipped
      : [...e.skipped, { path: a.path, reason: a.reason ?? "unknown error" }],
  };
}

/** "skipped: a.ts, b.ts (reason); c.ts (other reason)". */
export function skippedText(skipped: EditProgress["skipped"]): string {
  const byReason = new Map<string, string[]>();
  for (const { path, reason } of skipped)
    byReason.set(reason, [...(byReason.get(reason) ?? []), path]);
  const text = [...byReason]
    .map(([reason, paths]) => `${paths.join(", ")} (${reason})`)
    .join("; ");
  return `skipped: ${text}`;
}
