import {
  type CliRenderer,
  type CliRendererConfig,
  createCliRenderer,
  type Renderable,
  type TerminalCapabilities,
} from "@opentui/core";
import { pressStops } from "../core/state/mouse";
import type { Store } from "../core/state/store";
import type { AppState, SvgRaster } from "../core/state/types";
import type { Registries } from "../core/state/update";
import { ImageCache } from "./images";
import { createKeyNormalizer } from "./input";
import { createMouseRouter, MouseLayer, type MouseSource } from "./mouse";
import { CalendarOverlay } from "./overlays/calendar";
import { CompletionView } from "./overlays/completion";
import { ConflictView } from "./overlays/conflict";
import { OverlayHost } from "./overlays/host";
import { ToastStack } from "./overlays/notify";
import { PickerView } from "./overlays/picker";
import { PromptView } from "./overlays/prompt";
import { WhichKeyView } from "./overlays/whichkey";
import { ZoomOverlay } from "./overlays/zoom";
import { Bufferline } from "./views/bufferline";
import { CommandLine } from "./views/cmdline";
import { ExplorerView } from "./views/explorer";
import { SidePanelView } from "./views/side-panel";
import { Statusline } from "./views/statusline";
import { WindowTree } from "./views/window-tree";

/**
 * Every OpenTUI process handler is off (`src/app/lifecycle.ts` owns signals,
 * exceptions, and exit), and any-motion mouse tracking is not requested.
 * Mouse tracking starts off; the first paint turns it on from the config, so
 * `mouse = false` never enables it for a frame.
 */
export const RENDERER_OPTIONS = {
  exitOnCtrlC: false,
  exitSignals: [],
  openConsoleOnError: false,
  useMouse: false,
  enableMouseMovement: false,
  screenMode: "alternate-screen",
  useKittyKeyboard: {},
} as const satisfies CliRendererConfig;

export const createRenderer = (): Promise<CliRenderer> =>
  createCliRenderer({ ...RENDERER_OPTIONS, exitSignals: [] });

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
  loadImage: (ref: string) => Promise<Uint8Array>;
  /** PNG bytes of part of an SVG; the zoom float draws diagrams with it. */
  rasterizeSvg: (r: SvgRaster) => Promise<Uint8Array>;
  /** Tests inject terminal graphics support; the renderer's own detection otherwise. */
  capabilities?: () => GraphicsSupport;
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
  capabilities: () => GraphicsSupport;
};

export type Shell = {
  /** Build the views, follow the store, and feed it keys and resizes. */
  attach(store: Store): void;
  /** OSC 52 copy for the clipboard provider chain. */
  copyOsc52(text: string): void;
  /** Restore the terminal; later calls do nothing. */
  destroy(): void;
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
  let destroyed = false;
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
  return {
    attach(store) {
      const ctx: ViewDeps = {
        ...deps,
        dispatch: store.dispatch,
        images,
        capabilities:
          deps.capabilities ??
          (() => ({
            caps: renderer.capabilities,
            hasResolution: renderer.resolution !== null,
          })),
      };
      const windows = new WindowTree(renderer, ctx);
      const explorer = new ExplorerView(renderer);
      const cmdline = new CommandLine(renderer, ctx);
      const side = new SidePanelView(renderer);
      const overlays = new OverlayHost(renderer, [
        new PromptView(renderer),
        new ConflictView(renderer),
        new WhichKeyView(renderer, ctx),
        new PickerView(renderer, ctx),
        new CompletionView(renderer, () => windows.cursor()),
        new CalendarOverlay(renderer),
        new ZoomOverlay(renderer, ctx),
      ]);
      const bufferline = new Bufferline(renderer);
      const statusline = new Statusline(renderer, ctx);
      const toasts = new ToastStack(renderer);
      const views: View[] = [
        bufferline,
        windows,
        explorer,
        side,
        statusline,
        cmdline,
        toasts,
        overlays,
      ];
      // Focus order: an overlay, then the command line, the explorer, the side panel, the active window.
      const focus: View[] = [overlays, cmdline, explorer, side, windows];
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
      const layer = new MouseLayer(
        renderer,
        createMouseRouter({
          sources,
          enabled: () => store.get().config.mouse,
          stops: (t) => pressStops(store.get(), t),
          dispatch: (a) => store.dispatch(a),
          now: deps.now,
        }),
      );
      renderer.root.add(layer);
      const paint = (s: AppState) => {
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
        emit: (key, now) => store.dispatch({ type: "key", key, now }),
      });
      renderer.keyInput.on("keypress", (e) => normalizer.feed(e));
      renderer.on("resize", (cols: number, rows: number) =>
        store.dispatch({ type: "resize", cols, rows }),
      );
      paint(store.get());
    },
    copyOsc52(text) {
      renderer.copyToClipboardOSC52(text);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      images.clear();
      renderer.destroy();
    },
  };
}
