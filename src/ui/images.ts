import {
  imageInfo,
  NativeImage,
  resolveImageRenderProtocol,
  type TerminalCapabilities,
} from "@opentui/core";

/** How an image is drawn: a graphics protocol, block characters, or its name. */
export type ImageTier = "kitty" | "sixel" | "blocks" | "placeholder";

/** The tier for the `preview.images` setting on this terminal. */
export function imageTier(
  images: "auto" | "blocks" | "off",
  caps: TerminalCapabilities | null,
  hasResolution: boolean,
): ImageTier {
  if (images === "off") return "placeholder";
  if (images === "blocks") return "blocks";
  return resolveImageRenderProtocol("auto", caps, hasResolution);
}

type Entry =
  | { kind: "loading" }
  | { kind: "image"; image: NativeImage; bytes: number }
  | { kind: "failed"; at: number };

/**
 * Decoded images by reference (a workspace path or a URL). Each reference
 * loads once; decoded pixels stay within `limitBytes`, least recently drawn
 * first out; a failed load is tried again on the first `get` `retryMs` or
 * more later. Every finished load asks for a repaint.
 */
export class ImageCache {
  private readonly entries = new Map<string, Entry>();
  private total = 0;
  private readonly limitBytes: number;
  private readonly retryMs: number;

  constructor(
    private readonly o: {
      load: (ref: string) => Promise<Uint8Array>;
      repaint: () => void;
      now: () => number;
      /** A cell's size in pixels, when the terminal reports it. */
      cell?: () => { width: number; height: number } | undefined;
      limitBytes?: number;
      retryMs?: number;
    },
  ) {
    this.limitBytes = o.limitBytes ?? 64 * 2 ** 20;
    this.retryMs = o.retryMs ?? 60_000;
  }

  /** The decoded image, a failure, or undefined while it loads (the first call starts the load). */
  get(ref: string): { image: NativeImage } | { failed: true } | undefined {
    const e = this.entries.get(ref);
    if (e?.kind === "image") {
      this.entries.delete(ref);
      this.entries.set(ref, e);
      return { image: e.image };
    }
    if (e?.kind === "loading") return undefined;
    if (e?.kind === "failed" && this.o.now() - e.at < this.retryMs)
      return { failed: true };
    this.start(ref);
    return undefined;
  }

  /** The pixel size of a decoded image. */
  size(ref: string): { width: number; height: number } | undefined {
    const e = this.entries.get(ref);
    return e?.kind === "image"
      ? { width: e.image.width, height: e.image.height }
      : undefined;
  }

  /** A cell's size in pixels, when the terminal reports it. */
  cellPixels(): { width: number; height: number } | undefined {
    return this.o.cell?.();
  }

  /** A cell's size in pixels: the terminal's when it reports one, else 8×16. */
  cellSize(): { width: number; height: number } {
    const c = this.cellPixels();
    return c === undefined || c.width <= 0 || c.height <= 0
      ? { width: 8, height: 16 }
      : c;
  }

  /** Cell width ÷ cell height. */
  cellAspect(): number {
    const c = this.cellSize();
    return c.width / c.height;
  }

  /** Bytes of decoded pixels held. */
  bytes(): number {
    return this.total;
  }

  /** Dispose every decoded image. */
  clear(): void {
    for (const e of this.entries.values())
      if (e.kind === "image") e.image.dispose();
    this.entries.clear();
    this.total = 0;
  }

  private start(ref: string): void {
    const loading: Entry = { kind: "loading" };
    this.entries.set(ref, loading);
    this.o
      .load(ref)
      .then((bytes) => this.decode(bytes))
      .then(
        (decoded) => this.store(ref, loading, decoded),
        () => this.store(ref, loading, undefined),
      );
  }

  private decode(bytes: Uint8Array): Entry {
    // The header gives the size, so an image too large to keep is never decoded.
    const info = imageInfo(bytes);
    if (info.width * info.height * 4 > this.limitBytes)
      throw new Error("image too large");
    const image = NativeImage.decode(bytes);
    return { kind: "image", image, bytes: image.width * image.height * 4 };
  }

  /** Keep a finished load unless the entry was dropped meanwhile, then repaint. */
  private store(ref: string, loading: Entry, done: Entry | undefined): void {
    if (this.entries.get(ref) !== loading) {
      if (done?.kind === "image") done.image.dispose();
      return;
    }
    if (done?.kind === "image") {
      this.entries.set(ref, done);
      this.total += done.bytes;
      this.evict(ref);
    } else this.entries.set(ref, { kind: "failed", at: this.o.now() });
    this.o.repaint();
  }

  /** Dispose least recently used images, other than `keep`, until within the limit. */
  private evict(keep: string): void {
    for (const [ref, e] of this.entries) {
      if (this.total <= this.limitBytes) return;
      if (e.kind !== "image" || ref === keep) continue;
      e.image.dispose();
      this.total -= e.bytes;
      this.entries.delete(ref);
    }
  }
}
