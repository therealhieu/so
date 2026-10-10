import {
  type MouseEvent as OpenTuiMouseEvent,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import type {
  Action,
  AppState,
  MouseEvent,
  MouseTarget,
} from "../core/state/types";

/** Presses on the same cell this close together count as one multi-click. */
export const CLICK_MS = 500;

/** A view that can say what is under a screen cell, from its last layout. */
export type MouseSource = {
  /** `undefined` when the cell is not this view's or the view is hidden. */
  targetAt(x: number, y: number): MouseTarget | undefined;
  /** Where a drag that started on this source at `from` is now, clamped to it. */
  dragAt?(x: number, y: number, from: MouseTarget): MouseTarget | undefined;
  /** Answers only the wheel; presses pass through to the sources below. */
  readonly wheelOnly?: boolean;
};

/** The parts of an OpenTUI mouse event the router reads. */
type PointerEvent = Pick<
  OpenTuiMouseEvent,
  "type" | "button" | "x" | "y" | "modifiers" | "scroll"
>;

export type MouseRouter = {
  handle(e: PointerEvent): void;
  /** The cell the pointer last moved to with no button held. */
  pointer(): { x: number; y: number } | undefined;
};

const LEFT = 0;
const MIDDLE = 1;

const WHEEL: Record<string, { dx: -1 | 0 | 1; dy: -1 | 0 | 1 }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

/** Targets a drag can start on: window text (a selection), the zoom float (a pan), and the explorer's or a base table's separator (a resize). */
const draggable = (t: MouseTarget) =>
  (t.kind === "window" &&
    (t.spot.kind === "text" || t.spot.kind === "baseEdge")) ||
  t.kind === "zoomPoint" ||
  t.kind === "explorerEdge";

/**
 * Turn OpenTUI mouse events into core mouse actions: drop everything while
 * `enabled()` is false and every button but the left one (a middle press
 * is sent alone, with no clicks or drag), ask `sources`
 * (top of the z-order first, skipping wheel-only ones for a press) for the
 * target, count clicks on one cell (a repeated click keeps the first one's
 * target), and keep a drag with the source its press landed on, sending
 * each new drag target once. A press that `stops` says only closes
 * something starts no drag.
 */
export function createMouseRouter(o: {
  sources: readonly MouseSource[];
  enabled: () => boolean;
  /** Whether the core will stop a press on `target` before it acts there. */
  stops: (target: MouseTarget) => boolean;
  dispatch: (a: Action) => void;
  now: () => number;
}): MouseRouter {
  let last:
    | {
        x: number;
        y: number;
        at: number;
        clicks: 1 | 2 | 3;
        target: MouseTarget;
      }
    | undefined;
  let origin: { source: MouseSource; target: MouseTarget } | undefined;
  let lastDrag: string | undefined;
  let at: { x: number; y: number } | undefined;
  let lastMove: string | undefined;

  const resolve = (x: number, y: number, wheel = false) => {
    for (const source of o.sources) {
      if (source.wheelOnly && !wheel) continue;
      const target = source.targetAt(x, y);
      if (target !== undefined) return { source, target };
    }
    return undefined;
  };
  const send = (event: MouseEvent, now = o.now()) =>
    o.dispatch({ type: "mouse", event, now });

  return {
    pointer: () => at,
    handle(e) {
      if (!o.enabled()) return;
      switch (e.type) {
        case "move": {
          at = { x: e.x, y: e.y };
          // Only a change of what is under the pointer reaches the core.
          const target = resolve(e.x, e.y)?.target ?? { kind: "outside" };
          const key = JSON.stringify(target);
          if (key === lastMove) return;
          lastMove = key;
          send({ kind: "move", target });
          return;
        }
        case "scroll": {
          const step = WHEEL[e.scroll?.direction ?? ""];
          const hit = resolve(e.x, e.y, true);
          if (step === undefined || hit === undefined) return;
          // Scrolling moves what is under the pointer, so the next move counts.
          lastMove = undefined;
          send({ kind: "wheel", target: hit.target, ...step });
          return;
        }
        case "down": {
          if (e.button === MIDDLE) {
            const hit = resolve(e.x, e.y);
            if (hit !== undefined) send({ kind: "middle", target: hit.target });
            return;
          }
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
          // A repeated click acts on what the first one hit: that click may
          // have revealed source and moved the text under the pointer.
          const target = again && last ? last.target : hit.target;
          last = { x: e.x, y: e.y, at: now, clicks, target };
          if (!o.stops(target)) origin = { source: hit.source, target };
          send(
            {
              kind: "press",
              target,
              clicks,
              ctrl: e.modifiers.ctrl,
            },
            now,
          );
          return;
        }
        case "drag": {
          if (e.button !== LEFT || origin === undefined) return;
          if (!draggable(origin.target)) return;
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

/**
 * A full-screen layer above every view that paints nothing and sends every
 * mouse event to the router. It is hidden while the mouse is off, which takes
 * it out of the hit grid.
 */
export class MouseLayer extends Renderable {
  constructor(ctx: RenderContext, router: MouseRouter) {
    super(ctx, {
      position: "absolute",
      left: 0,
      top: 0,
      zIndex: 1000,
      onMouse: (e) => router.handle(e),
    });
  }

  update(s: AppState): void {
    this.width = s.terminal.cols;
    this.height = s.terminal.rows;
    this.visible = s.config.mouse;
  }

  protected renderSelf(): void {}
}
