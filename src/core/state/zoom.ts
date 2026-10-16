import {
  dragFrame,
  FITTED,
  filledFrame,
  framePans,
  panFrame,
  zoomFrame,
} from "../features/image/view";
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
import { bodyRows } from "./layout";
import { message, none } from "./result";
import type { AppState, Result, TerminalState, ZoomState } from "./types";

export { ZOOM_MAX } from "../features/image/view";

/** The zoom float: 90% of the terminal, at least 60×12, clipped to it below the bufferline. */
export function zoomSize(t: TerminalState): { w: number; h: number } {
  return {
    w: Math.min(t.cols, Math.max(60, Math.floor(t.cols * 0.9))),
    h: Math.min(bodyRows(t), Math.max(12, Math.floor(t.rows * 0.9))),
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
        ...FITTED,
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
          ...FITTED,
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

type DiagramZoom = Extract<ZoomState, { kind: "diagram" }>;

function imageKey(z: Extract<ZoomState, { kind: "image" }>, key: Key) {
  const pan = PAN[key];
  if (pan !== undefined) return panFrame(z, pan[0], pan[1]);
  switch (key) {
    case "+":
    case "=":
      return zoomFrame(z, 1);
    case "-":
      return zoomFrame(z, -1);
    case "0":
      return zoomFrame(z, 0);
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
  if (z.kind === "image") return none(showZoom(s, dragFrame(z, g, dx, dy)));
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
  if (z?.kind !== "image" || z.path !== a.path) return none(s);
  const next = filledFrame(z, a.fill);
  return next === z ? none(s) : none(showZoom(s, next));
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
  if (z.kind === "image") return framePans(z);
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
