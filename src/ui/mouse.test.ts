import { expect, test } from "bun:test";
import type { Action, MouseTarget } from "../core/state/types";
import { CLICK_MS, createMouseRouter, type MouseSource } from "./mouse";

type Ev = {
  type: "down" | "up" | "drag" | "drag-end" | "scroll" | "move" | "over";
  button: number;
  x: number;
  y: number;
  modifiers: { shift: boolean; alt: boolean; ctrl: boolean };
  scroll?: { direction: "up" | "down" | "left" | "right"; delta: number };
};

const ev = (
  type: Ev["type"],
  x: number,
  y: number,
  o: Partial<Omit<Ev, "type" | "x" | "y">> = {},
): Ev => ({
  type,
  x,
  y,
  button: 0,
  modifiers: { shift: false, alt: false, ctrl: false },
  ...o,
});

const text = (
  line: number,
  col: number,
  edge: -1 | 0 | 1 = 0,
): MouseTarget => ({
  kind: "window",
  window: 1,
  spot: { kind: "text", pos: { line, col }, edge },
});

/** A router over `sources` with a recording dispatch and a settable clock. */
function setup(sources: MouseSource[], enabled = () => true) {
  const sent: Action[] = [];
  let clock = 0;
  const router = createMouseRouter({
    sources,
    enabled,
    dispatch: (a) => sent.push(a),
    now: () => clock,
  });
  return {
    sent,
    events: () => sent.map((a) => (a.type === "mouse" ? a.event : undefined)),
    at(ms: number) {
      clock = ms;
    },
    handle: router.handle,
  };
}

/** Text at (y, x) for every cell; drags clamp to row 0..9 with an edge. */
const editor: MouseSource = {
  targetAt: (x, y) => text(y, x),
  dragAt: (x, y) =>
    y < 0 ? text(0, x, -1) : y > 9 ? text(9, x, 1) : text(y, x),
};

test("right and middle buttons and a disabled mouse never dispatch", () => {
  const r = setup([editor]);
  r.handle(ev("down", 1, 1, { button: 2 }));
  r.handle(ev("down", 1, 1, { button: 1 }));
  r.handle(ev("drag", 2, 2, { button: 2 }));
  expect(r.sent).toEqual([]);

  let on = false;
  const off = setup([editor], () => on);
  off.handle(ev("down", 1, 1));
  off.handle(ev("scroll", 1, 1, { scroll: { direction: "down", delta: 1 } }));
  off.handle(ev("drag", 2, 2));
  expect(off.sent).toEqual([]);
  on = true;
  off.handle(ev("down", 1, 1));
  expect(off.sent).toHaveLength(1);
});

test("the topmost source with a target answers the click", () => {
  const asked: string[] = [];
  const overlay: MouseSource = {
    targetAt: (x) => {
      asked.push("overlay");
      return x < 5 ? { kind: "overlayItem", index: 2 } : undefined;
    },
  };
  const windows: MouseSource = {
    targetAt: (x, y) => {
      asked.push("windows");
      return text(y, x);
    },
  };
  const r = setup([overlay, windows]);
  r.at(10);
  r.handle(
    ev("down", 1, 1, { modifiers: { shift: false, alt: false, ctrl: true } }),
  );
  expect(asked).toEqual(["overlay"]);
  expect(r.sent).toEqual([
    {
      type: "mouse",
      event: {
        kind: "press",
        target: { kind: "overlayItem", index: 2 },
        clicks: 1,
        ctrl: true,
      },
      now: 10,
    },
  ]);
  r.handle(ev("down", 7, 3));
  expect(asked).toEqual(["overlay", "overlay", "windows"]);
  expect(r.events()[1]).toEqual({
    kind: "press",
    target: text(3, 7),
    clicks: 1,
    ctrl: false,
  });

  const nothing = setup([{ targetAt: () => undefined }]);
  nothing.handle(ev("down", 1, 1));
  nothing.handle(ev("scroll", 1, 1, { scroll: { direction: "up", delta: 1 } }));
  expect(nothing.sent).toEqual([]);
});

test("the wheel dispatches one notch for the source under the pointer", () => {
  const r = setup([editor]);
  for (const direction of ["up", "down", "left", "right"] as const)
    r.handle(ev("scroll", 4, 2, { scroll: { direction, delta: 1 } }));
  expect(r.events()).toEqual([
    { kind: "wheel", target: text(2, 4), dx: 0, dy: -1 },
    { kind: "wheel", target: text(2, 4), dx: 0, dy: 1 },
    { kind: "wheel", target: text(2, 4), dx: -1, dy: 0 },
    { kind: "wheel", target: text(2, 4), dx: 1, dy: 0 },
  ]);
});

test("clicks on the same cell within the click window count up and wrap", () => {
  const r = setup([editor]);
  const clicks = () =>
    r.events().map((e) => (e?.kind === "press" ? e.clicks : 0));
  const click = (ms: number, x: number, y: number) => {
    r.at(ms);
    r.handle(ev("down", x, y));
    r.handle(ev("up", x, y));
  };
  click(0, 3, 3);
  click(300, 3, 3);
  click(600, 3, 3);
  click(700, 3, 3);
  expect(clicks()).toEqual([1, 2, 3, 1]);
  click(800, 4, 3);
  expect(clicks().at(-1)).toBe(1);
  click(800 + CLICK_MS, 4, 3);
  expect(clicks().at(-1)).toBe(2);
  click(800 + 2 * CLICK_MS + 1, 4, 3);
  expect(clicks().at(-1)).toBe(1);
});

test("a drag stays with the window it started in and dispatches once per new target", () => {
  const other: MouseSource = {
    targetAt: (x) => (x >= 50 ? { kind: "explorer", path: "a.md" } : undefined),
  };
  const r = setup([other, editor]);
  r.handle(ev("down", 2, 2));
  // Outside the window and over another source: the origin's dragAt answers.
  r.handle(ev("drag", 60, 12));
  r.handle(ev("drag", 60, 12));
  r.handle(ev("drag", 61, 12));
  r.handle(ev("drag", 5, 4));
  expect(r.events()).toEqual([
    { kind: "press", target: text(2, 2), clicks: 1, ctrl: false },
    { kind: "drag", target: text(9, 60, 1) },
    { kind: "drag", target: text(9, 61, 1) },
    { kind: "drag", target: text(4, 5) },
  ]);
  r.handle(ev("drag-end", 5, 4));
  r.handle(ev("up", 5, 4));
  r.handle(ev("drag", 6, 4));
  expect(r.sent).toHaveLength(4);

  // A press on something that is not window text starts no drag.
  r.handle(ev("down", 55, 1));
  r.handle(ev("drag", 3, 3));
  expect(r.events().at(-1)).toEqual({
    kind: "press",
    target: { kind: "explorer", path: "a.md" },
    clicks: 1,
    ctrl: false,
  });
  // A press that resolves nowhere starts no drag either.
  const empty = setup([
    { targetAt: () => undefined, dragAt: () => text(0, 0) },
  ]);
  empty.handle(ev("down", 1, 1));
  empty.handle(ev("drag", 2, 2));
  expect(empty.sent).toEqual([]);
});

test("hover and other events are ignored", () => {
  const r = setup([editor]);
  r.handle(ev("move", 1, 1));
  r.handle(ev("over", 1, 1));
  r.handle(ev("up", 1, 1));
  expect(r.sent).toEqual([]);
});
