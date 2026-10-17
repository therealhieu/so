import { expect, test } from "bun:test";
import { createBrowserFrames } from "./browser-frames";

const png = new Uint8Array();

test("a replaced frame is acknowledged with the newest, not before", () => {
  const frames = createBrowserFrames();
  const acked: string[] = [];
  frames.publish(1, png, () => acked.push("a"));
  frames.publish(1, png, () => acked.push("b"));
  expect(acked).toEqual([]);
  frames.latest(1)?.ack();
  frames.latest(1)?.ack();
  expect(acked).toEqual(["a", "b"]);
});

test("a page counts as driven only for a while after a key, click, or wheel", () => {
  let t = 0;
  const frames = createBrowserFrames(() => t);
  expect(frames.drivenWithin(1, 1000)).toBe(false);
  frames.drive(1);
  t = 999;
  expect(frames.drivenWithin(1, 1000)).toBe(true);
  expect(frames.drivenWithin(2, 1000)).toBe(false);
  t = 1000;
  expect(frames.drivenWithin(1, 1000)).toBe(false);
});

test("a wheel step scrolls the page and drives it; a key only drives it", () => {
  let t = 0;
  const frames = createBrowserFrames(() => t);
  frames.drive(1);
  expect(frames.scrolledWithin(1, 300)).toBe(false);
  frames.scroll(2);
  t = 299;
  expect(frames.scrolledWithin(2, 300)).toBe(true);
  expect(frames.drivenWithin(2, 1000)).toBe(true);
  t = 300;
  expect(frames.scrolledWithin(2, 300)).toBe(false);
  frames.drop(2);
  t = 0;
  expect(frames.drivenWithin(2, 1000)).toBe(false);
});

test("dropping a window acknowledges its frames; other windows keep theirs", () => {
  const frames = createBrowserFrames();
  const acked: string[] = [];
  frames.publish(1, png, () => acked.push("one"));
  frames.publish(2, png, () => acked.push("two"));
  frames.drop(1);
  expect(acked).toEqual(["one"]);
  expect(frames.latest(1)).toBeUndefined();
  expect(frames.latest(2)?.seq).toBe(2);
});
