import type { NativeImage } from "@opentui/core";
import type { RgbaImage } from "../core/state/types";
import { encodePng, isPng } from "./png";

/**
 * Requests about the picture `key` loaded as `source` (file bytes or
 * pixels): its size, or a copy scaled to `width`×`height` as a PNG file.
 */
export type ToScaleWorker =
  | { id: number; t: "size"; key: string; source: Uint8Array | RgbaImage }
  | {
      id: number;
      t: "scale";
      key: string;
      source: Uint8Array | RgbaImage;
      width: number;
      height: number;
    };

/** The answer to request `id`, or why there is none. */
export type FromScaleWorker =
  | { id: number; width: number; height: number }
  | { id: number; png: Uint8Array }
  | { id: number; error: string };

declare const self: Worker;

// The handler is set before OpenTUI loads, so no request is missed meanwhile.
const native = import("@opentui/core");

/** The last few pictures decoded, so a size and then a copy decode once. */
const decoded = new Map<string, NativeImage>();
const DECODED_KEPT = 4;

async function picture(
  key: string,
  source: Uint8Array | RgbaImage,
): Promise<NativeImage> {
  const held = decoded.get(key);
  if (held !== undefined) {
    decoded.delete(key);
    decoded.set(key, held);
    return held;
  }
  const { NativeImage } = await native;
  const image =
    source instanceof Uint8Array
      ? NativeImage.decode(source)
      : NativeImage.fromRgba(source.rgba, source.width, source.height);
  decoded.set(key, image);
  for (const [k, i] of decoded) {
    if (decoded.size <= DECODED_KEPT) break;
    i.dispose();
    decoded.delete(k);
  }
  return image;
}

async function answer(m: ToScaleWorker): Promise<FromScaleWorker> {
  const image = await picture(m.key, m.source);
  if (m.t === "size")
    return { id: m.id, width: image.width, height: image.height };
  const same = image.width === m.width && image.height === m.height;
  if (same && m.source instanceof Uint8Array && isPng(m.source))
    return { id: m.id, png: m.source.slice() };
  const scaled = same
    ? image
    : image.resize({ width: m.width, height: m.height, kernel: "area" });
  try {
    const raw = scaled.raw();
    return {
      id: m.id,
      png: encodePng(raw.data, raw.width, raw.height, raw.stride),
    };
  } finally {
    if (scaled !== image) scaled.dispose();
  }
}

async function reply(m: ToScaleWorker): Promise<void> {
  let r: FromScaleWorker;
  try {
    r = await answer(m);
  } catch (err) {
    decoded.get(m.key)?.dispose();
    decoded.delete(m.key);
    r = { id: m.id, error: err instanceof Error ? err.message : String(err) };
  }
  if ("png" in r) self.postMessage(r, [r.png.buffer]);
  else self.postMessage(r);
}

// One request at a time: another one's decode could dispose a picture
// still in use.
let queue = Promise.resolve();
self.onmessage = (e: MessageEvent<ToScaleWorker>) => {
  queue = queue.then(() => reply(e.data));
};
