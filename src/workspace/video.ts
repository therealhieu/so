import {
  frameWidth,
  type VideoFrameRequest,
} from "../core/features/video/file-type";
import { parseProbe } from "../core/features/video/probe";
import type { RgbaImage, VideoInfoResult } from "../core/state/types";
import { containedFile } from "./images";
import { createLimiter } from "./limit";
import type { Logger } from "./log";
import { bunRun, ppmToRgba, type ToolRun } from "./tool-run";

export const VIDEO_LIMITS = {
  infoTimeoutMs: 10_000,
  maxInfoBytes: 1 * 2 ** 20,
  frameTimeoutMs: 15_000,
  maxFrameBytes: 64 * 2 ** 20,
  maxInFlight: 2,
} as const;

export type VideoTool = {
  /** What the video holds; `missing` when ffprobe or ffmpeg is not on PATH. */
  info(rel: string): Promise<VideoInfoResult>;
  /** The still frame at a moment; rejects with the reason it could not be drawn. */
  frame(r: VideoFrameRequest): Promise<RgbaImage>;
};

/**
 * ffmpeg's last error line without the `<path>: ` it starts with, since the
 * window already names the file; else the exit code.
 */
function reasonOf(stderr: string, code: number, path: string): string {
  const last = stderr
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "")
    .at(-1);
  if (last === undefined) return `exit code ${code}`;
  return last.startsWith(`${path}: `) ? last.slice(path.length + 2) : last;
}

/**
 * What workspace videos hold, through `ffprobe`, and their still frames,
 * through `ffmpeg`, both found on PATH at each call. Paths must stay inside
 * the workspace, and at most two runs go at once.
 */
export function createVideoTool(d: {
  root: string;
  which: (cmd: string) => string | null;
  run?: ToolRun;
  logger?: Logger;
}): VideoTool {
  const run = d.run ?? bunRun;
  const limited = createLimiter(VIDEO_LIMITS.maxInFlight);
  return {
    async info(rel) {
      const probe = d.which("ffprobe");
      if (probe === null || d.which("ffmpeg") === null)
        return { kind: "missing" };
      try {
        const { path } = await containedFile(d.root, rel);
        const r = await limited(() =>
          run(
            [
              probe,
              "-v",
              "error",
              "-print_format",
              "json",
              "-show_format",
              "-show_streams",
              path,
            ],
            {
              timeoutMs: VIDEO_LIMITS.infoTimeoutMs,
              maxBytes: VIDEO_LIMITS.maxInfoBytes,
            },
          ),
        );
        if (r.code !== 0)
          return { kind: "failed", reason: reasonOf(r.stderr, r.code, path) };
        const meta = parseProbe(new TextDecoder().decode(r.stdout));
        return meta === undefined
          ? { kind: "failed", reason: "no video stream" }
          : { kind: "ok", meta };
      } catch (e) {
        const reason = e instanceof Error ? e.message : String(e);
        d.logger?.error("video.infoFailed", { path: rel, reason });
        return { kind: "failed", reason };
      }
    },

    async frame(r) {
      const bin = d.which("ffmpeg");
      if (bin === null) throw new Error("ffmpeg not found");
      const { path } = await containedFile(d.root, r.path);
      const argv = [
        bin,
        "-v",
        "error",
        "-nostdin",
        "-ss",
        Math.max(0, r.at).toFixed(2),
        "-i",
        path,
        "-frames:v",
        "1",
        "-vf",
        `scale=${frameWidth(r.width)}:-2`,
        "-f",
        "image2pipe",
        "-vcodec",
        "ppm",
        "-",
      ];
      const out = await limited(() =>
        run(argv, {
          timeoutMs: VIDEO_LIMITS.frameTimeoutMs,
          maxBytes: VIDEO_LIMITS.maxFrameBytes,
        }),
      );
      if (out.code !== 0 || out.stdout.byteLength === 0)
        throw new Error(
          out.code === 0
            ? "no frame there"
            : reasonOf(out.stderr, out.code, path),
        );
      return ppmToRgba(out.stdout);
    },
  };
}
