import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ToolRun } from "./tool-run";
import { createVideoTool } from "./video";

let root = "";

const ffmpeg = Bun.which("ffmpeg") !== null && Bun.which("ffprobe") !== null;

beforeAll(async () => {
  root = await realpath(await mkdtemp(join(tmpdir(), "so-video-")));
  await writeFile(join(root, "clip.mp4"), "not really a video");
  if (!ffmpeg) return;
  // Two seconds of ffmpeg's test pattern, 64×48 at 10 fps.
  const p = Bun.spawn(
    [
      "ffmpeg",
      "-v",
      "error",
      "-nostdin",
      "-f",
      "lavfi",
      "-i",
      "testsrc=duration=2:size=64x48:rate=10",
      "-pix_fmt",
      "yuv420p",
      join(root, "real.mp4"),
    ],
    { stdout: "ignore", stderr: "ignore" },
  );
  await p.exited;
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

const which = (cmd: string) => `/bin/${cmd}`;
const ok = (stdout: string | Uint8Array) => ({
  code: 0,
  stdout:
    typeof stdout === "string" ? new TextEncoder().encode(stdout) : stdout,
  stderr: "",
});

test("without ffprobe or ffmpeg on PATH a video is missing", async () => {
  const none = createVideoTool({ root, which: () => null });
  expect(await none.info("clip.mp4")).toEqual({ kind: "missing" });
  const probeOnly = createVideoTool({
    root,
    which: (c) => (c === "ffprobe" ? "/bin/ffprobe" : null),
  });
  expect(await probeOnly.info("clip.mp4")).toEqual({ kind: "missing" });
  await expect(
    none.frame({ path: "clip.mp4", at: 0, width: 100 }),
  ).rejects.toThrow("ffmpeg not found");
});

test("info runs ffprobe on the workspace file and reads its JSON", async () => {
  const runs: string[][] = [];
  const run: ToolRun = async (argv) => {
    runs.push(argv);
    return ok(
      JSON.stringify({
        streams: [
          { codec_type: "video", codec_name: "vp9", width: 8, height: 6 },
        ],
        format: { duration: "4" },
      }),
    );
  };
  const tool = createVideoTool({ root, which, run });
  expect(await tool.info("clip.mp4")).toEqual({
    kind: "ok",
    meta: { duration: 4, width: 8, height: 6, videoCodec: "vp9" },
  });
  expect(runs).toEqual([
    [
      "/bin/ffprobe",
      "-v",
      "error",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      join(root, "clip.mp4"),
    ],
  ]);
});

test("a failed probe, a file without video, or a path outside the workspace fails with why", async () => {
  const failing: ToolRun = async () => ({
    code: 1,
    stdout: new Uint8Array(),
    stderr: "clip.mp4: Invalid data found when processing input\n",
  });
  expect(
    await createVideoTool({ root, which, run: failing }).info("clip.mp4"),
  ).toEqual({
    kind: "failed",
    reason: "clip.mp4: Invalid data found when processing input",
  });
  const audio: ToolRun = async () =>
    ok(JSON.stringify({ streams: [{ codec_type: "audio" }] }));
  expect(
    await createVideoTool({ root, which, run: audio }).info("clip.mp4"),
  ).toEqual({ kind: "failed", reason: "no video stream" });
  const outside = await createVideoTool({ root, which, run: audio }).info(
    "../elsewhere.mp4",
  );
  expect(outside.kind).toBe("failed");
});

test("a frame asks ffmpeg for one PPM at the moment, at an even width", async () => {
  const runs: string[][] = [];
  const ppm = new Uint8Array([
    ...new TextEncoder().encode("P6\n2 1\n255\n"),
    1,
    2,
    3,
    4,
    5,
    6,
  ]);
  const run: ToolRun = async (argv) => {
    runs.push(argv);
    return ok(ppm);
  };
  const tool = createVideoTool({ root, which, run });
  expect(
    await tool.frame({ path: "clip.mp4", at: 12.345, width: 641 }),
  ).toEqual({
    rgba: new Uint8Array([1, 2, 3, 255, 4, 5, 6, 255]),
    width: 2,
    height: 1,
  });
  expect(runs[0]).toEqual([
    "/bin/ffmpeg",
    "-v",
    "error",
    "-nostdin",
    "-ss",
    "12.35",
    "-i",
    join(root, "clip.mp4"),
    "-frames:v",
    "1",
    "-vf",
    "scale=642:-2",
    "-f",
    "image2pipe",
    "-vcodec",
    "ppm",
    "-",
  ]);
  const empty: ToolRun = async () => ok(new Uint8Array());
  await expect(
    createVideoTool({ root, which, run: empty }).frame({
      path: "clip.mp4",
      at: 99,
      width: 10,
    }),
  ).rejects.toThrow("no frame there");
});

test.skipIf(!ffmpeg)(
  "a real video reports what it holds and gives frames",
  async () => {
    const tool = createVideoTool({ root, which: (c) => Bun.which(c) });
    expect(await tool.info("real.mp4")).toMatchObject({
      kind: "ok",
      meta: { width: 64, height: 48, fps: 10 },
    });
    const frame = await tool.frame({ path: "real.mp4", at: 1, width: 32 });
    expect([frame.width, frame.height]).toEqual([32, 24]);
    expect((await tool.info("clip.mp4")).kind).toBe("failed");
  },
  20_000,
);
