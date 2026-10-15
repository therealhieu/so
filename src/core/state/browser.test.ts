import { expect, test } from "bun:test";
import {
  fresh,
  stamp,
  testRegistries,
  textFile,
} from "../../../test/support/state";
import type { PageInput } from "../features/browser/file-type";
import { splitKeys } from "../kernel/vim/keys";
import { browserWindow } from "./browser";
import { activeBuffer, activeWindow } from "./buffers";
import { statusSegments } from "./status";
import type {
  Action,
  AppState,
  BrowserEvent,
  BrowserOp,
  Effect,
  MouseEvent,
  MouseTarget,
  Result,
} from "./types";
import { createUpdate } from "./update";

const update = createUpdate(testRegistries());
const PATH = "site/index.html";
const PX = { width: 1600, height: 900, cellHeight: 36 };
/** `PX` as CSS pixels: 36 px rows draw at 2 device pixels per CSS pixel. */
const SIZE = { width: 800, height: 450, dpr: 2 };

function run(s: AppState, ...actions: Action[]): Result {
  const effects: Effect[] = [];
  for (const a of actions) {
    const r = update(s, a);
    s = r.state;
    effects.push(...r.effects);
  }
  return { state: s, effects };
}

const keys = (seq: string): Action[] =>
  splitKeys(seq).map((key) => ({ type: "key", key, now: 0 }));
const loaded = (path = PATH, n = 1): Action => ({
  type: "fileLoaded",
  path,
  file: textFile("<h1>Hi</h1>", n),
});
const laidOut = (s: AppState, px = PX): Action => ({
  type: "browserLaidOut",
  window: s.windows.active,
  ...px,
});
const event = (s: AppState, e: BrowserEvent): Action => ({
  type: "browserEvent",
  window: s.windows.active,
  event: e,
});
const ready = (s: AppState) =>
  event(s, { kind: "status", status: { kind: "ready" } });

/** What the reducers asked of the browser host. */
const ops = (r: Result): BrowserOp[] =>
  r.effects.flatMap((e) => (e.kind === "browser" ? [e.op] : []));
const inputs = (r: Result): PageInput[] =>
  ops(r).flatMap((o) => (o.op === "input" ? [o.input] : []));

const page = (s: AppState) => browserWindow(s, s.windows.active);

/** `index.html` open, drawn, and showing its page. */
function openSite(): AppState {
  const opened = run(fresh(), loaded()).state;
  const drawn = run(opened, laidOut(opened)).state;
  return run(drawn, ready(drawn)).state;
}

const browse = (s: AppState) => run(s, ...keys("i")).state;

const onPage = (
  s: AppState,
  x = 0.25,
  y = 0.5,
  window = s.windows.active,
): MouseTarget => ({
  kind: "window",
  window,
  spot: { kind: "browser", at: { x, y } },
});
const mouse = (s: AppState, e: MouseEvent): Result =>
  run(s, { type: "mouse", event: e, now: 0 });

test("an HTML file opens in the browser view, and its page waits for the window's size", () => {
  const r = run(fresh(), loaded());
  expect(activeBuffer(r.state)).toMatchObject({ fileType: "html" });
  expect(activeBuffer(r.state)?.readOnly).not.toBe(true);
  expect(activeWindow(r.state)?.content.editor).toBe("browser");
  expect(page(r.state)).toEqual({
    mode: "normal",
    zoom: 1,
    status: { kind: "starting" },
  });
  expect(ops(r)).toEqual([]);
  const drawn = run(r.state, laidOut(r.state));
  expect(ops(drawn)).toEqual([{ op: "open", path: PATH, size: SIZE }]);
});

test("the same size again opens nothing; a new size or zoom resizes the page", () => {
  const s = openSite();
  expect(ops(run(s, laidOut(s)))).toEqual([]);
  const wider = run(s, laidOut(s, { ...PX, width: 2000 }));
  expect(ops(wider)).toEqual([
    { op: "resize", size: { ...SIZE, width: 1000 } },
  ]);
  const zoomed = run(s, ...keys("+"));
  expect(page(zoomed.state)?.zoom).toBe(1.1);
  expect(ops(zoomed)).toEqual([
    { op: "resize", size: { width: 727, height: 409, dpr: 2 } },
  ]);
  const reset = run(zoomed.state, ...keys("0"));
  expect(ops(reset)).toEqual([{ op: "resize", size: SIZE }]);
});

test("a changed file on disk shows again; the same version does not", () => {
  const s = openSite();
  expect(ops(run(s, loaded(PATH, 1)))).toEqual([]);
  expect(ops(run(s, loaded(PATH, 2)))).toEqual([
    { op: "open", path: PATH, size: SIZE },
  ]);
  expect(activeBuffer(run(s, loaded(PATH, 2)).state)?.stamp).toEqual(stamp(2));
});

test("<leader>m flips the window to its HTML source, closing the page, and back", () => {
  const s = openSite();
  const source = run(s, ...keys("<leader>m"));
  expect(activeWindow(source.state)?.content.editor).toBe("text");
  expect(ops(source)).toEqual([{ op: "close" }]);
  const back = run(source.state, ...keys("<leader>m"));
  expect(activeWindow(back.state)?.content.editor).toBe("browser");
  expect(page(back.state)?.px).toBeUndefined();
  expect(ops(run(back.state, laidOut(back.state)))).toEqual([
    { op: "open", path: PATH, size: SIZE },
  ]);
});

test("another file in the window closes the page", () => {
  const r = run(openSite(), loaded("notes.md"));
  expect(activeWindow(r.state)?.content.editor).toBe("text");
  expect(ops(r)).toEqual([{ op: "close" }]);
});

test("normal keys scroll, jump, go through history, and copy", () => {
  const s = openSite();
  const centre = { x: 0.5, y: 0.5 };
  expect(inputs(run(s, ...keys("j")))).toEqual([
    { kind: "wheel", at: centre, dx: 0, dy: 1 },
  ]);
  expect(inputs(run(s, ...keys("<C-d>")))).toEqual([
    { kind: "wheel", at: centre, dx: 0, dy: 6 },
  ]);
  const plain = { ctrl: false, alt: false, shift: false, meta: false };
  expect(inputs(run(s, ...keys("gg")))).toEqual([
    { kind: "key", key: { name: "home", ...plain } },
  ]);
  expect(inputs(run(s, ...keys("G")))).toEqual([
    { kind: "key", key: { name: "end", ...plain } },
  ]);
  expect(ops(run(s, ...keys("H")))).toEqual([{ op: "back" }]);
  expect(ops(run(s, ...keys("L")))).toEqual([{ op: "forward" }]);
  expect(ops(run(s, ...keys("r")))).toEqual([{ op: "reload" }]);
  expect(ops(run(s, ...keys("y")))).toEqual([{ op: "copy" }]);
});

test("i enters browse mode only once the page is shown", () => {
  const opened = run(fresh(), loaded()).state;
  const early = run(opened, ...keys("i"));
  expect(page(early.state)?.mode).toBe("normal");
  expect(early.state.notifications.message?.text).toBe("the page is not shown");
  const s = openSite();
  expect(statusSegments(s).mode).toBe("web");
  const browsing = browse(s);
  expect(page(browsing)?.mode).toBe("browse");
  expect(statusSegments(browsing).mode).toBe("browse");
});

test("in browse mode every key goes to the page, Vim's keys too", () => {
  const s = browse(openSite());
  const r = run(s, ...keys("j:<Esc>"));
  expect(
    inputs(r).map((i) => (i.kind === "key" ? i.key.name : i.kind)),
  ).toEqual(["j", ":", "escape"]);
  expect(r.state.overlay.kind).toBe("none");
  expect(page(r.state)?.mode).toBe("browse");
});

test("<C-\\><C-n> leaves browse mode; <C-\\> before any other key sends both", () => {
  const s = browse(openSite());
  const held = run(s, ...keys("<C-\\>"));
  expect(inputs(held)).toEqual([]);
  expect(page(held.state)?.prefix).toBe(true);
  const left = run(held.state, ...keys("<C-n>"));
  expect(inputs(left)).toEqual([]);
  expect(page(left.state)).toMatchObject({ mode: "normal" });
  expect(page(left.state)?.prefix).toBeUndefined();
  const both = run(held.state, ...keys("x"));
  expect(
    inputs(both).map((i) => (i.kind === "key" ? i.key : undefined)),
  ).toEqual([
    { name: "\\", ctrl: true, alt: false, shift: false, meta: false },
    {
      name: "x",
      text: "x",
      ctrl: false,
      alt: false,
      shift: false,
      meta: false,
    },
  ]);
  expect(page(both.state)).toMatchObject({ mode: "browse" });
  expect(page(both.state)?.prefix).toBeUndefined();
});

test("a key the editor has no name for goes to the page only in browse mode", () => {
  const raw = {
    name: "f13",
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
  };
  const s = openSite();
  expect(inputs(run(s, { type: "rawKey", raw, now: 0 }))).toEqual([]);
  expect(inputs(run(browse(s), { type: "rawKey", raw, now: 0 }))).toEqual([
    { kind: "key", key: raw },
  ]);
});

test("a click, drag, and release on the page go to it as pointer events", () => {
  const s = openSite();
  const press = mouse(s, {
    kind: "press",
    target: onPage(s),
    clicks: 2,
    ctrl: false,
  });
  expect(inputs(press)).toEqual([
    { kind: "mouse", type: "press", at: { x: 0.25, y: 0.5 }, clicks: 2 },
  ]);
  const drag = mouse(press.state, { kind: "drag", target: onPage(s, 0.5) });
  expect(inputs(drag)).toEqual([
    { kind: "mouse", type: "move", at: { x: 0.5, y: 0.5 }, held: true },
  ]);
  const release = mouse(drag.state, {
    kind: "release",
    target: onPage(s, 0.5),
    clicks: 2,
  });
  expect(inputs(release)).toEqual([
    { kind: "mouse", type: "release", at: { x: 0.5, y: 0.5 }, clicks: 2 },
  ]);
  const hover = mouse(s, { kind: "move", target: onPage(s, 0.1, 0.2) });
  expect(inputs(hover)).toEqual([
    { kind: "mouse", type: "move", at: { x: 0.1, y: 0.2 } },
  ]);
});

test("the wheel scrolls the page under the pointer; a page not shown takes no input", () => {
  const s = openSite();
  const r = mouse(s, { kind: "wheel", target: onPage(s), dx: 0, dy: 1 });
  expect(inputs(r)).toEqual([
    { kind: "wheel", at: { x: 0.25, y: 0.5 }, dx: 0, dy: 3 },
  ]);
  const opened = run(fresh(), loaded()).state;
  const early = mouse(opened, {
    kind: "press",
    target: onPage(opened),
    clicks: 1,
    ctrl: false,
  });
  expect(inputs(early)).toEqual([]);
});

test("a click into a text field types there; a click elsewhere gives the keys back", () => {
  const s = openSite();
  const field = run(s, event(s, { kind: "focus", editable: true }));
  expect(page(field.state)?.mode).toBe("browse");
  const away = run(field.state, event(s, { kind: "focus", editable: false }));
  expect(page(away.state)?.mode).toBe("normal");
});

test("only the active window keeps browse mode", () => {
  const s = browse(openSite());
  const split = run(s, ...keys("<C-\\><C-n><C-w>v")).state;
  const id = split.windows.active;
  const both = run(browse(split), ...keys("<C-\\><C-n><C-w>l")).state;
  expect(both.windows.active).not.toBe(id);
  const again = browse(both);
  const back = run(again, ...keys("<C-\\><C-n><C-w>h")).state;
  expect(browserWindow(back, both.windows.active)?.mode).toBe("normal");
  const focus = run(again, {
    type: "mouse",
    event: {
      kind: "press",
      target: onPage(again, 0.25, 0.5, id),
      clicks: 1,
      ctrl: false,
    },
    now: 0,
  }).state;
  expect(focus.windows.active).toBe(id);
  expect(browserWindow(focus, both.windows.active)?.mode).toBe("normal");
});

test("Chrome failing leaves browse mode and shows why", () => {
  const s = browse(openSite());
  const r = run(s, event(s, { kind: "status", status: { kind: "missing" } }));
  expect(page(r.state)).toMatchObject({
    mode: "normal",
    status: { kind: "missing" },
  });
});

test("the statusline shows the title, the address while loading, and the zoom", () => {
  const s = openSite();
  const at = (loading: boolean) =>
    run(
      s,
      event(s, {
        kind: "page",
        url: "file:///ws/site/index.html",
        title: "Showcase",
        loading,
      }),
    ).state;
  expect(statusSegments(at(false)).page).toBe("Showcase");
  expect(statusSegments(at(true)).page).toBe("loading…");
  expect(statusSegments(at(false)).position).toBeUndefined();
  const zoomed = run(at(false), ...keys("-")).state;
  expect(statusSegments(zoomed).page).toBe("Showcase 91%");
});

test("a copied selection goes to the clipboard; an empty one says so", () => {
  const s = openSite();
  const copied = run(s, event(s, { kind: "selection", text: "héllo" }));
  expect(copied.effects).toContainEqual({
    kind: "clipboardWrite",
    text: "héllo",
  });
  expect(copied.state.notifications.message?.text).toBe("copied 5 characters");
  const empty = run(s, event(s, { kind: "selection", text: "" }));
  expect(empty.effects.filter((e) => e.kind === "clipboardWrite")).toEqual([]);
  expect(empty.state.notifications.message?.text).toBe(
    "nothing selected on the page",
  );
});
