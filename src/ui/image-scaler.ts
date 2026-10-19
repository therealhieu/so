import type { RgbaImage } from "../core/state/types";
import type { FromScaleWorker, ToScaleWorker } from "./image-scale-worker";

/**
 * Decodes and scales pictures in a worker, so the main thread never does.
 * `key` names one picture's contents: the worker keeps the last few it
 * decoded, so a size and then a copy of the same key decode once.
 */
export type ImageScaler = {
  /** The picture's size in pixels. */
  size(
    key: string,
    source: Uint8Array | RgbaImage,
  ): Promise<{ width: number; height: number }>;
  /** The picture scaled to `width`×`height`, as a PNG file. */
  scale(
    key: string,
    source: Uint8Array | RgbaImage,
    width: number,
    height: number,
  ): Promise<Uint8Array>;
  stop(): void;
};

/** The worker next to this module, or inside the compiled binary. */
const scaleWorkerUrl = (here: string): URL =>
  new URL(
    here.includes("/$bunfs/")
      ? "./ui/image-scale-worker.ts"
      : "./image-scale-worker.ts",
    here,
  );

type Waiting = {
  resolve: (r: FromScaleWorker) => void;
  reject: (e: Error) => void;
};

/**
 * One worker with one request at a time, the newest waiting one first, so
 * the pictures on screen are made before those scrolled past. A worker that
 * fails or exits fails what it was given; the next request starts a new
 * one. The worker never keeps the process alive.
 */
export function createImageScaler(
  spawn: () => Worker = () =>
    new Worker(scaleWorkerUrl(import.meta.url), { ref: false }),
): ImageScaler {
  const queued: (Waiting & { m: ToScaleWorker })[] = [];
  let running: (Waiting & { m: ToScaleWorker }) | undefined;
  let worker: Worker | undefined;
  let nextId = 1;

  function lost(w: Worker, reason: string): void {
    if (worker !== w) return;
    worker = undefined;
    w.terminate();
    running?.reject(new Error(reason));
    running = undefined;
    next();
  }

  function ensureWorker(): Worker {
    if (worker !== undefined) return worker;
    const w = spawn();
    worker = w;
    w.onmessage = (e: MessageEvent<FromScaleWorker>) => {
      const r = running;
      if (r === undefined || r.m.id !== e.data.id) return;
      running = undefined;
      if ("error" in e.data) r.reject(new Error(e.data.error));
      else r.resolve(e.data);
      next();
    };
    w.addEventListener("error", (e) =>
      lost(w, `image worker failed: ${e.message || "error"}`),
    );
    w.addEventListener("close", () => lost(w, "image worker exited"));
    return w;
  }

  function next(): void {
    if (running !== undefined) return;
    running = queued.pop();
    if (running !== undefined) ensureWorker().postMessage(running.m);
  }

  function ask(m: DistributiveOmit<ToScaleWorker, "id">) {
    return new Promise<FromScaleWorker>((resolve, reject) => {
      queued.push({
        m: { ...m, id: nextId++ } as ToScaleWorker,
        resolve,
        reject,
      });
      next();
    });
  }

  return {
    async size(key, source) {
      const r = await ask({ t: "size", key, source });
      if (!("width" in r)) throw new Error("image worker: no size");
      return { width: r.width, height: r.height };
    },
    async scale(key, source, width, height) {
      const r = await ask({ t: "scale", key, source, width, height });
      if (!("png" in r)) throw new Error("image worker: no copy");
      return r.png;
    },
    stop() {
      for (const q of queued.splice(0)) q.reject(new Error("stopped"));
      if (worker !== undefined) lost(worker, "stopped");
    },
  };
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;
