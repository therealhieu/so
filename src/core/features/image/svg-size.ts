/**
 * An SVG's drawing area: `box`, the user coordinates it shows (its
 * `viewBox`), and `width`×`height`, its size in pixels.
 */
export type SvgSize = {
  box: { x: number; y: number; w: number; h: number };
  width: number;
  height: number;
};

/** What a browser draws an SVG at when it gives no size. */
const DEFAULT = { width: 300, height: 150 };

const attr = (tag: string, name: string): string | undefined =>
  new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`)
    .exec(tag)
    ?.slice(1)
    .find((v) => v !== undefined);

/** A length in pixels: a plain number or `px`; percentages and other units give nothing. */
function pixels(v: string | undefined): number | undefined {
  const m = /^\s*([\d.]+(?:e[+-]?\d+)?)\s*(px)?\s*$/i.exec(v ?? "");
  const n = Number(m?.[1]);
  return m !== null && Number.isFinite(n) && n > 0 ? n : undefined;
}

function viewBox(v: string | undefined): SvgSize["box"] | undefined {
  const n = (v ?? "")
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  const [x = 0, y = 0, w = 0, h = 0] = n;
  return n.length === 4 && n.every(Number.isFinite) && w > 0 && h > 0
    ? { x, y, w, h }
    : undefined;
}

/**
 * The size of the SVG `text`'s root element: its `width` and `height` in
 * pixels, else its `viewBox`'s size, else 300×150; a missing side follows
 * the `viewBox`'s aspect. Undefined when it has no `<svg>` element.
 */
export function svgSize(text: string): SvgSize | undefined {
  const tag = /<svg\b[^>]*>/.exec(text)?.[0];
  if (tag === undefined) return undefined;
  const vb = viewBox(attr(tag, "viewBox"));
  const w = pixels(attr(tag, "width"));
  const h = pixels(attr(tag, "height"));
  const aspect = vb === undefined ? undefined : vb.w / vb.h;
  const width =
    w ?? (h !== undefined && aspect !== undefined ? h * aspect : undefined);
  const height =
    h ?? (w !== undefined && aspect !== undefined ? w / aspect : undefined);
  const size =
    width !== undefined && height !== undefined
      ? { width, height }
      : vb === undefined
        ? DEFAULT
        : { width: vb.w, height: vb.h };
  return {
    box: vb ?? { x: 0, y: 0, w: size.width, h: size.height },
    ...size,
  };
}

/**
 * `svgSize` of an SVG held as lines, read only as far as its root tag, so a
 * large drawing costs nothing past its top.
 */
export function svgSizeOfLines(text: {
  lineCount: number;
  line(i: number): string;
}): SvgSize | undefined {
  let head = "";
  for (let i = 0; i < text.lineCount; i++) {
    head += `${text.line(i)}\n`;
    const at = head.indexOf("<svg");
    if (at >= 0 && head.includes(">", at)) return svgSize(head);
  }
  return undefined;
}

/** The longest side an SVG file is drawn at, so zooming in stays sharp. */
const LONGEST_SIDE = 2048;
/** The most pixels one drawing holds. */
const MAX_PIXELS = 8_000_000;

/** The pixel size to draw `size` at: its longest side `LONGEST_SIDE`, within `MAX_PIXELS`. */
export function svgRasterSize(size: SvgSize): {
  width: number;
  height: number;
} {
  const longest = Math.max(size.width, size.height);
  const scale = Math.min(
    LONGEST_SIDE / longest,
    Math.sqrt(MAX_PIXELS / (size.width * size.height)),
  );
  return {
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale)),
  };
}
