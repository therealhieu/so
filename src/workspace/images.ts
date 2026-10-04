import { readFile, realpath, stat } from "node:fs/promises";
import { isAbsolute, join, relative, sep } from "node:path";
import { isWebUrl } from "../core/lang/markdown/renderers/image";

/** Limits for downloading images referenced by URL. */
export const WEB_IMAGE = {
  timeoutMs: 10_000,
  maxBytes: 16 * 2 ** 20,
  maxInFlight: 4,
} as const;

/** The largest workspace image file read. */
const MAX_FILE_BYTES = 32 * 2 ** 20;

/**
 * The bytes of `rel` in the workspace. The real path must stay inside the
 * workspace's real path, so `..` and symlinks cannot reach other files.
 */
export async function readImage(
  root: string,
  rel: string,
): Promise<Uint8Array> {
  const realRoot = await realpath(root);
  const path = await realpath(join(realRoot, rel));
  const r = relative(realRoot, path);
  if (r === "" || r.split(sep)[0] === ".." || isAbsolute(r))
    throw new Error(`${rel}: outside the workspace`);
  const st = await stat(path);
  if (!st.isFile()) throw new Error(`${rel}: not a file`);
  if (st.size > MAX_FILE_BYTES) throw new Error(`${rel}: image too large`);
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

/**
 * Image bytes by reference: URLs download through `fetchImage`, at most four
 * at a time; anything else is a workspace path read with `readImage`.
 */
export function createImageLoader(
  root: string,
  o: { fetch?: typeof fetch } = {},
): (ref: string) => Promise<Uint8Array> {
  let active = 0;
  const waiting: (() => void)[] = [];
  const acquire = () => {
    if (active < WEB_IMAGE.maxInFlight) {
      active++;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => waiting.push(resolve));
  };
  // A finished download hands its slot straight to the next one waiting.
  const release = () => {
    const next = waiting.shift();
    if (next === undefined) active--;
    else next();
  };
  return async (ref) => {
    if (!isWebUrl(ref)) return readImage(root, ref);
    await acquire();
    try {
      return await fetchImage(
        ref,
        o.fetch === undefined ? {} : { fetch: o.fetch },
      );
    } finally {
      release();
    }
  };
}
