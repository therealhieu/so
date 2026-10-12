import {
  NativeImage,
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
  type RGBA,
} from "@opentui/core";
import type { PdfWindowState } from "../../core/features/pdf/file-type";
import {
  type PdfPoint,
  type PdfWord,
  selectedWords,
} from "../../core/features/pdf/layout";
import { pageWidth } from "../../core/features/pdf/page";
import { pdfPages, pdfWindow } from "../../core/state/pdf";
import {
  menuAnnotation,
  shownAnnotations,
} from "../../core/state/pdf-annotate";
import { pdfLayoutOf } from "../../core/state/pdf-select";
import type {
  AppState,
  BufferState,
  MouseTarget,
  RgbaImage,
  WindowId,
  WindowSpot,
} from "../../core/state/types";
import { type ImageTier, imageTier } from "../images";
import { pdfMenuBox, pdfMenuContent } from "../overlays/pdf-menu";
import { promptBox } from "../overlays/prompt";
import type { Cursor, ViewDeps } from "../shell";
import { drawCells, themeOf } from "../theme";
import type { WindowView } from "./registry";
import type { Rect } from "./text-view";

/** How long after the next page arrives its PNG is encoded, so typing gets the frame first. */
const ENCODE_DELAY_MS = 100;

/** How much of the selection colour covers selected words. */
const MARK_ALPHA = 0.4;

/** Rows of cells in one tinted block; a drag re-encodes only the blocks it changes. */
const MARK_ROWS = 4;

/** Half-blocks draw two pixels per cell, so wider pages only cost memory. */
const BLOCKS_PX_PER_COL = 4;

/** Where `show` put the page this frame: a source slice into a cell box. */
type Placement = Piece & {
  tier: Exclude<ImageTier, "placeholder">;
};

/** One image drawn this frame: a source slice into a cell box. */
type Piece = {
  image: NativeImage;
  x: number;
  y: number;
  cols: number;
  rows: number;
  srcX: number;
  srcY: number;
  srcW: number;
  srcH: number;
};

const nameOf = (path: string) => path.slice(path.lastIndexOf("/") + 1);

/** The cache key of one page drawn at `width` from the file version `b.stamp`. */
const pageKey = (b: BufferState, page: number, width: number) =>
  `pdf:${b.path}@${b.stamp.mtimeMs}-${b.stamp.size}-${b.stamp.hash}#${page}@${width}`;

/**
 * A PDF window: one page at a time, fit to the window's width (scrolling a
 * taller page) or whole in the window. Lines of text stand in while a page
 * draws, when Poppler is missing, or when the PDF cannot be shown. The last
 * page drawn stays up while the same page redraws at a new width. Selected
 * text is tinted on copies of the rows of cells it covers, in blocks of
 * `MARK_ROWS` rows drawn over the page, so a drag re-encodes only the blocks
 * whose selection changed, whatever the selection's height.
 */
export class PdfView extends Renderable implements WindowView {
  private s: AppState | undefined;
  private windowId: WindowId = 0;
  private rect: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private lines: string[] = [];
  private placed: Placement | undefined;
  /** The page last drawn and its key, kept to stand in during a redraw. */
  private last: { page: string; key: string } | undefined;
  private encoding: ReturnType<typeof setTimeout> | undefined;
  /** Tinted blocks of the page, by the rows and selected words they show. */
  private marks = new Map<string, NativeImage>();
  /** What this frame draws: the page, or the page around a tinted strip. */
  private pieces: Piece[] = [];
  /** Where the PDF action float goes this frame, when it is about this window. */
  private menu: Rect | undefined;

  constructor(
    ctx: RenderContext,
    private readonly deps: ViewDeps,
  ) {
    super(ctx, { position: "absolute" });
  }

  show(s: AppState, id: WindowId, r: Rect, _split: boolean): void {
    this.s = s;
    this.windowId = id;
    this.rect = r;
    this.left = r.x;
    this.top = r.y;
    this.width = r.w;
    this.height = r.h;
    this.lines = [];
    this.placed = undefined;
    this.pieces = [];
    this.menu = undefined;
    const w = s.windows.byId[id];
    const b = w === undefined ? undefined : s.buffers[w.content.bufferId];
    const ws = pdfWindow(s, id);
    if (b === undefined || ws === undefined || r.h <= 0 || r.w <= 0) return;
    const name = nameOf(b.path);
    const pages = pdfPages(b);
    const of = pages === undefined ? "" : `/${pages}`;
    if (b.pdf?.status === "missing") {
      this.lines = [
        `PDF view needs Poppler: ${name} cannot be drawn here.`,
        "Install it (brew install poppler, or apt install poppler-utils),",
        "or run :Open to show it in the system viewer.",
      ];
      return;
    }
    if (b.pdf?.status === "failed") {
      this.lines = [`Cannot show ${name}: ${b.pdf.reason}`];
      return;
    }
    const { caps, hasResolution } = this.deps.capabilities();
    const tier = imageTier(s.config.preview.images, caps, hasResolution);
    if (tier === "placeholder") {
      this.lines = [`[pdf: ${name} · page ${ws.page}${of}]`];
      return;
    }
    // A terminal image would draw over the zoom float.
    if (s.overlay.kind === "zoom") return;
    const images = this.deps.images;
    const cell = images.cellSize();
    const cols = pageColsOf(ws, r.w);
    const px = cols * (tier === "blocks" ? BLOCKS_PX_PER_COL : cell.width);
    const width = pageWidth(px);
    const text = themeOf(s).style("text");
    const tone = ws.dark === true ? `#dark@${s.config.theme}` : "";
    const draw = (n: number) =>
      images.get(pageKey(b, n, width) + tone, () => {
        const pixels = this.deps.rasterizePdf({ path: b.path, page: n, width });
        return ws.dark === true
          ? pixels.then((p) => darkPage(p, text))
          : pixels;
      });
    const key = pageKey(b, ws.page, width) + tone;
    const got = draw(ws.page);
    // Reading goes forward: once this page is up, draw the next one meanwhile.
    if (got !== undefined && "image" in got && ws.page < (pages ?? 0)) {
      const next = draw(ws.page + 1);
      if (tier === "kitty" && next !== undefined && "image" in next)
        this.encodeLater(next.image);
    }
    const page = pageKey(b, ws.page, 0);
    const image =
      got !== undefined && "image" in got
        ? got.image
        : this.last?.page === page
          ? images.peek(this.last.key)
          : undefined;
    if (got !== undefined && "image" in got) {
      this.last = { page, key };
      // Kitty sends PNG; encoded here it is far smaller than when encoded to send.
      if (tier === "kitty") got.image.ensureEncodedPng();
    }
    if (image === undefined) {
      this.lines = [
        got === undefined
          ? `◌ ${name} · page ${ws.page}${of}`
          : `[page ${ws.page} of ${name} could not be drawn]`,
      ];
      return;
    }
    this.placed = place(image, r, ws, images.cellAspect(), tier);
    this.pieces = this.marked(s, b, ws, this.placed, key);
    this.menu = this.placeMenu(s, b, ws, this.placed);
    // A terminal image draws over a float's cells: the page leaves them out.
    const hole = this.menu ?? promptBox(s);
    const floats =
      ws.select?.page === ws.page ||
      shownAnnotations(s, b.path).some((a) => a.page === ws.page);
    if (tier === "kitty" && floats) this.pieces = slotted(this.pieces, hole);
    else if (hole !== undefined && tier !== "blocks")
      this.pieces = punch(this.pieces, hole);
    const pageRows =
      ws.fit === "page"
        ? this.placed.rows
        : fullRows(image, cols, images.cellAspect());
    const pageCols = ws.fit === "page" ? this.placed.cols : cols;
    if (
      ws.pageRows !== pageRows ||
      ws.viewRows !== r.h ||
      ws.pageCols !== pageCols ||
      ws.viewCols !== r.w
    )
      // The core keeps the layout so moves can cross pages; it follows after this frame.
      queueMicrotask(() =>
        this.deps.dispatch({
          type: "pdfLaidOut",
          window: id,
          pageRows,
          viewRows: r.h,
          pageCols,
          viewCols: r.w,
        }),
      );
  }

  /**
   * Kitty sends pages as PNG, and encoding one takes tens of milliseconds:
   * encode the next page while the reader is still on this one.
   */
  private encodeLater(image: NativeImage): void {
    clearTimeout(this.encoding);
    this.encoding = setTimeout(() => {
      try {
        image.ensureEncodedPng();
      } catch {
        // Evicted meanwhile; it encodes when drawn, if ever.
      }
    }, ENCODE_DELAY_MS);
  }

  /**
   * The pieces that draw placement `p`: the page, and over it tinted blocks
   * of the rows its highlights, notes, and selected text cover, each kept
   * while its rows and the words tinted in them stay the same.
   */
  private marked(
    s: AppState,
    b: BufferState,
    ws: PdfWindowState,
    p: Placement,
    key: string,
  ): Piece[] {
    const layout = pdfLayoutOf(b, ws.page);
    if (layout?.status !== "ready") {
      this.keepMarks(new Set());
      return [p];
    }
    const theme = themeOf(s);
    const tints = {
      highlight: ints(theme.style("pdfHighlight").bg),
      note: ints(theme.style("pdfNote").bg),
      selection: ints(theme.style("selection").bg),
    };
    // Annotations first, so the selection tints over them.
    const layers = shownAnnotations(s, b.path)
      .filter((a) => a.page === ws.page)
      .map((a) => ({
        runs: selectedWords(layout.value, a),
        colour: tints[a.kind],
      }));
    if (ws.select !== undefined && ws.select.page === ws.page)
      layers.push({
        runs: selectedWords(layout.value, ws.select),
        colour: tints.selection,
      });
    const page = p.image;
    const scale = {
      x: page.width / layout.value.width,
      y: page.height / layout.value.height,
    };
    const spans = layers.flatMap((layer, at) =>
      layer.runs.map((run) => ({
        at,
        run,
        y0: Math.min(...run.map((w) => w.y0)) * scale.y,
        y1: Math.max(...run.map((w) => w.y1)) * scale.y,
      })),
    );
    // Source pixels per row of cells.
    const rh = p.srcH / p.rows;
    const rowOf = (y: number) => (y - p.srcY) / rh;
    const r0 = Math.max(
      0,
      Math.floor(Math.min(...spans.map((x) => rowOf(x.y0)))),
    );
    const r1 = Math.min(
      p.rows,
      Math.ceil(Math.max(...spans.map((x) => rowOf(x.y1)))),
    );
    if (spans.length === 0 || r0 >= r1) {
      this.keepMarks(new Set());
      return [p];
    }
    const pixel = (row: number) => Math.round(p.srcY + row * rh);
    const used = new Set<string>();
    const blocks: Piece[] = [];
    for (let at = r0; at < r1; ) {
      const end = Math.min(r1, (Math.floor(at / MARK_ROWS) + 1) * MARK_ROWS);
      const top = pixel(at);
      const bottom = pixel(end);
      const inside = layers.map((layer, at) => ({
        colour: layer.colour,
        runs: spans
          .filter((x) => x.at === at && x.y0 < bottom && x.y1 > top)
          .map((x) => x.run),
      }));
      const want = `${key}|${top}|${bottom}|${JSON.stringify(
        inside.flatMap((l) =>
          l.runs.length === 0
            ? []
            : [[l.colour, l.runs.map((r) => [r[0], r.at(-1)])]],
        ),
      )}`;
      let image = this.marks.get(want);
      if (image === undefined) {
        image = markWords(page, { top, height: bottom - top }, inside, scale);
        if (p.tier === "kitty") image.ensureEncodedPng();
        this.marks.set(want, image);
      }
      used.add(want);
      blocks.push({
        ...p,
        image,
        y: p.y + at,
        rows: end - at,
        srcY: 0,
        srcH: bottom - top,
      });
      at = end;
    }
    this.keepMarks(used);
    // OpenTUI keys kitty images by draw order and stacks later ones higher:
    // the whole page first keeps its slot, so a selection never sends it
    // again, and the blocks lie over it.
    return [p, ...blocks];
  }

  /** Free the tinted blocks this frame does not draw. */
  private keepMarks(used: ReadonlySet<string>): void {
    for (const [k, image] of this.marks)
      if (!used.has(k)) {
        image.dispose();
        this.marks.delete(k);
      }
  }

  protected override destroySelf(): void {
    clearTimeout(this.encoding);
    this.keepMarks(new Set());
    super.destroySelf();
  }

  cursor(): Cursor | undefined {
    return undefined;
  }

  floatBox(): Rect | undefined {
    return this.menu;
  }

  /**
   * The action float's box: under (or over) the text it is about, else
   * along the window's bottom when that text is not in view.
   */
  private placeMenu(
    s: AppState,
    b: BufferState,
    ws: PdfWindowState,
    p: Placement,
  ): Rect | undefined {
    const o = s.overlay;
    if (o.kind !== "pdfMenu" || o.window !== this.windowId) return undefined;
    const content = pdfMenuContent(s);
    if (content === undefined) return undefined;
    const r = this.rect;
    const bottom = { x: r.x, top: r.y + r.h, bottom: r.y + r.h };
    return pdfMenuBox(this.cellsOf(s, b, ws, p) ?? bottom, content, r);
  }

  /** The cells the float's text covers on placement `p`: its first column and its rows. */
  private cellsOf(
    s: AppState,
    b: BufferState,
    ws: PdfWindowState,
    p: Placement,
  ): { x: number; top: number; bottom: number } | undefined {
    const o = s.overlay;
    const layout = pdfLayoutOf(b, ws.page);
    if (o.kind !== "pdfMenu" || layout?.status !== "ready") return undefined;
    const sel = o.on.kind === "selection" ? ws.select : menuAnnotation(s)?.item;
    if (sel === undefined || sel.page !== ws.page) return undefined;
    const words = selectedWords(layout.value, sel).flat();
    if (words.length === 0) return undefined;
    const sx = p.image.width / layout.value.width;
    const sy = p.image.height / layout.value.height;
    const col = (x: number) => p.x + ((x * sx - p.srcX) * p.cols) / p.srcW;
    const row = (y: number) => p.y + ((y * sy - p.srcY) * p.rows) / p.srcH;
    const top = Math.floor(row(Math.min(...words.map((w) => w.y0))));
    const bottom = Math.ceil(row(Math.max(...words.map((w) => w.y1)))) - 1;
    if (bottom < p.y || top >= p.y + p.rows) return undefined;
    return {
      x: Math.floor(col(Math.min(...words.map((w) => w.x0)))),
      top,
      bottom,
    };
  }

  targetAt(x: number, y: number): MouseTarget | undefined {
    const r = this.rect;
    if (x < r.x || x >= r.x + r.w || y < r.y || y >= r.y + r.h)
      return undefined;
    const p = this.placed;
    const on =
      p !== undefined &&
      x >= p.x &&
      x < p.x + p.cols &&
      y >= p.y &&
      y < p.y + p.rows;
    return this.target(on ? pointAt(p, x, y) : undefined);
  }

  /** Where a drag that started on the page is: the cell clamped onto the page. */
  dragAt(x: number, y: number, _from: WindowSpot): MouseTarget | undefined {
    const p = this.placed;
    if (p === undefined) return this.target(undefined);
    const cx = Math.max(p.x, Math.min(x, p.x + p.cols - 1));
    const cy = Math.max(p.y, Math.min(y, p.y + p.rows - 1));
    return this.target(pointAt(p, cx, cy));
  }

  private target(at: PdfPoint | undefined): MouseTarget {
    return {
      kind: "window",
      window: this.windowId,
      spot: at === undefined ? { kind: "pdf" } : { kind: "pdf", at },
    };
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    if (s === undefined) return;
    const theme = themeOf(s);
    const r = this.rect;
    for (let i = 0; i < r.h; i++)
      drawCells(buf, theme.style("text"), r.x, r.y + i, "", r.w);
    const top = r.y + Math.max(0, Math.floor((r.h - this.lines.length) / 2));
    this.lines.slice(0, r.h).forEach((line, i) => {
      const pad = Math.max(0, Math.floor((r.w - [...line].length) / 2));
      drawCells(
        buf,
        theme.style("imagePlaceholder"),
        r.x + pad,
        top + i,
        line,
        r.w - pad,
      );
    });
    const tier = this.placed?.tier;
    if (tier === undefined) return;
    const cell = this.deps.images.cellPixels();
    for (const p of this.pieces)
      buf.drawImage(
        p.image,
        p.x,
        p.y,
        p.cols,
        p.rows,
        cell === undefined ? 0 : Math.round(p.cols * cell.width),
        cell === undefined ? 0 : Math.round(p.rows * cell.height),
        p.srcX,
        p.srcY,
        p.srcW,
        p.srcH,
        tier,
      );
  }
}

const ints = (c: RGBA): [number, number, number] => {
  const [r, g, b] = c.toInts();
  return [r, g, b];
};

/** A page's pixels (decoded first when they come as a file) recoloured into the theme's text colours. */
function darkPage(
  page: Uint8Array | RgbaImage,
  text: { fg: RGBA; bg: RGBA },
): RgbaImage {
  const pixels = page instanceof Uint8Array ? decoded(page) : page;
  recolor(pixels.rgba, ints(text.bg), ints(text.fg));
  return pixels;
}

function decoded(file: Uint8Array): RgbaImage {
  const image = NativeImage.decode(file);
  try {
    const { width, height } = image;
    const rgba = new Uint8Array(width * height * 4);
    image.copyTo(rgba, { format: "rgba8", stride: width * 4 });
    return { rgba, width, height };
  } finally {
    image.dispose();
  }
}

/**
 * Recolour RGBA pixels in place by lightness: white paper becomes `paper`
 * and black ink becomes `ink`, with the greys between them; alpha is kept.
 */
export function recolor(
  rgba: Uint8Array,
  paper: readonly [number, number, number],
  ink: readonly [number, number, number],
): void {
  for (let i = 0; i < rgba.length; i += 4) {
    const r = rgba[i] ?? 0;
    const g = rgba[i + 1] ?? 0;
    const b = rgba[i + 2] ?? 0;
    const light = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    for (let c = 0; c < 3; c++) {
      const p = paper[c] ?? 0;
      rgba[i + c] = Math.round(p + ((ink[c] ?? 0) - p) * (1 - light));
    }
  }
}

/** The point on the page at the middle of cell (x, y) inside placement `p`. */
function pointAt(p: Placement, x: number, y: number): PdfPoint {
  return {
    x: (p.srcX + ((x - p.x + 0.5) / p.cols) * p.srcW) / p.image.width,
    y: (p.srcY + ((y - p.y + 0.5) / p.rows) * p.srcH) / p.image.height,
  };
}

/** Runs of words to tint one colour. */
type Tint = {
  runs: readonly PdfWord[][];
  colour: readonly [number, number, number];
};

/**
 * The rows `band` of `page`, with each run of words of each tint, from its
 * first word to its last (in points, `scale` pixels to a point), blended
 * `MARK_ALPHA` of the way to its colour, the later tints over the earlier.
 */
export function markWords(
  page: NativeImage,
  band: { top: number; height: number },
  tints: readonly Tint[],
  scale: { x: number; y: number },
): NativeImage {
  const { width } = page;
  const { top, height } = band;
  const strip = page.extract({ left: 0, top, width, height });
  const rgba = new Uint8Array(width * height * 4);
  try {
    strip.copyTo(rgba, { format: "rgba8", stride: width * 4 });
  } finally {
    strip.dispose();
  }
  for (const { runs, colour } of tints)
    for (const run of runs) {
      const first = run[0];
      const last = run.at(-1);
      if (first === undefined || last === undefined) continue;
      const x0 = Math.max(0, Math.floor(first.x0 * scale.x));
      const x1 = Math.min(width, Math.ceil(last.x1 * scale.x));
      const y0 = Math.max(
        0,
        Math.floor(Math.min(...run.map((w) => w.y0)) * scale.y) - top,
      );
      const y1 = Math.min(
        height,
        Math.ceil(Math.max(...run.map((w) => w.y1)) * scale.y) - top,
      );
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++) {
          const i = (y * width + x) * 4;
          for (let c = 0; c < 3; c++) {
            const v = rgba[i + c] ?? 0;
            rgba[i + c] = Math.round(v + ((colour[c] ?? 0) - v) * MARK_ALPHA);
          }
        }
    }
  return NativeImage.fromRgba(rgba, width, height);
}

/** The kitty slots the page takes while a float can open over it. */
const PAGE_SLOTS = 4;

/**
 * The page and the tinted blocks over it (`pieces`, page first), with the
 * page in `PAGE_SLOTS` slots: around `hole` when there is one, else each
 * the whole page. A terminal shows a newly sent image a moment late, and
 * OpenTUI sends one per slot: the slots are sent while they still look
 * like the page, so the float opening only moves them.
 */
export function slotted<P extends Piece>(
  pieces: readonly P[],
  hole: Rect | undefined,
): P[] {
  const [page, ...blocks] = pieces;
  if (page === undefined) return [];
  if (hole === undefined)
    return [...Array<P>(PAGE_SLOTS).fill(page), ...blocks];
  const parts = punch([page], hole);
  const last = parts.at(-1);
  // A part drawn twice keeps the count when the hole is at an edge.
  while (last !== undefined && parts.length < PAGE_SLOTS) parts.push(last);
  return [...parts, ...punch(blocks, hole)];
}

/**
 * `pieces` with the cells of `hole` left out: each piece over it becomes the
 * parts above, left of, right of, and below it, each showing the matching
 * slice of its image.
 */
export function punch<P extends Piece>(pieces: readonly P[], hole: Rect): P[] {
  return pieces.flatMap((p) => {
    const x0 = Math.max(p.x, hole.x);
    const x1 = Math.min(p.x + p.cols, hole.x + hole.w);
    const y0 = Math.max(p.y, hole.y);
    const y1 = Math.min(p.y + p.rows, hole.y + hole.h);
    if (x0 >= x1 || y0 >= y1) return [p];
    const sx = (c: number) =>
      Math.round(p.srcX + ((c - p.x) * p.srcW) / p.cols);
    const sy = (r: number) =>
      Math.round(p.srcY + ((r - p.y) * p.srcH) / p.rows);
    const part = (c0: number, c1: number, r0: number, r1: number): P[] => {
      const srcW = sx(c1) - sx(c0);
      const srcH = sy(r1) - sy(r0);
      return c0 >= c1 || r0 >= r1 || srcW <= 0 || srcH <= 0
        ? []
        : [
            {
              ...p,
              x: c0,
              y: r0,
              cols: c1 - c0,
              rows: r1 - r0,
              srcX: sx(c0),
              srcY: sy(r0),
              srcW,
              srcH,
            },
          ];
    };
    const right = p.x + p.cols;
    return [
      ...part(p.x, right, p.y, y0),
      ...part(p.x, x0, y0, y1),
      ...part(x1, right, y0, y1),
      ...part(p.x, right, y1, p.y + p.rows),
    ];
  });
}

/** How many columns wide the page draws: the window's width times the zoom. */
const pageColsOf = (ws: PdfWindowState, cols: number) =>
  ws.fit === "width" && ws.zoom !== undefined
    ? Math.max(cols, Math.round(cols * ws.zoom))
    : cols;

/** Rows a page `cols` cells wide takes at its aspect ratio. */
const fullRows = (image: NativeImage, cols: number, aspect: number) =>
  Math.max(1, Math.round((cols * aspect * image.height) / image.width));

/**
 * Fit width: the page fills the window's width (times the zoom) and the
 * rows from `scroll` and the columns from `pan` show. Fit page: the whole page, as large as fits, centred across.
 */
function place(
  image: NativeImage,
  r: Rect,
  ws: PdfWindowState,
  aspect: number,
  tier: Placement["tier"],
): Placement {
  const wide = pageColsOf(ws, r.w);
  const full = fullRows(image, wide, aspect);
  if (ws.fit === "page" && full > r.h) {
    const cols = Math.max(
      1,
      Math.round((r.h * image.width) / image.height / aspect),
    );
    return {
      image,
      x: r.x + Math.floor((r.w - cols) / 2),
      y: r.y,
      cols,
      rows: r.h,
      srcX: 0,
      srcY: 0,
      srcW: image.width,
      srcH: image.height,
      tier,
    };
  }
  const scroll = Math.max(0, Math.min(ws.scroll, full - r.h));
  const rows = Math.min(r.h, full - scroll);
  const pan = Math.max(0, Math.min(ws.pan ?? 0, wide - r.w));
  return {
    image,
    x: r.x,
    y: r.y,
    cols: r.w,
    rows,
    srcX: Math.round((image.width * pan) / wide),
    srcY: Math.round((image.height * scroll) / full),
    srcW: Math.max(1, Math.round((image.width * r.w) / wide)),
    srcH: Math.max(1, Math.round((image.height * rows) / full)),
    tier,
  };
}
