import {
  NativeImage,
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import type { AppState } from "../core/state/types";

/** Where an image goes this frame: cells, their size in pixels, and the share of its rows shown. */
export type ImageDraw = {
  x: number;
  y: number;
  cols: number;
  rows: number;
  pixelWidth: number;
  pixelHeight: number;
  /** Rows shown ÷ all its rows; less than 1 where a window cuts it. */
  shown: number;
};

/** The `nth` draw of `ref` in a frame, showing `image` through a handle of its own. */
type Slot = {
  ref: string;
  nth: number;
  image: NativeImage;
  own: NativeImage;
  bytes: number;
  shownAt: number;
};

/**
 * Note pictures as kitty images, drawn after the windows and before
 * anything that covers them.
 *
 * OpenTUI names a kitty image by its place among the images drawn in a
 * frame and uploads it again whenever that place shows another image, so
 * each picture here keeps its place while it is held: on screen, or, once
 * scrolled away, drawn on the statusline's first cell, which the statusline
 * then paints over, so the terminal keeps it without showing it. Held
 * pictures stay within `limitBytes` of terminal pixels, least recently
 * shown first out; a place they free holds a transparent pixel until
 * another picture takes it.
 *
 * With `settleMs`, a picture not held yet is sent only once it has been
 * drawn in every frame for that long, then `repaint` brings the frame that
 * sends it: pictures a fast scroll carries past cost the terminal nothing.
 */
export class ImageSlots extends Renderable {
  private slots: (Slot | undefined)[] = [];
  private readonly frame = new Map<
    string,
    { image: NativeImage; d: ImageDraw }[]
  >();
  private readonly gap = NativeImage.fromRgba(new Uint8Array(4), 1, 1);
  private frames = 0;
  private hiddenY = 0;
  /** When each draw not held yet was first asked for, while asked for in every frame since. */
  private waiting = new Map<string, number>();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private readonly limitBytes: number;
  private readonly settleMs: number;

  constructor(
    ctx: RenderContext,
    private readonly o: {
      limitBytes?: number;
      settleMs?: number;
      now?: () => number;
      repaint?: () => void;
    } = {},
  ) {
    super(ctx, { position: "absolute", left: 0, top: 0 });
    this.limitBytes = o.limitBytes ?? 64 * 2 ** 20;
    this.settleMs = o.settleMs ?? 0;
  }

  update(s: AppState): void {
    this.width = s.terminal.cols;
    this.height = s.terminal.rows;
    this.hiddenY = s.terminal.rows - 1;
  }

  /** Draw `image`, the picture `ref`, as `d` this frame. */
  draw(ref: string, image: NativeImage, d: ImageDraw): void {
    const draws = this.frame.get(ref);
    if (draws === undefined) this.frame.set(ref, [{ image, d }]);
    else draws.push({ image, d });
  }

  /** Let go of the pictures of workspace `path` (and below it) after it changed on disk. */
  forget(path: string): void {
    this.slots.forEach((s, i) => {
      if (s === undefined || (s.ref !== path && !s.ref.startsWith(`${path}/`)))
        return;
      s.own.dispose();
      this.slots[i] = undefined;
    });
  }

  /** Let go of every picture held. */
  clear(): void {
    for (const s of this.slots) s?.own.dispose();
    this.slots = [];
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    this.frames++;
    const shown = new Map<Slot, ImageDraw>();
    for (const slot of this.slots) {
      const f = slot && this.frame.get(slot.ref)?.[slot.nth];
      if (slot === undefined || f === undefined) continue;
      if (f.image !== slot.image) {
        slot.own.dispose();
        slot.own = f.image.retain();
        slot.image = f.image;
        slot.bytes = f.image.width * f.image.height * 4;
      }
      slot.shownAt = this.frames;
      shown.set(slot, f.d);
    }
    const now = this.o.now?.() ?? performance.now();
    const waiting = new Map<string, number>();
    let wait = Number.POSITIVE_INFINITY;
    for (const [ref, draws] of this.frame)
      draws.forEach(({ image, d }, nth) => {
        if (this.slots.some((s) => s?.ref === ref && s.nth === nth)) return;
        if (this.settleMs > 0) {
          const key = `${nth}:${ref}`;
          const since = this.waiting.get(key) ?? now;
          if (now - since < this.settleMs) {
            waiting.set(key, since);
            wait = Math.min(wait, since + this.settleMs - now);
            return;
          }
        }
        const slot: Slot = {
          ref,
          nth,
          image,
          own: image.retain(),
          bytes: image.width * image.height * 4,
          shownAt: this.frames,
        };
        const free = this.slots.indexOf(undefined);
        if (free < 0) this.slots.push(slot);
        else this.slots[free] = slot;
        shown.set(slot, d);
      });
    this.frame.clear();
    this.waiting = waiting;
    clearTimeout(this.timer);
    this.timer =
      wait === Number.POSITIVE_INFINITY
        ? undefined
        : setTimeout(
            () => (this.o.repaint ?? (() => this.requestRender()))(),
            wait,
          );
    this.release(shown);
    for (const slot of this.slots) {
      const d = slot && shown.get(slot);
      if (slot === undefined) this.hide(buf, this.gap);
      else if (d === undefined) this.hide(buf, slot.own);
      else
        buf.drawImage(
          slot.own,
          d.x,
          d.y,
          d.cols,
          d.rows,
          d.pixelWidth,
          d.pixelHeight,
          0,
          0,
          slot.own.width,
          Math.max(1, Math.round(slot.own.height * d.shown)),
          "kitty",
        );
    }
  }

  protected override destroySelf(): void {
    clearTimeout(this.timer);
    this.clear();
    this.gap.dispose();
    super.destroySelf();
  }

  /** Draw `image` where the statusline paints next, so it stays uploaded but unseen. */
  private hide(buf: OptimizedBuffer, image: NativeImage): void {
    buf.drawImage(
      image,
      0,
      this.hiddenY,
      1,
      1,
      0,
      0,
      0,
      0,
      image.width,
      image.height,
      "kitty",
    );
  }

  /** Free held pictures not on screen, least recently shown first, until within the limit; trim free places at the end. */
  private release(shown: ReadonlyMap<Slot, ImageDraw>): void {
    let total = 0;
    for (const s of this.slots) total += s?.bytes ?? 0;
    const held = this.slots
      .map((s, i) => ({ s, i }))
      .filter(
        (x): x is { s: Slot; i: number } =>
          x.s !== undefined && !shown.has(x.s),
      )
      .sort((a, b) => a.s.shownAt - b.s.shownAt);
    for (const { s, i } of held) {
      if (total <= this.limitBytes) break;
      s.own.dispose();
      total -= s.bytes;
      this.slots[i] = undefined;
    }
    while (this.slots.length > 0 && this.slots.at(-1) === undefined)
      this.slots.pop();
  }
}
