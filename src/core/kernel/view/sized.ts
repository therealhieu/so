import { cellWidth, clusters } from "../text/cells";
import type {
  RenderLine,
  SizedChunk,
  SizedScale,
  Span,
  StyleToken,
  ZoomRow,
} from "./types";

type Unit = { ch: string; w: number; style: StyleToken; under?: StyleToken };

const sameLook = (a: Unit, b: Unit) =>
  a.style === b.style && a.under === b.under;

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/**
 * Normal-size cells one chunk holds: the most that fill whole sized cells
 * exactly within kitty's limit of 7 a chunk (8 at 7/8, 5 at 4/5, 10 at
 * 7/10, 7 at 1/1), so `n / gcd(n, d)` must not pass 7.
 */
const chunkPart = ({ n, d }: SizedScale) => {
  const g = gcd(n, d);
  return (d / g) * Math.floor(7 / (n / g));
};

/** Screen rows and columns one sized cell takes at `scale`. */
export const sizedCell = (scale: SizedScale) => scale.s ?? 2;

/**
 * Columns a chunk of `w` normal-size cells takes at `scale`: whole sized
 * cells of its text at the full size, which kitty's text never passes.
 */
const scaledCells = (w: number, scale: SizedScale) =>
  sizedCell(scale) * Math.ceil((w * fullSize(scale)) / sizedCell(scale) - 1e-9);

const isBlank = (ch: string) => ch === " " || ch === "\t";

/**
 * `units` as chunks: a same-look run is cut every `chunkPart` cells, so only
 * a run's last chunk leaves part of a double cell empty. With `wordSpace`, a
 * blank ends the chunk and becomes a `plain` chunk of its own, and a word
 * of several chunks has them meet: kitty draws a chunk's text slightly
 * short of its cells, so the first sits at the right of its cells, any
 * between are centred, and the last sits at the left.
 */
function chunksOf(units: readonly Unit[], scale: SizedScale): SizedChunk[] {
  const part = chunkPart(scale);
  const out: SizedChunk[] = [];
  let first: Unit | undefined;
  let text = "";
  let w = 0;
  let wordStart = 0;
  const endWord = () => {
    const last = out.length - 1;
    if (last > wordStart)
      for (let i = wordStart; i < last; i++)
        (out[i] as SizedChunk).align = i === wordStart ? "right" : "center";
  };
  const flush = () => {
    if (first === undefined) return;
    const { style, under } = first;
    const cells = scaledCells(w, scale);
    out.push(
      under === undefined
        ? { text, style, cells }
        : { text, style, under, cells },
    );
    first = undefined;
  };
  for (const u of units) {
    if (scale.wordSpace !== undefined && isBlank(u.ch)) {
      flush();
      endWord();
      const { style, under } = u;
      const cells = scale.wordSpace;
      out.push(
        under === undefined
          ? { text: " ", style, cells, plain: true }
          : { text: " ", style, under, cells, plain: true },
      );
      wordStart = out.length;
      continue;
    }
    if (first !== undefined && sameLook(first, u) && w + u.w <= part) {
      text += u.ch;
      w += u.w;
      continue;
    }
    flush();
    first = u;
    text = u.ch;
    w = u.w;
  }
  flush();
  if (scale.wordSpace !== undefined) endWord();
  return out;
}

/**
 * `text` as half-size script spans, two characters to a cell, or undefined
 * when a character is not one cell wide.
 */
export function scriptSpans(
  text: string,
  place: "sup" | "sub",
  style: StyleToken,
): Span[] | undefined {
  const chars = [...clusters(text)];
  if (chars.length === 0 || chars.some((ch) => cellWidth(ch, 0, 1) !== 1))
    return undefined;
  const out: Span[] = [];
  for (let i = 0; i < chars.length; i += 2) {
    const first = chars[i] ?? "";
    const pair = first + (chars[i + 1] ?? "");
    out.push({ text: first, style, script: { text: pair, place } });
  }
  return out;
}

const cellsOf = (chunks: readonly SizedChunk[]) =>
  chunks.reduce((n, c) => n + c.cells, 0);

/**
 * A line's spans as rows of sized chunks within `width` columns. A row
 * breaks after its last space, else mid-word, like `wrapLine`; a tab counts
 * as one cell.
 */
export function wrapSized(
  spans: readonly Span[],
  scale: SizedScale,
  width: number,
): SizedChunk[][] {
  const units: Unit[] = [];
  for (const sp of spans) {
    if (sp.virtual === "eol") continue;
    for (const ch of clusters(sp.text))
      units.push({
        ch,
        w: cellWidth(ch, 0, 1),
        style: sp.style,
        ...(sp.under === undefined ? {} : { under: sp.under }),
      });
  }
  if (scale.words === true) return wordRows(units, scale, width);
  const fits = (from: number, to: number) =>
    cellsOf(chunksOf(units.slice(from, to), scale)) <= width;
  const starts = [0];
  let rowStart = 0;
  let afterBlank = 0;
  for (let i = 0; i < units.length; i++) {
    while (!fits(rowStart, i + 1) && i > rowStart) {
      rowStart = afterBlank > rowStart ? afterBlank : i;
      afterBlank = rowStart;
      starts.push(rowStart);
    }
    const ch = units[i]?.ch;
    if (ch === " " || ch === "\t") afterBlank = i + 1;
  }
  return starts.map((from, r) =>
    chunksOf(units.slice(from, starts[r + 1] ?? units.length), scale),
  );
}

type Cell = Unit & { col?: number; fixed?: true };

/**
 * `spans` as cells with their display columns; a tab is blank cells, and
 * inserted or virtual text is `fixed`.
 */
function zoomCells(spans: readonly Span[], tabWidth: number): Cell[] {
  const out: Cell[] = [];
  let v = 0;
  for (const sp of spans) {
    if (sp.virtual === "eol") continue;
    const fixed = sp.virtual !== undefined || sp.inserted === true;
    for (const ch of clusters(sp.text)) {
      const w = cellWidth(ch, v, tabWidth);
      out.push({
        ch: ch === "\t" ? " ".repeat(w) : ch,
        w,
        col: v,
        style: sp.style,
        ...(sp.under === undefined ? {} : { under: sp.under }),
        ...(fixed ? { fixed: true as const } : {}),
      });
      v += w;
    }
  }
  return out;
}

/**
 * A text size as a sized scale: whole sized cells of the size rounded up,
 * the text taking the `n/d` of them nearest the size, with kitty's `d` of at
 * most 15 (1.5 is 3/4 of 2; 1.1 is drawn at 6/11 of 2, 1.09).
 */
export function sizeScale(size: number): SizedScale {
  const s = Math.ceil(size);
  let best: SizedScale = { s, n: 1, d: 1 };
  let off = Math.abs(s - size);
  for (let d = 2; d <= 15; d++) {
    const n = Math.min(d - 1, Math.max(1, Math.round((size * d) / s)));
    const o = Math.abs((s * n) / d - size);
    if (o < off - EPS) {
      best = { s, n, d };
      off = o;
    }
  }
  return best;
}

/** Screen rows one zoomed row takes at text size `size`. */
export const zoomStep = (size: number) => sizedCell(sizeScale(size));

/** The size `scale` draws text at, in columns per normal-size cell. */
const fullSize = (scale: SizedScale) => (sizedCell(scale) * scale.n) / scale.d;

/** Columns one normal-size cell's text takes at `scale`. */
function advance(scale: SizedScale): number {
  return scale.adv ?? fullSize(scale);
}

/** Normal-size cells one chunk holds at most: kitty draws one in at most 7 sized cells. */
const chunkMost = (scale: SizedScale) =>
  Math.max(1, Math.floor((7 * sizedCell(scale)) / fullSize(scale) + EPS));

/**
 * The text zoom: its size, and the width of a terminal cell in pixels when
 * the terminal reports it.
 */
export type TextZoom = { size: number; cellPx?: number };

/**
 * `scale` with the columns a character takes, given a cell `cellPx` pixels
 * wide. kitty's cell is the font's advance rounded up to a whole pixel, and
 * at a fractional size it spaces characters by that advance at the size,
 * not by the cell: half a pixel under the cell is the advance's middle.
 */
export function withAdvance(scale: SizedScale, cellPx?: number): SizedScale {
  const px = cellPx === undefined ? 0 : Math.round(cellPx);
  if (px <= 0 || scale.n === scale.d) return scale;
  return { ...scale, adv: (fullSize(scale) * (px - 0.5)) / px };
}

/** `zoom` as the sized scale its text is drawn at. */
export const zoomScale = (zoom: TextZoom): SizedScale =>
  withAdvance(sizeScale(zoom.size), zoom.cellPx);

/** The most extra columns a gap takes per column of a space before a row stays ragged. */
const MAX_STRETCH = 3;

const EPS = 1e-9;

const widthOf = (cells: readonly Cell[]) => cells.reduce((n, c) => n + c.w, 0);

function chunkOf(cells: readonly Cell[], scale: SizedScale): SizedChunk {
  const first = cells[0];
  if (first === undefined) throw new Error("empty chunk");
  const w = widthOf(cells);
  return {
    text: cells.map((c) => c.ch).join(""),
    style: first.style,
    ...(first.under === undefined ? {} : { under: first.under }),
    cells: scaledCells(w, scale),
    ...(first.col === undefined ? {} : { col: first.col }),
    w,
  };
}

/**
 * A word's chunks: each same-look run cut into as few chunks as kitty
 * takes, evenly, or in two where the first leaves the least of its sized
 * cells empty. Several chunks meet: the first sits at the right of its
 * sized cells, the last at the left, and any between are centred.
 */
function wordChunks(cells: readonly Cell[], scale: SizedScale): SizedChunk[] {
  const most = chunkMost(scale);
  const out: SizedChunk[] = [];
  let run: Cell[] = [];
  /** Normal-size cells of a run's first chunk when it takes two. */
  const firstOfTwo = (all: number) => {
    let best = Math.ceil(all / 2);
    let least = Number.POSITIVE_INFINITY;
    for (let k = Math.max(1, all - most); k <= Math.min(most, all - 1); k++) {
      const slack = scaledCells(k, scale) - k * advance(scale);
      if (
        slack < least - EPS ||
        (Math.abs(slack - least) < EPS &&
          Math.abs(k - all / 2) < Math.abs(best - all / 2))
      ) {
        best = k;
        least = slack;
      }
    }
    return best;
  };
  const flush = () => {
    const all = widthOf(run);
    const parts = Math.ceil(all / most);
    const even = Math.ceil(all / parts);
    const first = parts === 2 ? firstOfTwo(all) : even;
    let size = first;
    let part: Cell[] = [];
    let w = 0;
    for (const c of run) {
      if (w > 0 && w + c.w > size) {
        out.push(chunkOf(part, scale));
        part = [];
        w = 0;
        size = parts === 2 ? most : even;
      }
      part.push(c);
      w += c.w;
    }
    if (part.length > 0) out.push(chunkOf(part, scale));
    run = [];
  };
  for (const c of cells) {
    const first = run[0];
    if (first !== undefined && !sameLook(first, c)) flush();
    run.push(c);
  }
  if (run.length > 0) flush();
  if (out.length > 1)
    out.forEach((c, i) => {
      if (i === 0) c.align = "right";
      else if (i < out.length - 1) c.align = "center";
    });
  return out;
}

/**
 * Whether kitty draws `ch` itself as a shape (box drawing, blocks, braille,
 * Powerline, legacy computing): a chunk starting with one is drawn all as
 * shapes, and a bar of one is cut short at a fractional size.
 */
function isBoxDrawn(ch: string): boolean {
  const c = ch.codePointAt(0) ?? 0;
  return (
    (c >= 0x2500 && c <= 0x259f) ||
    (c >= 0x2800 && c <= 0x28ff) ||
    (c >= 0xe0b0 && c <= 0xe0d4) ||
    (c >= 0x1fb00 && c <= 0x1fbff)
  );
}

/** Columns a chunk's sized cells hold beyond its text. */
const slackOf = (c: SizedChunk, scale: SizedScale) =>
  c.cells - (c.w ?? 0) * advance(scale);

/** Columns of a chunk's slack before its text. */
const leadOf = (c: SizedChunk, scale: SizedScale) =>
  c.align === "right"
    ? slackOf(c, scale)
    : c.align === "center"
      ? slackOf(c, scale) / 2
      : 0;

/**
 * `c`'s text at normal size within its `cells` columns, each character at
 * the column its sized glyph starts in, so it sits under it.
 */
export function underText(c: SizedChunk, scale: SizedScale): string {
  const adv = advance(scale);
  const lead = leadOf(c, scale);
  let out = "";
  let at = 0;
  let v = 0;
  for (const ch of clusters(c.text)) {
    const w = cellWidth(ch, 0, 1);
    const x = Math.max(at, Math.floor(lead + adv * v + EPS));
    if (x + w > c.cells) break;
    out += " ".repeat(x - at) + ch;
    at = x + w;
    v += w;
  }
  return out;
}

/** One way to draw a word: its chunks, their columns, and their slack before and after its text. */
type Choice = {
  chunks: readonly SizedChunk[];
  cells: number;
  lead: number;
  trail: number;
  /** The squares of the gaps between its chunks, in columns. */
  inner: number;
  /** Only for a word at a row's left edge. */
  edge?: true;
};

/**
 * The ways to draw a word: as its chunks, or, as one chunk with slack, at
 * the left, right, or centre of its sized cells.
 */
function choicesOf(cells: readonly Cell[], scale: SizedScale): Choice[] {
  if (cells.every((c) => isBoxDrawn(c.ch))) {
    const bar = { ...chunkOf(cells, scale), bar: true as const };
    bar.cells = widthOf(cells);
    return [{ chunks: [bar], cells: bar.cells, lead: 0, trail: 0, inner: 0 }];
  }
  const word = wordChunks(cells, scale);
  const only = word[0];
  const left = (c: SizedChunk): SizedChunk => {
    const { align: _, ...rest } = c;
    return rest;
  };
  // At a row's left edge, a word of several chunks starts at the left of
  // its first chunk, its slack then falling between its chunks.
  const ways =
    word.length === 1 && only !== undefined
      ? slackOf(only, scale) > EPS
        ? (["left", "right", "center"] as const).map((a) => [
            a === "left" ? left(only) : { ...only, align: a },
          ])
        : [word]
      : [word, [left(word[0] as SizedChunk), ...word.slice(1)]];
  const trailOf = (c: SizedChunk) => slackOf(c, scale) - leadOf(c, scale);
  return ways.map((chunks) => {
    let inner = 0;
    for (let i = 1; i < chunks.length; i++) {
      const gap =
        trailOf(chunks[i - 1] as SizedChunk) +
        leadOf(chunks[i] as SizedChunk, scale);
      inner += gap * gap;
    }
    const way: Choice = {
      chunks,
      cells: chunks.reduce((n, c) => n + c.cells, 0),
      lead: leadOf(chunks[0] as SizedChunk, scale),
      trail: trailOf(chunks.at(-1) as SizedChunk),
      inner,
    };
    return word.length > 1 && chunks[0]?.align === undefined
      ? { ...way, edge: true as const }
      : way;
  });
}

/**
 * One way to place a row's words so far: the first free column, where the
 * text ends, the spacing error, and the last word's way and start column
 * after its blanks `gap`, following `prev`.
 */
type Placing = {
  x: number;
  end: number;
  cost: number;
  way?: Choice;
  p?: number;
  gap?: readonly Cell[];
  prev?: Placing;
};

/** The placings kept per word: the cheapest, one per first free column and text end. */
const KEEP = 8;

const START: readonly Placing[] = [{ x: 0, end: 0, cost: 0 }];

/**
 * A word drawn one of `ways` after `gap` in each of `rows`: its text should
 * start one space width per blank column after the text before it (plus
 * `stretch` columns) and never more than half a column closer. Each placing
 * adds the square of how far the start is off, so the cheapest keeps every
 * space of the row nearest its width.
 */
function placeWord(
  rows: readonly Placing[],
  gap: readonly Cell[],
  ways: readonly Choice[],
  scale: SizedScale,
  stretch = 0,
): Placing[] {
  const space = widthOf(gap) * advance(scale);
  const kept = new Map<number, Placing>();
  // A row's first word starts at its left edge: off it shows the most.
  const flush = ways.filter((w) => w.lead < EPS);
  for (const row of rows) {
    const target = row.end + space + stretch;
    const least = space > 0 ? target - 0.5 : target;
    const first = row.prev === undefined && space === 0 && flush.length > 0;
    for (const way of first ? flush : ways.filter((w) => !w.edge)) {
      const from = Math.max(row.x, Math.ceil(least - way.lead - EPS));
      const near = Math.max(from, Math.round(target - way.lead));
      const exact = Math.abs(near + way.lead - target) < EPS;
      for (const p of exact ? [near] : [near - 1, near, near + 1]) {
        if (p < from) continue;
        const off = p + way.lead - target;
        const x = p + way.cells;
        const end = x - way.trail;
        const cost = row.cost + off * off + way.inner;
        const key = x * 4096 + Math.round(end * 48);
        const had = kept.get(key);
        if (had !== undefined && had.cost <= cost + EPS) continue;
        kept.set(key, { x, end, cost, way, p, gap, prev: row });
      }
    }
  }
  const out = [...kept.values()];
  return out.length <= KEEP
    ? out.sort((a, b) => a.cost - b.cost)
    : out.sort((a, b) => a.cost - b.cost).slice(0, KEEP);
}

/** The placings of `rows` within `width` columns. */
const within = (rows: readonly Placing[], width: number) =>
  rows.filter((r) => r.x <= width);

/** Every chunk of the cheapest of `rows`, from the row start, a blank before each word that has room. */
function chunksOfBest(rows: readonly Placing[]): SizedChunk[] {
  const out: SizedChunk[][] = [];
  for (
    let r: Placing | undefined = rows[0];
    r?.prev !== undefined;
    r = r.prev
  ) {
    const { way, p = 0, gap = [], prev } = r;
    const first = gap[0];
    const blank: SizedChunk[] =
      p > prev.x && first !== undefined
        ? [
            {
              text: " ",
              style: first.style,
              ...(first.under === undefined ? {} : { under: first.under }),
              cells: p - prev.x,
              plain: true,
              ...(first.col === undefined ? {} : { col: first.col }),
              w: widthOf(gap),
            },
          ]
        : [];
    out.push([...blank, ...(way?.chunks ?? [])]);
  }
  return out.reverse().flat();
}

/** A word, the blanks before it, and its ways to be drawn once known. */
type Item = { gap: Cell[]; word: Cell[]; ways?: Choice[] };

/**
 * One row's words: the wrap prefix's first, then the line's own from
 * `own`, and the blanks after its last word.
 */
type RowPlan = {
  items: Item[];
  own: number;
  trailing: Cell[];
  startCol: number;
};

const isBlankCell = (c: Cell) => isBlank(c.ch[0] ?? "");

/** `cells` as words, each with the blanks before it, and the blanks after the last. */
function itemsOf(cells: readonly Cell[]): { items: Item[]; trailing: Cell[] } {
  const items: Item[] = [];
  let gap: Cell[] = [];
  let word: Cell[] = [];
  for (const c of cells) {
    if (isBlankCell(c)) {
      if (word.length > 0) {
        items.push({ gap, word });
        gap = [];
        word = [];
      }
      gap.push(c);
    } else word.push(c);
  }
  if (word.length > 0) {
    items.push({ gap, word });
    gap = [];
  }
  return { items, trailing: gap };
}

/**
 * `items` placed from the row start within `width` columns, item `i`
 * stretched by `stretch[i]` columns; empty when they do not fit.
 */
const placeAll = (
  items: readonly Item[],
  scale: SizedScale,
  width: number,
  stretch: readonly number[] = [],
): readonly Placing[] =>
  items.reduce<readonly Placing[]>((rows, it, i) => {
    it.ways ??= choicesOf(it.word, scale);
    return within(placeWord(rows, it.gap, it.ways, scale, stretch[i]), width);
  }, START);

/**
 * `cells` as rows of placed words within `width` columns, rows after the
 * first starting with `prefix`. A row breaks after the blanks following
 * its last word that fits, else inside a word wider than the row.
 */
function planRows(
  cells: readonly Cell[],
  scale: SizedScale,
  width: number,
  prefix: readonly Cell[],
): RowPlan[] {
  const lead = itemsOf(prefix);
  const { items, trailing } = itemsOf(cells);
  const plans: RowPlan[] = [];
  const startOf = (it: Item | undefined) =>
    it?.gap[0]?.col ?? it?.word[0]?.col ?? 0;
  let plan: RowPlan = { items: [], own: 0, trailing: [], startCol: 0 };
  let rows: readonly Placing[] = START;
  let pending: Cell[] = [];
  const next = () => {
    plans.push(plan);
    plan = {
      items: [...lead.items],
      own: lead.items.length,
      trailing: [],
      startCol: 0,
    };
    rows = placeAll(lead.items, scale, Number.POSITIVE_INFINITY);
    pending = [...lead.trailing];
  };
  for (const [i, it] of items.entries()) {
    if (i === 0) plan.startCol = startOf(it);
    let gap = [...pending, ...it.gap];
    let word = it.word;
    while (word.length > 0) {
      const ways = choicesOf(word, scale);
      const tried = placeWord(rows, gap, ways, scale);
      const fit = within(tried, width);
      // A single character wider than the row stays on it, cut by the window.
      if (
        fit.length > 0 ||
        (word.length === 1 && plan.items.length === plan.own)
      ) {
        plan.items.push({ gap, word, ways });
        rows = fit.length > 0 ? fit : tried;
        pending = [];
        break;
      }
      if (plan.items.length > plan.own) {
        plan.trailing = it.gap;
        next();
        plan.startCol = word[0]?.col ?? 0;
        gap = [...pending];
        continue;
      }
      let k = word.length - 1;
      while (
        k > 1 &&
        within(
          placeWord(rows, gap, choicesOf(word.slice(0, k), scale), scale),
          width,
        ).length === 0
      )
        k--;
      plan.items.push({ gap, word: word.slice(0, k) });
      next();
      word = word.slice(k);
      plan.startCol = word[0]?.col ?? 0;
      gap = [...pending];
    }
  }
  plan.trailing = trailing;
  plans.push(plan);
  return plans;
}

/**
 * A planned row's chunks, its blanks after the last word kept to `width`.
 * With `justify`, the extra columns go to the gaps after the row's first
 * word of buffer text, the leftmost first, unless a gap would take more
 * than three spaces' worth.
 */
function placeRow(
  plan: RowPlan,
  scale: SizedScale,
  width: number,
  justify: boolean,
): SizedChunk[] {
  const joined =
    justify || scale.n === scale.d
      ? []
      : placeAll(joinWords(plan.items, plan.own, scale), scale, width);
  const natural =
    joined.length > 0 ? joined : placeAll(plan.items, scale, width);
  let rows =
    natural.length > 0
      ? natural
      : placeAll(plan.items, scale, Number.POSITIVE_INFINITY);
  const x = rows[0]?.x ?? 0;
  if (justify) {
    const firstOwn = plan.items.findIndex(
      (it, i) => i >= plan.own && it.word.some((c) => c.fixed !== true),
    );
    const gaps: number[] = [];
    if (firstOwn >= 0)
      plan.items.forEach((it, i) => {
        if (
          i > firstOwn &&
          it.gap.length > 0 &&
          it.gap.every((c) => c.fixed !== true)
        )
          gaps.push(i);
      });
    const extra = width - x;
    const room = MAX_STRETCH * Math.ceil(advance(scale)) * gaps.length;
    if (gaps.length > 0 && extra > 0 && extra <= room) {
      const stretch: number[] = [];
      gaps.forEach((at, k) => {
        stretch[at] =
          Math.floor(extra / gaps.length) + (k < extra % gaps.length ? 1 : 0);
      });
      const wide = placeAll(plan.items, scale, width, stretch);
      if (wide.length > 0) rows = wide;
    }
  }
  const chunks = chunksOfBest(rows);
  const used = rows[0]?.x ?? 0;
  const first = plan.trailing[0];
  const tail = Math.min(
    width - used,
    Math.round(widthOf(plan.trailing) * advance(scale)),
  );
  if (first === undefined || tail <= 0) return chunks;
  return [
    ...chunks,
    {
      text: " ",
      style: first.style,
      ...(first.under === undefined ? {} : { under: first.under }),
      cells: tail,
      plain: true,
      ...(first.col === undefined ? {} : { col: first.col }),
      w: widthOf(plan.trailing),
    },
  ];
}

/** Whether `cells` all share the look of `first`. */
const oneLook = (cells: readonly Cell[], first: Cell) =>
  cells.every((c) => sameLook(c, first));

/**
 * `items` from `from` with neighbouring words of one look joined, with the
 * blanks between them, into one chunk where they fit, so kitty spaces them
 * itself. The cuts are chosen for the fewest chunks with the least slack,
 * each chunk costing one plus its slack in columns.
 */
function joinWords(
  items: readonly Item[],
  from: number,
  scale: SizedScale,
): Item[] {
  const most = chunkMost(scale);
  const n = items.length;
  const best: { cost: number; to: number }[] = [];
  best[n] = { cost: 0, to: n };
  for (let i = n - 1; i >= from; i--) {
    const head = items[i] as Item;
    const first = head.word[0] as Cell;
    let cells = [...head.word];
    let pick = { cost: Number.POSITIVE_INFINITY, to: i + 1 };
    for (let j = i + 1; j <= n; j++) {
      if (j > i + 1) {
        const next = items[j - 1] as Item;
        cells = [...cells, ...next.gap, ...next.word];
      }
      if (
        !oneLook(cells, first) ||
        widthOf(cells) > most ||
        cells.some((c) => isBoxDrawn(c.ch))
      ) {
        if (j === i + 1) pick = { cost: 1 + (best[j]?.cost ?? 0), to: j };
        break;
      }
      const w = widthOf(cells);
      const slack = scaledCells(w, scale) - w * advance(scale);
      const cost = 1 + slack + (best[j]?.cost ?? 0);
      if (cost < pick.cost - EPS) pick = { cost, to: j };
    }
    best[i] = pick;
  }
  const out = items.slice(0, from);
  for (let i = from; i < n; ) {
    const to = best[i]?.to ?? i + 1;
    const head = items[i] as Item;
    const word = [...head.word];
    for (const it of items.slice(i + 1, to)) word.push(...it.gap, ...it.word);
    out.push(to === i + 1 ? head : { gap: head.gap, word });
    i = to;
  }
  return out;
}

/** `units` laid out as rows of placed words within `width` columns. */
const wordRows = (
  units: readonly Unit[],
  scale: SizedScale,
  width: number,
): SizedChunk[][] =>
  planRows(units, scale, width, []).map((p) =>
    placeRow(p, scale, width, false),
  );

/** Box-drawing characters with a line going right, and with one going down. */
const RIGHT_ARM = new Set([..."─━═┼╋╬├┣╠┌┏╔└┗╚┬┳╦┴┻╩"]);
const DOWN_ARM = new Set([..."│┃║┼╋╬├┣╠┤┫╣┌┏╔┐┓╗┬┳╦"]);
/** Bars that run down as themselves. */
const BARS = new Set([..."▏▎▍▌▋▊▉█"]);

/**
 * A box-drawing character at normal size across `cells` columns: its line
 * going right carried on with `─` on its own row, and its line going down
 * (or a bar) on the rows below.
 */
function gridShape(c: Cell, cells: number): SizedChunk {
  const down = DOWN_ARM.has(c.ch) ? "│" : BARS.has(c.ch) ? c.ch : " ";
  const right = RIGHT_ARM.has(c.ch) ? "─" : " ";
  return {
    text: c.ch + right.repeat(Math.max(0, cells - 1)),
    down: down + " ".repeat(Math.max(0, cells - 1)),
    style: c.style,
    ...(c.under === undefined ? {} : { under: c.under }),
    cells,
    bar: true,
    ...(c.col === undefined ? {} : { col: c.col }),
    w: c.w,
  };
}

/**
 * One row of a grid (a table) at `zoom`, its columns kept: each box-drawing
 * character sits at `round(column × width)` of a character at the size,
 * drawn at normal size, and the text between two of them is placed like
 * prose in the columns between. Text that does not fit there stays at
 * normal size.
 */
export function gridRow(spans: readonly Span[], zoom: TextZoom): SizedChunk[] {
  const scale = zoomScale(zoom);
  const at = (col: number) => Math.round(col * advance(scale));
  const cells = zoomCells(spans, 1);
  const out: SizedChunk[] = [];
  let i = 0;
  while (i < cells.length) {
    const c = cells[i] as Cell;
    const col = c.col ?? 0;
    if (isBoxDrawn(c.ch)) {
      out.push(gridShape(c, at(col + c.w) - at(col)));
      i++;
      continue;
    }
    let j = i;
    while (j < cells.length && !isBoxDrawn((cells[j] as Cell).ch)) j++;
    const part = cells.slice(i, j);
    const next = cells[j];
    const end = next?.col ?? col + widthOf(part);
    const room = at(end) - at(col);
    const { items, trailing } = itemsOf(part);
    const rows = placeAll(joinWords(items, 0, scale), scale, room);
    if (rows.length > 0) {
      const placed = chunksOfBest(rows);
      const used = rows[0]?.x ?? 0;
      const first = trailing[0] ?? part[0];
      out.push(...placed);
      if (used < room && first !== undefined)
        out.push({
          text: " ",
          style: first.style,
          ...(first.under === undefined ? {} : { under: first.under }),
          cells: room - used,
          plain: true,
          ...(trailing[0]?.col === undefined
            ? {}
            : { col: trailing[0].col, w: widthOf(trailing) }),
        });
    } else if (room > 0) {
      const text = part.map((p) => p.ch).join("");
      out.push({
        text: text + " ".repeat(Math.max(0, room - widthOf(part))),
        down: "",
        style: c.style,
        ...(c.under === undefined ? {} : { under: c.under }),
        cells: room,
        bar: true,
        col,
        w: widthOf(part),
      });
    }
    i = j;
  }
  return out;
}

/**
 * Columns a grid `width` columns wide at `size` keeps at normal size, with
 * a fifth of a column to spare per column at a fractional size.
 */
export const gridColumns = (width: number, size: number) =>
  Math.max(1, Math.floor(width / (Number.isInteger(size) ? size : size + 0.2)));

/**
 * A zoomed line at text size `size` as rows of sized chunks within
 * `width` columns: each word placed on its own, every space taking a space
 * at the size, and rows after the first starting with the line's wrap
 * prefix at the same size. With `justify`, each row but the last is
 * stretched to the width.
 */
export function zoomRows(
  line: RenderLine,
  zoom: TextZoom,
  width: number,
  tabWidth: number,
): ZoomRow[] {
  const scale = zoomScale(zoom);
  const prefix =
    line.wrapPrefix === undefined
      ? []
      : zoomCells(line.wrapPrefix, 1).map(({ col: _, ...c }) => c);
  const plans = planRows(zoomCells(line.spans, tabWidth), scale, width, prefix);
  return plans.map((plan, k) => {
    const startCol = plan.startCol;
    const endCol = plans[k + 1]?.startCol;
    const chunks = placeRow(
      plan,
      scale,
      width,
      line.justify === true && endCol !== undefined,
    );
    return endCol === undefined
      ? { startCol, chunks }
      : { startCol, endCol, chunks };
  });
}

/** Index of the zoomed row showing display column `dc`. */
export function zoomRowOf(rows: readonly ZoomRow[], dc: number): number {
  let k = 0;
  while (k + 1 < rows.length && (rows[k + 1]?.startCol ?? 0) <= dc) k++;
  return k;
}

/**
 * Display column shown at column `x` of a zoomed row: a cell of the wrap
 * prefix maps to the row's first column, a blank to itself, and a column
 * past the last chunk to the column just past the row.
 */
export function zoomColAt(row: ZoomRow, x: number): number {
  let at = 0;
  let last = row.startCol;
  for (const c of row.chunks) {
    if (x < at + c.cells) {
      if (c.col === undefined) return row.startCol;
      const w = c.w ?? 1;
      return c.col + Math.min(w - 1, Math.floor(((x - at) * w) / c.cells));
    }
    at += c.cells;
    if (c.col !== undefined) last = c.col + (c.w ?? 1);
  }
  return row.endCol === undefined
    ? last
    : Math.max(row.startCol, row.endCol - 1);
}

/**
 * Column, from the row start, where display column `dc` of a zoomed row is
 * drawn (the first column `zoomColAt` maps to it), or the column just past
 * its last chunk.
 */
export function zoomCellOf(row: ZoomRow, dc: number): number {
  let at = 0;
  for (const c of row.chunks) {
    const w = c.w ?? 1;
    if (c.col !== undefined && dc >= c.col && dc < c.col + w)
      return at + Math.ceil(((dc - c.col) * c.cells) / w);
    at += c.cells;
  }
  return at;
}

const zoomed = new WeakMap<RenderLine, { key: string; rows: ZoomRow[] }>();

/** `zoomRows` of `line`, kept while the line, size, and width stay the same. */
export function zoomRowsOf(
  line: RenderLine,
  zoom: TextZoom,
  width: number,
  tabWidth: number,
): ZoomRow[] {
  const key = `${zoom.size}:${zoom.cellPx}:${width}:${tabWidth}`;
  const hit = zoomed.get(line);
  if (hit?.key === key) return hit.rows;
  const rows = zoomRows(line, zoom, width, tabWidth);
  zoomed.set(line, { key, rows });
  return rows;
}
