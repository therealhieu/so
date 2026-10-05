import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import type { AppState, MouseTarget, ZoomState } from "../../core/state/types";
import { zoomSize } from "../../core/state/zoom";
import { imageTier } from "../images";
import type { LayoutClass, ViewDeps } from "../shell";
import { drawCells, type Theme, themeOf } from "../theme";
import { centered, drawFrame } from "./host";

type Box = { x: number; y: number; w: number; h: number };
type ImageZoom = Extract<ZoomState, { kind: "image" }>;
type DiagramZoom = Extract<ZoomState, { kind: "diagram" }>;

const IMAGE_FOOTER = "wheel +/- zoom · 0 fit · hjkl pan · q close";
const DIAGRAM_FOOTER = "+/- spacing · 0 reset · wheel hjkl scroll · q close";

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
  }

  private box(s: AppState): Box {
    const { w, h } = zoomSize(s.terminal);
    return centered(s, w, h);
  }

  /** `overlay` inside the float, `undefined` outside it. */
  itemAt(x: number, y: number): MouseTarget | undefined {
    const s = this.s;
    if (s === undefined || zoomOf(s) === undefined) return undefined;
    const b = this.box(s);
    return x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h
      ? { kind: "overlay" }
      : undefined;
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
  private reportFill(z: ImageZoom, raw: { x: number; y: number }): void {
    const fill = {
      x: Math.round(raw.x * 1000) / 1000,
      y: Math.round(raw.y * 1000) / 1000,
    };
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
    const px = this.deps.images.cellPixels();
    buf.drawImage(
      image,
      v.x,
      v.y,
      v.cols,
      v.rows,
      px === undefined ? 0 : Math.round(v.cols * px.width),
      px === undefined ? 0 : Math.round(v.rows * px.height),
      Math.round(v.sx),
      Math.round(v.sy),
      Math.max(1, Math.round(v.sw)),
      Math.max(1, Math.round(v.sh)),
      tier,
    );
  }

  /**
   * The part of a `iw`×`ih` source the view shows (`sx`, `sy`, `sw`, `sh`,
   * in source units) and the cells it fills, centred in the float. It also
   * reports the fitted fill to the core.
   */
  private view(inner: Box, z: ImageZoom, iw: number, ih: number) {
    const cell = this.deps.images.cellSize();
    // Screen pixels per source unit: the fitted scale times the level.
    const fit = Math.min(
      (inner.w * cell.width) / iw,
      (inner.h * cell.height) / ih,
    );
    this.reportFill(z, {
      x: (iw * fit) / (inner.w * cell.width),
      y: (ih * fit) / (inner.h * cell.height),
    });
    const scale = fit * z.level;
    const sw = Math.min(iw, (inner.w * cell.width) / scale);
    const sh = Math.min(ih, (inner.h * cell.height) / scale);
    const sx = clamp(z.cx * iw - sw / 2, 0, iw - sw);
    const sy = clamp(z.cy * ih - sh / 2, 0, ih - sh);
    const cols = clamp(Math.round((sw * scale) / cell.width), 1, inner.w);
    const rows = clamp(Math.round((sh * scale) / cell.height), 1, inner.h);
    return {
      sx,
      sy,
      sw,
      sh,
      cols,
      rows,
      cell,
      x: inner.x + Math.floor((inner.w - cols) / 2),
      y: inner.y + Math.floor((inner.h - rows) / 2),
    };
  }

  /** The key of the last diagram raster drawn, shown while the next one renders. */
  private lastRaster: string | undefined;

  /**
   * A diagram drawn from its SVG: only the part in view, rasterized at the
   * float's pixel size, so it stays sharp at every zoom level. While a new
   * part renders the last one stays up; without graphics, or when the SVG
   * cannot be drawn (no font), the text drawing shows instead.
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
    const v = this.view(inner, z, d.svg.width, d.svg.height);
    const width = Math.round(v.cols * v.cell.width);
    const height = Math.round(v.rows * v.cell.height);
    const crop = { x: v.sx, y: v.sy, w: v.sw, h: v.sh };
    const key = `${z.path}|${s.config.theme}|${[crop.x, crop.y, crop.w, crop.h]
      .map((n) => n.toFixed(2))
      .join(",")}|${width}x${height}`;
    if (tier === "placeholder") {
      drawLines(buf, theme, inner, d.lines, 0, 0);
      return;
    }
    const got = this.deps.images.get(key, () =>
      this.deps.rasterizeSvg({
        svg: d.svg.svg,
        background: d.svg.background,
        crop,
        width,
        height,
      }),
    );
    if (got !== undefined && "failed" in got) {
      drawLines(buf, theme, inner, d.lines, 0, 0);
      return;
    }
    const last = this.lastRaster?.startsWith(`${z.path}|`)
      ? this.lastRaster
      : undefined;
    const image =
      got?.image ??
      (last === undefined ? undefined : this.deps.images.peek(last));
    if (got !== undefined) this.lastRaster = key;
    if (image === undefined) {
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
    const px = this.deps.images.cellPixels();
    buf.drawImage(
      image,
      v.x,
      v.y,
      v.cols,
      v.rows,
      px === undefined ? 0 : Math.round(v.cols * px.width),
      px === undefined ? 0 : Math.round(v.rows * px.height),
      0,
      0,
      image.width,
      image.height,
      tier,
    );
  }
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
