import { afterEach, expect, test } from "bun:test";
import { Writable } from "node:stream";
import { type OptimizedBuffer, Renderable, RGBA } from "@opentui/core";
import { createTestRenderer } from "@opentui/core/testing";
import { SizedText, terminalWriter } from "../../src/ui/sized-text";

const COLS = 20;
const ROWS = 6;
const OSC66 = "\x1b]66;";
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

test("a float over the second row stops the draw and has its whole area rewritten", async () => {
  const m = await mount();
  await m.frame();
  m.float.shown = true;
  const covered = await m.frame();
  expect(covered.out).not.toContain(OSC66);
  // Three float cells changed; the other nine of the 6×2 area are rewritten too.
  expect(covered.cells).toBe(12);
  expect((await m.frame()).out).not.toContain(OSC66);
  m.float.shown = false;
  const back = await m.frame();
  expect(back.out).toContain(`${OSC66}s=2;Raft`);
  expect(back.cells).toBe(12);
});
