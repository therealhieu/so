import {
  isVideoWindowState,
  type VideoWindowState,
} from "../features/video/file-type";
import type { Binding } from "../kernel/commands/defaults";
import type { Command } from "../kernel/commands/registry";
import { setWindow } from "./buffers";
import type { CommandContext, CommandResult } from "./commands";
import { sameStamp, windowBuffer } from "./pdf";
import { message, none } from "./result";
import type {
  Action,
  AppState,
  BufferState,
  Effect,
  Result,
  VideoInfo,
  WindowId,
} from "./types";

export const VIDEO_MISSING =
  "video view needs ffmpeg (ffprobe, ffmpeg) — :Open plays it in the system player";

export function videoWindow(
  s: AppState,
  id: WindowId,
): VideoWindowState | undefined {
  const ws = s.windows.byId[id]?.content.kindState;
  return isVideoWindowState(ws) ? ws : undefined;
}

/** How long the video `b` runs, once known. */
export const videoDuration = (
  b: BufferState | undefined,
): number | undefined =>
  b?.video?.status === "ready" ? b.video.meta.duration : undefined;

/**
 * The latest moment a still frame is asked for: a little before the end,
 * where a seek can land past the last frame and give none.
 */
export const lastFrameAt = (duration: number): number =>
  Math.max(0, duration - Math.min(1, duration * 0.05));

/**
 * Every video buffer on disk knows what it holds for its current bytes: one
 * whose info is missing or for older bytes asks again, so opening,
 * restoring, and a change on disk are handled alike.
 */
export function syncVideoInfo(prev: AppState, r: Result): Result {
  if (prev.buffers === r.state.buffers) return r;
  let buffers: AppState["buffers"] | undefined;
  const effects: Effect[] = [];
  for (const b of Object.values(r.state.buffers)) {
    if (b.fileType !== "video" || b.disk !== "present") continue;
    if (sameStamp(b.video?.stamp, b.stamp)) continue;
    buffers ??= { ...r.state.buffers };
    buffers[b.id] = { ...b, video: { status: "loading", stamp: b.stamp } };
    effects.push({ kind: "videoInfo", path: b.path, stamp: b.stamp });
  }
  return buffers === undefined
    ? r
    : {
        state: { ...r.state, buffers },
        effects: [...r.effects, ...effects],
      };
}

/** A video's info answered: stored for its bytes; a moment past its end moves back. */
export function onVideoInfo(
  s: AppState,
  a: Extract<Action, { type: "videoInfo" }>,
): Result {
  const b = Object.values(s.buffers).find((x) => x.path === a.path);
  if (b === undefined || !sameStamp(b.stamp, a.stamp)) return none(s);
  const r = a.result;
  const video: VideoInfo =
    r.kind === "ok"
      ? { status: "ready", stamp: a.stamp, meta: r.meta }
      : r.kind === "missing"
        ? { status: "missing", stamp: a.stamp }
        : { status: "failed", stamp: a.stamp, reason: r.reason };
  let st: AppState = {
    ...s,
    buffers: { ...s.buffers, [b.id]: { ...b, video } },
  };
  if (r.kind === "ok") {
    const last = lastFrameAt(r.meta.duration);
    for (const w of Object.values(st.windows.byId)) {
      const ws = videoWindow(st, w.id);
      if (w.content.bufferId === b.id && ws !== undefined && ws.at > last)
        st = setVideoWindow(st, w.id, { at: last });
    }
  }
  if (r.kind === "missing") return message(st, VIDEO_MISSING, "error");
  if (r.kind === "failed")
    return message(st, `cannot show ${b.path}: ${r.reason}`, "error");
  return none(st);
}

function setVideoWindow(
  s: AppState,
  id: WindowId,
  ws: VideoWindowState,
): AppState {
  const w = s.windows.byId[id];
  if (w === undefined) return s;
  return setWindow(s, { ...w, content: { ...w.content, kindState: ws } });
}

/**
 * Move the active video window's still frame: `to` gets the window's moment
 * and the video's length, and its answer is kept between the start and
 * `lastFrameAt`, to a hundredth of a second.
 */
function seekTo(
  s: AppState,
  to: (at: number, duration: number) => number,
): Result {
  const id = s.windows.active;
  const ws = videoWindow(s, id);
  if (ws === undefined) return none(s);
  const duration = videoDuration(windowBuffer(s, id));
  if (duration === undefined) return message(s, "video length not known yet");
  const at = Math.min(
    lastFrameAt(duration),
    Math.max(0, Math.round(to(ws.at, duration) * 100) / 100),
  );
  return at === ws.at ? none(s) : none(setVideoWindow(s, id, { at }));
}

const seek =
  (to: (at: number, duration: number) => number) => (c: CommandContext) =>
    seekTo(c.state, to);

/** The wheel: a notch down or right shows a hundredth of the video later, up or left earlier. */
export function wheelVideo(s: AppState, dx: number, dy: number): Result {
  const dir = Math.sign(dy !== 0 ? dy : dx);
  return dir === 0 ? none(s) : seekTo(s, (at, d) => at + (dir * d) / 100);
}

const VIDEO = ["video"] as const;
const cmd = (
  id: string,
  title: string,
  f: (c: CommandContext) => Result,
): Command<CommandContext, CommandResult> => ({
  id,
  title,
  filetypes: VIDEO,
  run: f,
});

export const videoCommands = [
  cmd(
    "video.forward",
    "Show a tenth of the video later",
    seek((at, d) => at + d / 10),
  ),
  cmd(
    "video.back",
    "Show a tenth of the video earlier",
    seek((at, d) => at - d / 10),
  ),
  cmd(
    "video.stepForward",
    "Show a hundredth of the video later",
    seek((at, d) => at + d / 100),
  ),
  cmd(
    "video.stepBack",
    "Show a hundredth of the video earlier",
    seek((at, d) => at - d / 100),
  ),
  cmd(
    "video.start",
    "Show the video's start",
    seek(() => 0),
  ),
  cmd(
    "video.end",
    "Show the video's end",
    seek((_, d) => d),
  ),
];

const KEYS: readonly (readonly [string, string])[] = [
  ["l", "video.forward"],
  ["<Right>", "video.forward"],
  ["h", "video.back"],
  ["<Left>", "video.back"],
  ["L", "video.stepForward"],
  ["H", "video.stepBack"],
  ["gg", "video.start"],
  ["0", "video.start"],
  ["G", "video.end"],
  ["$", "video.end"],
  ["<CR>", "file.systemOpen"],
  ["o", "file.systemOpen"],
];

export const videoBindings: readonly Binding[] = KEYS.map(([seq, id]) => ({
  scope: { mode: "normal", filetype: "video" },
  seq,
  id,
}));
