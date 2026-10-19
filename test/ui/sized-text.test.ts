import { afterEach, expect, test } from "bun:test";
import { Writable } from "node:stream";
import { type OptimizedBuffer, Renderable, RGBA } from "@opentui/core";
import {
  createTerminalCapabilities,
  createTestRenderer,
} from "@opentui/core/testing";
import {
  fullRepaintFlag,
  SizedText,
  terminalWriter,
} from "../../src/ui/sized-text";
import { cellStyle, type Mounted, mountShell } from "../support/ui";

const COLS = 20;
const ROWS = 6;
const OSC66 = "\x1b]66;";
/** The heading's old 6×2 area at the top left, erased row by row. */
const ERASE_TOP = "\x1b7\x1b[1;1H\x1b[6X\x1b[2;1H\x1b[6X\x1b8";
/** Where OpenTUI's own frame begins. */
const FRAME_START = "\x1b[?2026h\x1b[?25l";
const FG = RGBA.fromInts(255, 255, 255, 255);
const BG = RGBA.fromInts(20, 30, 60, 255);

const opened: { destroy(): void }[] = [];
afterEach(() => {
  for (const o of opened.splice(0)) o.destroy();
});

/** A heading's normal-size cells, 6×2 from row `y`, sent sized as `bytes`. */
class Heading extends Renderable {
  y0 = 0;
  text = "Raft";
  bytes = `${OSC66}s=2;Raft\x1b\\`;
  constructor(
    ctx: ConstructorParameters<typeof Renderable>[0],
    private readonly sized: SizedText,
  ) {
    super(ctx, { position: "absolute", left: 0, top: 0, width: COLS });
  }
  protected renderSelf(buf: OptimizedBuffer): void {
    buf.drawText(this.text.padEnd(6), 0, this.y0, FG, BG);
    buf.drawText(" ".repeat(6), 0, this.y0 + 1, FG, BG);
    this.sized.draw(buf, [{ x: 0, y: this.y0, w: 6, h: 2 }], this.bytes);
  }
}

/** Cells painted over everything before it, at row `y`, while `shown`. */
class Float extends Renderable {
  shown = false;
  y0 = 1;
  protected renderSelf(buf: OptimizedBuffer): void {
    if (this.shown) buf.drawText("+++", 0, this.y0, FG, FG);
  }
}

/** The writer on a test renderer whose terminal output is kept. */
async function mount() {
  let out = "";
  const stdout = Object.assign(
    new Writable({
      write(chunk, _encoding, done) {
        out += Buffer.from(chunk).toString();
        done();
      },
    }),
    { isTTY: true, columns: COLS, rows: ROWS, getColorDepth: () => 24 },
  ) as unknown as NodeJS.WriteStream;
  const t = await createTestRenderer({
    width: COLS,
    height: ROWS,
    stdout,
    bufferedOutput: "stream" as never,
  });
  opened.push(t.renderer);
  const sized = new SizedText(t.renderer);
  const heading = new Heading(t.renderer, sized);
  const float = new Float(t.renderer, { position: "absolute" });
  t.renderer.root.add(heading);
  t.renderer.root.add(float);
  /** Render one frame; what the terminal was sent and how many cells OpenTUI wrote. */
  const frame = async () => {
    out = "";
    await t.renderOnce();
    await Bun.sleep(5);
    return { out, cells: t.renderer.getNativeStats().cellsUpdated };
  };
  return { t, sized, heading, float, frame };
}

test("a sized draw goes out once after the frame, and not again while nothing changes", async () => {
  const m = await mount();
  const first = await m.frame();
  const at = first.out.indexOf(OSC66);
  expect(at).toBeGreaterThan(first.out.indexOf("Raft"));
  expect(first.out.slice(at - "\x1b[?2026h\x1b7".length)).toStartWith(
    `\x1b[?2026h\x1b7${OSC66}s=2;Raft`,
  );
  expect((await m.frame()).out).not.toContain(OSC66);
  expect(typeof terminalWriter(m.t.renderer)).toBe("function");
});

test("a draw goes out again once it moves, its cells change, or the screen is redrawn", async () => {
  const m = await mount();
  await m.frame();
  m.heading.y0 = 2;
  m.heading.bytes = `\x1b[3;1H${OSC66}s=2;Raft\x1b\\`;
  expect((await m.frame()).out).toContain(m.heading.bytes);
  // Same bytes, but a cell under it changes: OpenTUI rewrites it, so it goes again.
  m.heading.text = "Rafts";
  const changed = await m.frame();
  expect(changed.cells).toBe(12);
  expect(changed.out).toContain(m.heading.bytes);
  expect((await m.frame()).out).not.toContain(OSC66);
  m.t.resize(COLS + 2, ROWS);
  m.sized.invalidate();
  expect((await m.frame()).out).toContain(m.heading.bytes);
  expect((await m.frame()).out).not.toContain(OSC66);
});

test("an area that held a draw is erased row by row before OpenTUI writes the frame", async () => {
  const m = await mount();
  expect((await m.frame()).out).not.toContain("[6X");
  m.heading.y0 = 2;
  m.heading.bytes = `\x1b[3;1H${OSC66}s=2;Raft\x1b\\`;
  const moved = (await m.frame()).out;
  expect(moved).toStartWith(ERASE_TOP);
  expect(moved.indexOf(FRAME_START)).toBeGreaterThan(0);
  expect(moved.indexOf(OSC66)).toBeGreaterThan(moved.indexOf(FRAME_START));
  // Unchanged: nothing erased, nothing sent.
  expect((await m.frame()).out).not.toContain("[6X");
});

test("a full repaint OpenTUI forces on its own erases and sends the draw again", async () => {
  const m = await mount();
  await m.frame();
  expect(fullRepaintFlag(m.t.renderer)()).toBe(false);
  // A late capability reply (DA1) makes OpenTUI repaint every cell.
  m.t.mockInput.pressKey("\x1b[?62;22c");
  expect(fullRepaintFlag(m.t.renderer)()).toBe(true);
  const repainted = await m.frame();
  expect(repainted.cells).toBe(COLS * ROWS);
  expect(repainted.out).toStartWith(ERASE_TOP);
  expect(repainted.out).toContain(`${OSC66}s=2;Raft`);
  expect((await m.frame()).out).not.toContain(OSC66);
});

test("a float over the second row stops the draw and has its whole area rewritten", async () => {
  const m = await mount();
  await m.frame();
  m.float.shown = true;
  const covered = await m.frame();
  expect(covered.out).not.toContain(OSC66);
  expect(covered.out).toStartWith(ERASE_TOP);
  // Three float cells changed; the other nine of the 6×2 area are rewritten too.
  expect(covered.cells).toBe(12);
  expect((await m.frame()).out).not.toContain(OSC66);
  m.float.shown = false;
  const back = await m.frame();
  expect(back.out).toContain(`${OSC66}s=2;Raft`);
  expect(back.cells).toBe(12);
});

const SIZED = {
  caps: createTerminalCapabilities({ scaled_text: true }),
  hasResolution: false,
};
const NOTE = "# Raft\n\nTerm $Q_{w}$ ends.\n\nEnd.\n";

const shells: Mounted[] = [];
afterEach(() => {
  for (const x of shells.splice(0)) x.destroy();
});

/** The shell on a terminal that sizes text, with `text` open as a note. */
async function mountNote(
  text: string,
  rows = 12,
  config?: string,
): Promise<Mounted> {
  const x = await mountShell({
    cols: 60,
    rows,
    capabilities: SIZED,
    ...(config === undefined ? {} : { config }),
  });
  shells.push(x);
  x.keys("<leader>e");
  x.open("notes/raft.md", text);
  x.keys("G");
  await x.frame();
  return x;
}

/** What the shell sent the terminal outside the renderer during one more frame. */
async function sent(x: Mounted): Promise<string> {
  x.writes.length = 0;
  await x.frame();
  return x.writes.join("");
}

test("a note's heading and script cells are sent at their size over cells the window reserves", async () => {
  const m = await mountNote(NOTE);
  const out = m.writes.join("");
  const frame = m.t.captureCharFrame();
  expect(out).toContain(`${OSC66}s=2:w=4:n=7:d=8:v=2;Raft\x1b\\`);
  expect(out).toContain(`${OSC66}n=1:d=2:v=1:w=1;w\x1b\\`);
  const rows = frame.split("\n");
  const at = rows.findIndex((r) => r.includes("Raft"));
  expect(at).toBeGreaterThanOrEqual(0);
  expect(rows[at]).not.toContain("█");
  expect(rows[at + 1]?.trim()).toBe("");
  // No heading band: the heading sits on the paragraph's background.
  const spans = m.t.captureSpans().lines;
  const x = [...(rows[at] ?? "")].indexOf("R");
  const term = rows.findIndex((r) => r.includes("Term"));
  const plain = cellStyle(spans, [...(rows[term] ?? "")].indexOf("T"), term);
  expect(cellStyle(spans, x, at)?.bg).toEqual(plain?.bg);
  expect(cellStyle(spans, x + 6, at + 1)?.bg).toEqual(plain?.bg);
  expect(await sent(m)).toBe("");
});

test("a heading cut at the window bottom keeps its normal-size text and is not sent", async () => {
  const m = await mountNote(`${"line\n".repeat(30)}# Raft\n`);
  m.keys("Gk");
  const out = await sent(m);
  expect(await m.frame()).toContain("Raft");
  expect(out).not.toContain(`${OSC66}s=2`);
});

test("a resize or a resume from a tool hand-off sends the sized text again", async () => {
  const m = await mountNote(NOTE);
  await sent(m);
  m.t.resize(64, 12);
  expect(await sent(m)).toContain(`${OSC66}s=2:w=4:n=7:d=8:v=2;Raft`);
  expect(await sent(m)).toBe("");
  m.shell.suspend();
  m.shell.resume();
  expect(await sent(m)).toContain(`${OSC66}s=2:w=4:n=7:d=8:v=2;Raft`);
});

const ZOOMED = "# Raft\n\nSee [[ideas]] now.\n\n```\ncode\n```\n";
const ZOOM_2 = "[preview]\nzoom = 2\n";

test("with text zoom, prose and headings are sent larger and code stays at its size", async () => {
  const m = await mountNote(ZOOMED, 16, ZOOM_2);
  const out = m.writes.join("");
  expect(out).toContain(`${OSC66}s=2;See\x1b\\`);
  expect(out).toContain(`${OSC66}s=2;ideas\x1b\\`);
  // H1 keeps its 1.75× of the body: 3.5×, 7/8 of four-row cells.
  expect(out).toContain(`${OSC66}s=4:w=4:n=7:d=8:v=2;Raft\x1b\\`);
  expect(out).not.toContain(";code");
  const rows = (await m.frame()).split("\n");
  const at = rows.findIndex((r) => r.includes("S e e"));
  // Each character sits on the first of its double cells, a blank row below.
  expect(rows[at]).toContain("S e e   i d e a s   n o w .");
  expect(rows[at + 1]?.trim()).toBe("");
  expect(rows.some((r) => r.includes("code"))).toBe(true);
});

test("at a fractional zoom each word is sent on its own over cells that hold its text", async () => {
  const m = await mountNote(ZOOMED, 16, "[preview]\nzoom = 1.5\n");
  const out = m.writes.join("");
  // "See" takes 4.5 columns in three 2×2 cells; "now." fills its three.
  expect(out).toContain(`${OSC66}s=2:w=3:n=3:d=4:v=2;See\x1b\\`);
  expect(out).toContain(`${OSC66}s=2:w=3:n=3:d=4:v=2;now.\x1b\\`);
  const rows = (await m.frame()).split("\n");
  const at = rows.findIndex((r) => r.includes("Se e"));
  // Each character sits where its sized glyph starts, a blank row below.
  expect(rows[at]).toContain("Se e  id ea s  no w.");
  expect(rows[at + 1]?.trim()).toBe("");
});

test("a click on zoomed text places the cursor on the character drawn there", async () => {
  const m = await mountNote(ZOOMED, 16, ZOOM_2);
  const rows = (await m.frame()).split("\n");
  const y = rows.findIndex((r) => r.includes("n o w ."));
  const x = [...(rows[y] ?? "")].indexOf("n");
  const cursor = () => {
    const w = m.store.get().windows;
    return w.byId[w.active]?.content.cursor;
  };
  // The second double cell of "now." draws its "o".
  await m.mouse.click(x + 2, y);
  expect(cursor()).toEqual({ line: 2, col: 15 });
  // The lower row of a double cell maps to its character too.
  await m.mouse.click(x + 5, y + 1);
  expect(cursor()).toEqual({ line: 2, col: 16 });
  // The terminal cursor sits on the top row of the character's double cell.
  m.keys("h");
  await m.frame();
  expect(m.t.renderer.getCursorState()).toMatchObject({ x: x + 3, y: y + 1 });
});

test("<leader>u= and <leader>u- step the text zoom, which redraws the note's prose at its size", async () => {
  const m = await mountNote(ZOOMED, 16, '[preview]\nmode = "reading"\n');
  expect(m.writes.join("")).not.toContain(";See\x1b");
  m.keys("<leader>u=");
  m.writes.length = 0;
  await m.frame();
  expect(m.store.get().config.preview.zoom).toBe(1.25);
  expect(m.writes.join("")).toContain(`${OSC66}s=2:w=2:n=5:d=8:v=2;See\x1b\\`);
  m.keys("<leader>u-");
  await m.frame();
  expect(m.store.get().config.preview.zoom).toBe(1);
});

test("text zoom does nothing on a terminal that cannot size text", async () => {
  const m = await mountShell({ cols: 60, rows: 12, config: ZOOM_2 });
  shells.push(m);
  m.keys("<leader>e");
  m.open("notes/raft.md", ZOOMED);
  expect(await m.frame()).toContain("See ideas now.");
  expect(m.writes.join("")).not.toContain(OSC66);
});
