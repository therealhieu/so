import {
  type NativeImage,
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import { imageWindow } from "../../core/state/image";
import type {
  AppState,
  MouseTarget,
  WindowId,
  WindowSpot,
} from "../../core/state/types";
import { fitView } from "../image-fit";
import { type ImageTier, imageTier } from "../images";
import { promptBox } from "../overlays/prompt";
import type { Cursor, ViewDeps } from "../shell";
import { drawCells, themeOf } from "../theme";
import { punch } from "./pdf-view";
import type { WindowView } from "./registry";
import type { Rect } from "./text-view";

/** One image drawn this frame: a source slice into a cell box. */
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

const nameOf = (path: string) => path.slice(path.lastIndexOf("/") + 1);

/**
 * An image window: the picture fitted to the window, scaled by the window's
 * zoom around its centre, and centred when smaller than the window. An SVG
 * comes drawn by the image loader. Lines of text stand in while it loads,
 * when graphics are off, or when it cannot be drawn.
 */
export class ImageView extends Renderable implements WindowView {
  private s: AppState | undefined;
  private windowId: WindowId = 0;
  private rect: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private lines: string[] = [];
  private pieces: Piece[] = [];
  private tier: Exclude<ImageTier, "placeholder"> | undefined;

  constructor(
    ctx: RenderContext,
    private readonly deps: ViewDeps,
  ) {
    super(ctx, { position: "absolute" });
  }

  show(s: AppState, id: WindowId, r: Rect, _split: boolean): void {
    this.s = s;
    this.windowId = id;
    this.rect = r;
    this.left = r.x;
    this.top = r.y;
    this.width = r.w;
    this.height = r.h;
    this.lines = [];
    this.pieces = [];
    this.tier = undefined;
    const w = s.windows.byId[id];
    const b = w === undefined ? undefined : s.buffers[w.content.bufferId];
    const ws = imageWindow(s, id);
    if (b === undefined || ws === undefined || r.h <= 0 || r.w <= 0) return;
    const name = nameOf(b.path);
    const { caps, hasResolution } = this.deps.capabilities();
    const tier = imageTier(s.config.preview.images, caps, hasResolution);
    if (tier === "placeholder") {
      this.lines = [`[image: ${name}]`];
      return;
    }
    // A terminal image would draw over the zoom float.
    if (s.overlay.kind === "zoom") return;
    const got = this.deps.images.get(b.path);
    if (got === undefined) {
      this.lines = [`◌ ${name}`];
      return;
    }
    if ("failed" in got) {
      this.lines = [
        `${name} could not be drawn.`,
        ":Open shows it in the system viewer.",
      ];
      return;
    }
    const { image } = got;
    // Kitty sends PNG; encoded here it is far smaller than when encoded to send.
    if (tier === "kitty") image.ensureEncodedPng();
    const cell = this.deps.images.cellSize();
    const v = fitView(r, ws, image.width, image.height, cell);
    const piece: Piece = {
      image,
      x: v.x,
      y: v.y,
      cols: v.cols,
      rows: v.rows,
      srcX: Math.round(v.sx),
      srcY: Math.round(v.sy),
      srcW: Math.max(1, Math.round(v.sw)),
      srcH: Math.max(1, Math.round(v.sh)),
    };
    const hole = promptBox(s);
    this.pieces =
      hole === undefined || tier === "blocks" ? [piece] : punch([piece], hole);
    this.tier = tier;
    const size = { width: image.width, height: image.height };
    if (
      ws.fill.x !== v.fill.x ||
      ws.fill.y !== v.fill.y ||
      ws.size?.width !== size.width ||
      ws.size.height !== size.height
    )
      // The core keeps the fill so panning stops where the drawn view does.
      queueMicrotask(() =>
        this.deps.dispatch({
          type: "imageLaidOut",
          window: id,
          fill: v.fill,
          size,
        }),
      );
  }

  cursor(): Cursor | undefined {
    return undefined;
  }

  targetAt(x: number, y: number): MouseTarget | undefined {
    const r = this.rect;
    if (x < r.x || x >= r.x + r.w || y < r.y || y >= r.y + r.h)
      return undefined;
    return this.target(x, y);
  }

  /** A drag that started in the window: the point as fractions of it, past its edges too. */
  dragAt(x: number, y: number, _from: WindowSpot): MouseTarget | undefined {
    return this.target(x, y);
  }

  private target(x: number, y: number): MouseTarget {
    const r = this.rect;
    return {
      kind: "window",
      window: this.windowId,
      spot: {
        kind: "image",
        at: {
          fx: (x - r.x + 0.5) / Math.max(1, r.w),
          fy: (y - r.y + 0.5) / Math.max(1, r.h),
        },
      },
    };
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    if (s === undefined) return;
    const theme = themeOf(s);
    const r = this.rect;
    for (let i = 0; i < r.h; i++)
      drawCells(buf, theme.style("text"), r.x, r.y + i, "", r.w);
    const top = r.y + Math.max(0, Math.floor((r.h - this.lines.length) / 2));
    this.lines.slice(0, r.h).forEach((line, i) => {
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
    const tier = this.tier;
    if (tier === undefined) return;
    const cell = this.deps.images.cellPixels();
    for (const p of this.pieces)
      buf.drawImage(
        p.image,
        p.x,
        p.y,
        p.cols,
        p.rows,
        cell === undefined ? 0 : Math.round(p.cols * cell.width),
        cell === undefined ? 0 : Math.round(p.rows * cell.height),
        p.srcX,
        p.srcY,
        p.srcW,
        p.srcH,
        tier,
      );
  }
}
