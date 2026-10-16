import { expect, test } from "bun:test";
import {
  fresh,
  stamp,
  testRegistries,
  textFile,
} from "../../../test/support/state";
import type { VideoMeta } from "../features/video/probe";
import { splitKeys } from "../kernel/vim/keys";
import { activeBuffer, activeWindow } from "./buffers";
import { statusSegments } from "./status";
import type {
  Action,
  AppState,
  Effect,
  Result,
  VideoInfoResult,
} from "./types";
import { createUpdate } from "./update";
import { VIDEO_MISSING, videoWindow } from "./video";

const update = createUpdate(testRegistries());

function run(s: AppState, ...actions: Action[]): Result {
  const effects: Effect[] = [];
  for (const a of actions) {
    const r = update(s, a);
    s = r.state;
    effects.push(...r.effects);
  }
  return { state: s, effects };
}

const keys = (seq: string): Action[] =>
  splitKeys(seq).map((key) => ({ type: "key", key, now: 0 }));
const loaded = (path: string, n = 1): Action => ({
  type: "fileLoaded",
  path,
  file: textFile("", n),
});
const META: VideoMeta = {
  duration: 100,
  width: 1920,
  height: 1080,
  videoCodec: "h264",
};
const info = (result: VideoInfoResult, n = 1): Action => ({
  type: "videoInfo",
  path: "clips/clip.mp4",
  stamp: stamp(n),
  result,
});

const at = (s: AppState) => videoWindow(s, s.windows.active)?.at;

function openClip(): AppState {
  return run(
    fresh(),
    loaded("clips/clip.mp4"),
    info({ kind: "ok", meta: META }),
  ).state;
}

test("a video opens read-only in the video editor kind and asks what it holds", () => {
  const r = run(fresh(), loaded("clips/clip.mp4"));
  expect(activeBuffer(r.state)).toMatchObject({
    fileType: "video",
    readOnly: true,
    binary: true,
    video: { status: "loading", stamp: stamp(1) },
  });
  expect(activeWindow(r.state)?.content.editor).toBe("video");
  expect(at(r.state)).toBe(0);
  expect(r.effects).toContainEqual({
    kind: "videoInfo",
    path: "clips/clip.mp4",
    stamp: stamp(1),
  });
});

test("an answer for older bytes is dropped; a missing ffmpeg says how to play it", () => {
  let s = run(fresh(), loaded("clips/clip.mp4", 2)).state;
  s = run(s, info({ kind: "ok", meta: META }, 1)).state;
  expect(activeBuffer(s)?.video?.status).toBe("loading");
  s = run(s, info({ kind: "missing" }, 2)).state;
  expect(activeBuffer(s)?.video?.status).toBe("missing");
  expect(s.notifications.message?.text).toBe(VIDEO_MISSING);
});

test("h and l move a tenth, H and L a hundredth, gg and G to either end", () => {
  let s = run(openClip(), ...keys("l")).state;
  expect(at(s)).toBe(10);
  s = run(s, ...keys("LL")).state;
  expect(at(s)).toBe(12);
  s = run(s, ...keys("H")).state;
  expect(at(s)).toBe(11);
  s = run(s, ...keys("hh")).state;
  expect(at(s)).toBe(0);
  s = run(s, ...keys("G")).state;
  // Near the end, where a seek still finds a frame.
  expect(at(s)).toBe(99);
  s = run(s, ...keys("l")).state;
  expect(at(s)).toBe(99);
  s = run(s, ...keys("gg")).state;
  expect(at(s)).toBe(0);
});

test("moving before the length is known says so", () => {
  const s = run(fresh(), loaded("clips/clip.mp4")).state;
  const r = run(s, ...keys("l"));
  expect(at(r.state)).toBe(0);
  expect(r.state.notifications.message?.text).toBe(
    "video length not known yet",
  );
});

test("Enter plays the video in the system player", () => {
  const r = run(openClip(), ...keys("<CR>"));
  expect(r.effects).toContainEqual({
    kind: "openUrl",
    url: "/ws/clips/clip.mp4",
  });
  expect(run(openClip(), ...keys("o")).effects).toContainEqual({
    kind: "openUrl",
    url: "/ws/clips/clip.mp4",
  });
});

test("the statusline shows VIDEO and where the frame is", () => {
  let s = openClip();
  expect(statusSegments(s)).toMatchObject({
    mode: "video",
    page: "0:00 / 1:40",
  });
  s = run(s, ...keys("ll")).state;
  expect(statusSegments(s).page).toBe("0:20 / 1:40");
});

test("the wheel moves a hundredth of the video", () => {
  const s = openClip();
  const target = {
    kind: "window" as const,
    window: s.windows.active,
    spot: { kind: "video" as const },
  };
  const wheel = (dy: -1 | 1): Action => ({
    type: "mouse",
    event: { kind: "wheel", target, dx: 0, dy },
    now: 0,
  });
  expect(at(run(s, wheel(1), wheel(1)).state)).toBe(2);
  expect(at(run(s, wheel(-1)).state)).toBe(0);
});
