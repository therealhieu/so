import {
  type BrowserWindowState,
  isBrowserWindowState,
  type PageInput,
  type PagePoint,
  pageSize,
} from "../features/browser/file-type";
import { type RawKey, rawKeyOf } from "../features/browser/keys";
import type { Binding } from "../kernel/commands/defaults";
import type { Command } from "../kernel/commands/registry";
import { setWindow } from "./buffers";
import type { CommandContext, CommandResult } from "./commands";
import { sameStamp } from "./pdf";
import { message, none } from "./result";
import { flipSource } from "./source-view";
import type {
  Action,
  AppState,
  BrowserEvent,
  BrowserOp,
  Effect,
  Result,
  WindowId,
} from "./types";

/** CSS pixels one wheel line (and one `j`) scrolls a page. */
export const WHEEL_LINE_PX = 40;

export const BROWSER_ZOOM = { step: 1.1, min: 0.3, max: 3 } as const;

export function browserWindow(
  s: AppState,
  id: WindowId,
): BrowserWindowState | undefined {
  const w = s.windows.byId[id];
  if (w?.content.editor !== "browser") return undefined;
  const ws = w.content.kindState;
  return isBrowserWindowState(ws) ? ws : undefined;
}

export function setBrowserWindow(
  s: AppState,
  id: WindowId,
  ws: BrowserWindowState,
): AppState {
  const w = s.windows.byId[id];
  if (w === undefined || w.content.kindState === ws) return s;
  return setWindow(s, { ...w, content: { ...w.content, kindState: ws } });
}

const op = (window: WindowId, o: BrowserOp): Effect => ({
  kind: "browser",
  window,
  op: o,
});

const samePixels = (a: BrowserWindowState, b: BrowserWindowState) =>
  a.px?.width === b.px?.width &&
  a.px?.height === b.px?.height &&
  a.px?.cellHeight === b.px?.cellHeight &&
  a.zoom === b.zoom;

/**
 * Every browser window's page follows the window: it opens once the view
 * has drawn the window (so the page gets its size), follows the window's
 * size and zoom, shows the file again when the file changes on disk, and
 * closes when the window goes or shows something else. Only the active
 * window keeps browse mode.
 */
export function syncBrowser(prev: AppState, r: Result): Result {
  if (prev.windows === r.state.windows && prev.buffers === r.state.buffers)
    return r;
  let s = r.state;
  const effects: Effect[] = [];
  for (const [key, w] of Object.entries(s.windows.byId)) {
    const id = Number(key) as WindowId;
    let ws = browserWindow(s, id);
    if (ws === undefined) continue;
    if (ws.mode === "browse" && id !== s.windows.active) {
      const { prefix: _, ...rest } = ws;
      ws = { ...rest, mode: "normal" };
      s = setBrowserWindow(s, id, ws);
    }
    if (ws.px === undefined) continue;
    const b = s.buffers[w.content.bufferId];
    if (b === undefined) continue;
    const size = pageSize(ws.px, ws.zoom);
    const before = prev.windows.byId[id];
    const pws = browserWindow(prev, id);
    const sameBuffer = before?.content.bufferId === w.content.bufferId;
    const pb = sameBuffer ? prev.buffers[b.id] : undefined;
    if (pws?.px === undefined || !sameBuffer)
      effects.push(op(id, { op: "open", path: b.path, size }));
    else if (!samePixels(pws, ws)) effects.push(op(id, { op: "resize", size }));
    else if (
      pb !== undefined &&
      b.disk === "present" &&
      !sameStamp(pb.stamp, b.stamp)
    )
      effects.push(op(id, { op: "open", path: b.path, size }));
  }
  for (const key of Object.keys(prev.windows.byId)) {
    const id = Number(key) as WindowId;
    if (browserWindow(prev, id)?.px === undefined) continue;
    if (browserWindow(s, id) === undefined)
      effects.push(op(id, { op: "close" }));
  }
  return effects.length === 0 && s === r.state
    ? r
    : { state: s, effects: [...r.effects, ...effects] };
}

export function onBrowserLaidOut(
  s: AppState,
  a: Extract<Action, { type: "browserLaidOut" }>,
): Result {
  const ws = browserWindow(s, a.window);
  if (ws === undefined) return none(s);
  const px = { width: a.width, height: a.height, cellHeight: a.cellHeight };
  if (samePixels(ws, { ...ws, px })) return none(s);
  return none(setBrowserWindow(s, a.window, { ...ws, px }));
}

function onEvent(
  s: AppState,
  id: WindowId,
  ws: BrowserWindowState,
  e: BrowserEvent,
): Result {
  switch (e.kind) {
    case "status": {
      const failed = e.status.kind !== "ready" && e.status.kind !== "starting";
      const { prefix: _, ...rest } = ws;
      const next: BrowserWindowState = failed
        ? { ...rest, mode: "normal", status: e.status }
        : { ...ws, status: e.status };
      return none(setBrowserWindow(s, id, next));
    }
    case "page":
      return none(
        setBrowserWindow(s, id, {
          ...ws,
          status: { kind: "ready" },
          url: e.url,
          title: e.title,
          loading: e.loading,
        }),
      );
    case "selection":
      if (e.text === "") return message(s, "nothing selected on the page");
      return {
        ...message(s, `copied ${[...e.text].length} characters`),
        effects: [{ kind: "clipboardWrite", text: e.text }],
      };
    case "focus": {
      // A click into a text field types there, as in a browser; a click
      // anywhere else gives the keys back to the window.
      const mode = e.editable ? "browse" : "normal";
      if (id !== s.windows.active || ws.mode === mode) return none(s);
      const { prefix: _, ...rest } = ws;
      return none(setBrowserWindow(s, id, { ...rest, mode }));
    }
  }
}

export function onBrowserEvent(
  s: AppState,
  a: Extract<Action, { type: "browserEvent" }>,
): Result {
  const ws = browserWindow(s, a.window);
  return ws === undefined ? none(s) : onEvent(s, a.window, ws, a.event);
}

type Active = { s: AppState; id: WindowId; ws: BrowserWindowState };

function activeBrowser(s: AppState): Active | undefined {
  const id = s.windows.active;
  const ws = browserWindow(s, id);
  return ws === undefined ? undefined : { s, id, ws };
}

const withActive =
  (f: (a: Active) => Result) =>
  (c: CommandContext): Result => {
    const a = activeBrowser(c.state);
    return a === undefined ? none(c.state) : f(a);
  };

const send = (a: Active, o: BrowserOp): Result => ({
  state: a.s,
  effects: [op(a.id, o)],
});

const input = (a: Active, i: PageInput): Result =>
  send(a, { op: "input", input: i });

const CENTRE: PagePoint = { x: 0.5, y: 0.5 };

/** Lines in half the page's height. */
function halfPage(ws: BrowserWindowState): number {
  if (ws.px === undefined) return 10;
  const { height } = pageSize(ws.px, ws.zoom);
  return Math.max(1, Math.round(height / 2 / WHEEL_LINE_PX));
}

const plainKey = (name: string): RawKey => ({
  name,
  ctrl: false,
  alt: false,
  shift: false,
  meta: false,
});

function zoomTo(a: Active, zoom: number): Result {
  const z = Math.min(BROWSER_ZOOM.max, Math.max(BROWSER_ZOOM.min, zoom));
  const rounded = Math.round(z * 100) / 100;
  return none(setBrowserWindow(a.s, a.id, { ...a.ws, zoom: rounded }));
}

const HTML = ["html"] as const;
const cmd = (
  id: string,
  title: string,
  f: (c: CommandContext) => Result,
): Command<CommandContext, CommandResult> => ({
  id,
  title,
  filetypes: HTML,
  run: f,
});

export const browserCommands = [
  cmd(
    "browser.down",
    "Scroll the page down",
    withActive((a) => input(a, { kind: "wheel", at: CENTRE, dx: 0, dy: 1 })),
  ),
  cmd(
    "browser.up",
    "Scroll the page up",
    withActive((a) => input(a, { kind: "wheel", at: CENTRE, dx: 0, dy: -1 })),
  ),
  cmd(
    "browser.halfDown",
    "Scroll the page down half a window",
    withActive((a) =>
      input(a, { kind: "wheel", at: CENTRE, dx: 0, dy: halfPage(a.ws) }),
    ),
  ),
  cmd(
    "browser.halfUp",
    "Scroll the page up half a window",
    withActive((a) =>
      input(a, { kind: "wheel", at: CENTRE, dx: 0, dy: -halfPage(a.ws) }),
    ),
  ),
  cmd(
    "browser.left",
    "Scroll the page left",
    withActive((a) => input(a, { kind: "wheel", at: CENTRE, dx: -1, dy: 0 })),
  ),
  cmd(
    "browser.right",
    "Scroll the page right",
    withActive((a) => input(a, { kind: "wheel", at: CENTRE, dx: 1, dy: 0 })),
  ),
  cmd(
    "browser.top",
    "Go to the top of the page",
    withActive((a) => input(a, { kind: "key", key: plainKey("home") })),
  ),
  cmd(
    "browser.bottom",
    "Go to the bottom of the page",
    withActive((a) => input(a, { kind: "key", key: plainKey("end") })),
  ),
  cmd(
    "browser.back",
    "Go back a page",
    withActive((a) => send(a, { op: "back" })),
  ),
  cmd(
    "browser.forward",
    "Go forward a page",
    withActive((a) => send(a, { op: "forward" })),
  ),
  cmd(
    "browser.reload",
    "Reload the page (or restart Chrome)",
    withActive((a) => send(a, { op: "reload" })),
  ),
  cmd(
    "browser.zoomIn",
    "Zoom the page in",
    withActive((a) => zoomTo(a, a.ws.zoom * BROWSER_ZOOM.step)),
  ),
  cmd(
    "browser.zoomOut",
    "Zoom the page out",
    withActive((a) => zoomTo(a, a.ws.zoom / BROWSER_ZOOM.step)),
  ),
  cmd(
    "browser.zoomReset",
    "Reset the page zoom",
    withActive((a) => zoomTo(a, 1)),
  ),
  cmd(
    "browser.copy",
    "Copy the text selected on the page",
    withActive((a) => send(a, { op: "copy" })),
  ),
  cmd(
    "browser.browse",
    "Send keys to the page",
    withActive((a) =>
      a.ws.status.kind === "ready"
        ? none(setBrowserWindow(a.s, a.id, { ...a.ws, mode: "browse" }))
        : message(a.s, "the page is not shown"),
    ),
  ),
  cmd("browser.source", "Toggle the page and its HTML source", flipSource),
];

const KEYS: readonly (readonly [string, string])[] = [
  ["j", "browser.down"],
  ["<Down>", "browser.down"],
  ["k", "browser.up"],
  ["<Up>", "browser.up"],
  ["h", "browser.left"],
  ["<Left>", "browser.left"],
  ["l", "browser.right"],
  ["<Right>", "browser.right"],
  ["<C-d>", "browser.halfDown"],
  ["<PageDown>", "browser.halfDown"],
  ["<C-u>", "browser.halfUp"],
  ["<PageUp>", "browser.halfUp"],
  ["gg", "browser.top"],
  ["G", "browser.bottom"],
  ["H", "browser.back"],
  ["L", "browser.forward"],
  ["r", "browser.reload"],
  ["+", "browser.zoomIn"],
  ["=", "browser.zoomIn"],
  ["-", "browser.zoomOut"],
  ["0", "browser.zoomReset"],
  ["y", "browser.copy"],
  ["i", "browser.browse"],
  ["a", "browser.browse"],
  ["<leader>m", "browser.source"],
];

/**
 * The browser view's keys resolve under the `browser` scope (see
 * `keyScope`), so the HTML source keeps Vim's; `<leader>m` flips either way.
 */
export const browserBindings: readonly Binding[] = [
  ...KEYS.map(([seq, id]) => ({
    scope: { mode: "normal", filetype: "browser" },
    seq,
    id,
  })),
  {
    scope: { mode: "normal", filetype: "html" },
    seq: "<leader>m",
    id: "browser.source",
  },
];

/** Whether keys go to the active window's page. */
export function browsing(s: AppState): boolean {
  return activeBrowser(s)?.ws.mode === "browse";
}

const BROWSE_ESCAPE = "<C-\\>";

/**
 * A key in browse mode: every key goes to the page except `<C-\><C-n>`,
 * which returns to Normal mode; `<C-\>` and any other key both go to the page.
 */
export function browseKey(
  s: AppState,
  key: string,
  raw: RawKey | undefined,
): Result {
  const a = activeBrowser(s);
  if (a === undefined) return none(s);
  const { prefix, ...rest } = a.ws;
  if (prefix !== undefined) {
    const st = setBrowserWindow(s, a.id, rest);
    if (key === "<C-n>")
      return none(setBrowserWindow(st, a.id, { ...rest, mode: "normal" }));
    const held = rawKeyOf(BROWSE_ESCAPE);
    const typed = raw ?? rawKeyOf(key);
    const keys = [held, typed].filter((k) => k !== undefined);
    return {
      state: st,
      effects: keys.map((k) =>
        op(a.id, { op: "input", input: { kind: "key", key: k } }),
      ),
    };
  }
  if (key === BROWSE_ESCAPE)
    return none(setBrowserWindow(s, a.id, { ...a.ws, prefix: true }));
  const typed = raw ?? rawKeyOf(key);
  return typed === undefined
    ? none(s)
    : input({ ...a, s }, { kind: "key", key: typed });
}

/** A key the editor has no name for goes to the page in browse mode only. */
export function onRawKey(s: AppState, raw: RawKey): Result {
  const a = activeBrowser(s);
  if (a === undefined || a.ws.mode !== "browse" || a.ws.prefix !== undefined)
    return none(s);
  return input(a, { kind: "key", key: raw });
}

function windowInput(s: AppState, id: WindowId, i: PageInput): Result {
  return browserWindow(s, id)?.status.kind === "ready"
    ? { state: s, effects: [op(id, { op: "input", input: i })] }
    : none(s);
}

/** A press on the page goes to it as a click. */
export function pressBrowser(
  s: AppState,
  id: WindowId,
  at: PagePoint | undefined,
  clicks: number,
): Result {
  if (at === undefined) return none(s);
  return windowInput(s, id, { kind: "mouse", type: "press", at, clicks });
}

/** A drag over the page moves the pointer with the button held. */
export function dragBrowser(s: AppState, id: WindowId, at: PagePoint): Result {
  return windowInput(s, id, { kind: "mouse", type: "move", at, held: true });
}

export function releaseBrowser(
  s: AppState,
  id: WindowId,
  at: PagePoint | undefined,
  clicks: number,
): Result {
  if (at === undefined) return none(s);
  return windowInput(s, id, { kind: "mouse", type: "release", at, clicks });
}

/** A pointer resting over the page hovers it. */
export function hoverBrowser(
  s: AppState,
  id: WindowId,
  at: PagePoint | undefined,
): Result {
  if (at === undefined) return none(s);
  return windowInput(s, id, { kind: "mouse", type: "move", at });
}

export function wheelBrowser(
  s: AppState,
  id: WindowId,
  at: PagePoint | undefined,
  dx: number,
  dy: number,
): Result {
  return windowInput(s, id, { kind: "wheel", at: at ?? CENTRE, dx, dy });
}
