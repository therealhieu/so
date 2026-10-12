import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parsePdfLayout } from "../core/features/pdf/layout";
import { parsePdfOutline } from "../core/features/pdf/outline";
import { type PdfPageRequest, pageWidth } from "../core/features/pdf/page";
import type {
  PdfInfoResult,
  PdfLayoutResult,
  PdfOutlineResult,
  PdfTextResult,
  RgbaImage,
} from "../core/state/types";
import { xdgDir } from "./config-file";
import { containedFile } from "./images";
import { createLimiter } from "./limit";
import type { Logger } from "./log";

/** Runs a program without a shell; stdout past `maxBytes` or a run past `timeoutMs` fails. */
export type PdfRun = (
  argv: string[],
  o: { timeoutMs: number; maxBytes: number; env?: Record<string, string> },
) => Promise<{ code: number; stdout: Uint8Array; stderr: string }>;

export const PDF_LIMITS = {
  infoTimeoutMs: 5_000,
  pageTimeoutMs: 15_000,
  maxInfoBytes: 64 * 2 ** 10,
  maxPageBytes: 64 * 2 ** 20,
  textTimeoutMs: 15_000,
  maxTextBytes: 32 * 2 ** 20,
  layoutTimeoutMs: 10_000,
  maxLayoutBytes: 8 * 2 ** 20,
  outlineTimeoutMs: 10_000,
  maxOutlineBytes: 4 * 2 ** 20,
  maxInFlight: 2,
} as const;

export type PdfRasterizer = {
  /** The page count; `missing` when Poppler is not on PATH. */
  info(rel: string): Promise<PdfInfoResult>;
  /** One page's pixels; rejects with the reason it could not be drawn. */
  page(r: PdfPageRequest): Promise<RgbaImage>;
  /** Each page's text, in page order. */
  text(rel: string): Promise<PdfTextResult>;
  /** One page's words and their boxes. */
  layout(rel: string, page: number): Promise<PdfLayoutResult>;
  /** The table of contents; empty when the PDF has none. */
  outline(rel: string): Promise<PdfOutlineResult>;
};

/**
 * The pixels of a binary PPM (`P6`, 8 bits a channel), as `pdftoppm` writes
 * by default: raw pixels skip the PNG encoding that takes most of a page's
 * time in Poppler.
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

/** `pdftotext` output split at its form feeds, one entry per page. */
export function splitPdfPages(text: string): string[] {
  const pages = text.split("\f");
  if (pages.length > 1 && pages.at(-1)?.trim() === "") pages.pop();
  return pages;
}

/** The `Pages:` line of `pdfinfo` output. */
export function parsePdfPages(text: string): number | undefined {
  const n = Number(/^Pages:\s+(\d+)\s*$/m.exec(text)?.[1]);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

/** Poppler's first error line without its prefix, else its first line. */
function reasonOf(stderr: string, code: number): string {
  const lines = stderr
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "");
  const line = lines.find((l) => /error/i.test(l)) ?? lines[0];
  return (
    line?.replace(/^[\w/ ]*Error(?: \(\d+\))?:\s*/, "") || `exit code ${code}`
  );
}

/** `Bun.spawn` with piped output, killed at the timeout or once stdout passes the cap. */
export const bunRun: PdfRun = async (argv, o) => {
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

/**
 * Pages and page counts of workspace PDFs through Poppler's `pdftoppm` and
 * `pdfinfo`, found on PATH at each call. Paths must stay inside the
 * workspace, and at most two Poppler runs go at once.
 */
export function createPdfRasterizer(d: {
  root: string;
  which: (cmd: string) => string | null;
  run?: PdfRun;
  /** Added to Poppler's environment (see `popplerEnv`). */
  env?: Record<string, string>;
  logger?: Logger;
}): PdfRasterizer {
  const base = d.run ?? bunRun;
  const run: PdfRun = (argv, o) =>
    base(argv, d.env === undefined ? o : { ...o, env: d.env });
  const limited = createLimiter(PDF_LIMITS.maxInFlight);
  const tool = (name: string) => d.which(name);
  const failed = (what: string, rel: string, e: unknown) => {
    const reason = e instanceof Error ? e.message : String(e);
    d.logger?.error(what, { path: rel, reason });
    return { kind: "failed", reason } as const;
  };
  /** Run Poppler's `name` on the workspace file `rel`; stdout as text. */
  const readOut = async (
    name: string,
    rel: string,
    args: (path: string) => string[],
    limits: { timeoutMs: number; maxBytes: number },
  ): Promise<{ kind: "missing" } | { kind: "ok"; text: string }> => {
    const bin = tool(name);
    if (bin === null) return { kind: "missing" };
    const { path } = await containedFile(d.root, rel);
    const r = await limited(() => run([bin, ...args(path)], limits));
    if (r.code !== 0) throw new Error(reasonOf(r.stderr, r.code));
    return { kind: "ok", text: new TextDecoder().decode(r.stdout) };
  };

  return {
    async info(rel) {
      const bin = tool("pdfinfo");
      if (bin === null || tool("pdftoppm") === null) return { kind: "missing" };
      try {
        const { path } = await containedFile(d.root, rel);
        const r = await limited(() =>
          run([bin, path], {
            timeoutMs: PDF_LIMITS.infoTimeoutMs,
            maxBytes: PDF_LIMITS.maxInfoBytes,
          }),
        );
        const pages = parsePdfPages(new TextDecoder().decode(r.stdout));
        if (r.code !== 0 || pages === undefined)
          return { kind: "failed", reason: reasonOf(r.stderr, r.code) };
        return { kind: "ok", pages };
      } catch (e) {
        const reason = e instanceof Error ? e.message : String(e);
        d.logger?.error("pdf.infoFailed", { path: rel, reason });
        return { kind: "failed", reason };
      }
    },

    async page(r) {
      const bin = tool("pdftoppm");
      if (bin === null) throw new Error("Poppler (pdftoppm) not found");
      const { path } = await containedFile(d.root, r.path);
      const page = String(Math.max(1, Math.floor(r.page)));
      const argv = [
        bin,
        "-f",
        page,
        "-l",
        page,
        "-scale-to-x",
        String(pageWidth(r.width)),
        "-scale-to-y",
        "-1",
        path,
      ];
      const out = await limited(() =>
        run(argv, {
          timeoutMs: PDF_LIMITS.pageTimeoutMs,
          maxBytes: PDF_LIMITS.maxPageBytes,
        }),
      );
      if (out.code !== 0 || out.stdout.byteLength === 0)
        throw new Error(reasonOf(out.stderr, out.code));
      return ppmToRgba(out.stdout);
    },

    async text(rel) {
      try {
        const r = await readOut(
          "pdftotext",
          rel,
          (path) => ["-enc", "UTF-8", path, "-"],
          {
            timeoutMs: PDF_LIMITS.textTimeoutMs,
            maxBytes: PDF_LIMITS.maxTextBytes,
          },
        );
        return r.kind === "missing"
          ? r
          : { kind: "ok", pages: splitPdfPages(r.text) };
      } catch (e) {
        return failed("pdf.textFailed", rel, e);
      }
    },

    async layout(rel, page) {
      try {
        const n = String(Math.max(1, Math.floor(page)));
        const r = await readOut(
          "pdftotext",
          rel,
          (path) => [
            "-bbox-layout",
            "-enc",
            "UTF-8",
            "-f",
            n,
            "-l",
            n,
            path,
            "-",
          ],
          {
            timeoutMs: PDF_LIMITS.layoutTimeoutMs,
            maxBytes: PDF_LIMITS.maxLayoutBytes,
          },
        );
        return r.kind === "missing"
          ? r
          : { kind: "ok", layout: parsePdfLayout(r.text) };
      } catch (e) {
        return failed("pdf.layoutFailed", rel, e);
      }
    },

    async outline(rel) {
      try {
        // The outline comes whatever pages are asked for, so ask for one.
        const r = await readOut(
          "pdftohtml",
          rel,
          (path) => ["-xml", "-i", "-q", "-stdout", "-f", "1", "-l", "1", path],
          {
            timeoutMs: PDF_LIMITS.outlineTimeoutMs,
            maxBytes: PDF_LIMITS.maxOutlineBytes,
          },
        );
        return r.kind === "missing"
          ? r
          : { kind: "ok", items: parsePdfOutline(r.text) };
      } catch (e) {
        return failed("pdf.outlineFailed", rel, e);
      }
    },
  };
}

/**
 * A fontconfig file for Poppler on macOS: only the system and user font
 * folders. Homebrew's stock rules can resolve Helvetica, the commonest font
 * PDFs leave out, to Hiragino Sans, which Poppler draws as blank text.
 */
export function macFontConfig(home: string, cacheDir: string): string {
  const dirs = [
    "/System/Library/Fonts",
    "/Library/Fonts",
    join(home, "Library/Fonts"),
  ];
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return [
    '<?xml version="1.0"?>',
    '<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">',
    "<fontconfig>",
    ...dirs.map((d) => `  <dir>${esc(d)}</dir>`),
    `  <cachedir>${esc(cacheDir)}</cachedir>`,
    "</fontconfig>",
    "",
  ].join("\n");
}

/**
 * `$XDG_CACHE_HOME/so`, or `~/.cache/so`: files `so` can always rebuild.
 */
export const soCacheDir = (
  env: Record<string, string | undefined>,
  home: string,
) => join(xdgDir(env, "XDG_CACHE_HOME", join(home, ".cache")), "so");

/**
 * The environment Poppler runs with: on macOS, `FONTCONFIG_FILE` naming
 * `macFontConfig` written under `cacheDir`; elsewhere, and when it cannot
 * be written, nothing, so Poppler uses the system's fontconfig.
 */
export function popplerEnv(
  platform: NodeJS.Platform,
  home: string,
  cacheDir: string,
  logger?: Logger,
): Record<string, string> {
  if (platform !== "darwin") return {};
  const dir = join(cacheDir, "fontconfig");
  const file = join(dir, "fonts.conf");
  const text = macFontConfig(home, join(dir, "cache"));
  try {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    if (!existsSync(file) || readFileSync(file, "utf8") !== text)
      writeFileSync(file, text);
    return { FONTCONFIG_FILE: file };
  } catch (e) {
    logger?.error("pdf.fontConfigFailed", {
      reason: e instanceof Error ? e.message : String(e),
    });
    return {};
  }
}
