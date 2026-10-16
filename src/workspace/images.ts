import { readFile, realpath, stat } from "node:fs/promises";
import { isAbsolute, join, relative, sep } from "node:path";
import { svgRasterSize, svgSize } from "../core/features/image/svg-size";
import {
  type PdfPageRequest,
  parsePdfPageRef,
} from "../core/features/pdf/page";
import { isWebUrl } from "../core/lang/markdown/renderers/image";
import type { RgbaImage, SvgRaster } from "../core/state/types";
import { createLimiter } from "./limit";

/** Limits for downloading images referenced by URL. */
export const WEB_IMAGE = {
  timeoutMs: 10_000,
  maxBytes: 16 * 2 ** 20,
  maxInFlight: 4,
} as const;

/** The largest workspace image file read. */
const MAX_FILE_BYTES = 32 * 2 ** 20;

/**
 * The real path of the file `rel` in the workspace. It must stay inside the
 * workspace's real path, so `..` and symlinks cannot reach other files.
 */
export async function containedFile(
  root: string,
  rel: string,
): Promise<{ path: string; size: number }> {
  const realRoot = await realpath(root);
  const path = await realpath(join(realRoot, rel));
  const r = relative(realRoot, path);
  if (r === "" || r.split(sep)[0] === ".." || isAbsolute(r))
    throw new Error(`${rel}: outside the workspace`);
  const st = await stat(path);
  if (!st.isFile()) throw new Error(`${rel}: not a file`);
  return { path, size: st.size };
}

/** The bytes of the workspace image `rel` (see `containedFile`). */
export async function readImage(
  root: string,
  rel: string,
): Promise<Uint8Array> {
  const { path, size } = await containedFile(root, rel);
  if (size > MAX_FILE_BYTES) throw new Error(`${rel}: image too large`);
  return new Uint8Array(await readFile(path));
}

/** The response body, abandoned once it passes `max` bytes. */
async function readCapped(res: Response, max: number): Promise<Uint8Array> {
  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > max) {
    await res.body?.cancel();
    throw new Error("image too large");
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = res.body?.getReader();
  for (;;) {
    const next = await reader?.read();
    if (next === undefined || next.done) break;
    total += next.value.byteLength;
    if (total > max) {
      await reader?.cancel();
      throw new Error("image too large");
    }
    chunks.push(next.value);
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.byteLength;
  }
  return out;
}

/**
 * Download an `http(s)` image: no cookies or referrer, the whole download
 * within the timeout, and at most 16 MiB. A non-2xx status rejects.
 */
export async function fetchImage(
  url: string,
  o: { fetch?: typeof fetch; timeoutMs?: number } = {},
): Promise<Uint8Array> {
  if (!isWebUrl(url)) throw new Error(`${url}: not a web image`);
  const res = await (o.fetch ?? fetch)(url, {
    credentials: "omit",
    referrerPolicy: "no-referrer",
    redirect: "follow",
    signal: AbortSignal.timeout(o.timeoutMs ?? WEB_IMAGE.timeoutMs),
  });
  if (!res.ok) {
    await res.body?.cancel();
    throw new Error(`HTTP ${res.status}`);
  }
  return readCapped(res, WEB_IMAGE.maxBytes);
}

/** The width PDF pages embedded in notes are drawn at. */
const PDF_EMBED_WIDTH = 1024;

/** Whether `ref` (a path or URL) names an SVG file. */
const isSvgRef = (ref: string) =>
  /\.svg$/i.test(isWebUrl(ref) ? new URL(ref).pathname : ref);

/** The pixels of SVG file bytes, drawn through `rasterize` at `svgRasterSize`. */
async function drawSvg(
  ref: string,
  bytes: Uint8Array,
  rasterize: (r: SvgRaster) => Promise<RgbaImage>,
): Promise<RgbaImage> {
  const svg = new TextDecoder().decode(bytes);
  const size = svgSize(svg);
  if (size === undefined) throw new Error(`${ref}: not an SVG drawing`);
  return rasterize({
    svg,
    background: "transparent",
    crop: size.box,
    ...svgRasterSize(size),
  });
}

/**
 * Image bytes or pixels by reference: URLs download through `fetchImage`, at most four
 * at a time; a PDF page (`paper.pdf#page=3`) draws through `pdfPage`; anything
 * else is a workspace path read with `readImage`. An SVG file, from either,
 * is drawn through `svg`.
 */
export function createImageLoader(
  root: string,
  o: {
    fetch?: typeof fetch;
    pdfPage?: (r: PdfPageRequest) => Promise<RgbaImage>;
    svg?: (r: SvgRaster) => Promise<RgbaImage>;
  } = {},
): (ref: string) => Promise<Uint8Array | RgbaImage> {
  const limited = createLimiter(WEB_IMAGE.maxInFlight);
  return async (ref) => {
    const pdf = parsePdfPageRef(ref);
    if (pdf !== undefined) {
      if (o.pdfPage === undefined) throw new Error(`${ref}: no PDF renderer`);
      return o.pdfPage({ ...pdf, width: PDF_EMBED_WIDTH });
    }
    const bytes = isWebUrl(ref)
      ? await limited(() =>
          fetchImage(ref, o.fetch === undefined ? {} : { fetch: o.fetch }),
        )
      : await readImage(root, ref);
    return o.svg !== undefined && isSvgRef(ref)
      ? drawSvg(ref, bytes, o.svg)
      : bytes;
  };
}
