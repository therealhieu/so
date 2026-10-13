import { afterEach, expect, spyOn, test } from "bun:test";
import { deflateSync } from "node:zlib";
import { NativeImage } from "@opentui/core";
import { createTerminalCapabilities } from "@opentui/core/testing";
import { ImageCache, imageTier } from "./images";

const fixture = async (name: string) =>
  new Uint8Array(
    await Bun.file(
      new URL(`../../test/fixtures/images/${name}`, import.meta.url),
    ).arrayBuffer(),
  );
const PNG = await fixture("diagram.png");

const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (b: Uint8Array) => {
  let c = 0xffffffff;
  for (const x of b) c = (CRC[(c ^ x) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  out.set(new TextEncoder().encode(type), 4);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}
/** A black grayscale PNG of `side` × `side` pixels. */
function blackPng(side: number): Uint8Array {
  const header = new Uint8Array(13);
  const dv = new DataView(header.buffer);
  dv.setUint32(0, side);
  dv.setUint32(4, side);
  header.set([8, 0, 0, 0, 0], 8);
  const parts = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(new Uint8Array(side * (side + 1)))),
    pngChunk("IEND", new Uint8Array()),
  ];
  return new Uint8Array(parts.flatMap((p) => [...p]));
}

/** Let a stubbed load settle. */
const settle = () => Bun.sleep(0);

const caches: ImageCache[] = [];
afterEach(() => {
  for (const c of caches.splice(0)) c.clear();
});

function cache(load: (ref: string) => Promise<Uint8Array>, now = () => 0) {
  const calls: string[] = [];
  let repaints = 0;
  const c = new ImageCache({
    load: (ref) => {
      calls.push(ref);
      return load(ref);
    },
    repaint: () => {
      repaints++;
    },
    now,
  });
  caches.push(c);
  return { c, calls, repaints: () => repaints };
}

test("the tier follows the setting, then the terminal's graphics support", () => {
  const kitty = createTerminalCapabilities({ kitty_graphics: true });
  const sixel = createTerminalCapabilities({ sixel: true });
  const none = createTerminalCapabilities();
  expect(imageTier("off", kitty, true)).toBe("placeholder");
  expect(imageTier("blocks", kitty, true)).toBe("blocks");
  expect(imageTier("auto", kitty, true)).toBe("kitty");
  expect(imageTier("auto", sixel, true)).toBe("sixel");
  expect(imageTier("auto", sixel, false)).toBe("blocks");
  expect(imageTier("auto", none, true)).toBe("blocks");
  expect(imageTier("auto", null, true)).toBe("blocks");
});

test("an image loads once, however often it is asked for", async () => {
  const { c, calls, repaints } = cache(async () => PNG);
  expect(c.get("a.png")).toBeUndefined();
  expect(c.get("a.png")).toBeUndefined();
  expect(c.size("a.png")).toBeUndefined();
  await settle();
  expect(calls).toEqual(["a.png"]);
  expect(repaints()).toBe(1);
  const got = c.get("a.png");
  expect(got !== undefined && "image" in got).toBe(true);
  expect(c.size("a.png")).toEqual({ width: 240, height: 120 });
  expect(calls).toEqual(["a.png"]);
});

test("an image changed or removed on disk loads again", async () => {
  let bytes: Uint8Array = PNG;
  const { c, calls, repaints } = cache(async () => bytes);
  for (const path of ["img/a.png", "img/sub/b.png", "imgx.png"]) c.get(path);
  await settle();
  expect(c.size("img/a.png")).toEqual({ width: 240, height: 120 });
  const held = c.bytes();

  bytes = blackPng(10);
  c.forget("img/a.png");
  expect(c.size("img/a.png")).toBeUndefined();
  expect(c.bytes()).toBe(held - 240 * 120 * 4);
  expect(repaints()).toBe(4);
  expect(c.get("img/a.png")).toBeUndefined();
  await settle();
  expect(c.size("img/a.png")).toEqual({ width: 10, height: 10 });

  // A removed folder drops what is below it, not a sibling sharing its prefix.
  c.forget("img");
  expect(c.size("img/a.png")).toBeUndefined();
  expect(c.size("img/sub/b.png")).toBeUndefined();
  expect(c.size("imgx.png")).toEqual({ width: 240, height: 120 });
  expect(calls).toEqual([
    "img/a.png",
    "img/sub/b.png",
    "imgx.png",
    "img/a.png",
  ]);

  // A load still running when the file changes is not kept.
  c.get("late.png");
  c.forget("late.png");
  await settle();
  expect(c.size("late.png")).toBeUndefined();
  const before = repaints();
  c.forget("never-loaded.png");
  expect(repaints()).toBe(before);
});

test("decoded images stay within the memory limit", async () => {
  const big = blackPng(2805);
  const dispose = spyOn(NativeImage.prototype, "dispose");
  try {
    const { c, calls, repaints } = cache(async () => big);
    for (const path of ["1.png", "2.png", "3.png"]) {
      c.get(path);
      await settle();
    }
    expect(calls).toEqual(["1.png", "2.png", "3.png"]);
    expect(repaints()).toBe(3);
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(c.bytes()).toBeLessThanOrEqual(64 * 2 ** 20);
    expect(c.size("1.png")).toBeUndefined();
    expect(c.size("2.png")).toEqual({ width: 2805, height: 2805 });
    expect(c.size("3.png")).toEqual({ width: 2805, height: 2805 });
  } finally {
    dispose.mockRestore();
  }
});

test("the least recently drawn image is the one evicted", async () => {
  const big = blackPng(2805);
  const { c } = cache(async () => big);
  for (const path of ["1.png", "2.png"]) {
    c.get(path);
    await settle();
  }
  c.get("1.png");
  c.get("3.png");
  await settle();
  expect(c.size("1.png")).toEqual({ width: 2805, height: 2805 });
  expect(c.size("2.png")).toBeUndefined();
});

test("corrupt, unsupported, and unreadable images fail without throwing", async () => {
  const bytes: Record<string, Uint8Array> = {
    "broken.png": await fixture("broken.png"),
    "logo.svg": await fixture("logo.svg"),
  };
  const { c, repaints } = cache(async (ref) => {
    const b = bytes[ref];
    if (b === undefined) throw new Error("no such file");
    return b;
  });
  for (const path of ["broken.png", "logo.svg", "gone.png"])
    expect(() => c.get(path)).not.toThrow();
  await settle();
  for (const path of ["broken.png", "logo.svg", "gone.png"]) {
    expect(c.get(path)).toEqual({ failed: true });
    expect(c.size(path)).toBeUndefined();
  }
  expect(repaints()).toBe(3);
});

test("a failed image loads again after a minute", async () => {
  let t = 0;
  let online = false;
  const { c, calls, repaints } = cache(
    async () => {
      if (!online) throw new Error("offline");
      return PNG;
    },
    () => t,
  );
  c.get("https://example.com/a.png");
  await settle();
  expect(c.get("https://example.com/a.png")).toEqual({ failed: true });

  t = 59_000;
  online = true;
  expect(c.get("https://example.com/a.png")).toEqual({ failed: true });
  expect(calls).toHaveLength(1);

  t = 60_000;
  expect(c.get("https://example.com/a.png")).toBeUndefined();
  expect(calls).toHaveLength(2);
  await settle();
  const got = c.get("https://example.com/a.png");
  expect(got !== undefined && "image" in got).toBe(true);
  expect(repaints()).toBe(2);
});

test("the cell aspect comes from the terminal when known", () => {
  const c = new ImageCache({
    load: async () => PNG,
    repaint: () => {},
    now: () => 0,
  });
  expect(c.cellAspect()).toBe(0.5);
  const sized = new ImageCache({
    load: async () => PNG,
    repaint: () => {},
    now: () => 0,
    cell: () => ({ width: 9, height: 20 }),
  });
  expect(sized.cellAspect()).toBe(0.45);
  expect(sized.cellPixels()).toEqual({ width: 9, height: 20 });
});
