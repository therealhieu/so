import { afterAll, expect, test } from "bun:test";
import { imageInfo } from "@opentui/core";
import { createImageScaler } from "./image-scaler";
import { encodePng, isPng } from "./png";

const scaler = createImageScaler();
afterAll(() => scaler.stop());

const picture = (width: number, height: number) =>
  encodePng(new Uint8Array(width * height * 4).fill(128), width, height);

test("pictures asked for at once are each sized and scaled", async () => {
  const sources = Array.from({ length: 8 }, (_, i) =>
    picture(200 + i * 10, 100),
  );
  const sizes = await Promise.all(
    sources.map((s, i) => scaler.size(`p${i}`, s)),
  );
  expect(sizes.map((s) => s.width)).toEqual(
    sources.map((_, i) => 200 + i * 10),
  );
  const copies = await Promise.all(
    sources.map((s, i) => scaler.scale(`p${i}`, s, 100, 50)),
  );
  for (const c of copies) {
    expect(isPng(c)).toBe(true);
    const info = imageInfo(c);
    expect([info.width, info.height]).toEqual([100, 50]);
  }
});

test("the newest waiting request goes first, so pictures on screen beat those scrolled past", async () => {
  const done: string[] = [];
  await Promise.all(
    ["first", "older", "newer", "newest"].map((key) =>
      scaler.size(key, picture(64, 64)).then(() => done.push(key)),
    ),
  );
  expect(done).toEqual(["first", "newest", "newer", "older"]);
});

test("a PNG file at its own size comes back as it is", async () => {
  const source = picture(120, 80);
  expect(await scaler.scale("same", source, 120, 80)).toEqual(source);
});

test("pixels are scaled like files", async () => {
  const rgba = {
    rgba: new Uint8Array(64 * 32 * 4).fill(255),
    width: 64,
    height: 32,
  };
  const info = imageInfo(await scaler.scale("pixels", rgba, 32, 16));
  expect([info.width, info.height]).toEqual([32, 16]);
});

test("bytes that are no picture fail, and the next request still works", async () => {
  await expect(
    scaler.size("junk", new Uint8Array([1, 2, 3])),
  ).rejects.toThrow();
  expect(await scaler.size("after", picture(10, 10))).toEqual({
    width: 10,
    height: 10,
  });
});
