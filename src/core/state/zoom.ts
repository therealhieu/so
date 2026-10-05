import { resolveLink } from "../features/links/resolve";
import type { Key } from "../kernel/vim/keys";
import { embedLink, fenceBody } from "../lang/markdown/block-text";
import type { Doc } from "../lang/markdown/doc";
import { blocksIn } from "../lang/markdown/live-preview";
import { renderKey } from "../lang/markdown/render-key";
import { baseName, isWebUrl } from "../lang/markdown/renderers/image";
import { mermaidLines, mermaidSvg } from "../lang/markdown/renderers/mermaid";
import { activeBuffer, activeWindow } from "./buffers";
import type { CommandContext } from "./commands";
import { message, none } from "./result";
import type { AppState, Result, TerminalState, ZoomState } from "./types";

/** Image zoom, as a multiple of the size that fits the float: 0.25× to 8× in 0.25 steps. */
export const ZOOM_STEP = 0.25;
export const ZOOM_MAX = 8;

/** The zoom float: 90% of the terminal, at least 60×12, clipped to it below the bufferline. */
export function zoomSize(t: TerminalState): { w: number; h: number } {
  return {
    w: Math.min(t.cols, Math.max(60, Math.floor(t.cols * 0.9))),
    h: Math.min(t.rows - 2, Math.max(12, Math.floor(t.rows * 0.9))),
  };
}

/**
 * What a zoom on source line `line` of the active window shows: the image or
 * the drawable Mermaid diagram of the block there, only in the `reading` view.
 */
export function zoomTargetAt(s: AppState, line: number): ZoomState | undefined {
  const b = activeBuffer(s);
  const doc = b?.analysis as Doc | undefined;
  if (b === undefined || doc === undefined || b.view !== "reading")
    return undefined;
  const block = blocksIn(doc, { from: line, to: line + 1 })[0];
  if (block === undefined) return undefined;
  switch (renderKey(block, doc, b.text)) {
    case "image": {
      const { target, alt } = embedLink(doc, block, b.text);
      const r = isWebUrl(target)
        ? { path: target }
        : resolveLink(s.index.ix, b.path, { target });
      if (!("path" in r)) return undefined;
      const name = alt ?? baseName(target);
      return {
        kind: "image",
        path: r.path,
        name,
        level: 1,
        cx: 0.5,
        cy: 0.5,
        fill: { x: 1, y: 1 },
      };
    }
    case "mermaid": {
      const source = fenceBody(b.text, block).join("\n");
      const lines = mermaidLines(source, "loose");
      const svg =
        s.config.preview.images === "off"
          ? undefined
          : mermaidSvg(source, s.config.theme);
      if (svg !== undefined)
        return {
          kind: "image",
          path: `mermaid:${block.hash}`,
          name: "mermaid",
          level: 1,
          cx: 0.5,
          cy: 0.5,
          fill: { x: 1, y: 1 },
          diagram: { svg, lines: lines ?? [] },
        };
      return lines === undefined
        ? undefined
        : { kind: "diagram", source, spacing: "loose", lines, row: 0, col: 0 };
    }
    default:
      return undefined;
  }
}

/** The zoom float on `zoom`. */
export const showZoom = (s: AppState, zoom: ZoomState): AppState => ({
  ...s,
  overlay: { kind: "zoom", zoom },
});

/** `<leader>z`: zoom the image or diagram on the cursor's block. */
export function openZoom(c: CommandContext): Result {
  const s = c.state;
  const b = activeBuffer(s);
  const w = activeWindow(s);
  if (b === undefined || w === undefined) return none(s);
  if (b.view !== "reading") return message(s, "zoom works in reading view");
  const zoom = zoomTargetAt(s, w.content.cursor.line);
  return zoom === undefined
    ? message(s, "nothing to zoom here")
    : none(showZoom(s, zoom));
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

const PAN: Readonly<Record<string, [number, number]>> = {
  h: [-1, 0],
  l: [1, 0],
  j: [0, 1],
  k: [0, -1],
  "<Left>": [-1, 0],
  "<Right>": [1, 0],
  "<Down>": [0, 1],
  "<Up>": [0, -1],
};

type ImageZoom = Extract<ZoomState, { kind: "image" }>;
type DiagramZoom = Extract<ZoomState, { kind: "diagram" }>;

/** The fraction of the image the view shows along an axis: all of it until it outgrows the float. */
const shown = (level: number, fill: number) => Math.min(1, 1 / (level * fill));

/** The image at `level` with its view's centre kept on the image. */
function centred(
  z: ImageZoom,
  level: number,
  cx: number,
  cy: number,
): ImageZoom {
  const hx = shown(level, z.fill.x) / 2;
  const hy = shown(level, z.fill.y) / 2;
  return {
    ...z,
    level,
    cx: clamp(cx, hx, 1 - hx),
    cy: clamp(cy, hy, 1 - hy),
  };
}

function imageKey(z: ImageZoom, key: Key): ZoomState {
  const pan = PAN[key];
  if (pan !== undefined) {
    // A quarter of the view per step.
    const sx = shown(z.level, z.fill.x) / 4;
    const sy = shown(z.level, z.fill.y) / 4;
    return centred(z, z.level, z.cx + pan[0] * sx, z.cy + pan[1] * sy);
  }
  switch (key) {
    case "+":
    case "=":
      return centred(z, Math.min(ZOOM_MAX, z.level + ZOOM_STEP), z.cx, z.cy);
    case "-":
      return centred(z, Math.max(ZOOM_STEP, z.level - ZOOM_STEP), z.cx, z.cy);
    case "0":
      return centred(z, 1, 0.5, 0.5);
    default:
      return z;
  }
}

/** A press at `p` in the float: later drags move the view from here. */
export function grabZoom(s: AppState, p: { fx: number; fy: number }): Result {
  const z = s.overlay.kind === "zoom" ? s.overlay.zoom : undefined;
  if (z === undefined) return none(s);
  const at = z.kind === "image" ? { x: z.cx, y: z.cy } : { x: z.col, y: z.row };
  return none(showZoom(s, { ...z, grab: { fx: p.fx, fy: p.fy, ...at } }));
}

/**
 * A drag to `p` from the last press: the content follows the pointer, so a
 * drag across the whole float moves the view by one float's width or height.
 */
export function dragZoom(s: AppState, p: { fx: number; fy: number }): Result {
  const z = s.overlay.kind === "zoom" ? s.overlay.zoom : undefined;
  const g = z?.grab;
  if (z === undefined || g === undefined) return none(s);
  const dx = p.fx - g.fx;
  const dy = p.fy - g.fy;
  if (z.kind === "image") {
    // The float spans 1 / (level × fill) of the image along each axis.
    const cx = g.x - dx / (z.level * z.fill.x);
    const cy = g.y - dy / (z.level * z.fill.y);
    return none(showZoom(s, centred(z, z.level, cx, cy)));
  }
  const { w, h } = zoomSize(s.terminal);
  const col = g.x - Math.round(dx * (w - 2));
  const row = g.y - Math.round(dy * (h - 2));
  return none(showZoom(s, scrolled(z, s.terminal, row, col)));
}

/** The UI measured how much of the float the zoomed image covers at fit. */
export function onZoomFill(
  s: AppState,
  a: { path: string; fill: { x: number; y: number } },
): Result {
  const z = s.overlay.kind === "zoom" ? s.overlay.zoom : undefined;
  if (
    z?.kind !== "image" ||
    z.path !== a.path ||
    (z.fill.x === a.fill.x && z.fill.y === a.fill.y)
  )
    return none(s);
  return none(
    showZoom(s, centred({ ...z, fill: a.fill }, z.level, z.cx, z.cy)),
  );
}

/** Diagram rows and columns past the float's inner size, per axis. */
function diagramExcess(z: DiagramZoom, t: TerminalState) {
  const { w, h } = zoomSize(t);
  const widest = Math.max(0, ...z.lines.map((l) => [...l].length));
  return {
    x: Math.max(0, widest - (w - 2)),
    y: Math.max(0, z.lines.length - (h - 2)),
  };
}

/** Which axes of the open zoom float can pan: the content is larger than the view there. */
export function zoomPans(s: AppState): { x: boolean; y: boolean } {
  const z = s.overlay.kind === "zoom" ? s.overlay.zoom : undefined;
  if (z === undefined) return { x: false, y: false };
  if (z.kind === "image")
    return {
      x: shown(z.level, z.fill.x) < 1,
      y: shown(z.level, z.fill.y) < 1,
    };
  const e = diagramExcess(z, s.terminal);
  return { x: e.x > 0, y: e.y > 0 };
}

/** The diagram's first row and column kept so the float stays filled where it can. */
function scrolled(
  z: DiagramZoom,
  t: TerminalState,
  row: number,
  col: number,
): ZoomState {
  const e = diagramExcess(z, t);
  return { ...z, row: clamp(row, 0, e.y), col: clamp(col, 0, e.x) };
}

function diagramKey(z: DiagramZoom, key: Key, t: TerminalState): ZoomState {
  const pan = PAN[key];
  if (pan !== undefined) {
    const { w, h } = zoomSize(t);
    const dx = Math.max(1, Math.floor((w - 2) / 4));
    const dy = Math.max(1, Math.floor((h - 2) / 4));
    return scrolled(z, t, z.row + pan[1] * dy, z.col + pan[0] * dx);
  }
  const spacing =
    key === "+" || key === "=" || key === "0"
      ? "loose"
      : key === "-"
        ? "tight"
        : undefined;
  if (spacing === undefined) return z;
  const lines =
    spacing === z.spacing ? z.lines : mermaidLines(z.source, spacing);
  if (lines === undefined) return z;
  const kept = key !== "0" && spacing === z.spacing;
  return scrolled(
    { ...z, spacing, lines },
    t,
    kept ? z.row : 0,
    kept ? z.col : 0,
  );
}

/**
 * Keys while the zoom float is open: `+`/`=` and `-` step the zoom (a
 * diagram's looser or tighter layout), `0` fits it again, `hjkl` and the
 * arrows pan a quarter of the view, and `Esc` or `q` close it.
 */
export function zoomKey(s: AppState, a: { key: Key }): Result {
  if (s.overlay.kind !== "zoom") return none(s);
  if (a.key === "<Esc>" || a.key === "q")
    return none({ ...s, overlay: { kind: "none" } });
  const z = s.overlay.zoom;
  const next =
    z.kind === "image" ? imageKey(z, a.key) : diagramKey(z, a.key, s.terminal);
  return next === z ? none(s) : none(showZoom(s, next));
}
