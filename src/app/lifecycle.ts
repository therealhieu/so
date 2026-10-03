import { writeSync } from "node:fs";
import { pendingWrites } from "../core/state/save";
import type { Store } from "../core/state/store";
import type { Shell } from "../ui/shell";
import type { EffectRunner } from "./effects";

/** The longest a shutdown waits for its writes before restoring the terminal. */
export const FLUSH_BOUND_MS = 2000;

/**
 * Install the process handlers that end `so`. Signals exit 0 and uncaught
 * errors exit 1; both first write every writable buffer (bounded by
 * `FLUSH_BOUND_MS`), then restore the terminal once, then name any file
 * left unsaved on stderr. `exitNow` is the `exit` effect after `:q`, which
 * has already saved or was told to discard.
 */
export function installLifecycle(d: {
  store: Store;
  shell: Shell;
  runner: EffectRunner;
  exit?: (code: number) => void;
}): { exitNow(code: number): void } {
  let done = false;
  const shutdown = async (code: number, flush: boolean, error?: unknown) => {
    if (done) return;
    done = true;
    const writes = flush ? pendingWrites(d.store.get()) : [];
    const saved = new Set<string>();
    const all = Promise.all(
      writes.map((w) =>
        d.runner.flush([w]).then(
          () => saved.add(w.path),
          () => {},
        ),
      ),
    );
    await Promise.race([all, Bun.sleep(FLUSH_BOUND_MS)]);
    d.shell.destroy();
    // Written after the restore, so the lines land on the main screen, and
    // synchronously, so they are not lost to the exit that follows.
    const lines: string[] = [];
    if (error !== undefined) lines.push(`so: ${String(error)}`);
    if (flush)
      for (const b of Object.values(d.store.get().buffers))
        if (b.dirty && !saved.has(b.path)) lines.push(`so: unsaved: ${b.path}`);
    if (lines.length > 0) writeSync(2, `${lines.join("\n")}\n`);
    (d.exit ?? process.exit)(code);
  };
  for (const signal of ["SIGTERM", "SIGHUP", "SIGINT"] as const)
    process.on(signal, () => void shutdown(0, true));
  process.on("uncaughtException", (e) => void shutdown(1, true, e));
  process.on("unhandledRejection", (e) => void shutdown(1, true, e));
  return { exitNow: (code) => void shutdown(code, false) };
}
