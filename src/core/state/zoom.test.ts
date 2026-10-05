import { expect, test } from "bun:test";
import {
  freshDefaults,
  testRegistries,
  textFile,
} from "../../../test/support/state";
import { splitKeys } from "../kernel/vim/keys";
import type { Action, AppState, ZoomState } from "./types";
import { createUpdate } from "./update";
import {
  dragZoom,
  grabZoom,
  ZOOM_MAX,
  zoomPans,
  zoomSize,
  zoomTargetAt,
} from "./zoom";

const reg = testRegistries();
const update = createUpdate(reg);

const NOTE = [
  "# Pictures", // 0
  "", // 1
  "![[a.png]]", // 2
  "", // 3
  "![Chart](a.png)", // 4
  "", // 5
  "![](https://example.com/b.png?x=1)", // 6
  "", // 7
  "```mermaid", // 8
  "flowchart LR", // 9
  "  Capture --> Triage --> Plan --> Ship", // 10
  "```", // 11
  "", // 12
  "```mermaid", // 13
  "gantt", // 14
  "  title x", // 15
  "```", // 16
  "", // 17
  "Plain text.", // 18
].join("\n");

function keys(s: AppState, seq: string): AppState {
  for (const key of splitKeys(seq))
    s = update(s, { type: "key", key, now: 0 }).state;
  return s;
}

/** The note open in `reading`, with `a.png` in the index. */
function note(): AppState {
  const s = update(freshDefaults(), {
    type: "indexBatch",
    summaries: [],
    files: ["n.md", "a.png"],
    done: 0,
    total: 0,
  } satisfies Action).state;
  return update(s, { type: "fileLoaded", path: "n.md", file: textFile(NOTE) })
    .state;
}

/** `s` with `[preview] images = "off"`, where diagrams zoom as text. */
const imagesOff = (s: AppState): AppState => ({
  ...s,
  config: { ...s.config, preview: { ...s.config.preview, images: "off" } },
});

const zoomOf = (s: AppState): ZoomState | undefined =>
  s.overlay.kind === "zoom" ? s.overlay.zoom : undefined;
const message = (s: AppState) => s.notifications.message?.text;

test("a zoom shows the image or drawable diagram on a line of the reading view", () => {
  const s = note();
  expect(zoomTargetAt(s, 2)).toEqual({
    kind: "image",
    path: "a.png",
    name: "a.png",
    level: 1,
    cx: 0.5,
    cy: 0.5,
    fill: { x: 1, y: 1 },
  });
  expect(zoomTargetAt(s, 4)).toMatchObject({ path: "a.png", name: "Chart" });
  expect(zoomTargetAt(s, 6)).toMatchObject({
    path: "https://example.com/b.png?x=1",
    name: "b.png",
  });
  const drawn = zoomTargetAt(s, 10);
  if (drawn?.kind !== "image" || drawn.diagram === undefined)
    throw new Error("expected a diagram drawn as an image");
  expect(drawn).toMatchObject({ name: "mermaid", level: 1 });
  expect(drawn.path).toStartWith("mermaid:");
  expect(drawn.diagram.svg.width).toBeGreaterThan(0);
  expect(drawn.diagram.svg.svg).not.toContain("var(");
  expect(drawn.diagram.lines.join("\n")).toContain("│ Capture ├");
  const text = zoomTargetAt(imagesOff(s), 10);
  expect(text?.kind).toBe("diagram");
  if (text?.kind === "diagram")
    expect(text.lines.join("\n")).toContain("│ Capture ├");
  expect(zoomTargetAt(s, 14)).toBeUndefined();
  expect(zoomTargetAt(s, 18)).toBeUndefined();
  expect(zoomTargetAt(keys(s, "<leader>m"), 2)).toBeUndefined();
});

test("<leader>z zooms the cursor's block in reading and explains elsewhere", () => {
  const s = note();
  expect(zoomOf(keys(s, "2j<leader>z"))?.kind).toBe("image");
  expect(message(keys(s, "<leader>z"))).toBe("nothing to zoom here");
  expect(message(keys(s, "<leader>m2j<leader>z"))).toBe(
    "zoom works in reading view",
  );
});

test("zoom keys step the level, pan inside the image, reset, and close", () => {
  let s = keys(note(), "2j<leader>z");
  s = keys(s, "l");
  expect(zoomOf(s)).toMatchObject({ level: 1, cx: 0.5, cy: 0.5 });
  s = keys(s, "+");
  expect(zoomOf(s)).toMatchObject({ level: 1.25 });
  s = keys(s, "+++");
  expect(zoomOf(s)).toMatchObject({ level: 2 });
  s = keys(s, "lll");
  // At 2× the view is half the image wide, so its centre stops at 3/4.
  expect(zoomOf(s)).toMatchObject({ cx: 0.75, cy: 0.5 });
  s = keys(s, "kk");
  expect(zoomOf(s)).toMatchObject({ cy: 0.25 });
  s = keys(s, "--");
  const out = zoomOf(s);
  if (out?.kind !== "image") throw new Error("expected an image");
  expect(out.level).toBe(1.5);
  expect(out.cx).toBeCloseTo(2 / 3);
  expect(out.cy).toBeCloseTo(1 / 3);
  s = keys(s, "=".repeat(40));
  expect(zoomOf(s)).toMatchObject({ level: ZOOM_MAX });
  s = keys(s, "0");
  expect(zoomOf(s)).toMatchObject({ level: 1, cx: 0.5, cy: 0.5 });
  // Below fit the whole image shows, centred, so there is nothing to pan.
  s = keys(s, "-");
  expect(zoomOf(s)).toMatchObject({ level: 0.75 });
  s = keys(s, "----ll");
  expect(zoomOf(s)).toMatchObject({ level: 0.25, cx: 0.5, cy: 0.5 });
  expect(zoomPans(s)).toEqual({ x: false, y: false });
  expect(keys(s, "q").overlay.kind).toBe("none");
  expect(keys(s, "<Esc>").overlay.kind).toBe("none");
});

test("a diagram scrolls within its lines and switches to the tight layout", () => {
  let s = keys(imagesOff(note()), "10j<leader>z");
  const loose = zoomOf(s);
  if (loose?.kind !== "diagram") throw new Error("expected a diagram");
  const { w } = zoomSize(s.terminal);
  const widest = Math.max(...loose.lines.map((l) => [...l].length));
  s = keys(s, "llllllll");
  expect(zoomOf(s)).toMatchObject({ col: Math.max(0, widest - (w - 2)) });
  s = keys(s, "jjjj");
  expect(zoomOf(s)).toMatchObject({ row: 0 });
  s = keys(s, "-");
  const tight = zoomOf(s);
  expect(tight).toMatchObject({ spacing: "tight", row: 0, col: 0 });
  if (tight?.kind === "diagram")
    expect(tight.lines.length).toBeLessThan(loose.lines.length);
  expect(zoomOf(keys(s, "0"))).toMatchObject({ spacing: "loose", col: 0 });
});

test("the zoom float is 90% of the terminal, at least 60×12, within it", () => {
  const t = { cols: 200, rows: 50, color: "color" } as const;
  expect(zoomSize(t)).toEqual({ w: 180, h: 45 });
  expect(zoomSize({ ...t, cols: 64, rows: 20 })).toEqual({ w: 60, h: 18 });
  expect(zoomSize({ ...t, cols: 40, rows: 10 })).toEqual({ w: 40, h: 8 });
});

test("a measured fill stops panning on an axis the image does not outgrow", () => {
  const open = keys(note(), "2j<leader>z++++");
  const fill = (s: AppState, x: number, y: number) =>
    update(s, { type: "zoomFill", path: "a.png", fill: { x, y } }).state;
  // A wide image fills the float's width but only half its height: at 2×
  // the view shows half its width and all its height.
  let s = fill(keys(open, "jj"), 1, 0.5);
  expect(zoomOf(s)).toMatchObject({
    level: 2,
    cy: 0.5,
    fill: { x: 1, y: 0.5 },
  });
  expect(zoomPans(s)).toEqual({ x: true, y: false });
  expect(zoomOf(keys(s, "j"))).toMatchObject({ cy: 0.5 });
  expect(zoomOf(keys(s, "l"))).toMatchObject({ cx: 0.625 });
  s = keys(s, "++++");
  expect(zoomPans(s)).toEqual({ x: true, y: true });
  // At 3× the view shows 2/3 of the height: a step is 1/6, and the centre stops at 2/3.
  const down = zoomOf(keys(s, "jj"));
  expect(down?.kind === "image" ? down.cy : 0).toBeCloseTo(2 / 3);
  // A fill for another image, or the same fill again, changes nothing.
  expect(
    update(s, { type: "zoomFill", path: "b.png", fill: { x: 1, y: 1 } }).state,
  ).toBe(s);
  expect(fill(s, 1, 0.5)).toBe(s);
});

test("a drag from a press in the float moves the view with the pointer", () => {
  const open = keys(note(), "2j<leader>z++++");
  let s = update(open, {
    type: "zoomFill",
    path: "a.png",
    fill: { x: 1, y: 0.5 },
  }).state;
  // At 2× the float spans half the image's width: dragging a quarter of the
  // float to the left moves the centre an eighth of the image to the right.
  s = grabZoom(s, { fx: 0.5, fy: 0.5 }).state;
  s = dragZoom(s, { fx: 0.25, fy: 0.9 }).state;
  expect(zoomOf(s)).toMatchObject({ cx: 0.625, cy: 0.5 });
  // Far past the edge, the view stops at the image's edge.
  s = dragZoom(s, { fx: -5, fy: 0.5 }).state;
  expect(zoomOf(s)).toMatchObject({ cx: 0.75 });
  // Without a press there is nothing to drag from.
  expect(dragZoom(open, { fx: 0, fy: 0 }).state).toBe(open);
});

test("a drag scrolls a text diagram by the cells it covers", () => {
  const flow = Array.from({ length: 14 }, (_, i) => `Step${i}`).join(" --> ");
  let s = update(imagesOff(freshDefaults()), {
    type: "fileLoaded",
    path: "w.md",
    file: textFile(`\`\`\`mermaid\nflowchart LR\n  ${flow}\n\`\`\`\n`),
  }).state;
  s = keys(s, "j<leader>z");
  const { w } = zoomSize(s.terminal);
  s = grabZoom(s, { fx: 0.5, fy: 0.5 }).state;
  s = dragZoom(s, { fx: 0.5 - 10 / (w - 2), fy: 0.5 }).state;
  expect(zoomOf(s)).toMatchObject({ col: 10, row: 0 });
});
