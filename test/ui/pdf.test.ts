import { afterEach, expect, spyOn, test } from "bun:test";
import { readFileSync } from "node:fs";
import { NativeImage, OptimizedBuffer } from "@opentui/core";
import { createTerminalCapabilities } from "@opentui/core/testing";
import { pdfWindow } from "../../src/core/state/pdf";
import type { Action, PdfInfoResult } from "../../src/core/state/types";
import { recolor } from "../../src/ui/editors/pdf-view";
import { themeOf } from "../../src/ui/theme";
import { stamp } from "../support/state";
import { type Mounted, type MountOptions, mountShell } from "../support/ui";

let m: Mounted | undefined;
afterEach(() => {
  m?.destroy();
  m = undefined;
});

/** A 200×300 page, as pdftoppm draws one. */
const PAGE = new Uint8Array(
  readFileSync(new URL("../fixtures/images/page.png", import.meta.url)),
);
const KITTY = {
  caps: createTerminalCapabilities({ kitty_graphics: true }),
  hasResolution: true,
};
const NO_GRAPHICS = { caps: null, hasResolution: false };
const BLOCK_GLYPH = /[▀▄█▌▐▖▗▘▙▚▛▜▝▞▟]/;

/** Mount with a two-page `docs/paper.pdf` open and its page count answered. */
async function openPaper(
  o: Partial<MountOptions> = {},
  result: PdfInfoResult = { kind: "ok", pages: 2 },
): Promise<Mounted> {
  const x = await mountShell({
    cols: 80,
    rows: 30,
    capabilities: NO_GRAPHICS,
    files: { "docs/paper.pdf#page=1": PAGE, "docs/paper.pdf#page=2": PAGE },
    ...o,
  });
  x.keys("<leader>e");
  x.open("docs/paper.pdf", "");
  x.store.dispatch({
    type: "pdfInfo",
    path: "docs/paper.pdf",
    stamp: stamp(1),
    result,
  });
  return x;
}

/** Render until the page has loaded and the view's layout reached the core. */
async function settled(x: Mounted): Promise<string> {
  await x.frame();
  await Bun.sleep(0);
  await x.frame();
  await Bun.sleep(0);
  return x.frame();
}

const page = (x: Mounted) => {
  const s = x.store.get();
  return pdfWindow(s, s.windows.active);
};

test("a PDF shows its page in the window with PDF and the page in the statusline", async () => {
  m = await openPaper();
  expect(await m.frame()).toContain("◌ paper.pdf · page 1/2");
  const frame = await settled(m);
  expect(
    frame.split("\n").filter((r) => BLOCK_GLYPH.test(r)).length,
  ).toBeGreaterThan(10);
  const status = await m.status();
  expect(status).toContain("PDF");
  expect(status).toContain(" 1/2 ");
  // The next page draws in the background once the first is up.
  expect(m.loads).toEqual(["docs/paper.pdf#page=1", "docs/paper.pdf#page=2"]);
  m.keys("J");
  expect(await m.frame()).not.toContain("◌ paper.pdf · page 2/2");
  expect(m.loads).toHaveLength(2);
});

test("a page taller than the window scrolls, then J and the wheel turn pages", async () => {
  m = await openPaper();
  await settled(m);
  const laid = page(m);
  expect(laid?.viewRows).toBeGreaterThan(0);
  expect(laid?.pageRows).toBeGreaterThan(laid?.viewRows ?? 0);
  m.keys("<C-d>");
  expect(page(m)?.scroll).toBeGreaterThan(0);
  m.keys("J");
  expect(page(m)).toMatchObject({ page: 2, scroll: 0 });
  await settled(m);
  expect(m.loads).toContain("docs/paper.pdf#page=2");
  expect(await m.status()).toContain(" 2/2 ");
  m.keys("a");
  await settled(m);
  await m.mouse.scroll(40, 10, "up");
  expect(page(m)).toMatchObject({ page: 1, fit: "page" });
});

test("fit page draws the whole page centred, with the terminal's protocol", async () => {
  const draw = spyOn(OptimizedBuffer.prototype, "drawImage");
  try {
    m = await openPaper({ capabilities: KITTY });
    m.keys("a");
    await settled(m);
    draw.mockClear();
    await m.frame();
    expect(draw).toHaveBeenCalledTimes(1);
    const [, x, , cols, rows, , , , srcY, , srcH, tier] =
      draw.mock.calls[0] ?? [];
    expect(tier).toBe("kitty");
    expect(cols).toBeLessThan(80);
    expect(x).toBeGreaterThan(0);
    expect(rows).toBe(page(m)?.viewRows);
    expect(srcY).toBe(0);
    expect(srcH).toBe(300);
  } finally {
    draw.mockRestore();
  }
});

test("without Poppler the window says how to install it and how to open the PDF", async () => {
  m = await openPaper({}, { kind: "missing" });
  const frame = await m.frame();
  expect(frame).toContain("PDF view needs Poppler");
  expect(frame).toContain("brew install poppler");
  expect(frame).toContain(":Open");
});

test("with images off the window names the page instead", async () => {
  m = await openPaper({ config: '[preview]\nimages = "off"\n' });
  expect(await settled(m)).toContain("[pdf: paper.pdf · page 1/2]");
  expect(m.loads).toEqual([]);
});

test("a note embedding a PDF page draws that page in live and reading views", async () => {
  m = await mountShell({
    cols: 80,
    rows: 30,
    capabilities: NO_GRAPHICS,
    files: { "docs/paper.pdf#page=2": PAGE },
  });
  m.store.dispatch({
    type: "indexBatch",
    summaries: [],
    files: ["notes/read.md", "docs/paper.pdf"],
    done: 0,
    total: 0,
  });
  m.keys("<leader>e");
  m.open("notes/read.md", "# Reading\n\n![[paper.pdf#page=2]]\n\nAfter\n");
  m.keys("G");
  m.keys("gg");
  const live = await settled(m);
  expect(m.loads).toEqual(["docs/paper.pdf#page=2"]);
  expect(
    live.split("\n").filter((r) => BLOCK_GLYPH.test(r)).length,
  ).toBeGreaterThan(5);
  expect(live).not.toContain("![[paper.pdf");
  m.keys("<leader>m");
  m.keys("<leader>m");
  const s = m.store.get();
  expect(
    s.buffers[s.windows.byId[s.windows.active]?.content.bufferId ?? -1]?.view,
  ).toBe("reading");
  const reading = await settled(m);
  expect(reading).toContain("After");
  expect(
    reading.split("\n").filter((r) => BLOCK_GLYPH.test(r)).length,
  ).toBeGreaterThan(5);
});

test("a PDF embed that does not resolve names the page", async () => {
  m = await mountShell({ cols: 80, rows: 30, capabilities: NO_GRAPHICS });
  m.keys("<leader>e");
  m.open("notes/read.md", "# Reading\n\n![[gone.pdf#page=4]]\n\nAfter\n");
  m.keys("G");
  m.keys("gg");
  expect(await settled(m)).toContain("[pdf: gone.pdf · p. 4]");
});

test("recolouring maps white paper and black ink to the given colours", () => {
  const px = new Uint8Array([
    255, 255, 255, 255, 0, 0, 0, 128, 128, 128, 128, 255,
  ]);
  recolor(px, [26, 27, 38], [192, 202, 245]);
  expect([...px]).toEqual([
    26, 27, 38, 255, 192, 202, 245, 128, 109, 114, 141, 255,
  ]);
});

/** The top-left pixel of the image the PDF view draws last. */
async function corner(x: Mounted): Promise<number[]> {
  const draw = spyOn(OptimizedBuffer.prototype, "drawImage");
  try {
    await x.frame();
    const image = draw.mock.calls.at(-1)?.[0] as NativeImage | undefined;
    if (image === undefined) return [];
    const px = new Uint8Array(image.width * image.height * 4);
    image.copyTo(px, { format: "rgba8", stride: image.width * 4 });
    return [...px.slice(0, 3)];
  } finally {
    draw.mockRestore();
  }
}

test("<leader>pi draws the page in the theme's colours and back", async () => {
  m = await openPaper({ capabilities: KITTY });
  await settled(m);
  const light = await corner(m);
  m.keys("<leader>pi");
  await settled(m);
  const { fg, bg } = themeOf(m.store.get()).style("text");
  const want = new Uint8Array([...light, 255]);
  const rgb = (c: typeof fg) => {
    const [r, g, b] = c.toInts();
    return [r, g, b] as const;
  };
  recolor(want, rgb(bg), rgb(fg));
  expect(light).toHaveLength(3);
  expect(await corner(m)).toEqual([...want.slice(0, 3)]);
  m.keys("<leader>pi");
  await settled(m);
  expect(await corner(m)).toEqual(light);
});

test("/ in a PDF window opens the search line", async () => {
  m = await openPaper();
  m.keys("/atten");
  const frame = await m.frame();
  expect(frame).toContain("Search");
  expect(frame).toContain("/atten");
});

/** The `drawImage` arguments of the PDF view's next frame. */
async function drawn(x: Mounted) {
  const draw = spyOn(OptimizedBuffer.prototype, "drawImage");
  try {
    await x.frame();
    const [, , , cols, , , , srcX, , srcW] = draw.mock.calls.at(-1) ?? [];
    return { cols, srcX, srcW };
  } finally {
    draw.mockRestore();
  }
}

test("<leader>pz zooms the page in its own window, and l pans across it", async () => {
  m = await openPaper({ capabilities: KITTY });
  await settled(m);
  expect(await drawn(m)).toEqual({ cols: 80, srcX: 0, srcW: 200 });
  m.keys("<leader>pz");
  await settled(m);
  expect(m.store.get().overlay.kind).toBe("none");
  const zoomed = await drawn(m);
  expect(zoomed).toMatchObject({ cols: 80, srcW: 100 });
  expect(zoomed.srcX).toBe(50);
  expect(await m.status()).toContain("1/2 200%");
  m.keys("l");
  expect(((await drawn(m)).srcX as number) > 50).toBe(true);
  m.keys("0");
  await settled(m);
  expect(await drawn(m)).toEqual({ cols: 80, srcX: 0, srcW: 200 });
});

test("zoomed out, the page draws narrower than the window, centred across", async () => {
  m = await openPaper({ capabilities: KITTY });
  await settled(m);
  const full = await drawnAt(m);
  m.keys("-");
  await settled(m);
  expect(await drawn(m)).toEqual({ cols: 64, srcX: 0, srcW: 200 });
  expect(await drawnAt(m)).toBe(full + 8);
  expect(await m.status()).toContain("1/2 80%");
});

/** The column the PDF view's next frame draws the page from. */
async function drawnAt(x: Mounted): Promise<number> {
  const draw = spyOn(OptimizedBuffer.prototype, "drawImage");
  try {
    await x.frame();
    return draw.mock.calls.at(-1)?.[1] as number;
  } finally {
    draw.mockRestore();
  }
}

test("with kitty the page and the next one are PNG-encoded ahead of sending", async () => {
  const encode = spyOn(NativeImage.prototype, "ensureEncodedPng");
  try {
    m = await openPaper({ capabilities: KITTY });
    await settled(m);
    const encoded = () => new Set(encode.mock.contexts).size;
    expect(encoded()).toBe(1);
    for (let i = 0; i < 100 && encoded() < 2; i++) await Bun.sleep(10);
    expect(encoded()).toBe(2);
    m.keys("J");
    await settled(m);
    expect(encoded()).toBe(2);
  } finally {
    encode.mockRestore();
  }
});

/** One line of words across the top 30 points of the 200×300 page. */
const TOP_LINE: Action = {
  type: "pdfLayout",
  path: "docs/paper.pdf",
  stamp: stamp(1),
  page: 1,
  result: {
    kind: "ok",
    layout: {
      width: 200,
      height: 300,
      lines: [
        [
          { text: "top", x0: 0, y0: 0, x1: 90, y1: 30 },
          { text: "line", x0: 110, y0: 0, x1: 200, y1: 30 },
        ],
      ],
    },
  },
};

test("a drag on the page selects its characters, tinted in place until Esc", async () => {
  m = await openPaper({ capabilities: KITTY });
  await settled(m);
  const light = await corner(m);
  m.store.dispatch(TOP_LINE);
  await m.mouse.drag(2, 2, 60, 2);
  const sel = page(m)?.select;
  expect(sel?.page).toBe(1);
  expect(sel?.anchor.x).toBeLessThan(sel?.head.x ?? 0);
  expect(sel?.head.x).toBeLessThanOrEqual(1);
  // Letting go floated the actions; Esc puts them away and keeps the selection.
  m.keys("<Esc>");
  expect(page(m)?.select).toBeDefined();
  await settled(m);
  const tinted = await corner(m);
  expect(tinted).not.toEqual(light);
  // The whole page draws first, four times so a float can open over it
  // without sending it again; the rows of cells under the selection follow
  // over it as tinted blocks of at most four rows each.
  const draw = spyOn(OptimizedBuffer.prototype, "drawImage");
  try {
    await m.frame();
    const slots = draw.mock.calls.slice(0, 4);
    const blocks = draw.mock.calls.slice(4);
    const [whole] = slots;
    expect(slots.every((c) => c[0] === whole?.[0] && c[4] === whole?.[4])).toBe(
      true,
    );
    expect(blocks.length).toBeGreaterThan(0);
    expect(whole?.[4]).toBe(page(m)?.viewRows);
    const image = whole?.[0] as NativeImage;
    for (const b of blocks) {
      expect(b[4]).toBeLessThanOrEqual(4);
      expect((b[0] as NativeImage).width).toBe(image.width);
      expect((b[0] as NativeImage).height).toBeLessThan(image.height / 4);
    }
  } finally {
    draw.mockRestore();
  }
  m.keys("y");
  // The drag ends inside "line", between its i and n.
  expect(m.store.get().vim.registers.get('"')?.text).toBe("top li");
  m.keys("<Esc>");
  await settled(m);
  expect(await corner(m)).toEqual(light);
});

test("a press beside a fit-page page is off the page and ends the selection", async () => {
  m = await openPaper({ capabilities: KITTY });
  m.keys("a");
  await settled(m);
  m.store.dispatch(TOP_LINE);
  await m.mouse.click(40, 5);
  expect(page(m)?.select).toBeDefined();
  await m.mouse.click(1, 5);
  expect(page(m)?.select).toBeUndefined();
});

test("a press on a zoomed, panned page lands on the part of the page shown", async () => {
  m = await openPaper({ capabilities: KITTY });
  await settled(m);
  m.keys("<leader>pz");
  await settled(m);
  // 2× shows the middle half of the page's width: columns 0..79 are x 0.25..0.75.
  await m.mouse.click(0, 5);
  expect(page(m)?.select?.anchor.x).toBeCloseTo(0.25 + 0.5 / 160, 5);
  await m.mouse.click(79, 5);
  expect(page(m)?.select?.anchor.x).toBeCloseTo(0.75 - 0.5 / 160, 5);
});

/** The float's frame on screen: the box around the row showing `text`. */
function floatAt(screen: string, text: string) {
  const lines = screen.split("\n").map((l) => [...l]);
  const y = lines.findIndex((l) => l.join("").includes(text));
  const row = lines[y] ?? [];
  const at = row.join("").indexOf(text);
  const left = row.slice(0, at).lastIndexOf("│");
  const right = row.indexOf("│", at);
  let top = y;
  while (top > 0 && lines[top]?.[left] !== "╭") top--;
  let bottom = y;
  while (bottom < lines.length - 1 && lines[bottom]?.[left] !== "╰") bottom++;
  return {
    x: left,
    y: top,
    w: right - left + 1,
    h: bottom - top + 1,
    text: { x: at, y },
  };
}

test("letting go of a selection floats its actions below it, the page drawn around them", async () => {
  m = await openPaper({ capabilities: KITTY });
  await settled(m);
  const light = await corner(m);
  m.store.dispatch(TOP_LINE);
  m.store.dispatch({
    type: "annotationsRead",
    pdf: "docs/paper.pdf",
    text: null,
  });
  await m.mouse.drag(2, 2, 60, 2);
  expect(m.store.get().overlay.kind).toBe("pdfMenu");
  const screen = await settled(m);
  expect(screen).toContain("h Highlight  n Note  y Copy");
  const box = floatAt(screen, "h Highlight");
  expect(box.y).toBeGreaterThan(1);
  const draw = spyOn(OptimizedBuffer.prototype, "drawImage");
  try {
    await m.frame();
    expect(draw.mock.calls.length).toBeGreaterThan(1);
    for (const [, x, y, w, h] of draw.mock.calls)
      expect(
        x < box.x + box.w &&
          x + w > box.x &&
          y < box.y + box.h &&
          y + h > box.y,
      ).toBe(false);
  } finally {
    draw.mockRestore();
  }
  // A click on an action runs it: the selection becomes a highlight.
  await m.mouse.click(box.text.x + 2, box.text.y);
  const writes = m.effects.filter((e) => e.kind === "writeAnnotations");
  expect(writes).toHaveLength(1);
  expect(m.store.get().overlay.kind).toBe("none");
  expect(page(m)?.select).toBeUndefined();
  await settled(m);
  expect(await corner(m)).not.toEqual(light);
});

test("n asks for the note in a prompt the page is drawn around; Enter saves it", async () => {
  m = await openPaper({ capabilities: KITTY });
  await settled(m);
  m.store.dispatch(TOP_LINE);
  m.store.dispatch({
    type: "annotationsRead",
    pdf: "docs/paper.pdf",
    text: null,
  });
  await m.mouse.drag(2, 2, 60, 2);
  m.keys("n");
  const screen = await settled(m);
  expect(screen).toContain("Note on page 1");
  expect(screen).toContain("⏎ save · esc cancel");
  const box = floatAt(screen, "Note on page 1");
  const draw = spyOn(OptimizedBuffer.prototype, "drawImage");
  try {
    await m.frame();
    for (const [, x, y, w, h] of draw.mock.calls)
      expect(
        x < box.x + box.w &&
          x + w > box.x &&
          y < box.y + box.h &&
          y + h > box.y,
      ).toBe(false);
  } finally {
    draw.mockRestore();
  }
  m.keys("why?<CR>");
  const write = m.effects.filter((e) => e.kind === "writeAnnotations").at(-1);
  expect(
    write?.kind === "writeAnnotations" && JSON.parse(write.text).items,
  ).toEqual([expect.objectContaining({ kind: "note", note: "why?" })]);
  expect(m.store.get().overlay.kind).toBe("none");
});

test("with half-blocks the float draws over the page, which stays whole", async () => {
  m = await openPaper({
    capabilities: NO_GRAPHICS,
    config: '[preview]\nimages = "blocks"\n',
  });
  await settled(m);
  m.store.dispatch(TOP_LINE);
  m.store.dispatch({
    type: "annotationsRead",
    pdf: "docs/paper.pdf",
    text: null,
  });
  await m.mouse.drag(2, 2, 60, 2);
  const screen = await settled(m);
  expect(screen).toContain("h Highlight");
  const draw = spyOn(OptimizedBuffer.prototype, "drawImage");
  try {
    await m.frame();
    expect(draw.mock.calls[0]?.[4]).toBe(page(m)?.viewRows);
  } finally {
    draw.mockRestore();
  }
});

test("<leader>pa opens the highlights and notes over the page; the preview wraps the whole quote and note", async () => {
  m = await openPaper({ cols: 120 });
  await settled(m);
  const at = (y: number) => ({ x: 0.1, y });
  m.store.dispatch({
    type: "annotationsRead",
    pdf: "docs/paper.pdf",
    text: JSON.stringify({
      version: 1,
      file: "docs/paper.pdf",
      items: [
        {
          id: "n1",
          kind: "note",
          page: 2,
          anchor: at(0.2),
          head: at(0.2),
          quote: "Attention matters",
          note: "compare RNN with attention across many long sequences and report the end",
          created: "2026-10-12T08:00:00.000Z",
        },
        {
          id: "h1",
          kind: "highlight",
          page: 1,
          anchor: at(0.1),
          head: at(0.1),
          quote: "Hello brave",
          created: "2026-10-12T08:00:00.000Z",
        },
      ],
    }),
  });
  m.keys("<leader>pa<C-n>");
  const screen = await m.frame();
  expect(screen).toContain("Highlights and notes");
  expect(screen).toContain("▍ Hello brave");
  expect(screen).toContain("✎ Attention matters — compare RNN");
  expect(screen).toContain("Note · page 2");
  expect(screen).toContain("report the end");
  expect(screen).toContain("C-e note · C-y copy · C-x delete");
  m.keys("<CR>");
  await m.frame();
  expect(page(m)?.page).toBe(2);
  expect(m.store.get().overlay.kind).toBe("none");
});
