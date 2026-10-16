import type { RgbaImage } from "../core/state/types";

/** Runs a program without a shell; stdout past `maxBytes` or a run past `timeoutMs` fails. */
export type ToolRun = (
  argv: string[],
  o: { timeoutMs: number; maxBytes: number; env?: Record<string, string> },
) => Promise<{ code: number; stdout: Uint8Array; stderr: string }>;

/**
 * The pixels of a binary PPM (`P6`, 8 bits a channel), as `pdftoppm` and
 * `ffmpeg -vcodec ppm` write: raw pixels skip a PNG encoding that takes most
 * of a page's time in Poppler.
 */
export function ppmToRgba(ppm: Uint8Array): RgbaImage {
  const fields: number[] = [];
  let at = 2;
  if (ppm[0] !== 0x50 || ppm[1] !== 0x36) throw new Error("not a PPM image");
  while (fields.length < 3 && at < ppm.length) {
    const c = ppm[at] ?? 0;
    if (c === 0x23) while (at < ppm.length && ppm[at] !== 0x0a) at++;
    else if (c >= 0x30 && c <= 0x39) {
      let n = 0;
      while ((ppm[at] ?? 0) >= 0x30 && (ppm[at] ?? 0) <= 0x39)
        n = n * 10 + (ppm[at++] as number) - 0x30;
      fields.push(n);
      continue;
    }
    at++;
  }
  const [width = 0, height = 0, max = 0] = fields;
  at++;
  if (max !== 255 || width === 0 || height === 0)
    throw new Error("unsupported PPM image");
  if (ppm.length - at < width * height * 3)
    throw new Error("truncated PPM image");
  const rgba = new Uint8Array(width * height * 4);
  for (let i = at, j = 0; j < rgba.length; i += 3, j += 4) {
    rgba[j] = ppm[i] as number;
    rgba[j + 1] = ppm[i + 1] as number;
    rgba[j + 2] = ppm[i + 2] as number;
    rgba[j + 3] = 255;
  }
  return { rgba, width, height };
}

/** `Bun.spawn` with piped output, killed at the timeout or once stdout passes the cap. */
export const bunRun: ToolRun = async (argv, o) => {
  const p = Bun.spawn(argv, {
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
    ...(o.env === undefined ? {} : { env: { ...process.env, ...o.env } }),
  });
  let failure: string | undefined;
  const fail = (why: string) => {
    failure ??= why;
    p.kill();
  };
  const timer = setTimeout(() => fail("timed out"), o.timeoutMs);
  try {
    const chunks: Uint8Array[] = [];
    let total = 0;
    for await (const chunk of p.stdout) {
      total += chunk.byteLength;
      if (total > o.maxBytes) {
        fail("output too large");
        break;
      }
      chunks.push(chunk);
    }
    const [stderr, code] = await Promise.all([
      new Response(p.stderr).text(),
      p.exited,
    ]);
    if (failure !== undefined) throw new Error(failure);
    const stdout = new Uint8Array(total);
    let at = 0;
    for (const c of chunks) {
      stdout.set(c, at);
      at += c.byteLength;
    }
    return { code, stdout, stderr };
  } finally {
    clearTimeout(timer);
  }
};
