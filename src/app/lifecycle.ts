import { writeSync } from "node:fs";
import { pendingWrites } from "../core/state/save";
import type { Store } from "../core/state/store";
import type { AppState } from "../core/state/types";
import type { Shell } from "../ui/shell";
import type { EffectRunner } from "./effects";
import { LSP_STOP_BOUND_MS } from "./lsp-host";

/** The longest a shutdown waits for its writes before restoring the terminal. */
export const FLUSH_BOUND_MS = 2000;
/** The longest a shutdown waits for preview pages to receive `stopped`. */
const PREVIEW_STOP_BOUND_MS = 250;

/**
 * Install the process handlers that end `so`. Signals exit 0 and uncaught
 * errors exit 1; both first write every writable buffer (bounded by
 * `FLUSH_BOUND_MS`), then save the session, then stop the browser preview
 * (bounded by `PREVIEW_STOP_BOUND_MS`), then stop the language servers
 * (bounded by `LSP_STOP_BOUND_MS` plus a margin), then restore the terminal
 * once, then name any file left unsaved on stderr. `exitNow` is the `exit`
 * effect after `:q`, which has already saved or was told to discard; it
 * still saves the session. `holdInterrupts` makes SIGINT do nothing until
 * the returned release runs, while another program owns the terminal; holds
 * nest, a second release does nothing, and SIGTERM and SIGHUP still shut down.
 */
export function installLifecycle(d: {
  store: Store;
  shell: Pick<Shell, "destroy">;
  runner: Pick<EffectRunner, "flush">;
  exit?: (code: number) => void;
  /** Saves the session synchronously; a failure must not stop the shutdown. */
  saveSession?: (s: AppState) => void;
  /** Tells connected preview pages the preview stopped, then closes the server. */
  stopPreview?: () => Promise<void>;
  /** Stops every language server; each is killed once its own bound passes. */
  stopLsp?: () => Promise<void>;
}): { exitNow(code: number): void; holdInterrupts(): () => void } {
  let done = false;
  let held = 0;
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
    try {
      d.saveSession?.(d.store.get());
    } catch {}
    try {
      const stopped = d.stopPreview?.().catch(() => {});
      if (stopped !== undefined)
        await Promise.race([stopped, Bun.sleep(PREVIEW_STOP_BOUND_MS)]);
    } catch {}
    try {
      const stopped = d.stopLsp?.().catch(() => {});
      if (stopped !== undefined)
        await Promise.race([stopped, Bun.sleep(LSP_STOP_BOUND_MS + 100)]);
    } catch {}
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
    process.on(signal, () => {
      if (signal === "SIGINT" && held > 0) return;
      void shutdown(0, true);
    });
  process.on("uncaughtException", (e) => void shutdown(1, true, e));
  process.on("unhandledRejection", (e) => void shutdown(1, true, e));
  return {
    exitNow: (code) => void shutdown(code, false),
    holdInterrupts() {
      held++;
      let released = false;
      return () => {
        if (released) return;
        released = true;
        held--;
      };
    },
  };
}
