import {
  type CliRenderer,
  type CliRendererConfig,
  createCliRenderer,
  type Renderable,
} from "@opentui/core";
import type { Store } from "../core/state/store";
import type { AppState } from "../core/state/types";
import type { Registries } from "../core/state/update";
import { createKeyNormalizer } from "./input";
import { CompletionView } from "./overlays/completion";
import { ConflictView } from "./overlays/conflict";
import { OverlayHost } from "./overlays/host";
import { ToastStack } from "./overlays/notify";
import { PickerView } from "./overlays/picker";
import { PromptView } from "./overlays/prompt";
import { WhichKeyView } from "./overlays/whichkey";
import { Bufferline } from "./views/bufferline";
import { CommandLine } from "./views/cmdline";
import { ExplorerView } from "./views/explorer";
import { SidePanelView } from "./views/side-panel";
import { Statusline } from "./views/statusline";
import { WindowTree } from "./views/window-tree";

/**
 * Every OpenTUI process handler is off (`src/app/lifecycle.ts` owns signals,
 * exceptions, and exit), and any-motion mouse tracking is not requested.
 */
export const RENDERER_OPTIONS = {
  exitOnCtrlC: false,
  exitSignals: [],
  openConsoleOnError: false,
  useMouse: true,
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
};

/** What views get: the shell's dependencies and the store's dispatch. */
export type ViewDeps = ShellDeps & { dispatch: Store["dispatch"] };

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
 * defined only while the view owns focus.
 */
export type View = Renderable & {
  update(s: AppState, lc: LayoutClass): void;
  cursor?(): Cursor | undefined;
};

export function createShell(renderer: CliRenderer, deps: ShellDeps): Shell {
  let destroyed = false;
  return {
    attach(store) {
      const ctx: ViewDeps = { ...deps, dispatch: store.dispatch };
      const windows = new WindowTree(renderer, ctx);
      const explorer = new ExplorerView(renderer, ctx);
      const cmdline = new CommandLine(renderer, ctx);
      const side = new SidePanelView(renderer);
      const overlays = new OverlayHost(renderer, [
        new PromptView(renderer),
        new ConflictView(renderer),
        new WhichKeyView(renderer, ctx),
        new PickerView(renderer, ctx),
        new CompletionView(renderer, () => windows.cursor()),
      ]);
      const views: View[] = [
        new Bufferline(renderer),
        windows,
        explorer,
        side,
        new Statusline(renderer, ctx),
        cmdline,
        new ToastStack(renderer),
        overlays,
      ];
      // Focus order: an overlay, then the command line, the explorer, the side panel, the active window.
      const focus: View[] = [overlays, cmdline, explorer, side, windows];
      for (const v of views) renderer.root.add(v);
      const paint = (s: AppState) => {
        const lc = layoutClass(s.terminal.cols);
        for (const v of views) v.update(s, lc);
        const c = focus.map((v) => v.cursor?.()).find((x) => x !== undefined);
        if (c === undefined) renderer.setCursorPosition(0, 0, false);
        else {
          renderer.setCursorPosition(c.x + 1, c.y + 1, true);
          renderer.setCursorStyle({ style: c.style });
        }
        renderer.requestRender();
      };
      store.subscribe(paint);
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
      renderer.destroy();
    },
  };
}
