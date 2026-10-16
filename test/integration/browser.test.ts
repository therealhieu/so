import { afterEach, beforeEach, expect, test } from "bun:test";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import {
  type BrowserHost,
  createBrowserHost,
} from "../../src/app/browser-host";
import type {
  Action,
  BrowserEvent,
  BrowserOp,
} from "../../src/core/state/types";
import { createBrowserFrames } from "../../src/ui/browser-frames";
import { findChrome } from "../../src/workspace/browser/chrome";

const FAKE = join(import.meta.dir, "../fixtures/fake-chrome.ts");
const SIZE = { width: 400, height: 300, dpr: 1 };
let dir = "";
let host: BrowserHost | undefined;
/** Chrome processes the host started. */
let pids: number[] = [];

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "so-browser-"));
});

afterEach(async () => {
  await host?.stop();
  host = undefined;
  const alive = pids.filter((pid) => {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  });
  pids = [];
  expect(alive).toEqual([]);
  // Every fake started from this test's folder has exited.
  const left = Bun.spawnSync(["pgrep", "-f", dir]).stdout.toString().trim();
  await rm(dir, { recursive: true, force: true });
  expect(left).toBe("");
});

/** An executable that runs the fake Chrome in `mode`, logging to the returned path. */
async function fakeChrome(mode: "ok" | "crash" | "fail") {
  const log = join(dir, `${mode}.jsonl`);
  const path = join(dir, `chrome-${mode}`);
  await writeFile(
    path,
    `#!/bin/sh\nexec "${process.execPath}" "${FAKE}" "${log}" ${mode} "$@"\n`,
  );
  await chmod(path, 0o755);
  return { path, log };
}

const logged = (
  log: string,
): { method?: string; params?: Record<string, unknown>; argv?: string[] }[] =>
  existsSync(log)
    ? readFileSync(log, "utf8")
        .trim()
        .split("\n")
        .map((l) => JSON.parse(l))
    : [];

async function until<T>(
  f: () => T | undefined,
  ms = 5000,
  seen: () => unknown = () => "",
): Promise<T> {
  const end = Date.now() + ms;
  for (;;) {
    const v = f();
    if (v !== undefined) return v;
    if (Date.now() > end)
      throw new Error(`timed out; seen: ${JSON.stringify(seen())}`);
    await Bun.sleep(10);
  }
}

/** A host on `chrome` (with `more` of its options) over a workspace holding `site/index.html`. */
async function start(
  chrome: string,
  more: { scrollPixels?: number; settleMs?: number } = {},
) {
  await Bun.write(
    join(dir, "ws/site/index.html"),
    '<a href="next.html" style="display:block;height:100vh">next</a>',
  );
  await Bun.write(join(dir, "ws/site/next.html"), "<title>Next</title>");
  const events: BrowserEvent[] = [];
  /** What the host logged as errors, for a timeout to show. */
  const errors: unknown[] = [];
  const frames = createBrowserFrames();
  host = createBrowserHost({
    root: join(dir, "ws"),
    chrome: () => chrome,
    dispatch: (a: Action) => {
      if (a.type === "browserEvent") events.push(a.event);
    },
    frames,
    logger: {
      info(e, f) {
        if (e === "browser.started" && typeof f?.pid === "number")
          pids.push(f.pid);
      },
      error(e, f) {
        errors.push({ event: e, ...f });
      },
    },
    idleMs: 50,
    ...more,
  });
  const h = host;
  return {
    events,
    errors,
    frames,
    run: (op: BrowserOp) => h.run(1, op),
    statuses: () =>
      events.flatMap((e) => (e.kind === "status" ? [e.status.kind] : [])),
  };
}

test("a page opens in Chrome, shows its frames and title, and takes input", async () => {
  const fake = await fakeChrome("ok");
  const h = await start(fake.path);
  h.run({ op: "open", path: "site/index.html", size: SIZE });
  await until(() => h.frames.latest(1));
  const page = await until(() =>
    h.events.findLast((e) => e.kind === "page" && !e.loading),
  );
  expect(page).toMatchObject({
    kind: "page",
    url: `file://${join(realpathSync(dir), "ws/site/index.html")}`,
    title: "Fake page",
  });
  expect(h.statuses()[0]).toBe("starting");
  const argv = logged(fake.log)[0]?.argv ?? [];
  expect(argv).toContain("--headless=new");
  expect(argv).toContain("--remote-debugging-pipe");
  h.run({
    op: "input",
    input: { kind: "mouse", type: "press", at: { x: 0.5, y: 0.25 }, clicks: 1 },
  });
  h.run({ op: "copy" });
  await until(() => h.events.find((e) => e.kind === "selection"));
  const mouse = logged(fake.log).find(
    (m) => m.method === "Input.dispatchMouseEvent",
  );
  expect(mouse?.params).toMatchObject({
    type: "mousePressed",
    x: 200,
    y: 75,
    clickCount: 1,
  });
  expect(h.events).toContainEqual({
    kind: "selection",
    text: "fake selection",
  });
});

test("while a page scrolls its frames are limited, and full size once it rests", async () => {
  const fake = await fakeChrome("ok");
  const h = await start(fake.path, { scrollPixels: 30_000, settleMs: 50 });
  h.run({ op: "open", path: "site/index.html", size: SIZE });
  await until(() => h.frames.latest(1));
  const starts = () =>
    logged(fake.log)
      .filter((m) => m.method === "Page.startScreencast")
      .map((m) => [m.params?.maxWidth, m.params?.maxHeight]);
  const wheel: BrowserOp = {
    op: "input",
    input: { kind: "wheel", at: { x: 0.5, y: 0.5 }, dx: 0, dy: 1 },
  };
  h.run(wheel);
  h.run(wheel);
  // 400×300 is 120,000 pixels: half as wide and high fits 30,000.
  await until(() => (starts().length === 2 ? true : undefined), 5000, starts);
  await until(() => (starts().length === 3 ? true : undefined), 5000, starts);
  expect(starts()).toEqual([
    [400, 300],
    [200, 150],
    [400, 300],
  ]);
});

test("a frame is acknowledged to Chrome only when the view acknowledges it", async () => {
  const fake = await fakeChrome("ok");
  const h = await start(fake.path);
  h.run({ op: "open", path: "site/index.html", size: SIZE });
  const frame = await until(() => h.frames.latest(1));
  const acks = () =>
    logged(fake.log).filter((m) => m.method === "Page.screencastFrameAck");
  await Bun.sleep(50);
  expect(acks()).toEqual([]);
  frame.ack();
  await until(() => (acks().length > 0 ? true : undefined));
});

test("closing the last page stops Chrome once it has idled, and removes its profile", async () => {
  const fake = await fakeChrome("ok");
  const h = await start(fake.path);
  h.run({ op: "open", path: "site/index.html", size: SIZE });
  await until(() => h.frames.latest(1));
  const argv = logged(fake.log)[0]?.argv ?? [];
  const profile = argv
    .find((a) => a.startsWith("--user-data-dir="))
    ?.slice("--user-data-dir=".length);
  expect(profile).toBeDefined();
  expect(existsSync(profile ?? "")).toBe(true);
  h.run({ op: "close" });
  expect(h.frames.latest(1)).toBeUndefined();
  await until(() =>
    logged(fake.log).some((m) => m.method === "Target.closeTarget")
      ? true
      : undefined,
  );
  await until(() => (existsSync(profile ?? "") ? undefined : true));
  const left = Bun.spawnSync(["pgrep", "-f", fake.log]).stdout.toString();
  expect(left.trim()).toBe("");
});

test("a window closed before its page opens leaves no tab behind", async () => {
  const fake = await fakeChrome("ok");
  const h = await start(fake.path);
  h.run({ op: "open", path: "site/index.html", size: SIZE });
  h.run({ op: "close" });
  host?.run(2, { op: "open", path: "site/index.html", size: SIZE });
  await until(() => h.frames.latest(2));
  const tabs = logged(fake.log).filter(
    (m) => m.method === "Target.createTarget",
  );
  expect(tabs).toHaveLength(1);
});

test("Chrome stopping while a page is shown says so, and r starts it again", async () => {
  const fake = await fakeChrome("crash");
  const h = await start(fake.path);
  h.run({ op: "open", path: "site/index.html", size: SIZE });
  const frame = await until(() => h.frames.latest(1));
  frame.ack();
  await until(() => (h.statuses().includes("crashed") ? true : undefined));
  expect(h.frames.latest(1)).toBeUndefined();
  h.run({ op: "reload" });
  await until(() => h.frames.latest(1));
  const starts = logged(fake.log).filter((m) => m.argv !== undefined);
  expect(starts).toHaveLength(2);
});

test("Chrome that will not start reports its last error line", async () => {
  const fake = await fakeChrome("fail");
  const h = await start(fake.path);
  h.run({ op: "open", path: "site/index.html", size: SIZE });
  const failed = await until(() =>
    h.events.find((e) => e.kind === "status" && e.status.kind === "failed"),
  );
  expect(failed).toEqual({
    kind: "status",
    status: {
      kind: "failed",
      reason: "[0101/000000.000:ERROR:fake] no display to open",
    },
  });
});

test("a configured Chrome that does not exist is reported as missing", async () => {
  const h = await start(join(dir, "nowhere/chrome"));
  h.run({ op: "open", path: "site/index.html", size: SIZE });
  const missing = await until(() =>
    h.events.find((e) => e.kind === "status" && e.status.kind === "missing"),
  );
  expect(missing).toEqual({
    kind: "status",
    status: { kind: "missing", configured: join(dir, "nowhere/chrome") },
  });
});

test("a page outside the workspace is not opened", async () => {
  const fake = await fakeChrome("ok");
  const h = await start(fake.path);
  h.run({ op: "open", path: "../outside.html", size: SIZE });
  await until(() =>
    h.events.find((e) => e.kind === "status" && e.status.kind === "failed"),
  );
  expect(logged(fake.log)).toEqual([]);
});

const real = findChrome({
  configured: "",
  which: (n) => Bun.which(n),
  exists: existsSync,
  platform: process.platform,
  home: homedir(),
});

test.skipIf(real.kind !== "found")(
  "real Chrome: a page draws, and a click on its link goes to the next page",
  async () => {
    if (real.kind !== "found") return;
    const h = await start(real.path);
    h.run({ op: "open", path: "site/index.html", size: SIZE });
    const frame = await until(
      () => h.frames.latest(1),
      20_000,
      () => h.events,
    );
    expect([...frame.png.subarray(1, 4)]).toEqual([80, 78, 71]);
    frame.ack();
    await until(() => h.events.find((e) => e.kind === "page" && !e.loading));
    h.run({
      op: "input",
      input: {
        kind: "mouse",
        type: "press",
        at: { x: 0.5, y: 0.5 },
        clicks: 1,
      },
    });
    h.run({
      op: "input",
      input: {
        kind: "mouse",
        type: "release",
        at: { x: 0.5, y: 0.5 },
        clicks: 1,
      },
    });
    const next = await until(
      () =>
        h.events.find(
          (e) =>
            e.kind === "page" && e.url.endsWith("/next.html") && !e.loading,
        ),
      10_000,
    );
    expect(next).toMatchObject({ title: "Next" });
  },
  30_000,
);
