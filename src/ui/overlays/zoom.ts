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
    const cell = this.deps.images.cellSize();
    const iw = image.width;
    const ih = image.height;
    // Screen pixels per image pixel: the fitted scale times the level.
    const fit = Math.min(
      (inner.w * cell.width) / iw,
      (inner.h * cell.height) / ih,
    );
    this.reportFill(z, {
      x: (iw * fit) / (inner.w * cell.width),
      y: (ih * fit) / (inner.h * cell.height),
    });
    const scale = fit * z.level;
    const sw = Math.min(iw, Math.round((inner.w * cell.width) / scale));
    const sh = Math.min(ih, Math.round((inner.h * cell.height) / scale));
    const sx = Math.round(clamp(z.cx * iw - sw / 2, 0, iw - sw));
    const sy = Math.round(clamp(z.cy * ih - sh / 2, 0, ih - sh));
    const cols = clamp(Math.round((sw * scale) / cell.width), 1, inner.w);
    const rows = clamp(Math.round((sh * scale) / cell.height), 1, inner.h);
    const px = this.deps.images.cellPixels();
    buf.drawImage(
      image,
      inner.x + Math.floor((inner.w - cols) / 2),
      inner.y + Math.floor((inner.h - rows) / 2),
      cols,
      rows,
      px === undefined ? 0 : Math.round(cols * px.width),
      px === undefined ? 0 : Math.round(rows * px.height),
      sx,
      sy,
      Math.max(1, sw),
      Math.max(1, sh),
      tier,
    );
  }
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
  const x = inner.x + Math.max(0, Math.floor((inner.w - widest) / 2));
  const y = inner.y + Math.max(0, Math.floor((inner.h - z.lines.length) / 2));
  const style = theme.style("mdCode");
  z.lines.slice(z.row, z.row + inner.h).forEach((line, i) => {
    const text = [...line].slice(z.col, z.col + inner.w).join("");
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
