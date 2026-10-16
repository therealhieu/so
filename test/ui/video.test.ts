import { afterEach, expect, spyOn, test } from "bun:test";
import { readFileSync } from "node:fs";
import { OptimizedBuffer } from "@opentui/core";
import { createTerminalCapabilities } from "@opentui/core/testing";
import type { VideoInfoResult } from "../../src/core/state/types";
import { videoTimeline } from "../../src/ui/editors/video-view";
import { promptBox } from "../../src/ui/overlays/prompt";
import { stamp } from "../support/state";
import { type Mounted, type MountOptions, mountShell } from "../support/ui";

let m: Mounted | undefined;
afterEach(() => {
  m?.destroy();
  m = undefined;
});

/** A 200×300 frame. */
const FRAME = new Uint8Array(
  readFileSync(new URL("../fixtures/images/page.png", import.meta.url)),
);
const KITTY = {
  caps: createTerminalCapabilities({ kitty_graphics: true }),
  hasResolution: true,
};
const NO_GRAPHICS = { caps: null, hasResolution: false };
const META = {
  duration: 92,
  width: 200,
  height: 300,
  videoCodec: "h264",
  fps: 30,
  audioCodec: "aac",
  bytes: 48_000_000,
};

async function openClip(
  o: Partial<MountOptions> = {},
  result: VideoInfoResult = { kind: "ok", meta: META },
): Promise<Mounted> {
  const x = await mountShell({
    cols: 80,
    rows: 30,
    capabilities: NO_GRAPHICS,
    loadImage: () => Promise.resolve(FRAME),
    ...o,
  });
  x.keys("<leader>e");
  x.open("clips/clip.mp4", "");
  x.store.dispatch({
    type: "videoInfo",
    path: "clips/clip.mp4",
    stamp: stamp(1),
    result,
  });
  return x;
}

async function settled(x: Mounted): Promise<string> {
  await x.frame();
  await Bun.sleep(0);
  await x.frame();
  await Bun.sleep(0);
  return x.frame();
}

test("a video shows a still frame over what it holds and where the frame is", async () => {
  m = await openClip();
  const frame = await settled(m);
  expect(frame).not.toContain("binary file");
  expect(frame).toContain("clip.mp4 · 200×300 · h264 · 30 fps · aac · 48 MB");
  expect(frame).toContain("0:00 / 1:32");
  expect(frame).toContain("Enter plays");
  expect(m.loads).toEqual(["clips/clip.mp4#t=0"]);
  m.keys("l");
  await settled(m);
  expect(m.loads.at(-1)).toBe("clips/clip.mp4#t=9.2");
  const status = await m.status();
  expect(status).toContain("VIDEO");
  expect(status).toContain("0:09 / 1:32");
});

test("the frame fits above the details, with the terminal's protocol", async () => {
  const draw = spyOn(OptimizedBuffer.prototype, "drawImage");
  try {
    m = await openClip({ capabilities: KITTY });
    await settled(m);
    draw.mockClear();
    await m.frame();
    expect(draw).toHaveBeenCalledTimes(1);
    const [, , y, , rows, , , , , , , tier] = draw.mock.calls[0] ?? [];
    expect(tier).toBe("kitty");
    const body = m.store.get().terminal.rows;
    expect((y as number) + (rows as number)).toBeLessThanOrEqual(body - 3);
  } finally {
    draw.mockRestore();
  }
});

test("a delete prompt over the frame stays visible: the frame is drawn around it", async () => {
  m = await openClip({ capabilities: KITTY });
  await settled(m);
  m.keys("<leader>e");
  m.keys("d");
  await settled(m);
  const box = promptBox(m.store.get());
  if (box === undefined) throw new Error("no prompt open");
  const draw = spyOn(OptimizedBuffer.prototype, "drawImage");
  try {
    await m.frame();
    expect(draw.mock.calls.length).toBeGreaterThan(1);
    for (const [, x, y, w, h] of draw.mock.calls)
      expect(
        x < box.x + box.w &&
          x + w > box.x &&
          y < box.y + box.h &&
          y + h > box.y,
      ).toBe(false);
  } finally {
    draw.mockRestore();
  }
});

test("without ffmpeg the window says what to install and how to play it", async () => {
  m = await openClip({}, { kind: "missing" });
  const frame = await settled(m);
  expect(frame).toContain("Video view needs ffmpeg: clip.mp4 cannot be drawn");
  expect(frame).toContain("brew install ffmpeg");
  expect(frame).toContain("Enter (:Open)");
});

test("the timeline fills the width and falls back to the time when narrow", () => {
  const line = videoTimeline(46, 92, 60);
  expect([...line].length).toBe(60);
  expect(line).toStartWith("0:46 / 1:32  ━");
  expect(line).toEndWith("─  Enter plays");
  expect(videoTimeline(0, 92, 20)).toBe("0:00 / 1:32  Enter plays");
});
