import {
  type NativeImage,
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import type { AppState, MouseTarget, ZoomState } from "../../core/state/types";
import { zoomSize } from "../../core/state/zoom";
import { drawPieces, fittedPiece, fitView } from "../image-fit";
import { imageTier } from "../images";
import type { LayoutClass, ViewDeps } from "../shell";
import { drawCells, type Theme, themeOf } from "../theme";
import { centered, drawFrame } from "./host";

type Box = { x: number; y: number; w: number; h: number };
type ImageZoom = Extract<ZoomState, { kind: "image" }>;
type DiagramZoom = Extract<ZoomState, { kind: "diagram" }>;

const IMAGE_FOOTER = "wheel +/- zoom · 0 fit · drag hjkl pan · q close";
const DIAGRAM_FOOTER =
  "+/- spacing · 0 reset · drag wheel hjkl scroll · q close";

const zoomOf = (s: AppState): ZoomState | undefined =>
  s.overlay.kind === "zoom" ? s.overlay.zoom : undefined;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/** A level as `2×` or `1.5×`. */
const times = (level: number) => `${level}×`;

/**
 * The zoom float: an image fitted to it and scaled by the zoom level around
 * the view's centre, or a diagram's lines from its first row and column.
 * Either is centred when smaller than the float. Keys go to the core.
 */
export class ZoomOverlay extends Renderable {
  private s: AppState | undefined;

  constructor(
    ctx: RenderContext,
    private readonly deps: ViewDeps,
  ) {
    super(ctx, { position: "absolute", left: 0, top: 0 });
  }

  update(s: AppState, _lc: LayoutClass): void {
    this.s = s;
    this.width = s.terminal.cols;
    this.height = s.terminal.rows;
    this.visible = zoomOf(s) !== undefined;
    if (!this.visible && this.timer !== undefined) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  private box(s: AppState): Box {
    const { w, h } = zoomSize(s.terminal);
    return centered(s, w, h);
  }

  /**
   * Inside the float's content the point as fractions of it, so a press can
   * start a pan; `overlay` on its border; `undefined` outside it.
   */
  itemAt(x: number, y: number): MouseTarget | undefined {
    const s = this.s;
    if (s === undefined || zoomOf(s) === undefined) return undefined;
    const b = this.box(s);
    if (x < b.x || x >= b.x + b.w || y < b.y || y >= b.y + b.h)
      return undefined;
    const inside = x > b.x && x < b.x + b.w - 1 && y > b.y && y < b.y + b.h - 1;
    return inside ? this.pointAt(x, y) : { kind: "overlay" };
  }

  /** A drag from the float: the point as fractions of its content, past its edges too. */
  dragAt(x: number, y: number): MouseTarget | undefined {
    const s = this.s;
    return s === undefined || zoomOf(s) === undefined
      ? undefined
      : this.pointAt(x, y);
  }

  private pointAt(x: number, y: number): MouseTarget {
    const s = this.s;
    const b = s === undefined ? { x: 0, y: 0, w: 3, h: 3 } : this.box(s);
    return {
      kind: "zoomPoint",
      fx: (x - b.x - 1 + 0.5) / Math.max(1, b.w - 2),
      fy: (y - b.y - 1 + 0.5) / Math.max(1, b.h - 2),
    };
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    const z = s && zoomOf(s);
    if (s === undefined || z === undefined) return;
    const theme = themeOf(s);
    const box = this.box(s);
    const inner = { x: box.x + 1, y: box.y + 1, w: box.w - 2, h: box.h - 2 };
    if (z.kind === "image") this.paintImage(buf, theme, s, box, inner, z);
    else paintDiagram(buf, theme, box, inner, z);
  }

  /**
   * Tell the core how much of the float the fitted image covers, so its
   * panning stops where the drawn view does. Sent after this frame, and only
   * when it changed.
   */
  private reportFill(z: ImageZoom, fill: { x: number; y: number }): void {
    if (fill.x === z.fill.x && fill.y === z.fill.y) return;
    queueMicrotask(() =>
      this.deps.dispatch({ type: "zoomFill", path: z.path, fill }),
    );
  }

  private paintImage(
    buf: OptimizedBuffer,
    theme: Theme,
    s: AppState,
    box: Box,
    inner: Box,
    z: ImageZoom,
  ): void {
    const { caps, hasResolution } = this.deps.capabilities();
    const tier = imageTier(s.config.preview.images, caps, hasResolution);
    if (z.diagram !== undefined) {
      this.paintSvg(buf, theme, s, box, inner, z, z.diagram, tier);
      return;
    }
    const got =
      tier === "placeholder" ? undefined : this.deps.images.get(z.path);
    const image = got !== undefined && "image" in got ? got.image : undefined;
    const size = image && ` · ${image.width}×${image.height}`;
    drawFrame(buf, theme, box, {
      border: "floatBorder",
      fill: "float",
      title: `${z.name}${size ?? ""} · ${times(z.level)}`,
      footer: IMAGE_FOOTER,
    });
    if (image === undefined || tier === "placeholder") {
      const loading = tier !== "placeholder" && got === undefined;
      const text = loading ? `◌ ${z.name}` : `[image: ${z.name}]`;
      drawCells(
        buf,
        theme.style("imagePlaceholder"),
        inner.x,
        inner.y,
        text,
        inner.w,
      );
      return;
    }
    const v = this.view(inner, z, image.width, image.height);
    drawPieces(
      buf,
      [fittedPiece(image, v)],
      this.deps.images.cellPixels(),
      tier,
    );
  }

  /** The image fitted to the float, reporting the fitted fill to the core. */
  private view(inner: Box, z: ImageZoom, iw: number, ih: number) {
    const cell = this.deps.images.cellSize();
    const v = fitView(inner, z, iw, ih, cell);
    this.reportFill(z, v.fill);
    return { ...v, cell };
  }

  /** The diagram raster asked for last, and the last one drawn. */
  private wanted: Raster | undefined;
  private shown: Raster | undefined;
  /** A pending start of the raster the view needs, while the view keeps moving. */
  private timer: ReturnType<typeof setTimeout> | undefined;

  /**
   * A diagram drawn from its SVG. A raster covers the view plus a margin at
   * the float's pixel density, so a pan within the margin only moves the
   * placement. When the view moves past it or the level changes, the last
   * raster is drawn moved or stretched, and a new one starts once the view
   * rests for `RASTER_IDLE_MS`, so neither a drag nor a zoom waits on
   * rasterizing. Without
   * graphics, or when the SVG cannot be drawn (no font), the text drawing
   * shows instead.
   */
  private paintSvg(
    buf: OptimizedBuffer,
    theme: Theme,
    s: AppState,
    box: Box,
    inner: Box,
    z: ImageZoom,
    d: NonNullable<ImageZoom["diagram"]>,
    tier: ReturnType<typeof imageTier>,
  ): void {
    drawFrame(buf, theme, box, {
      border: "floatBorder",
      fill: "float",
      title: `${z.name} · ${times(z.level)}`,
      footer: IMAGE_FOOTER,
    });
    if (tier === "placeholder") {
      drawLines(buf, theme, inner, d.lines, 0, 0);
      return;
    }
    const v = this.view(inner, z, d.svg.width, d.svg.height);
    const view = { x: v.sx, y: v.sy, w: v.sw, h: v.sh };
    // Pixels per SVG unit.
    const scale = (v.cols * v.cell.width) / v.sw;
    const owner = `${z.path}|${s.config.theme}`;
    const usable = (r: Raster | undefined) =>
      r !== undefined &&
      r.owner === owner &&
      Math.abs(r.scale - scale) <= scale * 1e-3;
    const covers = (r: Raster | undefined) =>
      usable(r) && r !== undefined && contains(r.crop, view);
    if (!covers(this.wanted)) {
      const fresh = rasterFor(owner, view, scale, d.svg);
      // Once a raster is up, the next waits for the view to rest, so a pan
      // or a run of zoom steps redraws at once from the last raster (moved,
      // or stretched to the new level); only the first starts at once.
      if (this.shown?.owner === owner) this.restartTimer(fresh);
      else this.wanted = fresh;
    }
    const want = this.wanted;
    const got =
      want === undefined
        ? undefined
        : this.deps.images.get(want.key, () =>
            this.deps.rasterizeSvg({
              svg: d.svg.svg,
              background: d.svg.background,
              crop: want.crop,
              width: want.width,
              height: want.height,
            }),
          );
    if (got !== undefined && "failed" in got) {
      drawLines(buf, theme, inner, d.lines, 0, 0);
      return;
    }
    if (got !== undefined && want !== undefined) this.shown = want;
    const shown = this.shown?.owner === owner ? this.shown : undefined;
    const image = shown && this.deps.images.peek(shown.key);
    if (shown === undefined || image === undefined) {
      drawCells(
        buf,
        theme.style("imagePlaceholder"),
        inner.x,
        inner.y,
        `◌ ${z.name}`,
        inner.w,
      );
      return;
    }
    drawPart(buf, image, shown, view, v, this.deps.images.cellPixels(), tier);
  }

  /** Ask for `r` once the view has rested for `RASTER_IDLE_MS`. */
  private restartTimer(r: Raster): void {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.wanted = r;
      this.requestRender();
    }, RASTER_IDLE_MS);
  }
}

/** How long the view rests before the raster it needs starts. */
const RASTER_IDLE_MS = 80;
/** The margin rasterized around the view, as a fraction of its size on each side. */
const RASTER_MARGIN = 0.25;
/** The most pixels one raster holds; past it the margin shrinks. */
const RASTER_MAX_PIXELS = 8_000_000;

type Rect = { x: number; y: number; w: number; h: number };

/** A diagram raster: `crop` of the SVG at `scale` pixels per unit, `width`×`height` pixels. */
type Raster = {
  key: string;
  owner: string;
  crop: Rect;
  scale: number;
  width: number;
  height: number;
};

const contains = (a: Rect, b: Rect) =>
  b.x >= a.x - 1e-6 &&
  b.y >= a.y - 1e-6 &&
  b.x + b.w <= a.x + a.w + 1e-6 &&
  b.y + b.h <= a.y + a.h + 1e-6;

/** The raster for `view`: the view grown by the margin, within the SVG and the pixel budget. */
function rasterFor(
  owner: string,
  view: Rect,
  scale: number,
  svg: { width: number; height: number },
): Raster {
  const viewPixels = view.w * view.h * scale * scale;
  const room = Math.sqrt(RASTER_MAX_PIXELS / Math.max(1, viewPixels));
  const m = Math.max(0, Math.min(RASTER_MARGIN, (room - 1) / 2));
  const x = Math.max(0, view.x - view.w * m);
  const y = Math.max(0, view.y - view.h * m);
  const crop = {
    x,
    y,
    w: Math.min(svg.width, view.x + view.w * (1 + m)) - x,
    h: Math.min(svg.height, view.y + view.h * (1 + m)) - y,
  };
  const width = Math.max(1, Math.round(crop.w * scale));
  const height = Math.max(1, Math.round(crop.h * scale));
  const key = `${owner}|${[crop.x, crop.y, crop.w, crop.h]
    .map((n) => n.toFixed(2))
    .join(",")}|${width}x${height}`;
  return { key, owner, crop, scale, width, height };
}

/**
 * The part of `view` that raster `r` covers, drawn where it belongs in the
 * view's cells; a raster at another scale (just after a zoom) is stretched.
 */
function drawPart(
  buf: OptimizedBuffer,
  image: NativeImage,
  r: Raster,
  view: Rect,
  v: { x: number; y: number; cols: number; rows: number },
  px: { width: number; height: number } | undefined,
  tier: Exclude<ReturnType<typeof imageTier>, "placeholder">,
): void {
  const x0 = Math.max(view.x, r.crop.x);
  const y0 = Math.max(view.y, r.crop.y);
  const x1 = Math.min(view.x + view.w, r.crop.x + r.crop.w);
  const y1 = Math.min(view.y + view.h, r.crop.y + r.crop.h);
  if (x1 <= x0 || y1 <= y0) return;
  const cx0 = Math.round(((x0 - view.x) / view.w) * v.cols);
  const cy0 = Math.round(((y0 - view.y) / view.h) * v.rows);
  const cx1 = Math.round(((x1 - view.x) / view.w) * v.cols);
  const cy1 = Math.round(((y1 - view.y) / view.h) * v.rows);
  const cols = cx1 - cx0;
  const rows = cy1 - cy0;
  if (cols < 1 || rows < 1) return;
  // The source rectangle of the cells drawn, in the raster's pixels.
  const px0 = (u: number) =>
    clamp(
      Math.round(((u - r.crop.x) / r.crop.w) * image.width),
      0,
      image.width,
    );
  const py0 = (u: number) =>
    clamp(
      Math.round(((u - r.crop.y) / r.crop.h) * image.height),
      0,
      image.height,
    );
  const sx = px0(view.x + (cx0 / v.cols) * view.w);
  const sy = py0(view.y + (cy0 / v.rows) * view.h);
  const ex = px0(view.x + (cx1 / v.cols) * view.w);
  const ey = py0(view.y + (cy1 / v.rows) * view.h);
  buf.drawImage(
    image,
    v.x + cx0,
    v.y + cy0,
    cols,
    rows,
    px === undefined ? 0 : Math.round(cols * px.width),
    px === undefined ? 0 : Math.round(rows * px.height),
    sx,
    sy,
    Math.max(1, ex - sx),
    Math.max(1, ey - sy),
    tier,
  );
}

/** `lines` from row `row` and column `col`, centred in the float when smaller. */
function drawLines(
  buf: OptimizedBuffer,
  theme: Theme,
  inner: Box,
  lines: readonly string[],
  row: number,
  col: number,
): void {
  const widest = Math.max(0, ...lines.map((l) => [...l].length));
  const x = inner.x + Math.max(0, Math.floor((inner.w - widest) / 2));
  const y = inner.y + Math.max(0, Math.floor((inner.h - lines.length) / 2));
  const style = theme.style("mdCode");
  lines.slice(row, row + inner.h).forEach((line, i) => {
    const text = [...line].slice(col, col + inner.w).join("");
    drawCells(
      buf,
      style,
      x,
      y + i,
      text,
      Math.min(inner.w, inner.x + inner.w - x),
    );
  });
}

function paintDiagram(
  buf: OptimizedBuffer,
  theme: Theme,
  box: Box,
  inner: Box,
  z: DiagramZoom,
): void {
  const widest = Math.max(0, ...z.lines.map((l) => [...l].length));
  drawFrame(buf, theme, box, {
    border: "floatBorder",
    fill: "float",
    title: `mermaid · ${widest}×${z.lines.length}${z.spacing === "tight" ? " · tight" : ""}`,
    footer: DIAGRAM_FOOTER,
  });
  drawLines(buf, theme, inner, z.lines, z.row, z.col);
}
