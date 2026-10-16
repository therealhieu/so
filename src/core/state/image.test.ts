import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import { splitKeys } from "../kernel/vim/keys";
import { activeBuffer, activeWindow } from "./buffers";
import { imageWindow } from "./image";
import { keyScope } from "./keymap";
import { statusSegments } from "./status";
import type { Action, AppState, Effect, Result } from "./types";
import { createUpdate } from "./update";

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
const ex = (line: string): Action[] => keys(`:${line}<CR>`);
const loaded = (path: string, text = ""): Action => ({
  type: "fileLoaded",
  path,
  file: textFile(text),
});
const laidOut = (
  s: AppState,
  fill = { x: 1, y: 1 },
  size = { width: 800, height: 600 },
): Action => ({ type: "imageLaidOut", window: s.windows.active, fill, size });

const frame = (s: AppState) => imageWindow(s, s.windows.active);

/** `photo.png` open, drawn filling the window's width and 80% of its height. */
function openPhoto(): AppState {
  const s = run(fresh(), loaded("pics/photo.png")).state;
  return run(s, laidOut(s, { x: 1, y: 0.8 })).state;
}

test("a picture opens read-only in the image editor kind, fitted", () => {
  const s = run(fresh(), loaded("pics/photo.png")).state;
  expect(activeBuffer(s)).toMatchObject({
    fileType: "image",
    readOnly: true,
    binary: true,
  });
  expect(activeWindow(s)?.content.editor).toBe("image");
  expect(frame(s)).toEqual({
    level: 1,
    cx: 0.5,
    cy: 0.5,
    fill: { x: 1, y: 1 },
  });
  expect(keyScope(s)).toEqual({ mode: "normal", filetype: "image" });
});

test("a picture is never written", () => {
  const r = run(openPhoto(), ...ex("w"));
  expect(r.effects.filter((e) => e.kind === "write")).toEqual([]);
  expect(r.state.notifications.message?.text).toBe("read-only file");
});

test("+ and - zoom, hjkl pan within the image, and 0 fits it again", () => {
  let s = run(openPhoto(), ...keys("++++")).state;
  expect(frame(s)?.level).toBe(2);
  s = run(s, ...keys("l")).state;
  expect(frame(s)?.cx).toBeCloseTo(0.625);
  s = run(s, ...keys("llllllll")).state;
  expect(frame(s)?.cx).toBeCloseTo(0.75);
  s = run(s, ...keys("jjjjjjjj")).state;
  // A 0.8 fill shows 1 / (2 × 0.8) of the height.
  expect(frame(s)?.cy).toBeCloseTo(1 - 1 / 3.2);
  s = run(s, ...keys("0")).state;
  expect(frame(s)).toMatchObject({ level: 1, cx: 0.5, cy: 0.5 });
  expect(frame(run(s, ...keys("-")).state)?.level).toBe(0.75);
});

test("the statusline shows the image's size and its zoom", () => {
  let s = openPhoto();
  expect(statusSegments(s)).toMatchObject({ mode: "image", page: "800×600" });
  expect(statusSegments(s).position).toBeUndefined();
  s = run(s, ...keys("++")).state;
  expect(statusSegments(s).page).toBe("800×600 150%");
});

test("an SVG's statusline size is its own, not the size it is drawn at", () => {
  const svg =
    '<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg"\n  width="64" viewBox="0 0 32 16">\n</svg>\n';
  let s = run(fresh(), loaded("art/logo.svg", svg)).state;
  s = run(s, laidOut(s, { x: 1, y: 0.5 }, { width: 2048, height: 1024 })).state;
  expect(statusSegments(s).page).toBe("64×32");
});

test("the wheel zooms, a sideways turn pans, and a drag moves the image", () => {
  const s = run(openPhoto(), ...keys("++++")).state;
  const target = {
    kind: "window" as const,
    window: s.windows.active,
    spot: { kind: "image" as const, at: { fx: 0.5, fy: 0.5 } },
  };
  const wheel = (dx: -1 | 0 | 1, dy: -1 | 0 | 1): Action => ({
    type: "mouse",
    event: { kind: "wheel", target, dx, dy },
    now: 0,
  });
  expect(frame(run(s, wheel(0, -1)).state)?.level).toBe(2.25);
  expect(frame(run(s, wheel(0, 1)).state)?.level).toBe(1.75);
  expect(frame(run(s, wheel(1, 0)).state)?.cx).toBeCloseTo(0.625);
  const pressed = run(s, {
    type: "mouse",
    event: { kind: "press", target, clicks: 1, ctrl: false },
    now: 0,
  }).state;
  const dragged = run(pressed, {
    type: "mouse",
    event: {
      kind: "drag",
      target: { ...target, spot: { kind: "image", at: { fx: 0.25, fy: 0.5 } } },
    },
    now: 0,
  }).state;
  expect(frame(dragged)?.cx).toBeCloseTo(0.625);
});

test("leaving a picture and coming back keeps its zoom", () => {
  const note = run(fresh(), loaded("notes/a.md", "# A\n")).state;
  let s = run(note, ...ex("e pics/photo.png"), loaded("pics/photo.png")).state;
  s = run(s, ...keys("++")).state;
  s = run(s, ...keys("<C-^>")).state;
  expect(activeWindow(s)?.content.editor).toBe("text");
  s = run(s, ...keys("<C-^>")).state;
  expect(frame(s)?.level).toBe(1.5);
});

test("an SVG opens drawn; <leader>m flips it to its editable source and back", () => {
  const svg = '<svg width="10" height="10"></svg>\n';
  let s = run(fresh(), loaded("art/logo.svg", svg)).state;
  expect(activeBuffer(s)).toMatchObject({ fileType: "svg" });
  expect(activeBuffer(s)?.readOnly).not.toBe(true);
  expect(activeWindow(s)?.content.editor).toBe("image");
  s = run(s, ...keys("+")).state;
  expect(frame(s)?.level).toBe(1.25);
  s = run(s, ...keys(" m")).state;
  expect(activeWindow(s)?.content.editor).toBe("text");
  expect(keyScope(s)).toEqual({ mode: "normal", filetype: "svg" });
  // Text keys work in the source: `x` deletes a character.
  s = run(s, ...keys("x")).state;
  expect(activeBuffer(s)?.dirty).toBe(true);
  s = run(s, ...keys(" m")).state;
  expect(activeWindow(s)?.content.editor).toBe("image");
});
