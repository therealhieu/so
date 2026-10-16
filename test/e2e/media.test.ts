import { afterAll, beforeAll, expect, test } from "bun:test";
import { copyFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ready, runInPty, statusRow } from "./pty";

const MAIN = join(import.meta.dir, "../../src/app/main.ts");

let root = "";
let emptyPath = "";

const ffmpeg = Bun.which("ffmpeg") !== null && Bun.which("ffprobe") !== null;

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "so-media-e2e-"));
  emptyPath = await mkdtemp(join(tmpdir(), "so-no-ffmpeg-"));
  await writeFile(join(root, "broken.mp4"), "not really a video");
  if (ffmpeg) {
    // Twenty seconds of ffmpeg's test pattern, small and quick to make.
    const p = Bun.spawn(
      [
        "ffmpeg",
        "-v",
        "error",
        "-nostdin",
        "-f",
        "lavfi",
        "-i",
        "testsrc=duration=20:size=64x48:rate=5",
        "-pix_fmt",
        "yuv420p",
        join(root, "clip.mp4"),
      ],
      { stdout: "ignore", stderr: "ignore" },
    );
    await p.exited;
  }
  await copyFile(
    join(import.meta.dir, "../fixtures/images/page.png"),
    join(root, "photo.png"),
  );
  await writeFile(
    join(root, "logo.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"/>\n',
  );
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
  await rm(emptyPath, { recursive: true, force: true });
});

test.skipIf(!ffmpeg)(
  "so clip.mp4 shows what it holds and moves its frame through it",
  async () => {
    const r = await runInPty([process.execPath, MAIN, join(root, "clip.mp4")], {
      async script(p) {
        await ready(p);
        await p.waitFor(() => statusRow(p).includes("0:00 / 0:20"), 10_000);
        expect(statusRow(p)).toContain("VIDEO");
        await p.waitFor(() => p.screen().includes("64×48"));
        p.type("l");
        await p.waitFor(() => statusRow(p).includes("0:02 / 0:20"));
        p.type(":q\r");
      },
    });
    expect(r.exitCode).toBe(0);
    expect(r.screen.text).not.toContain("binary file");
  },
  30_000,
);

test("without ffmpeg on PATH a video opens with the install hint", async () => {
  const r = await runInPty([process.execPath, MAIN, join(root, "broken.mp4")], {
    env: { PATH: emptyPath },
    async script(p) {
      await ready(p);
      await p.waitFor(() => p.screen().includes("Video view needs ffmpeg"));
      expect(p.screen()).toContain("brew install ffmpeg");
      p.type(":q\r");
    },
  });
  expect(r.exitCode).toBe(0);
});

test("so photo.png opens it in an image window", async () => {
  const r = await runInPty([process.execPath, MAIN, join(root, "photo.png")], {
    async script(p) {
      await ready(p);
      await p.waitFor(() => statusRow(p).includes("IMAGE"));
      p.type(":q\r");
    },
  });
  expect(r.exitCode).toBe(0);
  expect(r.screen.text).not.toContain("binary file");
});

test("so logo.svg opens drawn, and <leader>m shows its source", async () => {
  const r = await runInPty([process.execPath, MAIN, join(root, "logo.svg")], {
    async script(p) {
      await ready(p);
      await p.waitFor(() => statusRow(p).includes("IMAGE"));
      p.type(" m");
      await p.waitFor(() => p.screen().includes("<svg xmlns="));
      p.type(":q\r");
    },
  });
  expect(r.exitCode).toBe(0);
});
