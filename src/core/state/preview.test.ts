import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import { splitKeys } from "../kernel/vim/keys";
import { previewUrl } from "./preview";
import type { Action, AppState, Effect } from "./types";
import { createUpdate } from "./update";

const update = createUpdate(testRegistries());

/** Type keys and collect every effect they produce. */
function keys(
  s: AppState,
  seq: string,
): { state: AppState; effects: Effect[] } {
  const effects: Effect[] = [];
  for (const key of splitKeys(seq)) {
    const r = update(s, { type: "key", key, now: 0 });
    s = r.state;
    effects.push(...r.effects);
  }
  return { state: s, effects };
}
const dispatch = (s: AppState, a: Action) => update(s, a);
const open = (s: AppState, path: string, text: string): AppState =>
  update(s, { type: "fileLoaded", path, file: textFile(text) }).state;
const previewEffects = (effects: Effect[]) =>
  effects.filter((e) =>
    ["startPreview", "stopPreview", "openUrl"].includes(e.kind),
  );
const note = () => open(fresh(), "notes/plan.md", "# Plan\n");

test("the preview address is on the loopback host, encodes each path segment, and carries the token", () => {
  expect(previewUrl(8731, "t0k")).toBe("http://127.0.0.1:8731/?token=t0k");
  expect(previewUrl(8731, "t0k", "notes/my plan#1.md")).toBe(
    "http://127.0.0.1:8731/notes/my%20plan%231.md?token=t0k",
  );
});

test("starting the preview twice starts one server", () => {
  const first = keys(note(), ":Preview<CR>");
  expect(first.state.preview).toEqual({ status: "starting" });
  expect(previewEffects(first.effects)).toEqual([{ kind: "startPreview" }]);

  const again = keys(first.state, ":Preview<CR>");
  expect(again.state.preview).toEqual({ status: "starting" });
  expect(previewEffects(again.effects)).toEqual([]);

  const started = dispatch(again.state, {
    type: "previewStarted",
    port: 8731,
    token: "t0k",
  });
  expect(started.state.preview).toEqual({
    status: "on",
    port: 8731,
    token: "t0k",
  });
  expect(started.effects).toEqual([
    { kind: "openUrl", url: "http://127.0.0.1:8731/notes/plan.md?token=t0k" },
  ]);

  const reopen = keys(started.state, ":Preview<CR>");
  expect(reopen.state.preview).toEqual({
    status: "on",
    port: 8731,
    token: "t0k",
  });
  expect(previewEffects(reopen.effects)).toEqual([
    { kind: "openUrl", url: "http://127.0.0.1:8731/notes/plan.md?token=t0k" },
  ]);
});

test("stopping says so when nothing runs and stops a running preview", () => {
  const off = keys(note(), ":PreviewStop<CR>");
  expect(off.state.notifications.message?.text).toBe("preview is not running");
  expect(previewEffects(off.effects)).toEqual([]);

  const on = dispatch(keys(note(), ":Preview<CR>").state, {
    type: "previewStarted",
    port: 8731,
    token: "t0k",
  }).state;
  const stop = keys(on, ":PreviewStop<CR>");
  expect(previewEffects(stop.effects)).toEqual([{ kind: "stopPreview" }]);
  expect(
    dispatch(stop.state, { type: "previewStopped" }).state.preview,
  ).toEqual({ status: "off" });
});

test("a failed browser launch shows the address", () => {
  const r = dispatch(note(), {
    type: "openUrlFailed",
    url: "http://127.0.0.1:8731/notes/plan.md?token=t0k",
    reason: "open failed",
  });
  expect(r.state.notifications.toasts).toEqual([
    {
      id: 1,
      level: "info",
      text: "could not open a browser — http://127.0.0.1:8731/notes/plan.md?token=t0k",
    },
  ]);
});

test("a server that cannot start leaves the preview off with an error", () => {
  const starting = keys(note(), ":Preview<CR>").state;
  const r = dispatch(starting, {
    type: "previewFailed",
    reason: "address in use",
  });
  expect(r.state.preview).toEqual({ status: "off" });
  expect(r.state.notifications.toasts.at(-1)).toMatchObject({
    level: "error",
    text: "preview failed: address in use",
  });
});

test("the preview is not offered for code files", () => {
  const s = open(fresh(), "scripts/sync.ts", "export {};\n");
  const r = keys(s, ":Preview<CR>");
  expect(r.state.notifications.message?.text).toBe(
    "not available for typescript files",
  );
  expect(r.state.preview).toEqual({ status: "off" });
  expect(previewEffects(r.effects)).toEqual([]);
});

test("the preview can be stopped from a code file", () => {
  const on = dispatch(keys(note(), ":Preview<CR>").state, {
    type: "previewStarted",
    port: 8731,
    token: "t0k",
  }).state;
  const code = open(on, "scripts/sync.ts", "export {};\n");
  expect(previewEffects(keys(code, ":PreviewStop<CR>").effects)).toEqual([
    { kind: "stopPreview" },
  ]);
});
