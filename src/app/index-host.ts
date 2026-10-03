import type { Action, FileEvent } from "../core/state/types";
import type { FromWorker, ToWorker } from "../workspace/index-worker";
import type { Logger } from "../workspace/log";

/** The index worker's lifecycle as seen by `main`: start, watcher events, and shutdown. */
export type IndexHost = {
  start(root: string, ignore: string[]): void;
  /** Forward a watcher event, so other programs' changes reach the index. */
  notify(e: FileEvent): void;
  stop(): void;
};

/**
 * The worker entry next to this module. A compiled binary keeps every entry
 * point under one root with the main entry at its top, so `app/` is gone there.
 */
export const workerUrl = (here: string): URL =>
  new URL(
    here.includes("/$bunfs/")
      ? "./workspace/index-worker.ts"
      : "../workspace/index-worker.ts",
    here,
  );

const spawnWorker = () => new Worker(workerUrl(import.meta.url));

/**
 * Spawn the index worker and turn its messages into actions. An `error`
 * message, an `error` event, or an exit before `stop` is a crash: the first
 * one restarts the worker with a fresh scan, the second leaves the index
 * unavailable for the rest of the session.
 */
export function createIndexHost(d: {
  dispatch: (a: Action) => void;
  logger: Logger;
  spawn?: () => Worker;
}): IndexHost {
  const spawn = d.spawn ?? spawnWorker;
  let scan: ToWorker | undefined;
  let worker: Worker | undefined;
  let crashes = 0;
  let stopped = false;

  const send = (m: ToWorker) => worker?.postMessage(m);

  function launch(): void {
    if (scan === undefined) return;
    const w = spawn();
    const startedAt = performance.now();
    let notes = 0;
    worker = w;
    const crashed = (reason: string) => {
      if (stopped || worker !== w) return;
      worker = undefined;
      w.terminate();
      crashes++;
      const final = crashes > 1;
      d.logger.error("index.crashed", { reason, final });
      d.dispatch({ type: "indexFailed", final, reason });
      if (!final) launch();
    };
    w.onmessage = (e: MessageEvent<FromWorker>) => {
      if (worker !== w) return;
      const m = e.data;
      if (m.t === "batch") {
        if (m.total > 0) notes = m.total;
        d.dispatch({
          type: "indexBatch",
          summaries: m.summaries,
          files: m.files ?? [],
          done: m.done,
          total: m.total,
        });
      } else if (m.t === "ready") {
        d.logger.info("index.ready", {
          notes,
          ms: Math.round(performance.now() - startedAt),
        });
        d.dispatch({ type: "indexReady" });
      } else if (m.t === "error") crashed(m.message);
    };
    w.addEventListener("error", (e) => crashed(e.message || "worker error"));
    w.addEventListener("close", () => crashed("worker exited"));
    d.logger.info("index.start", { attempt: crashes + 1 });
    w.postMessage(scan);
  }

  return {
    start(root, ignore) {
      if (scan !== undefined) return;
      scan = { t: "scan", root, ignore };
      launch();
    },
    notify(e) {
      if (e.kind === "removed") send({ t: "removed", paths: [e.path] });
      else if (!e.isDir) send({ t: "changed", paths: [e.path] });
    },
    stop() {
      stopped = true;
      worker?.terminate();
      worker = undefined;
    },
  };
}
