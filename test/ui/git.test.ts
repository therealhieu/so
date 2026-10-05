import { afterEach, expect, spyOn, test } from "bun:test";
import { readFileSync } from "node:fs";
import { OptimizedBuffer } from "@opentui/core";
import { createTerminalCapabilities } from "@opentui/core/testing";
import type { RepoInfo } from "../../src/core/state/types";
import { FOREIGN_MODES_RESET } from "../../src/ui/shell";
import { stamp } from "../support/state";
import { type Mounted, mountShell } from "../support/ui";

let m: Mounted | undefined;
afterEach(() => {
  m?.destroy();
  m = undefined;
});

const REPO: RepoInfo = {
  top: "~/notes",
  gitDir: "~/notes/.git",
  commonDir: "~/notes/.git",
  prefix: "",
  head: { kind: "branch", name: "main" },
};

const OPENING = '"notes/plan.md" written · opening lazygit';

/** Let any scheduled frame render. */
const settle = () => Bun.sleep(20);

test("the frame with the pre-suspend message is rendered before suspend and nothing after", async () => {
  m = await mountShell({ cols: 120, rows: 36 });
  const x = m;
  x.store.dispatch({ type: "gitDetected", repo: REPO });
  x.keys("<leader>e");
  x.open("notes/plan.md", "# Plan\n");
  x.keys("Ax<Esc><leader>gg");
  x.store.dispatch({ type: "saved", path: "notes/plan.md", stamp: stamp(2) });
  expect(x.effects.filter((e) => e.kind === "runTool")).toHaveLength(1);
  expect(x.store.get().config.mouse).toBe(true);

  const frames = x.record();
  await x.shell.flush();
  expect(frames.recordedFrames.at(-1)?.frame).toContain(OPENING);

  const before = frames.recordedFrames.length;
  x.shell.suspend();
  x.store.dispatch({ type: "resize", cols: 120, rows: 36 });
  x.store.dispatch({ type: "dirListed", dir: "", entries: [] });
  await settle();
  expect(frames.recordedFrames.length).toBe(before);
  expect(x.t.renderer.useMouse).toBe(false);
  expect(x.writes).toEqual([]);

  x.shell.resetForeignModes();
  expect(x.writes).toEqual([FOREIGN_MODES_RESET]);
  x.shell.resume();
  await settle();
  expect(frames.recordedFrames.length).toBeGreaterThan(before);
  expect(x.t.renderer.useMouse).toBe(true);
  frames.stop();
});

const PNG = new Uint8Array(
  readFileSync(new URL("../fixtures/images/wide.png", import.meta.url)),
);
const KITTY = {
  caps: createTerminalCapabilities({ kitty_graphics: true }),
  hasResolution: true,
};

test("images visible before suspend are drawn again after resume", async () => {
  const draw = spyOn(OptimizedBuffer.prototype, "drawImage");
  try {
    m = await mountShell({
      cols: 100,
      rows: 40,
      capabilities: KITTY,
      files: { "images/diagram.png": PNG },
    });
    const x = m;
    x.store.dispatch({
      type: "indexBatch",
      summaries: [],
      files: ["notes/diagram.md", "images/diagram.png"],
      done: 0,
      total: 0,
    });
    x.keys("<leader>e");
    x.open("notes/diagram.md", "# Diagram\n\n![[diagram.png]]\n\nText\n");
    await x.frame();
    await Bun.sleep(0);
    await x.shell.flush();
    expect(draw).toHaveBeenCalled();

    x.shell.suspend();
    draw.mockClear();
    x.store.dispatch({ type: "resize", cols: 100, rows: 40 });
    await settle();
    expect(draw).not.toHaveBeenCalled();

    x.shell.resume();
    await settle();
    expect(draw).toHaveBeenCalledTimes(1);
    expect(draw.mock.calls[0]?.[11]).toBe("kitty");
  } finally {
    draw.mockRestore();
  }
});

test("destroying the shell while suspended restores the terminal once", async () => {
  m = await mountShell({ cols: 80, rows: 24 });
  m.shell.suspend();
  m.shell.destroy();
  m.shell.destroy();
  expect(m.t.renderer.isDestroyed).toBe(true);
  m = undefined;
});
