import { appendFileSync, writeFileSync } from "node:fs";
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
 * How long apart the bands of one frame go to the terminal: herdr hands
 * Ghostty one image at a time through a file, and sends the others that
 * reach it together inline.
 */
const BAND_GAP_MS = 100;
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
/**
 * For this long after a wheel step, the page's frames go whole without
 * being compared to what is shown.
 */
const SCROLLED_MS = 300;

const TRACE = process.env.SO_TRACE;
const trace = (msg: string) => {
  if (TRACE)
    appendFileSync(TRACE, `${performance.now().toFixed(0)} view ${msg}\n`);
};

/** One image on screen over a box of the window's cells. */
type Layer = { image: NativeImage; box: CellBox };

/** `image`'s RGBA pixels, copied into `into` when it has their size. */
function pixelsOf(image: NativeImage, into?: Uint8Array): Pixels {
  const stride = image.width * 4;
  const size = stride * image.height;
  const data = into?.length === size ? into : new Uint8Array(size);
  image.copyTo(data, { stride, format: "rgba8" });
  return { data, width: image.width, height: image.height, stride };
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
   * What is on screen: the last whole frame (drawn as `bands` when it has
   * more pixels than one image may), the patches drawn over it since, and
   * their pixels together. Bands go on screen one at a time, `shownBands`
   * so far, over what was shown `behind` them. Images taken off screen are
   * freed at the next frame, once the terminal no longer shows them.
   */
  private base: Layer | undefined;
  private bands: Layer[] = [];
  private shownBands = 0;
  private behind: Layer[] = [];
  private bandShownAt = 0;
  private bandTimer: ReturnType<typeof setTimeout> | undefined;
  private patches: Layer[] = [];
  private shown: Pixels | undefined;
  /** A buffer a frame's pixels are copied into, so each frame allocates none. */
  private spare: Uint8Array | undefined;
  /** The PNG of the last frame taken, whose pixels are what is shown. */
  private shownPng: Uint8Array | undefined;
  private takenFrameId = -1;
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
    const r0 = this.rect;
    // Chrome sends a frame for every wheel step, even one that moves nothing:
    // the same bytes as what is shown change nothing.
    if (
      !process.env.SO_X_NODEDUPE &&
      this.base !== undefined &&
      this.base.box.cols === r0.w &&
      this.base.box.rows === r0.h &&
      this.shownPng !== undefined &&
      Buffer.from(
        this.shownPng.buffer,
        this.shownPng.byteOffset,
        this.shownPng.length,
      ).equals(frame.png)
    )
      return 0;
    this.shownPng = frame.png;
    let next: NativeImage;
    try {
      next = NativeImage.decode(frame.png);
      if (process.env.SO_X_TRANSPORT) {
        const cut = next.extract({
          left: 0,
          top: 0,
          width: next.width,
          height: next.height,
        });
        next.dispose();
        next = cut;
      }
    } catch {
      return 0;
    }
    const r = this.rect;
    const whole: CellBox = { col: 0, row: 0, cols: r.w, rows: r.h };
    const base = this.base;
    if (
      base === undefined ||
      base.image.width !== next.width ||
      base.image.height !== next.height ||
      base.box.cols !== r.w ||
      base.box.rows !== r.h ||
      // A frame that answers a wheel step has moved as a whole: comparing it
      // would only decode its pixels for nothing.
      this.deps.browserFrames?.scrolledWithin(this.windowId, SCROLLED_MS) ||
      process.env.SO_X_FIXED === "1"
    ) {
      if (
        process.env.SO_X_DIFF &&
        base !== undefined &&
        base.image.width === next.width &&
        base.image.height === next.height
      ) {
        const a = pixelsOf(base.image).data;
        const b = pixelsOf(next).data;
        let n = 0;
        let first = -1;
        for (let i = 0; i < a.length; i += 4)
          if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) {
            n++;
            if (first < 0) first = i / 4;
          }
        trace(
          `diff px=${n} first=${first < 0 ? "-" : `${first % next.width},${Math.floor(first / next.width)}`}`,
        );
      }
      return this.replace(next, whole);
    }
    // What is shown is read back from its frame only once a frame is compared to it.
    if (this.shown === undefined) {
      this.shown = pixelsOf(base.image, this.spare);
      this.spare = undefined;
    }
    const shown = this.shown;
    const pixels = pixelsOf(next, this.spare);
    this.spare = pixels.data;
    const changed = changedBoxes(
      shown,
      pixels,
      r.w,
      r.h,
      PATCH_SHARE * r.w * r.h,
    );
    if (changed === undefined) return this.replace(next, whole, pixels);
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
    if (area > PATCH_SHARE * r.w * r.h)
      return this.replace(next, whole, pixels);
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

  /**
   * Show `next` alone over the whole window; its `pixels` when they were
   * read, else they are read from it once a frame is compared to it.
   */
  private replace(next: NativeImage, box: CellBox, pixels?: Pixels): number {
    const bands = this.bandsOf(next, box);
    // Bands go up one at a time over a whole frame of the same window, which
    // stays under them.
    const staggered =
      bands.length > 1 &&
      this.bands.length === 0 &&
      this.base?.box.cols === box.cols &&
      this.base.box.rows === box.rows;
    const behind = staggered ? this.onScreen() : [];
    const old = [
      ...(this.base === undefined ? [] : [this.base]),
      ...this.bands,
      ...this.patches,
      ...this.behind,
    ];
    this.trash.push(
      ...old.filter((l) => !behind.includes(l)).map((l) => l.image),
    );
    this.behind = behind;
    this.base = { image: next, box };
    this.bands = bands;
    this.shownBands = staggered ? 0 : bands.length;
    for (const b of staggered ? [] : bands) b.image.ensureEncodedPng();
    this.patches = [];
    // The buffer of the pixels shown before takes the next frame's.
    this.spare = this.shown?.data ?? this.spare;
    this.shown = pixels;
    return next.width * next.height;
  }

  /**
   * The layers on screen, bottom first. The terminal is told each image
   * by its place in this list, so a layer keeps its place while it stays.
   */
  private onScreen(): Layer[] {
    const base =
      this.bands.length > 0
        ? this.bands.slice(0, this.shownBands)
        : this.base === undefined
          ? []
          : [this.base];
    return [...this.behind, ...base, ...this.patches];
  }

  /**
   * Put the next band on screen once the last went `BAND_GAP_MS` ago, its
   * PNG made only now; until then, render again when it may.
   */
  private showBand(): void {
    if (this.shownBands === this.bands.length) return;
    const wait =
      this.shownBands === 0
        ? 0
        : this.bandShownAt + BAND_GAP_MS - performance.now();
    const later = (ms: number) => {
      this.bandTimer ??= setTimeout(() => {
        this.bandTimer = undefined;
        this.requestRender();
      }, ms);
    };
    if (wait > 0) {
      later(wait);
      return;
    }
    this.bands[this.shownBands++]?.image.ensureEncodedPng();
    this.bandShownAt = performance.now();
    if (this.shownBands < this.bands.length) later(BAND_GAP_MS);
  }

  /**
   * `image` over `box` as bands of whole cell rows, each within the image
   * pixel limit; none when the whole image is.
   */
  private bandsOf(image: NativeImage, box: CellBox): Layer[] {
    const limit = this.deps.browserImagePixels;
    if (limit === undefined || image.width * image.height <= limit) return [];
    const boxes = (n: number): CellBox[] => {
      const rows = Math.ceil(box.rows / n);
      const out: CellBox[] = [];
      for (let row = 0; row < box.rows; row += rows)
        out.push({
          col: 0,
          row,
          cols: box.cols,
          rows: Math.min(rows, box.rows - row),
        });
      return out;
    };
    const pixels = (b: CellBox) =>
      cellPixels(b, image.width, image.height, box.cols, box.rows);
    let n = Math.min(box.rows, Math.ceil((image.width * image.height) / limit));
    let cut = boxes(n);
    while (
      n < box.rows &&
      cut.some((b) => pixels(b).width * pixels(b).height > limit)
    )
      cut = boxes(++n);
    return cut.map((b) => {
      const p = pixels(b);
      return {
        image: image.extract({
          left: p.x,
          top: p.y,
          width: p.width,
          height: p.height,
        }),
        box: b,
      };
    });
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
    trace(`rest seq=${frame.seq} driven=${driven} work=${work.toFixed(1)}`);
    const takenAt = this.ctx.frameId;
    const startedAt = performance.now();
    const ack = () => {
      if (process.env.SO_X_BP === "1" && sent > 0) {
        const status = (
          this.ctx as unknown as {
            kittyImageTransportStatus?: { pendingFiles: number };
          }
        ).kittyImageTransportStatus;
        const waiting =
          this.ctx.frameId === takenAt || (status?.pendingFiles ?? 0) > 0;
        if (waiting && performance.now() - startedAt < 500) {
          this.pacing = setTimeout(ack, 2);
          return;
        }
        trace(`bp waited=${(performance.now() - startedAt).toFixed(0)}`);
      }
      trace(`ack seq=${frame.seq}`);
      this.resting = false;
      frame.ack();
      this.requestRender();
    };
    this.pacing = setTimeout(
      ack,
      Math.max(
        driven ? 0 : FRAME_REST * work,
        paced,
        Number(process.env.SO_X_GAP ?? 0),
        !driven && process.env.SO_X_IDLE_RATE
          ? (sent / Number(process.env.SO_X_IDLE_RATE)) * 1000
          : 0,
      ),
    );
  }

  protected override destroySelf(): void {
    clearTimeout(this.wait);
    clearTimeout(this.pacing);
    clearTimeout(this.bandTimer);
    for (const image of this.trash.splice(0)) image.dispose();
    this.base?.image.dispose();
    for (const b of this.bands) b.image.dispose();
    for (const p of this.patches) p.image.dispose();
    for (const l of this.behind) l.image.dispose();
    this.base = undefined;
    this.bands = [];
    this.behind = [];
    this.patches = [];
    this.shown = undefined;
    this.spare = undefined;
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
    // A frame's bands all go on screen before the next frame is taken.
    const banding = this.shownBands < this.bands.length;
    let herdrBusy = false;
    if (process.env.SO_X_BP === "2" && frame.seq !== this.seq) {
      const status = (
        this.ctx as unknown as {
          kittyImageTransportStatus?: { pendingFiles: number };
        }
      ).kittyImageTransportStatus;
      herdrBusy =
        this.ctx.frameId === this.takenFrameId ||
        (status?.pendingFiles ?? 0) > 0;
      if (herdrBusy) setTimeout(() => this.requestRender(), 2);
    }
    const fresh =
      frame.seq !== this.seq && !this.resting && !banding && !herdrBusy;
    if (fresh) this.takenFrameId = this.ctx.frameId;
    const started = performance.now();
    trace(
      `render seq=${frame.seq} taken=${this.seq} resting=${this.resting} banding=${banding} bands=${this.shownBands}/${this.bands.length} fresh=${fresh}`,
    );
    if (fresh && TRACE && process.env.SO_TRACE_PNG)
      writeFileSync(`${TRACE}.png`, frame.png);
    const sent = fresh ? this.take(frame) : 0;
    if (fresh)
      trace(
        `took ${this.base?.image.width}x${this.base?.image.height} bands=${this.bands.length} patches=${this.patches.length} sent=${sent}`,
      );
    this.showBand();
    const work = performance.now() - started;
    const base = this.base;
    if (base === undefined) {
      if (fresh) frame.ack();
      return;
    }
    this.placed = this.place(base);
    const layers = this.onScreen().map((l) => this.place(l));
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
    // A frame that came while the bands went up is taken now.
    else if (
      banding &&
      this.shownBands === this.bands.length &&
      frame.seq !== this.seq &&
      !this.resting
    )
      this.requestRender();
  }
}

/** The point in the frame at the middle of cell (x, y) inside piece `p`. */
function pointAt(p: Piece, x: number, y: number): PagePoint {
  return {
    x: (p.srcX + ((x - p.x + 0.5) / p.cols) * p.srcW) / p.image.width,
    y: (p.srcY + ((y - p.y + 0.5) / p.rows) * p.srcH) / p.image.height,
  };
}
