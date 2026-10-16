import {
  NativeImage,
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import type {
  BrowserWindowState,
  PagePoint,
} from "../../core/features/browser/file-type";
import { browserWindow } from "../../core/state/browser";
import type {
  AppState,
  MouseTarget,
  WindowId,
  WindowSpot,
} from "../../core/state/types";
import type { BrowserFrame } from "../browser-frames";
import {
  type CellBox,
  cellPixels,
  changedBoxes,
  copyBox,
  type Pixels,
  union,
  within,
} from "../browser-patch";
import { type ImageTier, imageTier } from "../images";
import { promptBox } from "../overlays/prompt";
import type { Cursor, ViewDeps } from "../shell";
import { drawCells, themeOf } from "../theme";
import { punch } from "./pdf-view";
import type { WindowView } from "./registry";
import type { Rect } from "./text-view";

type Tier = Exclude<ImageTier, "placeholder">;

/** One slice of the frame drawn into a cell box. */
type Piece = {
  image: NativeImage;
  x: number;
  y: number;
  cols: number;
  rows: number;
  srcX: number;
  srcY: number;
  srcW: number;
  srcH: number;
};

/** How long the page waits for the terminal to report its cell size. */
const CELL_WAIT_MS = 500;

/** A change over more of the window than this goes as a whole frame. */
const PATCH_SHARE = 0.25;
/** Patches over one whole frame before the next whole frame replaces them. */
const PATCH_LIMIT = 16;
/**
 * How many times as long as a frame took to take the page waits before its
 * next: a page that never stops moving keeps so at most a quarter busy.
 */
const FRAME_REST = 3;
/**
 * For this long after a key, click, wheel, or navigation reaches the page,
 * its frames are taken without resting, so scrolling keeps up.
 */
const DRIVEN_MS = 1000;

/** One image on screen over a box of the window's cells. */
type Layer = { image: NativeImage; box: CellBox };

function pixelsOf(image: NativeImage): Pixels {
  const raw = image.raw("rgba8");
  return {
    data: raw.data,
    width: raw.width,
    height: raw.height,
    stride: raw.stride,
  };
}

const nameOf = (path: string) => path.slice(path.lastIndexOf("/") + 1);

/** Lines that stand in for the page while there is no frame to draw. */
function statusLines(ws: BrowserWindowState, name: string): string[] {
  const s = ws.status;
  switch (s.kind) {
    case "missing":
      return [
        `The browser view needs Chrome or Chromium: ${name} cannot be drawn here.`,
        s.configured === undefined
          ? "Install Google Chrome or Chromium, or set [browser] chrome in config.toml."
          : `[browser] chrome = "${s.configured}" does not exist.`,
        ":Open shows it in the system browser · <leader>m shows the source",
      ];
    case "failed":
      return [
        `Chrome would not start: ${s.reason}`,
        "r tries again · :Open shows it in the system browser",
      ];
    case "crashed":
      return ["Chrome stopped.", "r starts it again"];
    case "starting":
    case "ready":
      return [`◌ ${name}`];
  }
}

/**
 * A browser window: the latest frame of its page over the whole window. Frames come from the shared
 * frame holder, not the store, and each is acknowledged once drawn, so the
 * page sends the next only when the terminal has taken this one. Lines
 * stand in while there is no frame, when Chrome is missing or stopped, and
 * when the terminal draws no images.
 */
export class BrowserView extends Renderable implements WindowView {
  private s: AppState | undefined;
  private windowId: WindowId = 0;
  private rect: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private lines: string[] = [];
  private tier: Tier | undefined;
  /**
   * What is on screen: the last whole frame, the patches drawn over it
   * since, and their pixels together. Images taken off screen are freed at
   * the next frame, once the terminal no longer shows them.
   */
  private base: Layer | undefined;
  private patches: Layer[] = [];
  private shown: Pixels | undefined;
  private trash: NativeImage[] = [];
  private seq = -1;
  private pacing: ReturnType<typeof setTimeout> | undefined;
  /** Set while the view rests from the last frame it took. */
  private resting = false;
  private pieces: Piece[] = [];
  private placed: Piece | undefined;
  /** Set once the wait for the terminal's cell size is over. */
  private guessing = false;
  private wait: ReturnType<typeof setTimeout> | undefined;

  constructor(
    ctx: RenderContext,
    private readonly deps: ViewDeps,
  ) {
    super(ctx, { position: "absolute" });
  }

  show(s: AppState, id: WindowId, r: Rect, _split: boolean): void {
    this.s = s;
    if (id !== this.windowId) this.seq = -1;
    this.windowId = id;
    this.rect = r;
    this.left = r.x;
    this.top = r.y;
    this.width = r.w;
    this.height = r.h;
    this.lines = [];
    this.tier = undefined;
    const w = s.windows.byId[id];
    const b = w === undefined ? undefined : s.buffers[w.content.bufferId];
    const ws = browserWindow(s, id);
    if (b === undefined || ws === undefined || r.h <= 0 || r.w <= 0) return;
    const name = nameOf(b.path);
    const { caps, hasResolution } = this.deps.capabilities();
    const tier = imageTier(s.config.preview.images, caps, hasResolution);
    if (tier === "placeholder") {
      this.lines = [
        `[html: ${name}] needs terminal graphics (preview.images)`,
        ":Open shows it in the system browser · <leader>m shows the source",
      ];
      return;
    }
    // Chrome's density is set when it starts, so the page waits a moment for
    // the terminal's cell size; a terminal that never reports one gets the
    // usual guess. Blocks need no pixel size.
    const known = this.deps.images.cellPixels();
    if (known === undefined && tier !== "blocks" && !this.guessing) {
      this.lines = [`◌ ${name}`];
      this.wait ??= setTimeout(() => {
        this.guessing = true;
        this.layOut(this.rect);
      }, CELL_WAIT_MS);
      return;
    }
    this.layOut(r, ws);
    // The lines stand in until a frame comes; frames come without a repaint.
    this.lines = statusLines(ws, name);
    const live = ws.status.kind === "ready" || ws.status.kind === "starting";
    // A terminal image would draw over the zoom float.
    if (live && s.overlay.kind !== "zoom") this.tier = tier;
  }

  /** Tell the core the window's size in pixels when it changed; the page follows. */
  private layOut(
    r: Rect,
    ws = this.s && browserWindow(this.s, this.windowId),
  ): void {
    if (ws === undefined || r.w <= 0 || r.h <= 0) return;
    const cell = this.deps.images.cellSize();
    const width = Math.round(r.w * cell.width);
    const height = Math.round(r.h * cell.height);
    const cellHeight = Math.round(cell.height);
    if (
      ws.px?.width === width &&
      ws.px.height === height &&
      ws.px.cellHeight === cellHeight
    )
      return;
    const window = this.windowId;
    queueMicrotask(() =>
      this.deps.dispatch({
        type: "browserLaidOut",
        window,
        width,
        height,
        cellHeight,
      }),
    );
  }

  /**
   * Take the newest frame onto the screen. When only a little of the page
   * changed, just that part goes over what is shown as a patch: a terminal
   * is sent its pixels alone. Otherwise, or once patches pile up, the whole
   * frame replaces everything. A frame that does not decode changes nothing.
   * Gives how many pixels the terminal is sent.
   */
  private take(frame: BrowserFrame): number {
    this.seq = frame.seq;
    for (const image of this.trash.splice(0)) image.dispose();
    let next: NativeImage;
    try {
      next = NativeImage.decode(frame.png);
    } catch {
      return 0;
    }
    const r = this.rect;
    const whole: CellBox = { col: 0, row: 0, cols: r.w, rows: r.h };
    const base = this.base;
    const shown = this.shown;
    if (
      base === undefined ||
      shown === undefined ||
      shown.width !== next.width ||
      shown.height !== next.height ||
      base.box.cols !== r.w ||
      base.box.rows !== r.h
    )
      return this.replace(next, whole);
    const pixels = pixelsOf(next);
    const changed = changedBoxes(
      shown,
      pixels,
      r.w,
      r.h,
      PATCH_SHARE * r.w * r.h,
    );
    if (changed === undefined) return this.replace(next, whole);
    if (changed.length === 0) {
      next.dispose();
      return 0;
    }
    // Patches may overlap: outside its change a newer patch's pixels are
    // the older ones'. Ones a new patch hides go; once too many are left,
    // they all go back into one, cut from the new frame, which has the
    // latest pixels.
    const full = this.patches.length + changed.length > PATCH_LIMIT;
    const cells = full
      ? [this.patches.reduce((b, p) => union(b, p.box), changed.reduce(union))]
      : changed;
    const area = cells.reduce((n, c) => n + c.cols * c.rows, 0);
    if (area > PATCH_SHARE * r.w * r.h) return this.replace(next, whole);
    const gone = this.patches.filter(
      (p) => full || cells.some((c) => within(p.box, c)),
    );
    const added = cells.map((c) => {
      const box = cellPixels(c, next.width, next.height, r.w, r.h);
      const image = next.extract({
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height,
      });
      // A cut image has no PNG of its own; without one it goes as raw pixels.
      image.ensureEncodedPng();
      copyBox(pixels, shown, box);
      return { image, box: c };
    });
    next.dispose();
    this.trash.push(...gone.map((p) => p.image));
    this.patches = [...this.patches.filter((p) => !gone.includes(p)), ...added];
    return added.reduce((n, l) => n + l.image.width * l.image.height, 0);
  }

  /** Show `next` alone, over the whole window. */
  private replace(next: NativeImage, box: CellBox): number {
    if (this.base !== undefined) this.trash.push(this.base.image);
    this.trash.push(...this.patches.map((p) => p.image));
    const pixels = pixelsOf(next);
    this.base = { image: next, box };
    this.patches = [];
    this.shown = { ...pixels, data: pixels.data.slice() };
    return next.width * next.height;
  }

  /**
   * A layer over its cells of the window. A whole frame matches the
   * window's pixels at zoom 1; zoomed, or for the moment after a resize, it
   * is scaled.
   */
  private place(l: Layer): Piece {
    const r = this.rect;
    return {
      image: l.image,
      x: r.x + l.box.col,
      y: r.y + l.box.row,
      cols: l.box.cols,
      rows: l.box.rows,
      srcX: 0,
      srcY: 0,
      srcW: l.image.width,
      srcH: l.image.height,
    };
  }

  /**
   * Rest from the frame just taken, `work` ms of it, before taking another,
   * unless the page was just driven; with a pixel rate set, also until the
   * `sent` pixels fit the rate, so the terminal is never sent more than it
   * passes on. Chrome has more frames in flight: those arriving meanwhile
   * wait, and the newest is taken after. Then the page is asked for its next.
   */
  private rest(frame: BrowserFrame, sent: number, work: number): void {
    const rate = this.deps.browserPixelRate;
    const paced = rate === undefined ? 0 : (sent / rate) * 1000;
    const driven =
      this.deps.browserFrames?.drivenWithin(this.windowId, DRIVEN_MS) ?? false;
    this.resting = true;
    clearTimeout(this.pacing);
    this.pacing = setTimeout(
      () => {
        this.resting = false;
        frame.ack();
        this.requestRender();
      },
      Math.max(driven ? 0 : FRAME_REST * work, paced),
    );
  }

  protected override destroySelf(): void {
    clearTimeout(this.wait);
    clearTimeout(this.pacing);
    for (const image of this.trash.splice(0)) image.dispose();
    this.base?.image.dispose();
    for (const p of this.patches) p.image.dispose();
    this.base = undefined;
    this.patches = [];
    this.shown = undefined;
    super.destroySelf();
  }

  cursor(): Cursor | undefined {
    return undefined;
  }

  targetAt(x: number, y: number): MouseTarget | undefined {
    const r = this.rect;
    if (x < r.x || x >= r.x + r.w || y < r.y || y >= r.y + r.h)
      return undefined;
    const p = this.placed;
    const on =
      p !== undefined &&
      x >= p.x &&
      x < p.x + p.cols &&
      y >= p.y &&
      y < p.y + p.rows;
    return this.target(on ? pointAt(p, x, y) : undefined);
  }

  /** Where a drag that started on the page is: the cell clamped onto the frame. */
  dragAt(x: number, y: number, _from: WindowSpot): MouseTarget | undefined {
    const p = this.placed;
    if (p === undefined) return this.target(undefined);
    const cx = Math.max(p.x, Math.min(x, p.x + p.cols - 1));
    const cy = Math.max(p.y, Math.min(y, p.y + p.rows - 1));
    return this.target(pointAt(p, cx, cy));
  }

  private target(at: PagePoint | undefined): MouseTarget {
    return {
      kind: "window",
      window: this.windowId,
      spot: at === undefined ? { kind: "browser" } : { kind: "browser", at },
    };
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    if (s === undefined) return;
    const theme = themeOf(s);
    const r = this.rect;
    for (let i = 0; i < r.h; i++)
      drawCells(buf, theme.style("text"), r.x, r.y + i, "", r.w);
    const tier = this.tier;
    const frame =
      tier === undefined
        ? undefined
        : this.deps.browserFrames?.latest(this.windowId);
    const lines = frame === undefined ? this.lines : [];
    const top = r.y + Math.max(0, Math.floor((r.h - lines.length) / 2));
    lines.slice(0, r.h).forEach((line, i) => {
      const pad = Math.max(0, Math.floor((r.w - [...line].length) / 2));
      drawCells(
        buf,
        theme.style("imagePlaceholder"),
        r.x + pad,
        top + i,
        line,
        r.w - pad,
      );
    });
    this.placed = undefined;
    if (tier === undefined || frame === undefined) return;
    const fresh = frame.seq !== this.seq && !this.resting;
    const started = performance.now();
    const sent = fresh ? this.take(frame) : 0;
    const work = performance.now() - started;
    const base = this.base;
    if (base === undefined) {
      if (fresh) frame.ack();
      return;
    }
    this.placed = this.place(base);
    const layers = [this.placed, ...this.patches.map((p) => this.place(p))];
    // A terminal image draws over a prompt's cells: the frame leaves them out.
    const hole = promptBox(s);
    this.pieces =
      hole === undefined || tier === "blocks" ? layers : punch(layers, hole);
    const px = this.deps.images.cellPixels();
    for (const p of this.pieces)
      buf.drawImage(
        p.image,
        p.x,
        p.y,
        p.cols,
        p.rows,
        px === undefined ? 0 : Math.round(p.cols * px.width),
        px === undefined ? 0 : Math.round(p.rows * px.height),
        p.srcX,
        p.srcY,
        p.srcW,
        p.srcH,
        tier,
      );
    if (fresh) this.rest(frame, sent, work);
  }
}

/** The point in the frame at the middle of cell (x, y) inside piece `p`. */
function pointAt(p: Piece, x: number, y: number): PagePoint {
  return {
    x: (p.srcX + ((x - p.x + 0.5) / p.cols) * p.srcW) / p.image.width,
    y: (p.srcY + ((y - p.y + 0.5) / p.rows) * p.srcH) / p.image.height,
  };
}
