import {
  type CliRenderer,
  type OptimizedBuffer,
  type RGBA,
  TextAttributes,
} from "@opentui/core";
import type { SizedBlock, SizedChunk } from "../core/kernel/view/types";
import type { Style } from "./theme";

/**
 * Text drawn larger or smaller than one cell with kitty's text sizing
 * protocol (OSC 66), written after OpenTUI's frame over cells the views
 * reserve. https://sw.kovidgoyal.net/kitty/text-sizing-protocol/
 */

/** A box of screen cells. */
export type CellRect = { x: number; y: number; w: number; h: number };

const ESC = "\x1b";
const ST = `${ESC}\\`;

const cup = (x: number, y: number) => `${ESC}[${y + 1};${x + 1}H`;

const SGR_ATTRS: readonly [number, number][] = [
  [TextAttributes.BOLD, 1],
  [TextAttributes.DIM, 2],
  [TextAttributes.ITALIC, 3],
  [TextAttributes.UNDERLINE, 4],
  [TextAttributes.BLINK, 5],
  [TextAttributes.INVERSE, 7],
  [TextAttributes.HIDDEN, 8],
  [TextAttributes.STRIKETHROUGH, 9],
];

const colour = (c: RGBA, base: 38 | 48) => {
  if (c.intent === "default") return String(base + 1);
  const [r, g, b] = c.toInts();
  return `${base};2;${r};${g};${b}`;
};

/** SGR that sets exactly `s`: a reset, the attributes, then both colours. */
export function sgr(s: Style): string {
  const parts = ["0"];
  for (const [bit, code] of SGR_ATTRS)
    if ((s.attrs & bit) !== 0) parts.push(String(code));
  parts.push(colour(s.fg, 38), colour(s.bg, 48));
  return `${ESC}[${parts.join(";")}m`;
}

/** Note text never carries a control character into an escape. */
// biome-ignore lint/suspicious/noControlCharactersInRegex: control characters are what it removes
const CONTROL = /[\u0000-\u001f\u007f-\u009f]/g;
const clean = (text: string) => text.replace(CONTROL, " ");

const osc66 = (params: string, text: string) =>
  `${ESC}]66;${params};${text}${ST}`;

/**
 * One chunk drawn in `cells / 2` double cells at `n/d` of double size,
 * centred vertically.
 */
export function chunkBytes(
  chunk: SizedChunk,
  { n, d }: SizedBlock["scale"],
): string {
  return osc66(`s=2:w=${chunk.cells / 2}:n=${n}:d=${d}:v=2`, clean(chunk.text));
}

/** Each chunk of `block` in `style`, its rows from (x, y), two screen rows apart. */
export function blockBytes(
  block: SizedBlock,
  x: number,
  y: number,
  style: (chunk: SizedChunk) => Style,
): string {
  let out = "";
  block.rows.forEach((row, r) => {
    let at = x;
    for (const chunk of row) {
      out +=
        cup(at, y + 2 * r) + sgr(style(chunk)) + chunkBytes(chunk, block.scale);
      at += chunk.cells;
    }
  });
  return out;
}

/** One or two characters at half size in the cell (x, y), raised or lowered. */
export function scriptBytes(
  script: { text: string; place: "sup" | "sub" },
  x: number,
  y: number,
  style: Style,
): string {
  const v = script.place === "sup" ? 0 : 1;
  return (
    cup(x, y) + sgr(style) + osc66(`n=1:d=2:v=${v}:w=1`, clean(script.text))
  );
}

/**
 * `body` as one synchronized update that leaves the cursor and its
 * attributes as the frame left them.
 */
export const frameBytes = (body: string) =>
  `${ESC}[?2026h${ESC}7${body}${ESC}8${ESC}[?2026l`;

/**
 * Every row of `rects`, inside a `w`×`h` screen, erased with ECH. kitty
 * pushes text written into a sized block's lower row past the block unless
 * that row was erased first, even after the top row's write removed it.
 */
export function eraseBytes(
  rects: readonly CellRect[],
  w: number,
  h: number,
): string {
  let body = "";
  for (const r of rects) {
    const x0 = Math.max(0, r.x);
    const x1 = Math.min(w, r.x + r.w);
    if (x1 <= x0) continue;
    for (let y = Math.max(0, r.y); y < Math.min(h, r.y + r.h); y++)
      body += `${cup(x0, y)}${ESC}[${x1 - x0}X`;
  }
  return body === "" ? "" : `${ESC}7${body}${ESC}8`;
}

/** One registered draw: the cells it covers and what it sends. */
type Draw = { rects: readonly CellRect[]; bytes: string };

/**
 * What one frame does with the draws: which old areas to erase before
 * OpenTUI writes, which areas it must rewrite, and which draws to send.
 */
export type FramePlan = {
  send: readonly Draw[];
  erase: readonly CellRect[];
  rewrite: readonly CellRect[];
  /** The draws on screen once the frame is written. */
  shown: ReadonlyMap<string, readonly CellRect[]>;
};

/**
 * The frame's decisions, following kitty's overwrite rules: writing a
 * sized block's top-left cell erases it, another top-row cell blanks it,
 * and a lower-row cell pushes text right. So every area OpenTUI writes
 * into, and every area whose draw goes away, is rewritten whole; a draw is
 * sent again after OpenTUI wrote into its area, when it is new or moved,
 * or when the screen is `fresh` (a resize, resume, or full repaint). An
 * area that held a draw last frame and is rewritten now is erased first.
 */
export function planFrame(
  last: ReadonlyMap<string, readonly CellRect[]>,
  draws: readonly (Draw & { covered: boolean })[],
  touched: (rects: readonly CellRect[]) => boolean,
  fresh: boolean,
): FramePlan {
  const visible = draws.filter((d) => !d.covered);
  const shown = new Map(visible.map((d) => [d.bytes, d.rects]));
  const send = visible.filter(
    (d) => fresh || !last.has(d.bytes) || touched(d.rects),
  );
  const resent = new Set(send.map((d) => d.bytes));
  const erase: CellRect[] = [];
  for (const [bytes, rects] of last)
    if (!shown.has(bytes) || resent.has(bytes)) erase.push(...rects);
  const rewrite = [...erase, ...send.flatMap((d) => d.rects)];
  return { send, erase, rewrite, shown };
}

/** The cells of `rects` inside a `w`×`h` buffer, as indexes. */
function* cellsOf(
  rects: readonly CellRect[],
  w: number,
  h: number,
): Generator<number> {
  for (const r of rects)
    for (let y = Math.max(0, r.y); y < Math.min(h, r.y + r.h); y++)
      for (let x = Math.max(0, r.x); x < Math.min(w, r.x + r.w); x++)
        yield y * w + x;
}

type Cells = OptimizedBuffer["buffers"];

/** One cell's character, colours, and attributes. */
const cellOf = (b: Cells, i: number): number[] => [
  b.char[i] ?? 0,
  b.attributes[i] ?? 0,
  ...b.fg.subarray(4 * i, 4 * i + 4),
  ...b.bg.subarray(4 * i, 4 * i + 4),
];

const sameCell = (a: Cells, b: Cells, i: number) =>
  a.char[i] === b.char[i] &&
  a.attributes[i] === b.attributes[i] &&
  [0, 1, 2, 3].every(
    (k) =>
      a.fg[4 * i + k] === b.fg[4 * i + k] &&
      a.bg[4 * i + k] === b.bg[4 * i + k],
  );

/**
 * The renderer's terminal writer: bytes queued after the frame being
 * written, on its render thread where it has one. OpenTUI keeps it private.
 */
export function terminalWriter(r: CliRenderer): (bytes: string) => void {
  const writeOut = (r as unknown as { writeOut?: (chunk: string) => unknown })
    .writeOut;
  if (typeof writeOut !== "function")
    throw new Error("OpenTUI's renderer has no writeOut");
  return (bytes) => {
    writeOut.call(r, bytes);
  };
}

/**
 * Whether the renderer will repaint every cell this frame, which erases
 * all sized text. OpenTUI keeps the flag private.
 */
export function fullRepaintFlag(r: CliRenderer): () => boolean {
  const read = () =>
    (r as unknown as { forceFullRepaintRequested?: unknown })
      .forceFullRepaintRequested;
  if (typeof read() !== "boolean")
    throw new Error("OpenTUI's renderer has no forceFullRepaintRequested");
  return () => read() === true;
}

/**
 * The frame's sized text. Views `draw` while they render; a post-process
 * step then decides with `planFrame`, erases the old areas through the
 * renderer's writer (so the bytes land before the frame's), and marks the
 * areas OpenTUI must rewrite as changed in its current buffer; once the
 * frame is written the draws go out in one write after it. A draw whose
 * cells something painted over since is covered and not sent.
 */
export class SizedText {
  private draws: { rects: CellRect[]; bytes: string; painted: number[][] }[] =
    [];
  private last = new Map<string, readonly CellRect[]>();
  private pending: FramePlan | undefined;
  private fresh = false;
  private readonly write: (bytes: string) => void;
  private readonly repaintsAll: () => boolean;

  constructor(
    private readonly renderer: CliRenderer,
    write?: (bytes: string) => void,
  ) {
    this.write = write ?? terminalWriter(renderer);
    this.repaintsAll = fullRepaintFlag(renderer);
    renderer.addPostProcessFn(this.step);
    renderer.on("frame", this.flush);
  }

  /** Send `bytes` this frame over `rects`, which `buf` now holds as painted. */
  draw(buf: OptimizedBuffer, rects: CellRect[], bytes: string): void {
    const b = buf.buffers;
    const painted = [...cellsOf(rects, buf.width, buf.height)].map((i) =>
      cellOf(b, i),
    );
    this.draws.push({ rects, bytes, painted });
  }

  /** Send every draw again on the next frame: the terminal resized or was handed back. */
  invalidate(): void {
    this.fresh = true;
  }

  destroy(): void {
    this.renderer.removePostProcessFn(this.step);
    this.renderer.off("frame", this.flush);
  }

  private readonly step = (next: OptimizedBuffer): void => {
    const draws = this.draws;
    this.draws = [];
    this.pending = undefined;
    if (draws.length === 0 && this.last.size === 0) return;
    const cur = this.renderer.currentRenderBuffer;
    const { width: w, height: h } = next;
    const n = next.buffers;
    const c = cur.buffers;
    const sameSize = cur.width === w && cur.height === h;
    const plan = planFrame(
      this.last,
      draws.map((d) => {
        let k = 0;
        let covered = false;
        for (const i of cellsOf(d.rects, w, h)) {
          const was = d.painted[k++];
          const now = cellOf(n, i);
          if (was === undefined || was.some((v, j) => v !== now[j])) {
            covered = true;
            break;
          }
        }
        return { rects: d.rects, bytes: d.bytes, covered };
      }),
      (rects) => {
        if (!sameSize) return true;
        for (const i of cellsOf(rects, w, h))
          if (!sameCell(n, c, i)) return true;
        return false;
      },
      this.fresh || this.repaintsAll(),
    );
    const erase = eraseBytes(plan.erase, w, h);
    if (erase !== "") this.write(erase);
    if (sameSize)
      for (const i of cellsOf(plan.rewrite, w, h))
        c.fg[4 * i + 3] = (n.fg[4 * i + 3] ?? 0) ^ 0x8000;
    this.pending = plan;
  };

  private readonly flush = (): void => {
    const plan = this.pending;
    this.pending = undefined;
    if (plan === undefined) return;
    this.last = new Map(plan.shown);
    this.fresh = false;
    if (plan.send.length > 0)
      this.write(frameBytes(plan.send.map((d) => d.bytes).join("")));
  };
}
