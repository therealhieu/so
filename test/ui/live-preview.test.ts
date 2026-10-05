import { afterEach, expect, spyOn, test } from "bun:test";
import { readFileSync } from "node:fs";
import { OptimizedBuffer } from "@opentui/core";
import { createTerminalCapabilities } from "@opentui/core/testing";
import { activeBuffer, activeWindow } from "../../src/core/state/buffers";
import { themes } from "../../src/ui/theme";
import { noteSummary, TASK_NOTES, TASKS_BASE } from "../support/bases";
import { SYNC_TS } from "../support/notes";
import { textFile } from "../support/state";
import {
  cellStyle,
  type Mounted,
  type MountOptions,
  mountShell,
} from "../support/ui";

let m: Mounted | undefined;
afterEach(() => {
  m?.destroy();
  m = undefined;
});

/** Close the explorer and open `path` in the active window. */
function openNote(x: Mounted, path: string, text: string) {
  x.keys("<leader>e");
  x.open(path, text);
}

const lines = (x: Mounted) => {
  const b = activeBuffer(x.store.get());
  return Array.from({ length: b?.text.lineCount ?? 0 }, (_, i) =>
    b?.text.line(i),
  );
};

test("reading view refuses edits with a hint and still moves", async () => {
  m = await mountShell({ cols: 100, rows: 30 });
  openNote(m, "notes/plan.md", "# Plan\n\nFirst **line**.\nSecond line.\n");
  m.keys("<leader>m<leader>m");
  expect(activeBuffer(m.store.get())?.view).toBe("reading");
  // A yank changes no text, so it works and gives `p` something to put.
  m.keys("yy");
  const before = lines(m);
  for (const seq of ["x", "i", "p", "dd"]) {
    m.keys(seq);
    expect(lines(m)).toEqual(before);
    expect(m.store.get().vim.mode).toBe("normal");
    expect(await m.row(-1)).toContain("reading mode — <leader>m to edit");
  }
  m.keys("j");
  expect(activeWindow(m.store.get())?.content.cursor.line).toBe(1);
});

const TOUR_MD = readFileSync(
  new URL("../fixtures/tour.md", import.meta.url),
  "utf8",
);
const ROADMAP_MD = `# So roadmap\n\n## Goals\n\n${Array.from(
  { length: 16 },
  (_, i) => `- Goal ${i + 1}`,
).join("\n")}\n\n## Later\n\nNothing yet.\n`;

/** The sign cell sits right of the line numbers: four digits and a space. */
const SIGN_X = 5;
const signOf = (row: string) => [...row][SIGN_X] ?? " ";

/** Rows of the editor window: below the bufferline, above the statusline and command line. */
async function windowRows(x: Mounted): Promise<string[]> {
  const rows = (await x.frame()).split("\n");
  return rows.slice(1, x.store.get().terminal.rows - 2);
}

/** Open the tour with its embedded roadmap and base loaded, and the base's task notes indexed. */
function openTour(x: Mounted) {
  x.store.dispatch({
    type: "indexBatch",
    summaries: Object.entries(TASK_NOTES).map(([p, t]) => noteSummary(p, t)),
    files: ["tour.md", "so-roadmap.md", "diagram.png", "tasks.base"],
    done: 0,
    total: 0,
  });
  openNote(x, "tour.md", TOUR_MD);
  x.store.dispatch({
    type: "fileLoaded",
    path: "so-roadmap.md",
    file: textFile(ROADMAP_MD),
  });
  x.store.dispatch({
    type: "fileLoaded",
    path: "tasks.base",
    file: textFile(TASKS_BASE),
    embed: true,
  });
}

for (const cols of [60, 100])
  test(`the tour at width ${cols} matches its golden, base embed included`, async () => {
    m = await mountShell({ cols, rows: 140 });
    openTour(m);
    expect(m.effects).toContainEqual({
      kind: "read",
      path: "tasks.base",
      embed: true,
    });
    await m.frame();
    // diagram.png is not among the mounted files: let its load fail first.
    await Bun.sleep(0);
    const rows = await windowRows(m);
    const title = rows.findIndex((r) => r.includes("╭ ↳ tasks.base#All tasks"));
    expect(title).toBeGreaterThan(-1);
    expect(rows[title + 1]).toContain("due ↑");
    // Every indexed file is a row of the unfiltered base, empty dues first.
    expect(rows.slice(title + 3, title + 13).join("\n")).toContain("review-pr");
    expect(rows.join("\n")).not.toContain("loading…");
    expect((await m.frame()).trimEnd()).toMatchSnapshot();
  });

test("a note frame paints signs, rules, embed rows, and folded callouts", async () => {
  m = await mountShell({ cols: 100, rows: 80 });
  openTour(m);
  // diagram.png is not among the mounted files: its load fails on the first frame.
  await m.frame();
  await Bun.sleep(0);
  expect(m.effects).toContainEqual({
    kind: "read",
    path: "so-roadmap.md",
    embed: true,
  });

  m.keys("24G");
  let rows = await windowRows(m);
  const revealed = rows.filter((r) => signOf(r) === "▕");
  expect(revealed).toHaveLength(1);
  expect(revealed[0]).toContain("## Quotes and callouts");

  const tip = rows.findIndex((r) => r.includes("Folded tip"));
  expect(rows[tip]).toContain("★ Folded tip (za to open) ▸");
  expect(rows[tip + 1]?.trim()).toMatch(/^\d*$/);
  expect(rows.join("\n")).not.toContain("start folded");

  const title = rows.findIndex((r) => r.includes("↳ so-roadmap#Goals"));
  expect(title).toBeGreaterThan(-1);
  const embed = rows.slice(title, title + 12);

  expect(embed.some((r) => r.includes("│ • Goal 1"))).toBe(true);
  expect(embed.at(-1)).toMatch(/╰ … \d+ more lines/);
  expect(rows.some((r) => r.includes("[image: diagram.png]"))).toBe(true);

  m.keys("G");
  rows = await windowRows(m);
  const rule = rows.find((r) => r.includes("─".repeat(20)));
  expect(rule?.slice(SIGN_X + 1).trimEnd()).toBe("─".repeat(100 - SIGN_X - 1));
});

test("code files paint raw lines and ignore note keys", async () => {
  m = await mountShell({ cols: 100, rows: 30 });
  openNote(m, "scripts/sync.ts", SYNC_TS);
  const raw = SYNC_TS.replace(/\n$/, "").split("\n");
  const rows = await windowRows(m);
  raw.forEach((line, i) => {
    expect((rows[i] ?? "").slice(SIGN_X + 1).trimEnd()).toBe(
      line.replace(/\t/g, " ".repeat(8)).trimEnd(),
    );
  });
  expect(rows.every((r) => signOf(r) === " ")).toBe(true);

  const before = m.store.get();
  m.keys("<leader>m");
  m.keys("2Gwgd");
  const after = m.store.get();
  expect(activeBuffer(after)?.view).toBe("source");
  expect(activeBuffer(after)?.text).toBe(activeBuffer(before)?.text);
  expect(activeBuffer(after)?.path).toBe("scripts/sync.ts");
  const at = activeWindow(after)?.content.cursor;
  m.keys("<CR>");
  expect(activeWindow(m.store.get())?.content.cursor.line).toBe(
    (at?.line ?? 0) + 1,
  );
  expect(activeBuffer(m.store.get())?.text).toBe(activeBuffer(before)?.text);
});

test("a missing embed paints its title in the unresolved link style", async () => {
  m = await mountShell({ cols: 100, rows: 30 });
  m.store.dispatch({
    type: "indexBatch",
    summaries: [],
    files: ["notes/hub.md", "notes/present.md", "notes/gone.md"],
    done: 0,
    total: 0,
  });
  openNote(
    m,
    "notes/hub.md",
    "# Hub\n\nSee [[nowhere]].\n\n![[present]]\n\n![[gone]]\n",
  );
  m.store.dispatch({
    type: "fileLoaded",
    path: "notes/present.md",
    file: textFile("# Present\n\nBody.\n"),
    embed: true,
  });
  m.store.dispatch({
    type: "fileRefused",
    path: "notes/gone.md",
    reason: "io",
    embed: true,
  });
  const lines = (await m.frame()).split("\n");
  const at = (text: string) => {
    const y = lines.findIndex((l) => l.includes(text));
    return { x: [...(lines[y] ?? "")].indexOf(text[0] ?? ""), y };
  };
  const missing = at("↳ gone");
  expect(missing.y).toBeGreaterThan(-1);
  const spans = m.t.captureSpans().lines;
  const style = (p: { x: number; y: number }) => cellStyle(spans, p.x, p.y);
  expect(style(missing)).toEqual(style(at("nowhere")));
  expect(style(missing)).not.toEqual(style(at("↳ present")));
  expect(lines.join("\n")).not.toContain("cannot read file");
});

const fixture = (name: string) =>
  new Uint8Array(
    readFileSync(new URL(`../fixtures/images/${name}`, import.meta.url)),
  );
/** 1920×960: wider than any test window, so it fills the window width. */
const PNG = fixture("wide.png");
/** 240×120: narrower than the window. */
const SMALL_PNG = fixture("diagram.png");
const IMAGE_NOTE = `# Diagram\n\n![[diagram.png]]\n\n${Array.from(
  { length: 40 },
  (_, i) => `Line ${i + 5}`,
).join("\n")}\n`;

const KITTY = {
  caps: createTerminalCapabilities({ kitty_graphics: true }),
  hasResolution: true,
};
const SIXEL = {
  caps: createTerminalCapabilities({ sixel: true }),
  hasResolution: true,
};
const NO_GRAPHICS = { caps: null, hasResolution: false };
const BLOCK_GLYPH = /[▀▄█▌▐▖▗▘▙▚▛▜▝▞▟]/;

/** Mount with `images/diagram.png` on disk, open a note that shows it, and let the image load. */
async function mountImageNote(
  o: Partial<MountOptions>,
  note = IMAGE_NOTE,
): Promise<Mounted> {
  const x = await mountShell({
    cols: 100,
    rows: 40,
    files: { "images/diagram.png": PNG },
    ...o,
  });
  x.store.dispatch({
    type: "indexBatch",
    summaries: [],
    files: ["notes/diagram.md", "notes/other.md", "images/diagram.png"],
    done: 0,
    total: 0,
  });
  openNote(x, "notes/diagram.md", note);
  x.keys("G");
  x.keys("gg");
  await x.frame();
  await Bun.sleep(0);
  await x.frame();
  return x;
}

test("images draw with the terminal's best protocol and fall back to blocks or a placeholder", async () => {
  const draw = spyOn(OptimizedBuffer.prototype, "drawImage");
  try {
    for (const [capabilities, protocol] of [
      [KITTY, "kitty"],
      [SIXEL, "sixel"],
    ] as const) {
      m = await mountImageNote({ capabilities });
      draw.mockClear();
      await m.frame();
      expect(draw).toHaveBeenCalledTimes(1);
      expect(draw.mock.calls[0]?.[11]).toBe(protocol);
      expect(m.loads).toEqual(["images/diagram.png"]);
      m.destroy();
    }

    m = await mountImageNote({ capabilities: NO_GRAPHICS });
    const rows = await windowRows(m);
    const image = rows.filter((r) => BLOCK_GLYPH.test(r));
    expect(image.length).toBeGreaterThan(10);
    expect(rows.join("\n")).not.toContain("diagram.png");
    m.destroy();

    draw.mockClear();
    m = await mountImageNote({
      capabilities: KITTY,
      config: '[preview]\nimages = "off"\n',
    });
    expect((await windowRows(m)).join("\n")).toContain("[image: diagram.png]");
    expect(m.loads).toEqual([]);
    expect(draw).not.toHaveBeenCalled();
  } finally {
    draw.mockRestore();
  }
});

test("an image shows a dimmed loading placeholder until its bytes arrive", async () => {
  const bytes = Promise.withResolvers<Uint8Array>();
  m = await mountShell({
    cols: 100,
    rows: 40,
    capabilities: KITTY,
    loadImage: () => bytes.promise,
  });
  m.store.dispatch({
    type: "indexBatch",
    summaries: [],
    files: ["notes/diagram.md", "images/diagram.png"],
    done: 0,
    total: 0,
  });
  openNote(m, "notes/diagram.md", IMAGE_NOTE);
  await m.frame();
  await Bun.sleep(0);
  const lines = (await m.frame()).split("\n");
  const y = lines.findIndex((l) => l.includes("◌ diagram.png"));
  expect(y).toBeGreaterThan(0);
  expect(m.loads).toEqual(["images/diagram.png"]);
  const s = themes.dark.style("imagePlaceholder");
  const x = [...(lines[y] ?? "")].indexOf("◌");
  expect(cellStyle(m.t.captureSpans().lines, x, y)).toEqual({
    fg: s.fg.toInts().join(","),
    bg: s.bg.toInts().join(","),
    attrs: s.attrs,
  });

  bytes.resolve(PNG);
  await Bun.sleep(0);
  expect(await m.frame()).not.toContain("◌");
});

test("an image is drawn only while it is on screen, so no placement outlives it", async () => {
  const draw = spyOn(OptimizedBuffer.prototype, "drawImage");
  try {
    // 20 lines above the image, so the window's bottom cuts its 24 rows.
    m = await mountImageNote(
      { capabilities: KITTY },
      `${Array.from({ length: 20 }, (_, i) => `Above ${i + 1}`).join("\n")}\n\n${IMAGE_NOTE}`,
    );
    const drawn = async () => {
      draw.mockClear();
      await m?.frame();
      return draw.mock.calls.length;
    };
    expect(await drawn()).toBe(1);
    const [, , y, , height, , , , , , sourceHeight] = draw.mock.calls[0] ?? [];
    expect(height).toBe(37 - ((y as number) - 1));
    expect(height).toBeLessThan(24);
    expect(sourceHeight).toBe(Math.round((960 * (height as number)) / 24));

    m.keys("G");
    expect(await drawn()).toBe(0);
    m.keys("gg");
    expect(await drawn()).toBe(1);

    m.keys("<leader>m");
    expect(activeBuffer(m.store.get())?.view).toBe("source");
    expect(await drawn()).toBe(0);
    expect((await windowRows(m)).join("\n")).toContain("![[diagram.png]]");
    m.keys("<leader>m<leader>m");
    expect(await drawn()).toBe(1);

    m.open("notes/other.md", "# Other\n\nPlain text.\n");
    expect(await drawn()).toBe(0);
    expect((await windowRows(m)).join("\n")).toContain("Plain text.");
  } finally {
    draw.mockRestore();
  }
});

test("an image narrower than the window keeps its natural size", async () => {
  const draw = spyOn(OptimizedBuffer.prototype, "drawImage");
  try {
    m = await mountImageNote({
      capabilities: KITTY,
      files: { "images/diagram.png": SMALL_PNG },
    });
    draw.mockClear();
    await m.frame();
    // 240×120 px in 8×16 px cells: 8 rows, about 30 of the window's 94 columns.
    const [, , , cols, rows] = draw.mock.calls[0] ?? [];
    expect(rows).toBe(8);
    expect(cols).toBeLessThanOrEqual(32);
  } finally {
    draw.mockRestore();
  }
});

test("the cursor stays on screen below a tall image", async () => {
  m = await mountImageNote({ cols: 120, rows: 24, capabilities: KITTY });
  const textRows = 24 - 3;
  // The image takes 80% of the window: its first row is numbered, the rest are blank.
  const blankGutter = (await windowRows(m)).filter((r) =>
    r.startsWith(" ".repeat(6)),
  );
  expect(blankGutter).toHaveLength(Math.floor(textRows * 0.8) - 1);
  for (let line = 0; line < 30; line++) {
    expect(activeWindow(m.store.get())?.content.cursor.line).toBe(line);
    const frame = (await m.frame()).split("\n");
    const c = m.t.renderer.getCursorState();
    const y = c.y - 1;
    expect(y).toBeGreaterThanOrEqual(1);
    expect(y).toBeLessThan(1 + textRows);
    expect(frame[y]?.slice(0, 4)).toBe(String(line + 1).padStart(4));
    m.keys("j");
  }
});
