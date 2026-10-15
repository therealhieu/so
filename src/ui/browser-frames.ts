import type { WindowId } from "../core/state/types";

/** One frame of a page: PNG bytes, a number that grows per frame, and its acknowledgement. */
export type BrowserFrame = { png: Uint8Array; seq: number; ack: () => void };

/**
 * The latest frame of each browser window's page, kept outside the store:
 * a frame repaints only its window's view, not the whole state. Each frame
 * is acknowledged once, after it or a newer one that replaced it is drawn,
 * so the page sends the next.
 */
export type BrowserFrames = {
  publish(window: WindowId, png: Uint8Array, ack: () => void): void;
  /** Forget window `window`'s frame, acknowledging it. */
  drop(window: WindowId): void;
  latest(window: WindowId): BrowserFrame | undefined;
  /** `cb` runs after each published frame. */
  listen(cb: () => void): void;
};

const once = (f: () => void) => {
  let done = false;
  return () => {
    if (done) return;
    done = true;
    f();
  };
};

export function createBrowserFrames(): BrowserFrames {
  const frames = new Map<WindowId, BrowserFrame>();
  const listeners: (() => void)[] = [];
  let seq = 0;
  return {
    publish(window, png, ack) {
      // Chrome keeps more than one frame in flight: the one replaced is
      // acknowledged with the newest, so the view's pace holds.
      const older = frames.get(window)?.ack;
      const both = () => {
        older?.();
        ack();
      };
      frames.set(window, { png, seq: ++seq, ack: once(both) });
      for (const l of listeners) l();
    },
    drop(window) {
      frames.get(window)?.ack();
      frames.delete(window);
    },
    latest: (window) => frames.get(window),
    listen(cb) {
      listeners.push(cb);
    },
  };
}
