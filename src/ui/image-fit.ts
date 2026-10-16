import type { NativeImage, OptimizedBuffer } from "@opentui/core";
import type { ImageFrame } from "../core/features/image/view";
import type { ImageTier } from "./images";

type Box = { x: number; y: number; w: number; h: number };
type Size = { width: number; height: number };

/** What a frame of an image shows in a box: a source rectangle and the cells it fills. */
export type FittedView = {
  /** The part of the source shown, in source units. */
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  /** The cells drawn, centred in the box. */
  x: number;
  y: number;
  cols: number;
  rows: number;
  /** How much of the box the fitted image covers per axis, rounded so it settles. */
  fill: { x: number; y: number };
};

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

const settle = (n: number) => Math.round(n * 1000) / 1000;

/**
 * A `iw`×`ih` source fitted to `box` (cells of `cell` pixels), scaled by the
 * frame's level around its centre, and centred when smaller than the box.
 */
export function fitView(
  box: Box,
  f: ImageFrame,
  iw: number,
  ih: number,
  cell: Size,
): FittedView {
  // Screen pixels per source unit: the fitted scale times the level.
  const fit = Math.min((box.w * cell.width) / iw, (box.h * cell.height) / ih);
  const scale = fit * f.level;
  const sw = Math.min(iw, (box.w * cell.width) / scale);
  const sh = Math.min(ih, (box.h * cell.height) / scale);
  const cols = clamp(Math.round((sw * scale) / cell.width), 1, box.w);
  const rows = clamp(Math.round((sh * scale) / cell.height), 1, box.h);
  return {
    sx: clamp(f.cx * iw - sw / 2, 0, iw - sw),
    sy: clamp(f.cy * ih - sh / 2, 0, ih - sh),
    sw,
    sh,
    cols,
    rows,
    x: box.x + Math.floor((box.w - cols) / 2),
    y: box.y + Math.floor((box.h - rows) / 2),
    fill: {
      x: settle((iw * fit) / (box.w * cell.width)),
      y: settle((ih * fit) / (box.h * cell.height)),
    },
  };
}

/** A slice of an image drawn into a box of cells, in whole source pixels. */
export type ImagePiece = {
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

/** `image` as `v` places it. */
export const fittedPiece = (image: NativeImage, v: FittedView): ImagePiece => ({
  image,
  x: v.x,
  y: v.y,
  cols: v.cols,
  rows: v.rows,
  srcX: Math.round(v.sx),
  srcY: Math.round(v.sy),
  srcW: Math.max(1, Math.round(v.sw)),
  srcH: Math.max(1, Math.round(v.sh)),
});

/** Draw each piece with cells of `px` pixels (0 lets the renderer choose). */
export function drawPieces(
  buf: OptimizedBuffer,
  pieces: readonly ImagePiece[],
  px: Size | undefined,
  tier: Exclude<ImageTier, "placeholder">,
): void {
  for (const p of pieces)
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
}
