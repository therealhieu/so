/** Image zoom, as a multiple of the size that fits the view: 0.25× to 8× in 0.25 steps. */
export const ZOOM_STEP = 0.25;
export const ZOOM_MAX = 8;

/**
 * How an image sits in its view: `level` times the size that fits, the view's
 * centre `cx`/`cy` as fractions of the image, and `fill`, how much of the view
 * the fitted image covers per axis (the UI measures it).
 */
export type ImageFrame = {
  level: number;
  cx: number;
  cy: number;
  fill: { x: number; y: number };
};

/** A press in the view, and the view's centre then. */
export type FrameGrab = { fx: number; fy: number; x: number; y: number };

export const FITTED: ImageFrame = {
  level: 1,
  cx: 0.5,
  cy: 0.5,
  fill: { x: 1, y: 1 },
};

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/** The fraction of the image the view shows along an axis: all of it until it outgrows the view. */
const shown = (level: number, fill: number) => Math.min(1, 1 / (level * fill));

/** The frame at `level` with its view's centre kept on the image. */
export function centred<F extends ImageFrame>(
  f: F,
  level: number,
  cx: number,
  cy: number,
): F {
  const hx = shown(level, f.fill.x) / 2;
  const hy = shown(level, f.fill.y) / 2;
  return {
    ...f,
    level,
    cx: clamp(cx, hx, 1 - hx),
    cy: clamp(cy, hy, 1 - hy),
  };
}

/** One zoom step in (`1`) or out (`-1`), or back to fit (`0`). */
export function zoomFrame<F extends ImageFrame>(f: F, step: 1 | -1 | 0): F {
  if (step === 0) return centred(f, 1, 0.5, 0.5);
  const level = clamp(f.level + step * ZOOM_STEP, ZOOM_STEP, ZOOM_MAX);
  return centred(f, level, f.cx, f.cy);
}

/** Pan by `dx`/`dy` quarters of the view. */
export function panFrame<F extends ImageFrame>(
  f: F,
  dx: number,
  dy: number,
): F {
  const sx = shown(f.level, f.fill.x) / 4;
  const sy = shown(f.level, f.fill.y) / 4;
  return centred(f, f.level, f.cx + dx * sx, f.cy + dy * sy);
}

/**
 * A drag by `dx`/`dy` view widths and heights from `grab`: the image follows
 * the pointer, since the view spans 1 / (level × fill) of it along each axis.
 */
export function dragFrame<F extends ImageFrame>(
  f: F,
  grab: FrameGrab,
  dx: number,
  dy: number,
): F {
  const cx = grab.x - dx / (f.level * f.fill.x);
  const cy = grab.y - dy / (f.level * f.fill.y);
  return centred(f, f.level, cx, cy);
}

/** The frame with the view's measured `fill`, its centre kept on the image. */
export function filledFrame<F extends ImageFrame>(
  f: F,
  fill: { x: number; y: number },
): F {
  if (f.fill.x === fill.x && f.fill.y === fill.y) return f;
  return centred({ ...f, fill }, f.level, f.cx, f.cy);
}

/** Which axes can pan: the image is larger than the view there. */
export const framePans = (f: ImageFrame): { x: boolean; y: boolean } => ({
  x: shown(f.level, f.fill.x) < 1,
  y: shown(f.level, f.fill.y) < 1,
});
