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

/** Columns a chunk of `w` normal-size cells takes at `scale`: whole sized cells. */
const scaledCells = (w: number, scale: SizedScale) =>
  sizedCell(scale) * Math.ceil((scale.n * w) / scale.d);

const isBlank = (ch: string) => ch === " " || ch === "\t";

/**
 * `units` as chunks: a same-look run is cut every `chunkPart` cells, so only
 * a run's last chunk leaves part of a double cell empty. With `wordSpace`, a
 * blank ends the chunk and becomes a `plain` chunk of its own.
 */
function chunksOf(units: readonly Unit[], scale: SizedScale): SizedChunk[] {
  const part = chunkPart(scale);
  const out: SizedChunk[] = [];
  let first: Unit | undefined;
  let text = "";
  let w = 0;
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
      const { style, under } = u;
      const cells = scale.wordSpace;
      out.push(
        under === undefined
          ? { text: " ", style, cells, plain: true }
          : { text: " ", style, under, cells, plain: true },
      );
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
 * the text taking `n/d` of them (1.5 is 3/4 of 2, 2.5 is 5/6 of 3).
 */
export function sizeScale(size: number): SizedScale {
  const s = Math.ceil(size);
  for (let d = 1; d <= 15; d++) {
    const n = (size * d) / s;
    if (Number.isInteger(n)) return { s, n, d };
  }
  return { s, n: 1, d: 1 };
}

/** Screen rows one zoomed row takes at text size `size`. */
export const zoomStep = (size: number) => sizedCell(sizeScale(size));

/** Columns one normal-size cell's text takes at `scale`. */
const advance = (scale: SizedScale) => (sizedCell(scale) * scale.n) / scale.d;

/** Normal-size cells one chunk holds at most: kitty draws one in at most 7 sized cells. */
const chunkMost = ({ n, d }: SizedScale) => Math.floor((7 * d) / n);

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
 * A word's chunks: each same-look run cut evenly into as few chunks as
 * kitty takes. Several chunks meet: the first sits at the right of its
 * sized cells, the last at the left, and any between are centred.
 */
function wordChunks(cells: readonly Cell[], scale: SizedScale): SizedChunk[] {
  const most = chunkMost(scale);
  const out: SizedChunk[] = [];
  let run: Cell[] = [];
  const flush = () => {
    const parts = Math.ceil(widthOf(run) / most);
    const size = Math.ceil(widthOf(run) / parts);
    let part: Cell[] = [];
    let w = 0;
    for (const c of run) {
      if (w > 0 && w + c.w > size) {
        out.push(chunkOf(part, scale));
        part = [];
        w = 0;
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
};

/**
 * The ways to draw a word: as its chunks, or, as one chunk with slack, at
 * the left, right, or centre of its sized cells.
 */
function choicesOf(cells: readonly Cell[], scale: SizedScale): Choice[] {
  const word = wordChunks(cells, scale);
  const only = word[0];
  const ways =
    word.length === 1 && only !== undefined && slackOf(only, scale) > EPS
      ? (["left", "right", "center"] as const).map((a) => {
          const { align: _, ...c } = only;
          return [a === "left" ? c : { ...c, align: a }];
        })
      : [word];
  return ways.map((chunks) => {
    const last = chunks.at(-1) as SizedChunk;
    return {
      chunks,
      cells: chunks.reduce((n, c) => n + c.cells, 0),
      lead: leadOf(chunks[0] as SizedChunk, scale),
      trail: slackOf(last, scale) - leadOf(last, scale),
    };
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
  for (const row of rows) {
    const target = row.end + space + stretch;
    const least = space > 0 ? target - 0.5 : target;
    for (const way of ways) {
      const from = Math.max(row.x, Math.ceil(least - way.lead - EPS));
      const near = Math.max(from, Math.round(target - way.lead));
      const exact = Math.abs(near + way.lead - target) < EPS;
      for (const p of exact ? [near] : [near - 1, near, near + 1]) {
        if (p < from) continue;
        const off = p + way.lead - target;
        const x = p + way.cells;
        const end = x - way.trail;
        const cost = row.cost + off * off;
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
  const natural = placeAll(plan.items, scale, width);
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

/** `units` laid out as rows of placed words within `width` columns. */
const wordRows = (
  units: readonly Unit[],
  scale: SizedScale,
  width: number,
): SizedChunk[][] =>
  planRows(units, scale, width, []).map((p) =>
    placeRow(p, scale, width, false),
  );

/**
 * A zoomed line at text size `size` as rows of sized chunks within
 * `width` columns: each word placed on its own, every space taking a space
 * at the size, and rows after the first starting with the line's wrap
 * prefix at the same size. With `justify`, each row but the last is
 * stretched to the width.
 */
export function zoomRows(
  line: RenderLine,
  size: number,
  width: number,
  tabWidth: number,
): ZoomRow[] {
  const scale = sizeScale(size);
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
  s: number,
  width: number,
  tabWidth: number,
): ZoomRow[] {
  const key = `${s}:${width}:${tabWidth}`;
  const hit = zoomed.get(line);
  if (hit?.key === key) return hit.rows;
  const rows = zoomRows(line, s, width, tabWidth);
  zoomed.set(line, { key, rows });
  return rows;
}
