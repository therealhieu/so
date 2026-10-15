import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";
import type { PageSize } from "../core/features/browser/file-type";
import { pageKey } from "../core/features/browser/keys";
import { WHEEL_LINE_PX } from "../core/state/browser";
import type {
  Action,
  BrowserEvent,
  BrowserOp,
  WindowId,
} from "../core/state/types";
import type { BrowserFrames } from "../ui/browser-frames";
import {
  type ChromeLookup,
  type ChromeProcess,
  findChrome,
  launchChrome,
} from "../workspace/browser/chrome";
import { type BrowserPage, openPage } from "../workspace/browser/page";
import { containedFile } from "../workspace/images";
import type { Logger } from "../workspace/log";

/**
 * Runs the pages of browser windows in one headless Chrome, started for the
 * first page and stopped once no page has been open for `idleMs`. Each
 * window has one tab; its operations run in order. Frames go to `frames`,
 * never through the store; everything else comes back as `browserEvent`.
 */
export type BrowserHost = {
  run(window: WindowId, op: BrowserOp): void;
  /** Close every tab and stop Chrome. */
  stop(): Promise<void>;
};

/** How long Chrome keeps running with no page open, so a page shown again opens at once. */
export const BROWSER_IDLE_MS = 30_000;

type Tab = {
  path: string;
  size: PageSize;
  /** The size of the last frame, "WxH", for the debug log. */
  frame?: string;
  page?: Promise<BrowserPage> | undefined;
  queue: Promise<void>;
};

class Missing extends Error {
  constructor(readonly configured: string | undefined) {
    super("Chrome not found");
  }
}

export function createBrowserHost(d: {
  root: string;
  /** The configured Chrome path, read at each start. */
  chrome: () => string;
  dispatch: (a: Action) => void;
  frames: BrowserFrames;
  logger: Logger;
  find?: (configured: string) => ChromeLookup;
  launch?: (path: string, dpr: number) => Promise<ChromeProcess>;
  idleMs?: number;
}): BrowserHost {
  const find =
    d.find ??
    ((configured: string) =>
      findChrome({
        configured,
        which: (n) => Bun.which(n),
        exists: existsSync,
        platform: process.platform,
        home: homedir(),
      }));
  const launch =
    d.launch ??
    ((path: string, dpr: number) =>
      launchChrome(path, {
        extraArgs: [`--force-device-scale-factor=${dpr}`],
      }));
  const idleMs = d.idleMs ?? BROWSER_IDLE_MS;
  const tabs = new Map<WindowId, Tab>();
  let chrome: Promise<ChromeProcess> | undefined;
  let idle: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;

  const event = (window: WindowId, e: BrowserEvent) => {
    if (!stopped) d.dispatch({ type: "browserEvent", window, event: e });
  };

  /** Chrome draws every tab at the density of the page that started it. */
  const startChrome = (dpr: number): Promise<ChromeProcess> => {
    if (chrome !== undefined) return chrome;
    const lookup = find(d.chrome());
    if (lookup.kind === "missing")
      return Promise.reject(new Missing(lookup.configured));
    const started = launch(lookup.path, dpr);
    chrome = started;
    started.then(
      (c) => {
        d.logger.info("browser.started", { pid: c.pid ?? -1 });
        void c.exited.then(() => {
          if (chrome !== started) return;
          chrome = undefined;
          if (stopped) return;
          d.logger.error("browser.exited", {});
          for (const [window, tab] of tabs) {
            tab.page = undefined;
            d.frames.drop(window);
            event(window, { kind: "status", status: { kind: "crashed" } });
          }
        });
      },
      () => {
        if (chrome === started) chrome = undefined;
      },
    );
    return started;
  };

  const stopChrome = async () => {
    const c = chrome;
    chrome = undefined;
    if (c === undefined) return;
    try {
      await (await c).stop();
    } catch {}
  };

  const keepAlive = () => {
    if (idle !== undefined) clearTimeout(idle);
    idle = undefined;
    if (tabs.size > 0) return;
    idle = setTimeout(() => {
      idle = undefined;
      if (tabs.size === 0) void stopChrome();
    }, idleMs);
  };

  const failure = (e: unknown): BrowserEvent => {
    if (e instanceof Missing)
      return {
        kind: "status",
        status:
          e.configured === undefined
            ? { kind: "missing" }
            : { kind: "missing", configured: e.configured },
      };
    return {
      kind: "status",
      status: {
        kind: "failed",
        reason: e instanceof Error ? e.message : String(e),
      },
    };
  };

  /** The tab's page, opened (with Chrome started) when it has none. */
  const pageOf = (window: WindowId, tab: Tab): Promise<BrowserPage> => {
    if (tab.page !== undefined) return tab.page;
    event(window, { kind: "status", status: { kind: "starting" } });
    const opening = (async () => {
      const c = await startChrome(tab.size.dpr);
      return openPage(c.cdp, {
        size: tab.size,
        onFrame: (png, ack) => {
          if (tabs.get(window) !== tab) return;
          const dims = pngSize(png);
          if (dims !== undefined && dims !== tab.frame) {
            tab.frame = dims;
            d.logger.info("browser.frame", { window, size: dims });
          }
          d.frames.publish(window, png, ack);
        },
        onInfo: (info) => {
          if (tabs.get(window) === tab)
            event(window, { kind: "page", ...info });
        },
      });
    })();
    tab.page = opening;
    opening.catch(() => {
      if (tab.page === opening) tab.page = undefined;
    });
    return opening;
  };

  const fileUrl = async (path: string) =>
    pathToFileURL((await containedFile(d.root, path)).path).href;

  /** Run `f` after the tab's earlier operations; a failure is reported, not thrown. */
  const queue = (
    window: WindowId,
    tab: Tab,
    f: () => Promise<void>,
    report = false,
  ) => {
    tab.queue = tab.queue.then(f).catch((e: unknown) => {
      d.logger.error("browser.op", {
        reason: e instanceof Error ? e.message : String(e),
      });
      if (report && tabs.get(window) === tab) event(window, failure(e));
    });
  };

  const open = (window: WindowId, tab: Tab) =>
    queue(
      window,
      tab,
      async () => {
        const url = await fileUrl(tab.path);
        // A window closed meanwhile had no page to close: none opens for it.
        if (tabs.get(window) !== tab) return;
        const page = await pageOf(window, tab);
        if (!sameSize(page.size(), tab.size)) await page.resize(tab.size);
        await page.navigate(url);
      },
      true,
    );

  const withPage = (
    window: WindowId,
    f: (p: BrowserPage, tab: Tab) => Promise<void>,
  ) => {
    const tab = tabs.get(window);
    if (tab?.page === undefined) return;
    const page = tab.page;
    queue(window, tab, async () => f(await page, tab));
  };

  return {
    run(window, o) {
      if (stopped) return;
      switch (o.op) {
        case "open": {
          const tab = tabs.get(window) ?? {
            path: o.path,
            size: o.size,
            queue: Promise.resolve(),
          };
          tab.path = o.path;
          tab.size = o.size;
          tabs.set(window, tab);
          d.logger.info("browser.open", { window, ...o.size });
          keepAlive();
          open(window, tab);
          return;
        }
        case "close": {
          const tab = tabs.get(window);
          tabs.delete(window);
          d.frames.drop(window);
          keepAlive();
          const page = tab?.page;
          if (page !== undefined)
            void page.then((p) => p.close()).catch(() => {});
          return;
        }
        case "resize": {
          const tab = tabs.get(window);
          if (tab === undefined) return;
          tab.size = o.size;
          d.logger.info("browser.resize", { window, ...o.size });
          withPage(window, (p) => p.resize(o.size));
          return;
        }
        case "input":
          withPage(window, (p, tab) => {
            const i = o.input;
            const x = (at: { x: number }) => at.x * tab.size.width;
            const y = (at: { y: number }) => at.y * tab.size.height;
            switch (i.kind) {
              case "mouse": {
                const sent = p.mouse(i.type, x(i.at), y(i.at), {
                  ...(i.clicks === undefined ? {} : { clicks: i.clicks }),
                  ...(i.held === undefined ? {} : { held: i.held }),
                });
                if (i.type !== "release") return sent;
                // The click has settled the focus: say whether it is a text field.
                return sent.then(async () => {
                  const editable = await p.editing();
                  if (tabs.get(window) === tab)
                    event(window, { kind: "focus", editable });
                });
              }
              case "wheel":
                return p.wheel(
                  x(i.at),
                  y(i.at),
                  i.dx * WHEEL_LINE_PX,
                  i.dy * WHEEL_LINE_PX,
                );
              case "key": {
                const k = pageKey(i.key);
                return k === undefined ? Promise.resolve() : p.key(k);
              }
            }
          });
          return;
        case "back":
          withPage(window, (p) => p.back());
          return;
        case "forward":
          withPage(window, (p) => p.forward());
          return;
        case "reload": {
          const tab = tabs.get(window);
          if (tab === undefined) return;
          // A tab without a page (Chrome stopped or never started) opens again.
          if (tab.page === undefined) open(window, tab);
          else withPage(window, (p) => p.reload());
          return;
        }
        case "copy":
          withPage(window, async (p) => {
            event(window, { kind: "selection", text: await p.selection() });
          });
          return;
      }
    },
    async stop() {
      stopped = true;
      if (idle !== undefined) clearTimeout(idle);
      tabs.clear();
      await stopChrome();
    },
  };
}

const sameSize = (a: PageSize, b: PageSize) =>
  a.width === b.width && a.height === b.height && a.dpr === b.dpr;

/** "WxH" from a PNG's header. */
function pngSize(png: Uint8Array): string | undefined {
  if (png.length < 24) return undefined;
  const v = new DataView(png.buffer, png.byteOffset, 24);
  return `${v.getUint32(16)}x${v.getUint32(20)}`;
}
