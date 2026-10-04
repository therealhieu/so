import { expect, test } from "bun:test";
import { RenderCache } from "./render-cache";

test("a cached result is reused and the least recently used entry is evicted", () => {
  const cache = new RenderCache<number>(2);
  let made = 0;
  const make = () => ++made;
  expect(cache.get("a", make)).toBe(1);
  expect(cache.get("b", make)).toBe(2);
  expect(cache.get("a", make)).toBe(1);
  expect(cache.get("c", make)).toBe(3);
  expect(cache.get("a", make)).toBe(1);
  expect(cache.get("b", make)).toBe(4);
});
