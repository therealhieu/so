import { afterEach, expect, spyOn, test } from "bun:test";
import { readFileSync } from "node:fs";
import { OptimizedBuffer } from "@opentui/core";
import { createTerminalCapabilities } from "@opentui/core/testing";
import { imageWindow } from "../../src/core/state/image";
import { type Mounted, type MountOptions, mountShell } from "../support/ui";

let m: Mounted | undefined;
afterEach(() => {
  m?.destroy();
  m = undefined;
});

/** A 200×300 picture. */
const PAGE = new Uint8Array(
  readFileSync(new URL("../fixtures/images/page.png", import.meta.url)),
);
const BROKEN = new Uint8Array(
  readFileSync(new URL("../fixtures/images/broken.png", import.meta.url)),
);
const KITTY = {
  caps: createTerminalCapabilities({ kitty_graphics: true }),
  hasResolution: true,
};
const NO_GRAPHICS = { caps: null, hasResolution: false };
const BLOCK_GLYPH = /[▀▄█▌▐▖▗▘▙▚▛▜▝▞▟]/;

async function openPhoto(o: Partial<MountOptions> = {}): Promise<Mounted> {
  const x = await mountShell({
    cols: 80,
    rows: 30,
    capabilities: NO_GRAPHICS,
    files: { "pics/photo.png": PAGE, "pics/broken.png": BROKEN },
    ...o,
  });
  x.keys("<leader>e");
  x.open("pics/photo.png", "");
  return x;
}

/** Render until the image has loaded and the view's layout reached the core. */
async function settled(x: Mounted): Promise<string> {
  await x.frame();
  await Bun.sleep(0);
  await x.frame();
  await Bun.sleep(0);
  return x.frame();
}

const frameOf = (x: Mounted) => {
  const s = x.store.get();
  return imageWindow(s, s.windows.active);
};

test("a picture draws in its window, with IMAGE and its size in the statusline", async () => {
  m = await openPhoto();
  expect(await m.frame()).toContain("◌ photo.png");
  const frame = await settled(m);
  expect(frame).not.toContain("binary file");
  expect(
    frame.split("\n").filter((r) => BLOCK_GLYPH.test(r)).length,
  ).toBeGreaterThan(10);
  const status = await m.status();
  expect(status).toContain("IMAGE");
  expect(status).toContain("200×300");
  expect(m.loads).toEqual(["pics/photo.png"]);
});

test("a fitted picture fills the window's height, centred; zoomed it shows part of itself", async () => {
  const draw = spyOn(OptimizedBuffer.prototype, "drawImage");
  try {
    m = await openPhoto({ capabilities: KITTY });
    await settled(m);
    draw.mockClear();
    await m.frame();
    expect(draw).toHaveBeenCalledTimes(1);
    const [, x, , cols, , , , , srcY, , srcH, tier] = draw.mock.calls[0] ?? [];
    expect(tier).toBe("kitty");
    expect(x).toBeGreaterThan(0);
    expect(cols).toBeLessThan(80);
    expect([srcY, srcH]).toEqual([0, 300]);
    // A tall picture fills the height, so only sideways is left to pan.
    expect(frameOf(m)?.fill.y).toBe(1);
    m.keys("++++");
    await settled(m);
    draw.mockClear();
    await m.frame();
    const [, , , , , , , , zy, , zh] = draw.mock.calls[0] ?? [];
    expect(zh).toBe(150);
    expect(zy).toBe(75);
    m.keys("jjjjjjjj");
    draw.mockClear();
    await m.frame();
    const [, , , , , , , , ey, , eh] = draw.mock.calls[0] ?? [];
    expect((ey as number) + (eh as number)).toBe(300);
    expect(await m.status()).toContain("200%");
  } finally {
    draw.mockRestore();
  }
});

test("with images off the window names the picture, and a broken one says so", async () => {
  m = await openPhoto({ config: '[preview]\nimages = "off"\n' });
  expect(await settled(m)).toContain("[image: photo.png]");
  m.destroy();
  m = await mountShell({
    cols: 80,
    rows: 30,
    capabilities: NO_GRAPHICS,
    files: { "pics/broken.png": BROKEN },
  });
  m.keys("<leader>e");
  m.open("pics/broken.png", "");
  const frame = await settled(m);
  expect(frame).toContain("broken.png could not be drawn.");
  expect(frame).toContain(":Open shows it in the system viewer.");
});

test("an SVG draws through the image loader and flips to its source", async () => {
  m = await mountShell({
    cols: 80,
    rows: 30,
    capabilities: NO_GRAPHICS,
    files: { "art/logo.svg": PAGE },
  });
  m.keys("<leader>e");
  m.open("art/logo.svg", '<svg width="10" height="10"></svg>\n');
  const drawn = await settled(m);
  expect(m.loads).toEqual(["art/logo.svg"]);
  expect(drawn.split("\n").some((r) => BLOCK_GLYPH.test(r))).toBe(true);
  m.keys("<leader>m");
  const source = await m.frame();
  expect(source).toContain('<svg width="10" height="10"></svg>');
  expect(await m.status()).not.toContain("IMAGE");
});
