import { NativeImage } from "@opentui/core";
import type { RgbaImage } from "../core/state/types";
import type { ImageScaler } from "./image-scaler";
import { pictureSize } from "./picture-size";

type Source = Uint8Array | RgbaImage;

/** The copy the terminal gets: the size asked for last, and the newest copy made. */
type Copy = {
  width: number;
  height: number;
  image?: NativeImage;
  bytes: number;
  pending: boolean;
  failed: boolean;
};

type Entry =
  | { kind: "loading" }
  | { kind: "failed"; at: number }
  | {
      kind: "ready";
      /** Names these contents to the scaler; a reload gets a new one. */
      key: string;
      source: Source;
      width: number;
      height: number;
      bytes: number;
      copy?: Copy;
    };

type Ready = Extract<Entry, { kind: "ready" }>;

const sourceBytes = (s: Source) =>
  s instanceof Uint8Array ? s.byteLength : s.rgba.byteLength;

/**
 * Pictures in notes, for a kitty terminal. The main thread only loads their
 * files and reads their sizes from the headers; `scaler` decodes the rest
 * (a size no header tells, and every copy). The copy the terminal gets is
 * scaled down to the box it shows in and PNG-encoded, so the terminal
 * takes a picture once, at its shown size. Files and copies stay within
 * `limitBytes`, least recently used first out; a failed load is tried again
 * `retryMs` or more later. Every finished load or copy asks for a repaint.
 */
export class NotePictures {
  private readonly entries = new Map<string, Entry>();
  private total = 0;
  private loads = 0;
  private readonly limitBytes: number;
  private readonly retryMs: number;

  constructor(
    private readonly o: {
      load: (ref: string) => Promise<Source>;
      scaler: Pick<ImageScaler, "size" | "scale">;
      repaint: () => void;
      now: () => number;
      limitBytes?: number;
      retryMs?: number;
    },
  ) {
    this.limitBytes = o.limitBytes ?? 64 * 2 ** 20;
    this.retryMs = o.retryMs ?? 60_000;
  }

  /** The picture's size in pixels: undefined while it loads (the first call starts it), or a failure. */
  size(
    ref: string,
  ): { width: number; height: number } | { failed: true } | undefined {
    const e = this.entries.get(ref);
    if (e?.kind === "ready") {
      this.touch(ref, e);
      return { width: e.width, height: e.height };
    }
    if (e?.kind === "loading") return undefined;
    if (e?.kind === "failed" && this.o.now() - e.at < this.retryMs)
      return { failed: true };
    this.start(ref);
    return undefined;
  }

  /**
   * The picture for a terminal box of `width`×`height` pixels, scaled down
   * to fit it. While that copy is made, the copy made for an earlier box,
   * else undefined; `failed` when no copy can be made.
   */
  copy(
    ref: string,
    width: number,
    height: number,
  ): NativeImage | "failed" | undefined {
    const e = this.entries.get(ref);
    if (e?.kind !== "ready") return undefined;
    this.touch(ref, e);
    const ratio = Math.min(1, width / e.width, height / e.height);
    const w = Math.max(1, Math.round(e.width * ratio));
    const h = Math.max(1, Math.round(e.height * ratio));
    const c = e.copy;
    if (c?.width === w && c.height === h) return c.failed ? "failed" : c.image;
    const next: Copy = {
      width: w,
      height: h,
      bytes: c?.bytes ?? 0,
      pending: true,
      failed: false,
      ...(c?.image === undefined ? {} : { image: c.image }),
    };
    e.copy = next;
    const current = () => this.entries.get(ref) === e && e.copy === next;
    this.o.scaler
      .scale(e.key, e.source, w, h)
      .then((png) => ({ png, image: NativeImage.decode(png) }))
      .then(
        ({ png, image }) => {
          if (!current()) return image.dispose();
          next.image?.dispose();
          this.total += png.byteLength - next.bytes;
          next.image = image;
          next.bytes = png.byteLength;
          next.pending = false;
          this.evict(ref);
          this.o.repaint();
        },
        () => {
          if (!current()) return;
          next.pending = false;
          next.failed = true;
          this.o.repaint();
        },
      );
    return next.image;
  }

  /**
   * Drop what is held for workspace `path` (and, for a folder, every path
   * below it) after it changed or went away on disk; a load or copy still
   * running is discarded when it finishes.
   */
  forget(path: string): void {
    for (const [ref, e] of this.entries) {
      if (ref !== path && !ref.startsWith(`${path}/`)) continue;
      if (e.kind === "ready") this.drop(e);
      this.entries.delete(ref);
    }
  }

  /** Dispose every copy. */
  clear(): void {
    for (const e of this.entries.values()) if (e.kind === "ready") this.drop(e);
    this.entries.clear();
    this.total = 0;
  }

  private start(ref: string): void {
    const loading: Entry = { kind: "loading" };
    this.entries.set(ref, loading);
    const key = `${ref}#${++this.loads}`;
    this.o
      .load(ref)
      .then(async (source) => {
        const size =
          source instanceof Uint8Array
            ? (pictureSize(source) ?? (await this.o.scaler.size(key, source)))
            : { width: source.width, height: source.height };
        return { source, ...size };
      })
      .then(
        ({ source, width, height }) => {
          if (this.entries.get(ref) !== loading) return;
          const bytes = sourceBytes(source);
          this.entries.set(ref, {
            kind: "ready",
            key,
            source,
            width,
            height,
            bytes,
          });
          this.total += bytes;
          this.evict(ref);
          this.o.repaint();
        },
        () => {
          if (this.entries.get(ref) !== loading) return;
          this.entries.set(ref, { kind: "failed", at: this.o.now() });
          this.o.repaint();
        },
      );
  }

  private touch(ref: string, e: Entry): void {
    this.entries.delete(ref);
    this.entries.set(ref, e);
  }

  /** Dispose what `e` holds and stop counting it. */
  private drop(e: Ready): void {
    e.copy?.image?.dispose();
    this.total -= e.bytes + (e.copy?.bytes ?? 0);
  }

  /** Drop least recently used pictures, other than `keep`, until within the limit. */
  private evict(keep: string): void {
    for (const [ref, e] of this.entries) {
      if (this.total <= this.limitBytes) return;
      if (e.kind !== "ready" || ref === keep) continue;
      this.drop(e);
      this.entries.delete(ref);
    }
  }
}
