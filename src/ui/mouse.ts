import type { MouseEvent as OpenTuiMouseEvent } from "@opentui/core";
import type { Action, MouseEvent, MouseTarget } from "../core/state/types";

/** Presses on the same cell this close together count as one multi-click. */
export const CLICK_MS = 500;

/** A view that can say what is under a screen cell, from its last layout. */
export type MouseSource = {
  /** `undefined` when the cell is not this view's or the view is hidden. */
  targetAt(x: number, y: number): MouseTarget | undefined;
  /** Where a drag that started on this source at `from` is now, clamped to it. */
  dragAt?(x: number, y: number, from: MouseTarget): MouseTarget | undefined;
};

/** The parts of an OpenTUI mouse event the router reads. */
type PointerEvent = Pick<
  OpenTuiMouseEvent,
  "type" | "button" | "x" | "y" | "modifiers" | "scroll"
>;

export type MouseRouter = { handle(e: PointerEvent): void };

const LEFT = 0;

const WHEEL: Record<string, { dx: -1 | 0 | 1; dy: -1 | 0 | 1 }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

const isWindowText = (t: MouseTarget) =>
  t.kind === "window" && t.spot.kind === "text";

/**
 * Turn OpenTUI mouse events into core mouse actions: drop everything while
 * `enabled()` is false and every button but the left one, ask `sources`
 * (top of the z-order first) for the target, count clicks on one cell, and
 * keep a drag with the source its press landed on, sending each new drag
 * target once.
 */
export function createMouseRouter(o: {
  sources: readonly MouseSource[];
  enabled: () => boolean;
  dispatch: (a: Action) => void;
  now: () => number;
}): MouseRouter {
  let last: { x: number; y: number; at: number; clicks: 1 | 2 | 3 } | undefined;
  let origin: { source: MouseSource; target: MouseTarget } | undefined;
  let lastDrag: string | undefined;

  const resolve = (x: number, y: number) => {
    for (const source of o.sources) {
      const target = source.targetAt(x, y);
      if (target !== undefined) return { source, target };
    }
    return undefined;
  };
  const send = (event: MouseEvent, now = o.now()) =>
    o.dispatch({ type: "mouse", event, now });

  return {
    handle(e) {
      if (!o.enabled()) return;
      switch (e.type) {
        case "scroll": {
          const step = WHEEL[e.scroll?.direction ?? ""];
          const hit = resolve(e.x, e.y);
          if (step === undefined || hit === undefined) return;
          send({ kind: "wheel", target: hit.target, ...step });
          return;
        }
        case "down": {
          if (e.button !== LEFT) return;
          origin = undefined;
          lastDrag = undefined;
          const hit = resolve(e.x, e.y);
          if (hit === undefined) return;
          const now = o.now();
          const again =
            last !== undefined &&
            last.x === e.x &&
            last.y === e.y &&
            now - last.at <= CLICK_MS;
          const clicks =
            again && last ? (((last.clicks % 3) + 1) as 1 | 2 | 3) : 1;
          last = { x: e.x, y: e.y, at: now, clicks };
          origin = hit;
          send(
            {
              kind: "press",
              target: hit.target,
              clicks,
              ctrl: e.modifiers.ctrl,
            },
            now,
          );
          return;
        }
        case "drag": {
          if (e.button !== LEFT || origin === undefined) return;
          if (!isWindowText(origin.target)) return;
          const target = origin.source.dragAt?.(e.x, e.y, origin.target);
          if (target === undefined) return;
          const key = JSON.stringify(target);
          if (key === lastDrag) return;
          lastDrag = key;
          send({ kind: "drag", target });
          return;
        }
        case "up":
        case "drag-end":
          origin = undefined;
          lastDrag = undefined;
          return;
      }
    },
  };
}
