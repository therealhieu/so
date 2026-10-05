import { resolveLink } from "../features/links/resolve";
import type { Key } from "../kernel/vim/keys";
import { embedLink, fenceBody } from "../lang/markdown/block-text";
import type { Doc } from "../lang/markdown/doc";
import { blocksIn } from "../lang/markdown/live-preview";
import { renderKey } from "../lang/markdown/render-key";
import { baseName, isWebUrl } from "../lang/markdown/renderers/image";
import { mermaidLines } from "../lang/markdown/renderers/mermaid";
import { activeBuffer, activeWindow } from "./buffers";
import type { CommandContext } from "./commands";
import { message, none } from "./result";
import type { AppState, Result, TerminalState, ZoomState } from "./types";

/** Image zoom levels, as multiples of the size that fits the float. */
export const ZOOM_LEVELS = [1, 1.5, 2, 3, 4, 6, 8] as const;

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
      return { kind: "image", path: r.path, name, level: 1, cx: 0.5, cy: 0.5 };
    }
    case "mermaid": {
      const source = fenceBody(b.text, block).join("\n");
      const lines = mermaidLines(source, "loose");
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

/** The image view's centre kept where the view stays on the image at `level`. */
function centred(
  z: Extract<ZoomState, { kind: "image" }>,
  level: number,
  cx: number,
  cy: number,
): ZoomState {
  const half = 1 / (2 * level);
  return {
    ...z,
    level,
    cx: clamp(cx, half, 1 - half),
    cy: clamp(cy, half, 1 - half),
  };
}

function imageKey(
  z: Extract<ZoomState, { kind: "image" }>,
  key: Key,
): ZoomState {
  const at = ZOOM_LEVELS.indexOf(z.level as (typeof ZOOM_LEVELS)[number]);
  const pan = PAN[key];
  if (pan !== undefined) {
    // A quarter of the view per step.
    const step = 0.25 / z.level;
    return centred(z, z.level, z.cx + pan[0] * step, z.cy + pan[1] * step);
  }
  switch (key) {
    case "+":
    case "=":
      return centred(z, ZOOM_LEVELS[at + 1] ?? z.level, z.cx, z.cy);
    case "-":
      return centred(z, ZOOM_LEVELS[at - 1] ?? z.level, z.cx, z.cy);
    case "0":
      return centred(z, 1, 0.5, 0.5);
    default:
      return z;
  }
}

/** The diagram's first row and column kept so the float stays filled where it can. */
function scrolled(
  z: Extract<ZoomState, { kind: "diagram" }>,
  t: TerminalState,
  row: number,
  col: number,
): ZoomState {
  const { w, h } = zoomSize(t);
  const widest = Math.max(0, ...z.lines.map((l) => [...l].length));
  return {
    ...z,
    row: clamp(row, 0, Math.max(0, z.lines.length - (h - 2))),
    col: clamp(col, 0, Math.max(0, widest - (w - 2))),
  };
}

function diagramKey(
  z: Extract<ZoomState, { kind: "diagram" }>,
  key: Key,
  t: TerminalState,
): ZoomState {
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
