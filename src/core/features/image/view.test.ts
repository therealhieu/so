import { expect, test } from "bun:test";
import {
  dragFrame,
  FITTED,
  filledFrame,
  framePans,
  panFrame,
  ZOOM_MAX,
  zoomFrame,
} from "./view";

test("zoom steps a quarter between a quarter and eight times the fit; fit recentres", () => {
  let f = zoomFrame(FITTED, 1);
  expect(f.level).toBe(1.25);
  for (let i = 0; i < 40; i++) f = zoomFrame(f, 1);
  expect(f.level).toBe(ZOOM_MAX);
  f = panFrame(f, 1, 1);
  expect(zoomFrame(f, 0)).toMatchObject({ level: 1, cx: 0.5, cy: 0.5 });
  let out = FITTED;
  for (let i = 0; i < 10; i++) out = zoomFrame(out, -1);
  expect(out.level).toBe(0.25);
});

/** The frame zoomed in to 2×. */
const DOUBLE = [1, 1, 1, 1].reduce((f) => zoomFrame(f, 1), FITTED);

test("a fitted image cannot pan; a zoomed one pans a quarter view and stops at its edges", () => {
  expect(panFrame(FITTED, 1, 0)).toMatchObject({ cx: 0.5, cy: 0.5 });
  const f = DOUBLE;
  expect(f.level).toBe(2);
  expect(framePans(f)).toEqual({ x: true, y: true });
  expect(panFrame(f, 1, 0).cx).toBeCloseTo(0.625);
  let edge = f;
  for (let i = 0; i < 10; i++) edge = panFrame(edge, -1, 0);
  expect(edge.cx).toBeCloseTo(0.25);
});

test("a drag moves the image with the pointer; a narrower fill pans less of it", () => {
  const f = DOUBLE;
  const grab = { fx: 0.5, fy: 0.5, x: f.cx, y: f.cy };
  expect(dragFrame(f, grab, -0.25, 0).cx).toBeCloseTo(0.625);
  const wide = filledFrame(f, { x: 1, y: 0.5 });
  expect(framePans(wide)).toEqual({ x: true, y: false });
  expect(filledFrame(wide, { x: 1, y: 0.5 })).toBe(wide);
});
