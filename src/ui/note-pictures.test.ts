import { afterEach, expect, test } from "bun:test";
import { NativeImage } from "@opentui/core";
import { NotePictures } from "./note-pictures";
import { encodePng } from "./png";

/** Let stubbed promises settle. */
const settle = () => Bun.sleep(0);

const png = (width: number, height: number) =>
  encodePng(new Uint8Array(width * height * 4).fill(90), width, height);

type Asked = { key: string; width: number; height: number };

const made: NotePictures[] = [];
afterEach(() => {
  for (const p of made.splice(0)) p.clear();
});

/**
 * NotePictures over files of `sizes` (ref → width×height) and a scaler
 * whose copies the test answers by hand.
 */
function pictures(
  sizes: Record<string, [number, number]>,
  o: { limitBytes?: number; now?: () => number } = {},
) {
  const scaled: (Asked & {
    answer: () => void;
    fail: () => void;
  })[] = [];
  const loads: string[] = [];
  let repaints = 0;
  const p = new NotePictures({
    load: async (ref) => {
      loads.push(ref);
      const size = sizes[ref];
      if (size === undefined) throw new Error(`${ref}: no such file`);
      return new Uint8Array(size[0] * size[1]);
    },
    scaler: {
      size: async (key) => {
        const size = sizes[key.split("#")[0] as string] ?? [0, 0];
        return { width: size[0], height: size[1] };
      },
      scale: (key, _source, width, height) =>
        new Promise((resolve, reject) =>
          scaled.push({
            key,
            width,
            height,
            answer: () => resolve(png(width, height)),
            fail: () => reject(new Error("broken")),
          }),
        ),
    },
    repaint: () => repaints++,
    now: o.now ?? (() => 0),
    ...(o.limitBytes === undefined ? {} : { limitBytes: o.limitBytes }),
  });
  made.push(p);
  return { p, scaled, loads, repaints: () => repaints };
}

const sizeOf = (i: NativeImage | "failed" | undefined) =>
  i instanceof NativeImage ? `${i.width}x${i.height}` : i;

test("a picture's size comes from the scaler when the header can't tell it, and a copy is made for the box it shows in", async () => {
  const { p, scaled, repaints } = pictures({ "a.jpg": [2400, 1600] });
  expect(p.size("a.jpg")).toBeUndefined();
  await settle();
  expect(p.size("a.jpg")).toEqual({ width: 2400, height: 1600 });
  expect(repaints()).toBe(1);
  expect(p.copy("a.jpg", 1200, 1000)).toBeUndefined();
  expect(scaled.map(({ width, height }) => [width, height])).toEqual([
    [1200, 800],
  ]);
  scaled[0]?.answer();
  await settle();
  expect(sizeOf(p.copy("a.jpg", 1200, 1000))).toBe("1200x800");
  expect(scaled).toHaveLength(1);
  expect(repaints()).toBe(2);
});

test("a file whose header tells its size is not decoded for it", async () => {
  const sized: string[] = [];
  const p = new NotePictures({
    load: async () => png(640, 400),
    scaler: {
      size: async (key) => {
        sized.push(key);
        return { width: 1, height: 1 };
      },
      scale: () => new Promise(() => {}),
    },
    repaint: () => {},
    now: () => 0,
  });
  made.push(p);
  p.size("chart.png");
  await settle();
  expect(p.size("chart.png")).toEqual({ width: 640, height: 400 });
  expect(sized).toEqual([]);
});

test("a picture smaller than its box is never scaled up", async () => {
  const { p, scaled } = pictures({ "small.png": [300, 200] });
  p.size("small.png");
  await settle();
  p.copy("small.png", 3000, 3000);
  expect(scaled.map(({ width, height }) => [width, height])).toEqual([
    [300, 200],
  ]);
});

test("while a copy for a new box is made, the copy for the last box stays", async () => {
  const { p, scaled } = pictures({ "a.jpg": [2400, 1600] });
  p.size("a.jpg");
  await settle();
  p.copy("a.jpg", 1200, 800);
  scaled[0]?.answer();
  await settle();
  expect(sizeOf(p.copy("a.jpg", 600, 400))).toBe("1200x800");
  scaled[1]?.answer();
  await settle();
  expect(sizeOf(p.copy("a.jpg", 600, 400))).toBe("600x400");
});

test("a copy that cannot be made fails, and a picture that cannot be read fails until retried", async () => {
  let now = 0;
  const { p, scaled, loads } = pictures(
    { "a.jpg": [100, 100] },
    { now: () => now },
  );
  p.size("a.jpg");
  await settle();
  p.copy("a.jpg", 50, 50);
  scaled[0]?.fail();
  await settle();
  expect(p.copy("a.jpg", 50, 50)).toBe("failed");
  expect(p.size("gone.jpg")).toBeUndefined();
  await settle();
  expect(p.size("gone.jpg")).toEqual({ failed: true });
  now = 60_000;
  expect(p.size("gone.jpg")).toBeUndefined();
  expect(loads.filter((r) => r === "gone.jpg")).toHaveLength(2);
});

test("a forgotten picture is read again under a new key, and its late copy is dropped", async () => {
  const { p, scaled, loads } = pictures({ "a.jpg": [100, 100] });
  p.size("a.jpg");
  await settle();
  p.copy("a.jpg", 50, 50);
  p.forget("a.jpg");
  scaled[0]?.answer();
  await settle();
  expect(p.size("a.jpg")).toBeUndefined();
  await settle();
  p.copy("a.jpg", 50, 50);
  expect(loads).toEqual(["a.jpg", "a.jpg"]);
  expect(scaled[1]?.key).not.toBe(scaled[0]?.key);
});

test("held files and copies stay within the limit, least recently used first out", async () => {
  // Each file is 100×100 bytes in this stub; two fit.
  const { p, loads } = pictures(
    { "a.jpg": [100, 100], "b.jpg": [100, 100], "c.jpg": [100, 100] },
    { limitBytes: 25_000 },
  );
  for (const ref of ["a.jpg", "b.jpg"]) p.size(ref);
  await settle();
  p.size("a.jpg");
  p.size("c.jpg");
  await settle();
  expect(p.size("a.jpg")).toEqual({ width: 100, height: 100 });
  expect(p.size("b.jpg")).toBeUndefined();
  expect(loads).toEqual(["a.jpg", "b.jpg", "c.jpg", "b.jpg"]);
});
