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
