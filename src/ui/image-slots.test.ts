import { afterEach, expect, test } from "bun:test";
import { Writable } from "node:stream";
import {
  NativeImage,
  type OptimizedBuffer,
  Renderable,
  RGBA,
} from "@opentui/core";
import { createTestRenderer } from "@opentui/core/testing";
import type { AppState } from "../core/state/types";
import { type ImageDraw, ImageSlots } from "./image-slots";

const COLS = 60;
const ROWS = 30;

const ESC = "\x1b";
/** A kitty graphics command's keys, up to its payload. */
const KITTY_COMMAND = new RegExp(`${ESC}_G[^;${ESC}]*`, "g");

/** Paints the last row after the slots, as the statusline does. */
class LastRow extends Renderable {
  protected renderSelf(buf: OptimizedBuffer): void {
    const black = RGBA.fromInts(0, 0, 0, 255);
    buf.drawText(" ".repeat(COLS), 0, ROWS - 1, black, black);
  }
}

const opened: { destroy(): void }[] = [];
afterEach(() => {
  for (const o of opened.splice(0)) o.destroy();
});

/** ImageSlots on a test renderer whose terminal output is kept. */
async function mount(o: ConstructorParameters<typeof ImageSlots>[1] = {}) {
  let out = "";
  const stdout = Object.assign(
    new Writable({
      write(chunk, _encoding, done) {
        out += Buffer.from(chunk).toString("latin1");
        done();
      },
    }),
    { isTTY: true, columns: COLS, rows: ROWS, getColorDepth: () => 24 },
  ) as unknown as NodeJS.WriteStream;
  const t = await createTestRenderer({
    width: COLS,
    height: ROWS,
    stdout,
    bufferedOutput: "stream" as never,
  });
  opened.push(t.renderer);
  const slots = new ImageSlots(t.renderer, o);
  slots.update({ terminal: { cols: COLS, rows: ROWS } } as AppState);
  t.renderer.root.add(slots);
  t.renderer.root.add(new LastRow(t.renderer, { position: "absolute" }));
  /** Draw `draws` in one frame; what the terminal was sent. */
  const frame = async (draws: [string, NativeImage, number][] = []) => {
    for (const [ref, image, y] of draws) slots.draw(ref, image, at(y));
    out = "";
    await t.renderOnce();
    const cmds = out.match(KITTY_COMMAND) ?? [];
    const ids = (re: RegExp) =>
      cmds.filter((c) => re.test(c)).map((c) => c.match(/i=(\d+)/)?.[1]);
    return {
      uploads: ids(/a=t(?!.*s=1,v=1,)/).length,
      gaps: ids(/a=t.*s=1,v=1,/).length,
      placed: ids(/a=p/),
      freed: ids(/a=d,d=I/),
    };
  };
  return { slots, frame };
}

const at = (y: number): ImageDraw => ({
  x: 0,
  y,
  cols: 20,
  rows: 10,
  pixelWidth: 0,
  pixelHeight: 0,
  shown: 1,
});

const picture = (side = 40) =>
  NativeImage.fromRgba(new Uint8Array(side * side * 4).fill(200), side, side);

test("a picture scrolled away and back is sent once", async () => {
  const { frame } = await mount();
  const a = picture();
  expect((await frame([["a.png", a, 0]])).uploads).toBe(1);
  const away = await frame();
  expect(away.uploads).toBe(0);
  expect(away.placed).toEqual([]);
  expect(away.freed).toEqual([]);
  expect((await frame([["a.png", a, 12]])).uploads).toBe(0);
});

test("a picture is not sent again when one drawn before it leaves", async () => {
  const { frame } = await mount();
  const a = picture();
  const b = picture();
  expect(
    (
      await frame([
        ["a.png", a, 0],
        ["b.png", b, 12],
      ])
    ).uploads,
  ).toBe(2);
  const next = await frame([["b.png", b, 2]]);
  expect(next.uploads).toBe(0);
  expect(next.placed.length).toBe(1);
});

test("pictures past the limit are let go, least recently shown first, and their places kept", async () => {
  const side = 40;
  const { frame } = await mount({ limitBytes: 2 * side * side * 4 });
  const [a, b, c] = [picture(side), picture(side), picture(side)];
  await frame([["a.png", a, 0]]);
  await frame([["b.png", b, 0]]);
  const third = await frame([["c.png", c, 0]]);
  expect(third.uploads).toBe(1);
  expect(third.freed.length).toBe(1);
  // a's place now holds a transparent pixel, so b's picture stays sent.
  expect(third.gaps).toBe(1);
  expect((await frame([["b.png", b, 0]])).uploads).toBe(0);
  expect((await frame([["a.png", a, 0]])).uploads).toBe(1);
});

test("a new copy of a picture takes its place, and the pictures after it stay sent", async () => {
  const { frame } = await mount();
  const b = picture();
  await frame([
    ["a.png", picture(40), 0],
    ["b.png", b, 12],
  ]);
  const resized = await frame([
    ["a.png", picture(60), 0],
    ["b.png", b, 12],
  ]);
  expect(resized.uploads).toBe(1);
  expect(resized.placed.length).toBe(1);
});

test("with a settle time, a picture is sent only once it has stayed on screen that long", async () => {
  let now = 0;
  let repaints = 0;
  const { frame } = await mount({
    settleMs: 100,
    now: () => now,
    repaint: () => repaints++,
  });
  const a = picture();
  const b = picture();
  // A scroll carries a past within 100 ms: it is never sent.
  expect((await frame([["a.png", a, 0]])).uploads).toBe(0);
  now = 60;
  expect((await frame([["b.png", b, 0]])).uploads).toBe(0);
  now = 120;
  expect((await frame([["b.png", b, 2]])).uploads).toBe(0);
  await Bun.sleep(60);
  expect(repaints).toBe(1);
  now = 160;
  const settled = await frame([["b.png", b, 2]]);
  expect(settled.uploads).toBe(1);
  // Once sent, it comes back at once.
  await frame();
  now = 170;
  expect((await frame([["b.png", b, 0]])).placed.length).toBe(1);
});
