import {
  type ImageWindowState,
  isImageWindowState,
} from "../features/image/file-type";
import {
  dragFrame,
  filledFrame,
  panFrame,
  zoomFrame,
} from "../features/image/view";
import type { Binding } from "../kernel/commands/defaults";
import type { Command } from "../kernel/commands/registry";
import { setWindow } from "./buffers";
import type { CommandContext, CommandResult } from "./commands";
import { none } from "./result";
import { flipSource } from "./source-view";
import type { Action, AppState, Result, WindowId } from "./types";

export function imageWindow(
  s: AppState,
  id: WindowId,
): ImageWindowState | undefined {
  const ws = s.windows.byId[id]?.content.kindState;
  return isImageWindowState(ws) ? ws : undefined;
}

function setImageWindow(
  s: AppState,
  id: WindowId,
  ws: ImageWindowState,
): AppState {
  const w = s.windows.byId[id];
  if (w === undefined) return s;
  return setWindow(s, { ...w, content: { ...w.content, kindState: ws } });
}

/** The view drew the image: its size, and how much of the window it fills when fitted. */
export function onImageLaidOut(
  s: AppState,
  a: Extract<Action, { type: "imageLaidOut" }>,
): Result {
  const ws = imageWindow(s, a.window);
  if (ws === undefined) return none(s);
  const sized =
    ws.size?.width === a.size.width && ws.size.height === a.size.height
      ? ws
      : { ...ws, size: a.size };
  const next = filledFrame(sized, a.fill);
  return next === ws ? none(s) : none(setImageWindow(s, a.window, next));
}

/** The active image window's frame changed by `f`. */
function withFrame(
  s: AppState,
  f: (ws: ImageWindowState) => ImageWindowState,
): Result {
  const id = s.windows.active;
  const ws = imageWindow(s, id);
  if (ws === undefined) return none(s);
  const next = f(ws);
  return next === ws ? none(s) : none(setImageWindow(s, id, next));
}

/** A press at `at` (fractions of the window) in image window `id`: later drags pan from here. */
export function grabImage(
  s: AppState,
  id: WindowId,
  at: { fx: number; fy: number },
): Result {
  const ws = imageWindow(s, id);
  if (ws === undefined) return none(s);
  return none(
    setImageWindow(s, id, { ...ws, grab: { ...at, x: ws.cx, y: ws.cy } }),
  );
}

/** A drag to `at` from the last press: the image follows the pointer. */
export function dragImage(
  s: AppState,
  id: WindowId,
  at: { fx: number; fy: number },
): Result {
  const ws = imageWindow(s, id);
  const g = ws?.grab;
  if (ws === undefined || g === undefined) return none(s);
  return none(
    setImageWindow(s, id, dragFrame(ws, g, at.fx - g.fx, at.fy - g.fy)),
  );
}

/** The wheel: a vertical notch zooms in (up) or out (down), a sideways one pans. */
export function wheelImage(s: AppState, dx: number, dy: number): Result {
  if (dx !== 0) return withFrame(s, (ws) => panFrame(ws, Math.sign(dx), 0));
  if (dy === 0) return none(s);
  return withFrame(s, (ws) => zoomFrame(ws, dy < 0 ? 1 : -1));
}

const IMAGE = ["image", "svg"] as const;
const cmd = (
  id: string,
  title: string,
  f: (c: CommandContext) => Result,
): Command<CommandContext, CommandResult> => ({
  id,
  title,
  filetypes: IMAGE,
  run: f,
});

const framed =
  (f: (ws: ImageWindowState) => ImageWindowState) => (c: CommandContext) =>
    withFrame(c.state, f);

export const imageCommands = [
  cmd(
    "image.zoomIn",
    "Zoom in",
    framed((ws) => zoomFrame(ws, 1)),
  ),
  cmd(
    "image.zoomOut",
    "Zoom out",
    framed((ws) => zoomFrame(ws, -1)),
  ),
  cmd(
    "image.fit",
    "Fit the image to the window",
    framed((ws) => zoomFrame(ws, 0)),
  ),
  cmd(
    "image.left",
    "Pan left",
    framed((ws) => panFrame(ws, -1, 0)),
  ),
  cmd(
    "image.right",
    "Pan right",
    framed((ws) => panFrame(ws, 1, 0)),
  ),
  cmd(
    "image.up",
    "Pan up",
    framed((ws) => panFrame(ws, 0, -1)),
  ),
  cmd(
    "image.down",
    "Pan down",
    framed((ws) => panFrame(ws, 0, 1)),
  ),
  cmd("image.source", "Toggle the drawing and its SVG source", flipSource),
];

const KEYS: readonly (readonly [string, string])[] = [
  ["+", "image.zoomIn"],
  ["=", "image.zoomIn"],
  ["-", "image.zoomOut"],
  ["0", "image.fit"],
  ["h", "image.left"],
  ["<Left>", "image.left"],
  ["l", "image.right"],
  ["<Right>", "image.right"],
  ["k", "image.up"],
  ["<Up>", "image.up"],
  ["j", "image.down"],
  ["<Down>", "image.down"],
  ["<leader>m", "image.source"],
];

/**
 * An image window's keys resolve as file type `image` (see `keyScope`), so
 * an SVG drawn in one gets them too; its source, shown as text, keeps only
 * the key back to the drawing.
 */
export const imageBindings: readonly Binding[] = [
  ...KEYS.map(([seq, id]) => ({
    scope: { mode: "normal" as const, filetype: "image" },
    seq,
    id,
  })),
  {
    scope: { mode: "normal", filetype: "svg" },
    seq: "<leader>m",
    id: "image.source",
  },
];
