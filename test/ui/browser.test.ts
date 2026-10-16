import { afterEach, expect, spyOn, test } from "bun:test";
import { deflateSync } from "node:zlib";
import { OptimizedBuffer } from "@opentui/core";
import { createTerminalCapabilities } from "@opentui/core/testing";
import { browserWindow } from "../../src/core/state/browser";
import type { BrowserOp } from "../../src/core/state/types";
import {
  type BrowserFrames,
  createBrowserFrames,
} from "../../src/ui/browser-frames";
import { type Mounted, type MountOptions, mountShell } from "../support/ui";

let m: Mounted | undefined;
afterEach(() => {
  m?.destroy();
  m = undefined;
});

const KITTY = {
  caps: createTerminalCapabilities({ kitty_graphics: true }),
  hasResolution: true,
};
const NO_GRAPHICS = { caps: null, hasResolution: false };
const BLOCK_GLYPH = /[▀▄█▌▐▖▗▘▙▚▛▜▝▞▟]/;
/** How long a kitty view waits for a cell size the test renderer never reports. */
const CELL_WAIT_MS = 600;

const chunk = (type: string, data: Uint8Array) => {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "latin1");
  out.set(data, 8);
  const crc = Bun.hash.crc32(out.subarray(4, 8 + data.length));
  out.writeUInt32BE(crc >>> 0, 8 + data.length);
  return out;
};

/** A `width`×`height` PNG: black, with white where `lit(x, y)` holds. */
function png(
  width: number,
  height: number,
  lit: (x: number, y: number) => boolean = () => false,
): Uint8Array {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 6, 0, 0, 0], 8);
  const rows = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const at = y * (1 + width * 4) + 1 + x * 4;
      const v = lit(x, y) ? 255 : 0;
      rows.set([v, v, v, 255], at);
    }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", new Uint8Array()),
  ]);
}

/** Mount with `site/index.html` open in the browser view and its page shown. */
async function openSite(
  o: Partial<MountOptions> = {},
): Promise<{ m: Mounted; frames: BrowserFrames }> {
  const frames = o.browserFrames ?? createBrowserFrames();
  const x = await mountShell({
    cols: 80,
    rows: 30,
    capabilities: NO_GRAPHICS,
    browserFrames: frames,
    ...o,
  });
  x.keys("<leader>e");
  x.open("site/index.html", "<h1>Hi</h1>");
  x.store.dispatch({
    type: "browserEvent",
    window: x.store.get().windows.active,
    event: { kind: "status", status: { kind: "ready" } },
  });
  return { m: x, frames };
}

/** Render, let the view's layout reach the core, and render again. */
async function settled(x: Mounted): Promise<string> {
  await x.frame();
  await Bun.sleep(0);
  return x.frame();
}

const window = (x: Mounted) => x.store.get().windows.active;
const ops = (x: Mounted): BrowserOp[] =>
  x.effects.flatMap((e) => (e.kind === "browser" ? [e.op] : []));

test("the page opens once the window is drawn, at the window's size", async () => {
  ({ m } = await openSite());
  const frame = await settled(m);
  expect(frame).toContain("◌ index.html");
  // 80×28 cells of the usual 8×16 guess, one device pixel per CSS pixel.
  expect(ops(m)).toEqual([
    {
      op: "open",
      path: "site/index.html",
      size: { width: 640, height: 448, dpr: 1 },
    },
  ]);
  await settled(m);
  await settled(m);
  expect(ops(m).filter((o) => o.op !== "input")).toHaveLength(1);
});

test("a frame draws over the window and is acknowledged only after it is drawn", async () => {
  const frames = createBrowserFrames();
  ({ m } = await openSite({ browserFrames: frames }));
  await settled(m);
  let acked = 0;
  frames.publish(
    window(m),
    png(160, 100, (x) => x < 80),
    () => acked++,
  );
  expect(acked).toBe(0);
  const frame = await m.frame();
  expect(frame).not.toContain("◌ index.html");
  expect(
    frame.split("\n").filter((r) => BLOCK_GLYPH.test(r)).length,
  ).toBeGreaterThan(10);
  for (let i = 0; i < 50 && acked === 0; i++) await Bun.sleep(5);
  expect(acked).toBe(1);
  await m.frame();
  expect(acked).toBe(1);
});

test("with a pixel rate the next frame waits until the last one's pixels fit it", async () => {
  const frames = createBrowserFrames();
  ({ m } = await openSite({
    browserFrames: frames,
    browserPixelRate: 160_000,
  }));
  await settled(m);
  let acked = 0;
  frames.publish(window(m), png(160, 100), () => acked++);
  await m.frame();
  // 16,000 pixels at 160,000 a second: 100 ms.
  await Bun.sleep(40);
  expect(acked).toBe(0);
  for (let i = 0; i < 40 && acked === 0; i++) await Bun.sleep(10);
  expect(acked).toBe(1);
});

test("with kitty a small change goes as a patch over the frame shown", async () => {
  const draw = spyOn(OptimizedBuffer.prototype, "drawImage");
  try {
    const frames = createBrowserFrames();
    ({ m } = await openSite({ browserFrames: frames, capabilities: KITTY }));
    await settled(m);
    await Bun.sleep(CELL_WAIT_MS);
    await settled(m);
    const id = window(m);
    const size = browserWindow(m.store.get(), id)?.px;
    if (size === undefined) throw new Error("the page has no size");
    const { width, height } = size;
    let acks = 0;
    frames.publish(id, png(width, height), () => acks++);
    draw.mockClear();
    await m.frame();
    expect(draw).toHaveBeenCalledTimes(1);
    const whole = draw.mock.calls[0] ?? [];
    expect(whole[3]).toBe(80);
    expect(whole[11]).toBe("kitty");
    for (let i = 0; i < 50 && acks === 0; i++) await Bun.sleep(5);
    // One lit pixel near the top left: a patch of a few cells.
    frames.publish(
      id,
      png(width, height, (x, y) => x === 3 && y === 3),
      () => acks++,
    );
    draw.mockClear();
    await m.frame();
    expect(draw).toHaveBeenCalledTimes(2);
    const patch = draw.mock.calls[1] ?? [];
    expect(patch[3]).toBeLessThanOrEqual(2);
    expect(patch[4]).toBeLessThanOrEqual(2);
  } finally {
    draw.mockRestore();
  }
});

test("with kitty a frame over the image limit goes as bands, one at a time over the frame before", async () => {
  const draw = spyOn(OptimizedBuffer.prototype, "drawImage");
  try {
    const frames = createBrowserFrames();
    // 640×448 pixels over 80×28 cells: two bands of 14 rows fit.
    ({ m } = await openSite({
      browserFrames: frames,
      capabilities: KITTY,
      browserImagePixels: 150_000,
    }));
    await settled(m);
    await Bun.sleep(CELL_WAIT_MS);
    await settled(m);
    const id = window(m);
    const size = browserWindow(m.store.get(), id)?.px;
    if (size === undefined) throw new Error("the page has no size");
    const { width, height } = size;
    let acks = 0;
    const acked = async (n: number) => {
      for (let i = 0; i < 50 && acks < n; i++) await Bun.sleep(5);
    };
    const drawn = () =>
      draw.mock.calls.map((c) => ({
        width: c[0].width,
        row: c[2],
        rows: c[4],
      }));

    // A frame scaled down to fit, as while scrolling: one image.
    frames.publish(id, png(width / 2, height / 2), () => acks++);
    draw.mockClear();
    await m.frame();
    expect(drawn()).toEqual([{ width: width / 2, row: 1, rows: 28 }]);
    await acked(1);

    frames.publish(
      id,
      png(width, height, (x) => x < 8),
      () => acks++,
    );
    draw.mockClear();
    await m.frame();
    expect(drawn()).toEqual([
      { width: width / 2, row: 1, rows: 28 },
      { width, row: 1, rows: 14 },
    ]);
    await Bun.sleep(150);
    draw.mockClear();
    await m.frame();
    // The frame before stays first, so the terminal keeps each image's place.
    expect(drawn()).toEqual([
      { width: width / 2, row: 1, rows: 28 },
      { width, row: 1, rows: 14 },
      { width, row: 15, rows: 14 },
    ]);
  } finally {
    draw.mockRestore();
  }
});

test("with kitty a first frame over the image limit goes as all its bands at once", async () => {
  const draw = spyOn(OptimizedBuffer.prototype, "drawImage");
  try {
    const frames = createBrowserFrames();
    ({ m } = await openSite({
      browserFrames: frames,
      capabilities: KITTY,
      browserImagePixels: 150_000,
    }));
    await settled(m);
    await Bun.sleep(CELL_WAIT_MS);
    await settled(m);
    const id = window(m);
    const size = browserWindow(m.store.get(), id)?.px;
    if (size === undefined) throw new Error("the page has no size");
    frames.publish(id, png(size.width, size.height), () => {});
    draw.mockClear();
    await m.frame();
    expect(draw.mock.calls.map((c) => [c[2], c[4]])).toEqual([
      [1, 14],
      [15, 14],
    ]);
  } finally {
    draw.mockRestore();
  }
});

test("a click on the page goes to it at the point clicked", async () => {
  const frames = createBrowserFrames();
  ({ m } = await openSite({ browserFrames: frames }));
  await settled(m);
  frames.publish(window(m), png(160, 100), () => {});
  await m.frame();
  await m.mouse.click(40, 10);
  const press = ops(m).find(
    (o) => o.op === "input" && o.input.kind === "mouse",
  );
  expect(press).toMatchObject({
    op: "input",
    input: { kind: "mouse", type: "press", clicks: 1 },
  });
  const at =
    press?.op === "input" && press.input.kind === "mouse"
      ? press.input.at
      : undefined;
  expect(at?.x).toBeGreaterThan(0.4);
  expect(at?.x).toBeLessThan(0.6);
});

test("without Chrome the window says what to install and how else to see the page", async () => {
  ({ m } = await openSite());
  m.store.dispatch({
    type: "browserEvent",
    window: window(m),
    event: {
      kind: "status",
      status: { kind: "missing", configured: "/nonexistent" },
    },
  });
  const frame = await settled(m);
  expect(frame).toContain("The browser view needs Chrome or Chromium");
  expect(frame).toContain('[browser] chrome = "/nonexistent" does not exist.');
  expect(frame).toContain(":Open");
});

test("with images off the window names the page instead", async () => {
  ({ m } = await openSite({ config: '[preview]\nimages = "off"\n' }));
  expect(await settled(m)).toContain(
    "[html: index.html] needs terminal graphics",
  );
});

test("the statusline shows WEB and the page's title, BROWSE while keys go to it", async () => {
  ({ m } = await openSite());
  m.store.dispatch({
    type: "browserEvent",
    window: window(m),
    event: {
      kind: "page",
      url: "file:///notes/site/index.html",
      title: "Showcase",
      loading: false,
    },
  });
  await settled(m);
  const web = await m.status();
  expect(web).toContain("WEB");
  expect(web).toContain("Showcase");
  m.keys("i");
  expect(await m.status()).toContain("BROWSE");
  m.keys("<C-\\><C-n>");
  expect(await m.status()).toContain("WEB");
});
