import type { PageSize } from "../../core/features/browser/file-type";
import type { PageKey } from "../../core/features/browser/keys";
import type { Cdp, CdpEvent } from "./cdp";

/** What a page shows: its address, its title, and whether it is loading. */
export type PageInfo = { url: string; title: string; loading: boolean };

/**
 * One browser tab. Frames arrive as PNG bytes, at the density Chrome was
 * started with (`--force-device-scale-factor`; a tab's own scale factor does
 * not reach its screencast); Chrome sends the next one
 * only after `ack`, so a slow terminal slows the stream instead of queueing
 * it. Mouse coordinates are CSS pixels in the viewport.
 */
export type BrowserPage = {
  navigate(url: string): Promise<void>;
  resize(size: PageSize): Promise<void>;
  /**
   * Scale frames down to at most `maxPixels`, keeping their shape, or send
   * them at the page's own size again (undefined).
   */
  limit(maxPixels: number | undefined): Promise<void>;
  mouse(
    type: "press" | "release" | "move",
    x: number,
    y: number,
    o?: { clicks?: number; held?: boolean },
  ): Promise<void>;
  wheel(x: number, y: number, dx: number, dy: number): Promise<void>;
  key(k: PageKey): Promise<void>;
  back(): Promise<void>;
  forward(): Promise<void>;
  reload(): Promise<void>;
  /** The text selected on the page; empty when nothing is. */
  selection(): Promise<string>;
  /** Whether the focused element takes typing: a text field or editable content. */
  editing(): Promise<boolean>;
  close(): Promise<void>;
  size(): PageSize;
};

/** How long after a frame the title is read again. */
const TITLE_CHECK_MS = 250;

const MOUSE_TYPE = {
  press: "mousePressed",
  release: "mouseReleased",
  move: "mouseMoved",
} as const;

/**
 * Whether the focused element takes typing, looking into open shadow roots
 * and same-origin frames. Buttons, boxes, and pickers do not.
 */
const EDITING = `(() => {
  let e = document.activeElement;
  for (;;) {
    const inner = e?.shadowRoot?.activeElement ?? e?.contentDocument?.activeElement;
    if (!inner) break;
    e = inner;
  }
  if (!e) return false;
  if (e.isContentEditable || e.tagName === "TEXTAREA") return true;
  return e.tagName === "INPUT" &&
    !/^(button|checkbox|color|file|hidden|image|radio|range|reset|submit)$/i.test(e.type);
})()`;

/** Open a tab at `about:blank` sized to `size` and start its screencast. */
export async function openPage(
  cdp: Cdp,
  o: {
    size: PageSize;
    onFrame: (png: Uint8Array, ack: () => void) => void;
    onInfo: (info: PageInfo) => void;
  },
): Promise<BrowserPage> {
  const { targetId } = await cdp.send<{ targetId: string }>(
    "Target.createTarget",
    { url: "about:blank" },
  );
  const { sessionId } = await cdp.send<{ sessionId: string }>(
    "Target.attachToTarget",
    { targetId, flatten: true },
  );
  const call = <T = Record<string, unknown>>(
    method: string,
    params: Record<string, unknown> = {},
  ) => cdp.send<T>(method, params, sessionId);
  let size = o.size;
  let closed = false;
  const info: PageInfo = { url: "about:blank", title: "", loading: false };
  let mainFrame = "";
  const report = () => o.onInfo({ ...info });
  const title = async () => {
    try {
      const r = await call<{ result: { value?: unknown } }>(
        "Runtime.evaluate",
        { expression: "document.title", returnByValue: true },
      );
      const t = r.result.value;
      info.title = typeof t === "string" ? t : "";
    } catch {}
  };
  // Scripts set the title without any event. It is read again shortly after
  // what usually changes it: a new frame, a click, or a key.
  let titleCheck: ReturnType<typeof setTimeout> | undefined;
  const followTitle = () => {
    if (titleCheck !== undefined) return;
    titleCheck = setTimeout(() => {
      titleCheck = undefined;
      const before = info.title;
      void title().then(() => {
        if (!closed && info.title !== before) report();
      });
    }, TITLE_CHECK_MS);
  };
  const onEvent = (e: CdpEvent) => {
    if (e.sessionId !== sessionId || closed) return;
    const p = e.params;
    switch (e.method) {
      case "Page.screencastFrame": {
        const frame = p.sessionId;
        const data = p.data;
        if (typeof data !== "string") return;
        followTitle();
        o.onFrame(Buffer.from(data, "base64"), () => {
          if (!closed)
            call("Page.screencastFrameAck", { sessionId: frame }).catch(
              () => {},
            );
        });
        return;
      }
      case "Page.frameNavigated": {
        const f = p.frame as { id?: string; parentId?: string; url?: string };
        if (f.parentId !== undefined) return;
        if (f.id !== undefined) mainFrame = f.id;
        info.url = f.url ?? info.url;
        report();
        return;
      }
      case "Page.navigatedWithinDocument":
        if (p.frameId !== mainFrame || typeof p.url !== "string") return;
        info.url = p.url;
        void title().then(report);
        return;
      case "Page.frameStartedLoading":
        if (p.frameId !== mainFrame) return;
        info.loading = true;
        report();
        return;
      // A jump to an anchor starts loading too, but fires no load event.
      case "Page.frameStoppedLoading":
        if (p.frameId !== mainFrame) return;
        info.loading = false;
        void title().then(report);
        return;
    }
  };
  const off = cdp.on(onEvent);
  let maxPixels: number | undefined;
  const startScreencast = () => {
    const width = size.width * size.dpr;
    const height = size.height * size.dpr;
    const scale =
      maxPixels === undefined
        ? 1
        : Math.min(1, Math.sqrt(maxPixels / (width * height)));
    // Scaled down, the box is rounded down so the frame stays within the limit.
    const fit = (n: number) =>
      scale < 1 ? Math.floor(n * scale) : Math.round(n);
    return call("Page.startScreencast", {
      format: "png",
      maxWidth: fit(width),
      maxHeight: fit(height),
    });
  };
  const metrics = () =>
    call("Emulation.setDeviceMetricsOverride", {
      width: size.width,
      height: size.height,
      deviceScaleFactor: size.dpr,
      mobile: false,
    });
  try {
    await call("Page.enable");
    const tree = await call<{ frameTree: { frame: { id: string } } }>(
      "Page.getFrameTree",
    );
    mainFrame = tree.frameTree.frame.id;
    await call("Runtime.enable");
    await metrics();
    await startScreencast();
  } catch (e) {
    off();
    cdp.send("Target.closeTarget", { targetId }).catch(() => {});
    throw e;
  }
  const history = async (step: -1 | 1) => {
    const h = await call<{
      currentIndex: number;
      entries: { id: number }[];
    }>("Page.getNavigationHistory");
    const entry = h.entries[h.currentIndex + step];
    if (entry !== undefined)
      await call("Page.navigateToHistoryEntry", { entryId: entry.id });
  };
  return {
    async navigate(url) {
      await call("Page.navigate", { url });
    },
    async resize(next) {
      size = next;
      await metrics();
      await call("Page.stopScreencast");
      await startScreencast();
    },
    async limit(next) {
      if (next === maxPixels) return;
      maxPixels = next;
      await call("Page.stopScreencast");
      await startScreencast();
    },
    async mouse(type, x, y, m = {}) {
      const pressed = type !== "move" || m.held === true;
      await call("Input.dispatchMouseEvent", {
        type: MOUSE_TYPE[type],
        x,
        y,
        button: pressed ? "left" : "none",
        buttons: type === "release" || !pressed ? 0 : 1,
        clickCount: type === "move" ? 0 : (m.clicks ?? 1),
      });
      if (type === "release") followTitle();
    },
    async wheel(x, y, dx, dy) {
      await call("Input.dispatchMouseEvent", {
        type: "mouseWheel",
        x,
        y,
        deltaX: dx,
        deltaY: dy,
      });
    },
    async key(k) {
      const base = {
        key: k.key,
        code: k.code,
        windowsVirtualKeyCode: k.keyCode,
        modifiers: k.modifiers,
      };
      await call(
        "Input.dispatchKeyEvent",
        k.text === undefined
          ? { type: "rawKeyDown", ...base }
          : { type: "keyDown", ...base, text: k.text, unmodifiedText: k.text },
      );
      await call("Input.dispatchKeyEvent", { type: "keyUp", ...base });
      followTitle();
    },
    back: () => history(-1),
    forward: () => history(1),
    async reload() {
      await call("Page.reload");
    },
    async selection() {
      const r = await call<{ result: { value?: unknown } }>(
        "Runtime.evaluate",
        { expression: "String(getSelection() ?? '')", returnByValue: true },
      );
      return typeof r.result.value === "string" ? r.result.value : "";
    },
    async editing() {
      const r = await call<{ result: { value?: unknown } }>(
        "Runtime.evaluate",
        { expression: EDITING, returnByValue: true },
      );
      return r.result.value === true;
    },
    async close() {
      if (closed) return;
      closed = true;
      clearTimeout(titleCheck);
      off();
      await cdp.send("Target.closeTarget", { targetId }).catch(() => {});
    },
    size: () => size,
  };
}
