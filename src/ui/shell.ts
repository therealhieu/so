import { writeSync } from "node:fs";
import {
  CliRenderer,
  type CliRendererConfig,
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
  type TerminalCapabilities,
} from "@opentui/core";
import type { PdfPageRequest } from "../core/features/pdf/page";
import type { VideoFrameRequest } from "../core/features/video/file-type";
import { pressStops } from "../core/state/mouse";
import type { Store } from "../core/state/store";
import type { AppState, RgbaImage, SvgRaster } from "../core/state/types";
import type { Registries } from "../core/state/update";
import type { BrowserFrames } from "./browser-frames";
import type { ImageScaler } from "./image-scaler";
import { ImageSlots } from "./image-slots";
import { ImageCache } from "./images";
import { createKeyNormalizer } from "./input";
import {
  createMouseRouter,
  MouseLayer,
  type MouseRouter,
  type MouseSource,
} from "./mouse";
import { NotePictures } from "./note-pictures";
import { CalendarOverlay } from "./overlays/calendar";
import { CompletionView } from "./overlays/completion";
import { ConflictView } from "./overlays/conflict";
import { OverlayHost } from "./overlays/host";
import { HunkView } from "./overlays/hunk";
import { LspFloatView } from "./overlays/lsp-float";
import { ToastStack } from "./overlays/notify";
import { PdfMenuView } from "./overlays/pdf-menu";
import { PickerView } from "./overlays/picker";
import { PromptView } from "./overlays/prompt";
import { SqliteQueryView } from "./overlays/sqlite-query";
import { WhichKeyView } from "./overlays/whichkey";
import { ZoomOverlay } from "./overlays/zoom";
import { SizedText } from "./sized-text";
import { drawCells, themes } from "./theme";
import { Bufferline } from "./views/bufferline";
import { CommandLine } from "./views/cmdline";
import { ExplorerView } from "./views/explorer";
import { SidePanelView } from "./views/side-panel";
import { Statusline } from "./views/statusline";
import { WindowTree } from "./views/window-tree";

/**
 * Every OpenTUI process handler is off (`src/app/lifecycle.ts` owns signals,
 * exceptions, and exit). Any-motion mouse tracking is requested so a
 * pointer resting on a word can hover it; the router passes on only moves
 * that change what is under the pointer.
 * Mouse tracking starts off; the first paint turns it on from the config, so
 * `mouse = false` never enables it for a frame.
 */
export const RENDERER_OPTIONS = {
  exitOnCtrlC: false,
  exitSignals: [],
  openConsoleOnError: false,
  useMouse: false,
  enableMouseMovement: true,
  screenMode: "alternate-screen",
  useKittyKeyboard: {},
} as const satisfies CliRendererConfig;

/**
 * Turns off every mode another program may have left on: all mouse
 * tracking and encodings, focus reporting, bracketed paste, up to 99 kitty
 * keyboard flag entries, modifyOtherKeys, and text attributes; then shows the
 * cursor. Written after that program exits and before the renderer resumes,
 * which turns so's own modes back on.
 */
export const FOREIGN_MODES_RESET =
  "\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1005l\x1b[?1006l\x1b[?1015l\x1b[?1004l\x1b[?2004l\x1b[<99u\x1b[>4;0m\x1b[0m\x1b[?25h";

const BACKDROP_ID = "so-backdrop";

/** The whole screen blank in default colours, until the shell attaches. */
class Backdrop extends Renderable {
  constructor(ctx: RenderContext) {
    super(ctx, {
      id: BACKDROP_ID,
      position: "absolute",
      left: 0,
      top: 0,
      width: "100%",
      height: "100%",
    });
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const blank = themes.nocolor.style("text");
    for (let y = 0; y < this.height; y++)
      drawCells(buf, blank, 0, y, "", this.width);
  }
}

/**
 * With `imageFiles`, raw kitty images go through files the terminal reads.
 *
 * A capability reply during terminal setup requests a frame that paints as
 * soon as setup ends, before the shell attaches. The renderer clears cells
 * with a white foreground, which NO_COLOR forbids, so that frame paints the
 * backdrop. Frames wait for setup, so the backdrop is added once it starts.
 */
export async function createRenderer(
  o: { imageFiles?: boolean } = {},
): Promise<CliRenderer> {
  const renderer = new CliRenderer(
    process.stdin,
    process.stdout,
    process.stdout.columns || 80,
    process.stdout.rows || 24,
    {
      ...RENDERER_OPTIONS,
      exitSignals: [],
      ...(o.imageFiles ? { kittyImageTransport: "file" } : {}),
    },
  );
  try {
    const setup = renderer.setupTerminal();
    renderer.root.add(new Backdrop(renderer));
    await setup;
    return renderer;
  } catch (e) {
    renderer.destroy();
    await renderer.closed.catch(() => {});
    throw e;
  }
}

export type LayoutClass = "wide" | "medium" | "narrow";

/** The only place the width thresholds live. */
export const layoutClass = (cols: number): LayoutClass =>
  cols >= 120 ? "wide" : cols >= 100 ? "medium" : "narrow";

/** What the views read besides the state. `now` is the effect runner's clock. */
export type ShellDeps = {
  /** The registries `update` reads; views use them for titles, file types, and keys. */
  reg: Registries;
  now: () => number;
  /** Bytes for a workspace path or an http(s) URL. */
  loadImage: (ref: string) => Promise<Uint8Array | RgbaImage>;
  /** Pixels of part of an SVG; the zoom float draws diagrams with it. */
  rasterizeSvg: (r: SvgRaster) => Promise<RgbaImage>;
  /** PNG bytes of one page of a workspace PDF; PDF windows draw pages with it. */
  rasterizePdf: (r: PdfPageRequest) => Promise<Uint8Array | RgbaImage>;
  /** Pixels of a workspace video's still frame; video windows draw it. */
  videoFrame: (r: VideoFrameRequest) => Promise<Uint8Array | RgbaImage>;
  /** The latest frame of each browser window's page; browser windows draw them. */
  browserFrames?: BrowserFrames;
  /**
   * Pixels per second of new browser frame images the terminal is sent:
   * after each, the page waits that long before sending its next frame.
   * Unset, the next comes once a frame is drawn. For a path that passes
   * images on as raw pixels.
   */
  browserPixelRate?: number;
  /**
   * Set where herdr hands Ghostty images through files, which it does only
   * while their layout stays the same: every browser frame goes whole as raw
   * pixels, the next is taken once herdr has read the last, and a page not
   * driven by a key, click, or wheel sends at most this many pixels a second.
   */
  browserFileRate?: number;
  /**
   * Reads and scales pictures off the main thread. With it, a note window
   * on a kitty terminal never decodes its pictures and sends each one at
   * the size it shows.
   */
  imageScaler?: Pick<ImageScaler, "size" | "scale">;
  /**
   * How long a note picture stays on screen before the terminal gets it.
   * For a path where each picture costs much to pass on, so those a fast
   * scroll carries past are never sent.
   */
  pictureSettleMs?: number;
  /** Tests inject terminal graphics support; the renderer's own detection otherwise. */
  capabilities?: () => GraphicsSupport;
  /** Tests inject how many image files the terminal has yet to read; the renderer's otherwise. */
  imageFilesPending?: () => number;
  /**
   * Bytes for the terminal outside the renderer; otherwise written to
   * standard output synchronously, so they land before the renderer's next
   * native write. Sized text otherwise goes through the renderer's own
   * writer, in order with the frames.
   */
  write?: (bytes: string) => void;
  /** Where failures the shell does not throw are reported. */
  logger?: { error(event: string, fields: { reason: string }): void };
};

/** What the terminal can draw images with. */
export type GraphicsSupport = {
  caps: TerminalCapabilities | null;
  hasResolution: boolean;
};

/**
 * What views get: the shell's dependencies, the store's dispatch, the
 * decoded images, and the terminal's graphics support.
 */
export type ViewDeps = ShellDeps & {
  dispatch: Store["dispatch"];
  images: ImageCache;
  /** Note pictures as kitty images, kept in places that do not move. */
  imageSlots: ImageSlots;
  /** Note pictures read and scaled off the main thread, with `imageScaler`. */
  pictures?: NotePictures;
  /** Text the terminal draws at other sizes, written after each frame. */
  sizedText: SizedText;
  capabilities: () => GraphicsSupport;
  imageFilesPending: () => number;
};

export type Shell = {
  /** Build the views, follow the store, and feed it keys and resizes. */
  attach(store: Store): void;
  /** OSC 52 copy for the clipboard provider chain. */
  copyOsc52(text: string): void;
  /** Drop the decoded images of a workspace path that changed or went away on disk. */
  forgetImages(path: string): void;
  /** Paint the latest state and resolve once that frame is written. */
  flush(): Promise<void>;
  /** Give the terminal away: nothing is painted until `resume`. */
  suspend(): Promise<void>;
  /** Take the terminal back and paint the latest state, images included. */
  resume(): Promise<void>;
  /** Write `FOREIGN_MODES_RESET`. */
  resetForeignModes(): void;
  /** Restore the terminal; later calls do nothing. Safe while suspended. */
  destroy(): void;
  /**
   * Resolves once the terminal is restored after `destroy`, or the renderer
   * gave up on it; a failure is logged, never thrown.
   */
  closed(): Promise<void>;
};

/** Where the hardware cursor goes, in screen cells from the top left. */
export type Cursor = { x: number; y: number; style: "block" | "line" };

/**
 * A region repainted from the state on every store change. `cursor` is
 * defined only while the view owns focus; `targetAt` and `dragAt` make the
 * view a mouse source.
 */
export type View = Renderable & {
  update(s: AppState, lc: LayoutClass): void;
  cursor?(): Cursor | undefined;
  targetAt?: MouseSource["targetAt"];
  dragAt?: MouseSource["dragAt"];
};

export function createShell(renderer: CliRenderer, deps: ShellDeps): Shell {
  // A destroyed renderer throws on most calls, and the store can still
  // change while the terminal is being restored: nothing paints after it.
  let destroyed = false;
  // While another program owns the terminal, no paint may run: a paint
  // would turn mouse tracking back on under it.
  let suspended = false;
  // A finished image load lays the views out again, so its rows are reserved.
  let repaint = () => renderer.requestRender();
  const images = new ImageCache({
    load: deps.loadImage,
    repaint: () => repaint(),
    now: deps.now,
    cell: () => {
      const r = renderer.resolution;
      const { terminalWidth: cols, terminalHeight: rows } = renderer;
      return r === null || cols <= 0 || rows <= 0
        ? undefined
        : { width: r.width / cols, height: r.height / rows };
    },
  });
  const pictures =
    deps.imageScaler === undefined
      ? undefined
      : new NotePictures({
          load: deps.loadImage,
          scaler: deps.imageScaler,
          repaint: () => repaint(),
          now: deps.now,
        });
  let imageSlots: ImageSlots | undefined;
  let sizedText: SizedText | undefined;
  return {
    attach(store) {
      const slots = new ImageSlots(renderer, {
        ...(deps.pictureSettleMs === undefined
          ? {}
          : { settleMs: deps.pictureSettleMs }),
        now: deps.now,
        repaint: () => repaint(),
      });
      imageSlots = slots;
      const sized = new SizedText(renderer, deps.write);
      sizedText = sized;
      const ctx: ViewDeps = {
        ...deps,
        dispatch: store.dispatch,
        images,
        imageSlots: slots,
        sizedText: sized,
        ...(pictures === undefined ? {} : { pictures }),
        capabilities:
          deps.capabilities ??
          (() => ({
            caps: renderer.capabilities,
            hasResolution: renderer.resolution !== null,
          })),
        imageFilesPending:
          deps.imageFilesPending ??
          (() => renderer.kittyImageTransportStatus.pendingFiles),
      };
      const windows = new WindowTree(renderer, ctx);
      const explorer = new ExplorerView(renderer);
      const cmdline = new CommandLine(renderer, ctx);
      const side = new SidePanelView(renderer);
      let router: MouseRouter | undefined;
      const overlays = new OverlayHost(
        renderer,
        [
          new PromptView(renderer),
          new ConflictView(renderer),
          new WhichKeyView(renderer, ctx),
          new PickerView(renderer, ctx),
          new CompletionView(renderer, () => windows.cursor()),
          new CalendarOverlay(renderer),
          new ZoomOverlay(renderer, ctx),
          new HunkView(renderer, () => windows.anchor()),
          new PdfMenuView(renderer, () => windows.pdfMenuBox()),
          new SqliteQueryView(renderer, ctx),
        ],
        new LspFloatView(renderer, (f) =>
          f.pointer === true ? router?.pointer() : windows.cursor(),
        ),
      );
      const bufferline = new Bufferline(renderer);
      const statusline = new Statusline(renderer, ctx);
      const toasts = new ToastStack(renderer);
      // Images go after the windows' text and before anything drawn over them.
      const views: View[] = [
        bufferline,
        windows,
        slots,
        explorer,
        side,
        statusline,
        cmdline,
        toasts,
        overlays,
      ];
      // Focus order: an overlay, then the command line, the explorer, the side panel, the active window.
      const focus: View[] = [overlays, cmdline, explorer, side, windows];
      renderer.root.getRenderable(BACKDROP_ID)?.destroy();
      for (const v of views) renderer.root.add(v);
      // Mouse sources, top of the z-order first: the paint order reversed.
      const sources: MouseSource[] = [
        overlays,
        toasts,
        cmdline,
        statusline,
        side,
        explorer,
        bufferline,
        windows,
      ];
      router = createMouseRouter({
        sources,
        enabled: () => store.get().config.mouse,
        stops: (t) => pressStops(store.get(), t),
        dispatch: (a) => store.dispatch(a),
        now: deps.now,
      });
      const layer = new MouseLayer(renderer, router);
      renderer.root.add(layer);
      const paint = (s: AppState) => {
        if (suspended || destroyed) return;
        const lc = layoutClass(s.terminal.cols);
        for (const v of views) v.update(s, lc);
        if (renderer.useMouse !== s.config.mouse)
          renderer.useMouse = s.config.mouse;
        layer.update(s);
        const c = focus.map((v) => v.cursor?.()).find((x) => x !== undefined);
        if (c === undefined) renderer.setCursorPosition(0, 0, false);
        else {
          renderer.setCursorPosition(c.x + 1, c.y + 1, true);
          renderer.setCursorStyle({ style: c.style });
        }
        renderer.requestRender();
      };
      store.subscribe(paint);
      repaint = () => paint(store.get());
      const normalizer = createKeyNormalizer({
        escTimeoutMs: () => store.get().config.escTimeoutMs,
        now: deps.now,
        setTimer: (fn, ms) => setTimeout(fn, ms),
        clear: (t) => clearTimeout(t),
        emit: (key, now, raw) =>
          store.dispatch(
            raw === undefined
              ? { type: "key", key, now }
              : { type: "key", key, now, raw },
          ),
        unnamed: (raw, now) => store.dispatch({ type: "rawKey", raw, now }),
      });
      // A page's frame changes nothing in the store: the next render draws it.
      deps.browserFrames?.listen(() => {
        if (!suspended) renderer.requestRender();
      });
      renderer.keyInput.on("keypress", (e) => normalizer.feed(e));
      const utf8 = new TextDecoder();
      renderer.keyInput.on("paste", (e) =>
        store.dispatch({ type: "paste", text: utf8.decode(e.bytes) }),
      );
      renderer.on("resize", (cols: number, rows: number) => {
        sized.invalidate();
        store.dispatch({ type: "resize", cols, rows });
      });
      // Whether the terminal sizes text is known only once it answers.
      renderer.on("capabilities", () => {
        if (!suspended) repaint();
      });
      paint(store.get());
    },
    copyOsc52(text) {
      renderer.copyToClipboardOSC52(text);
    },
    forgetImages(path) {
      images.forget(path);
      pictures?.forget(path);
      imageSlots?.forget(path);
    },
    async flush() {
      repaint();
      await renderer.idle();
    },
    async suspend() {
      suspended = true;
      try {
        await renderer.suspend();
      } catch (x) {
        // The terminal was not handed over, so the shell keeps painting.
        suspended = false;
        throw x;
      }
      // The terminal drops every image: holding scrolled-away pictures would
      // send them all again on resume.
      imageSlots?.clear();
    },
    async resume() {
      // The renderer repaints every cell on its next frame, so each image
      // still on screen is drawn again; the terminal dropped it on suspend.
      await renderer.resume();
      suspended = false;
      sizedText?.invalidate();
      repaint();
    },
    resetForeignModes() {
      (deps.write ?? ((b) => writeSync(1, b)))(FOREIGN_MODES_RESET);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      images.clear();
      pictures?.clear();
      renderer.destroy();
    },
    closed() {
      return renderer.closed.then(
        () => {},
        (x: unknown) =>
          deps.logger?.error("terminal.closeFailed", {
            reason: x instanceof Error ? x.message : String(x),
          }),
      );
    },
  };
}
