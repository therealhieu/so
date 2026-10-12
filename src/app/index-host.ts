import type { Action, Effect, FileEvent, SearchHit } from "../core/state/types";
import type { FromWorker, ToWorker } from "../workspace/index-worker";
import type { Logger } from "../workspace/log";

/** The index worker's lifecycle as seen by `main`: start, watcher events, and shutdown. */
export type IndexHost = {
  start(root: string, ignore: string[]): void;
  /** Forward a watcher event, so other programs' changes reach the index. */
  notify(e: FileEvent): void;
  /** A rename or move `so` made, which the watcher stays silent about. */
  moved(from: string, to: string): void;
  /**
   * Search the worker's texts; answers one `searchResults`, empty while the
   * worker is down or when it crashes before answering.
   */
  search(e: Extract<Effect, { kind: "search" }>): void;
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
 * unavailable for the rest of the session. Searches the crashed worker had
 * not answered are answered empty.
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
  /** Search ids posted to the current worker and not yet answered. */
  let searching = new Set<number>();

  const send = (m: ToWorker) => worker?.postMessage(m);
  const answer = (id: number, hits: SearchHit[] = [], capped = false) =>
    d.dispatch({ type: "searchResults", id, hits, capped });

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
      const unanswered = searching;
      searching = new Set();
      for (const id of unanswered) answer(id);
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
          ...(m.facts === undefined ? {} : { facts: m.facts }),
          done: m.done,
          total: m.total,
        });
      } else if (m.t === "ready") {
        d.logger.info("index.ready", {
          notes,
          ms: Math.round(performance.now() - startedAt),
        });
        d.dispatch({ type: "indexReady" });
      } else if (m.t === "results") {
        searching.delete(m.id);
        answer(m.id, m.hits, m.capped ?? false);
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
      else send({ t: "changed", paths: [e.path] });
    },
    moved(from, to) {
      send({ t: "moved", from, to });
    },
    search(e) {
      if (worker === undefined) {
        answer(e.id);
        return;
      }
      searching.add(e.id);
      const { kind: _, ...rest } = e;
      send({ t: "search", ...rest });
    },
    stop() {
      stopped = true;
      worker?.terminate();
      worker = undefined;
    },
  };
}
