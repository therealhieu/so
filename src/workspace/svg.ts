/// <reference path="./svg.d.ts" />
import { readFileSync } from "node:fs";
import { initWasm, Resvg } from "@resvg/resvg-wasm";
import wasmPath from "@resvg/resvg-wasm/index_bg.wasm" with { type: "file" };
import type { RgbaImage, SvgRaster } from "../core/state/types";

/** Sans-serif, then monospace font files tried in order; the first readable one of each is used. */
const FONT_PATHS = {
  sans: [
    "/System/Library/Fonts/Helvetica.ttc",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/TTF/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/liberation-sans/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
    "/usr/share/fonts/noto/NotoSans-Regular.ttf",
  ],
  mono: [
    "/System/Library/Fonts/Menlo.ttc",
    "/System/Library/Fonts/Monaco.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    "/usr/share/fonts/dejavu/DejaVuSansMono.ttf",
    "/usr/share/fonts/TTF/DejaVuSansMono.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
    "/usr/share/fonts/liberation-mono/LiberationMono-Regular.ttf",
    "/usr/share/fonts/truetype/noto/NotoSansMono-Regular.ttf",
    "/usr/share/fonts/noto/NotoSansMono-Regular.ttf",
  ],
} as const;

function firstFont(paths: readonly string[]): Uint8Array | undefined {
  for (const path of paths) {
    try {
      return readFileSync(path);
    } catch {}
  }
  return undefined;
}

/**
 * An SVG rasterizer: resvg compiled to WebAssembly, embedded in the binary
 * and started on the first call, with the first system sans-serif and
 * monospace fonts found. Without a sans-serif font every call fails, so the
 * caller can fall back to a text drawing instead of an image without labels.
 */
export function createSvgRasterizer(
  fontPaths: { sans: readonly string[]; mono: readonly string[] } = FONT_PATHS,
): (r: SvgRaster) => Promise<RgbaImage> {
  let ready: Promise<Uint8Array[]> | undefined;
  const start = async () => {
    const sans = firstFont(fontPaths.sans);
    if (sans === undefined) throw new Error("no system font for diagrams");
    await initWasm(readFileSync(wasmPath));
    const mono = firstFont(fontPaths.mono);
    return mono === undefined ? [sans] : [sans, mono];
  };
  return async (r) => {
    ready ??= start();
    const fontBuffers = await ready;
    const { x, y, w, h } = r.crop;
    const svg = r.svg.replace(/<svg\b[^>]*>/, (tag) =>
      tag
        .replace(/\s(viewBox|width|height)="[^"]*"/g, "")
        .replace(
          /^<svg/,
          `<svg viewBox="${x} ${y} ${w} ${h}" width="${r.width}" height="${r.height}" preserveAspectRatio="none"`,
        ),
    );
    const resvg = new Resvg(svg, {
      background: r.background,
      fitTo: { mode: "original" },
      font: { fontBuffers },
    });
    try {
      const image = resvg.render();
      try {
        // Raw pixels: a PNG round trip costs about 20 times the drawing.
        return { rgba: image.pixels, width: image.width, height: image.height };
      } finally {
        image.free();
      }
    } finally {
      resvg.free();
    }
  };
}
