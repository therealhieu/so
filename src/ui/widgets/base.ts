import type { OptimizedBuffer } from "@opentui/core";
import type { BaseEmbedData } from "../../core/features/bases/embed";
import type { KanbanModel } from "../../core/features/bases/kanban";
import {
  headerOf,
  shown,
  type TableModel,
} from "../../core/features/bases/table";
import type { Rect } from "../editors/text-view";
import { drawCells, type Theme } from "../theme";
import type { WidgetPainter } from "./registry";

/**
 * The text of a cell being edited, its caret, and why it cannot be written;
 * a list cell's chips, or a text cell's suggested values (the first is the
 * one Tab completes).
 */
export type CellEditView = {
  value: string;
  caret: number;
  error?: string;
  chips?: string[];
  suggestions?: string[];
};
export type TableFocus = { row: number; column: number; edit?: CellEditView };
/**
 * The first body line the window prefers to show, and how many columns after
 * the pinned first one are scrolled off.
 */
export type TableScroll = { top: number; col: number };

type Line =
  | { kind: "group"; label: string; count: number }
  | { kind: "row"; row: number };

export type TableLayout = {
  /**
   * Shown columns: model index, x from the rect's left, and width in cells;
   * `clipped` marks the right-edge column cut to the room left.
   */
  cols: { index: number; x: number; w: number; clipped?: true }[];
  /** Columns scrolled off between the pinned first column and the shown ones. */
  left: number;
  /** Columns not shown whole right of the shown ones. */
  right: number;
  lines: Line[];
  /** The first body line shown. */
  top: number;
  bodyRows: number;
  summaries: boolean;
  /** Screen cell of the focused cell (the caret while editing), when shown. */
  cursor?: { x: number; y: number };
};

/** Marker, two spaces, then the cells. */
const LEAD = 3;
const SEP = " │ ";
/** Cells kept at the right edge for `+N cols ›`. */
const MORE_COLS = 11;
/** Cells after the pinned column for `‹ +N`. */
const LEFT_MORE = 6;
/** The fewest cells a clipped right-edge column is drawn in. */
const MIN_CLIP = 6;

const len = (t: string) => [...t].length;
const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(n, hi));

/** Cut `text` to `w` cells with a trailing `…`. */
function fit(text: string, w: number): string {
  const cells = [...text];
  if (cells.length <= w) return text;
  return w <= 1
    ? cells.slice(0, w).join("")
    : `${cells.slice(0, w - 1).join("")}…`;
}

const labelOf = (m: TableModel, i: number) => {
  const c = m.columns[i];
  return c === undefined ? "" : headerOf(c);
};

/**
 * Where a table's parts go in `rect`. When every column fits, all show.
 * Otherwise the first column stays pinned (at most half the width), the
 * columns after it start `scroll.col` columns in (moved so the focused column
 * shows whole), and the next column is drawn clipped in the room left. The
 * body lines come with group headers, from the first line shown so the
 * focused row shows.
 */
export function layoutBaseTable(
  rect: Rect,
  m: TableModel,
  focus?: TableFocus,
  scroll: TableScroll = { top: 0, col: 0 },
): TableLayout {
  const n = m.columns.length;
  const room = Math.max(1, rect.w - LEAD);
  const widths = m.columns.map((c, i) => {
    let w = c.width;
    if (focus?.edit !== undefined && focus.column === i)
      w = Math.max(w, len(focus.edit.value) + 1);
    return clamp(w, 1, room);
  });
  /** Whole columns from `from` in `budget` cells, each at most `budget` wide. */
  const fitFrom = (from: number, budget: number) => {
    const out: number[] = [];
    let used = 0;
    for (let i = from; i < n; i++) {
      const w =
        Math.min(widths[i] ?? 1, budget) + (out.length > 0 ? SEP.length : 0);
      if (out.length > 0 && used + w > budget) break;
      out.push(i);
      used += w;
    }
    return { shown: out, used, budget };
  };
  const cols: TableLayout["cols"] = [];
  let left = 0;
  let right = 0;
  const place = (index: number, x: number, w: number) => {
    cols.push({ index, x, w });
    return x + w + SEP.length;
  };
  const all = fitFrom(0, room);
  if (all.shown.length === n) {
    let x = LEAD;
    for (const index of all.shown) x = place(index, x, widths[index] ?? 1);
  } else {
    const pin = Math.min(widths[0] ?? 1, Math.floor(room / 2));
    const budget = (off: number, more: boolean) =>
      Math.max(
        1,
        room -
          pin -
          SEP.length -
          (off > 1 ? LEFT_MORE : 0) -
          (more ? MORE_COLS : 0),
      );
    const shownFrom = (off: number) => {
      const whole = fitFrom(off, budget(off, false));
      return whole.shown.at(-1) === n - 1
        ? whole
        : fitFrom(off, budget(off, true));
    };
    const target = focus?.column ?? 0;
    let off = 1 + clamp(scroll.col, 0, n - 2);
    if (target >= 1 && target < off) off = target;
    let vis = shownFrom(off);
    while (target > off && !vis.shown.includes(target)) vis = shownFrom(++off);
    let x = place(0, LEAD, pin);
    if (off > 1) x += LEFT_MORE;
    for (const index of vis.shown)
      x = place(index, x, Math.min(widths[index] ?? 1, vis.budget));
    const next = off + vis.shown.length;
    const rest = vis.budget - vis.used - SEP.length;
    if (next < n && rest >= MIN_CLIP)
      cols.push({ index: next, x, w: rest, clipped: true });
    left = off - 1;
    right = n - next;
  }

  const lines: Line[] = [];
  if (m.groups.length === 0)
    for (let row = 0; row < m.rows.length; row++)
      lines.push({ kind: "row", row });
  else
    for (const g of m.groups) {
      lines.push({ kind: "group", label: g.label, count: g.count });
      for (let row = g.start; row < g.start + g.count; row++)
        lines.push({ kind: "row", row });
    }
  const summaries = m.summaries.some((sm) => sm !== undefined);
  const bodyRows = Math.max(0, rect.h - 2 - (summaries ? 2 : 0));
  const at =
    focus === undefined
      ? -1
      : lines.findIndex((l) => l.kind === "row" && l.row === focus.row);
  let top = clamp(scroll.top, 0, Math.max(0, lines.length - bodyRows));
  if (at >= 0 && at < top)
    top = at > 0 && lines[at - 1]?.kind === "group" ? at - 1 : at;
  if (at >= 0 && at >= top + bodyRows) top = at - bodyRows + 1;

  const col = cols.find((c) => c.index === focus?.column && !c.clipped);
  const caret = focus?.edit === undefined ? 0 : focus.edit.caret;
  const cursor =
    at >= top && at < top + bodyRows && col !== undefined
      ? {
          x: rect.x + col.x + Math.min(caret, col.w - 1),
          y: rect.y + 2 + at - top,
        }
      : undefined;
  return {
    cols,
    left,
    right,
    lines,
    top,
    bodyRows,
    summaries,
    ...(cursor === undefined ? {} : { cursor }),
  };
}

type Part = { token: string; text: string };

/** What goes under an edited cell: its error, then its chips or suggestions. */
function underEdit(e: CellEditView): Part[][] {
  const lines: Part[][] = [];
  if (e.error !== undefined)
    lines.push([{ token: "messageError", text: `✗ ${e.error}` }]);
  if (e.chips !== undefined && e.chips.length > 0)
    lines.push(
      e.chips.flatMap((c, i) => [
        ...(i === 0 ? [] : [{ token: "text", text: " " }]),
        { token: "baseChip", text: `${c} ×` },
      ]),
    );
  const w = Math.max(0, ...(e.suggestions ?? []).map(len)) + 2;
  for (const [i, v] of (e.suggestions ?? []).entries()) {
    const text = ` ${v}`;
    lines.push([
      {
        token: i === 0 ? "baseFocus" : "baseSuggest",
        text: text + " ".repeat(w - len(text)),
      },
    ]);
  }
  return lines;
}

/** Paint `text` at column `x` of a row, never past the rect's right edge. */
function put(
  buf: OptimizedBuffer,
  theme: Theme,
  rect: Rect,
  token: string,
  x: number,
  y: number,
  text: string,
  width?: number,
): void {
  const room = rect.w - x;
  if (room <= 0) return;
  drawCells(
    buf,
    theme.style(token),
    rect.x + x,
    y,
    text,
    Math.min(width ?? len(text), room),
  );
}

/**
 * Paint a table model in `rect` and nowhere else: header with sort arrows,
 * `‹ +N` after the pinned column when columns are scrolled off and
 * `+N cols ›` at the right edge when more follow, group headers, rows with the focused cell reversed and
 * its row marked `▌`, an edited cell's text with its inline error, chips,
 * or suggestions below, and the summary row. Without rows it says so, with `empty` below.
 */
export function paintBaseTable(
  buf: OptimizedBuffer,
  theme: Theme,
  rect: Rect,
  m: TableModel,
  o: { focus?: TableFocus; scroll?: TableScroll; empty?: string } = {},
): TableLayout {
  const l = layoutBaseTable(rect, m, o.focus, o.scroll);
  for (let i = 0; i < rect.h; i++)
    put(buf, theme, rect, "text", 0, rect.y + i, "", rect.w);
  if (rect.h <= 0) return l;
  const sepRow = (y: number, join: string) => {
    let end = 0;
    for (const [k, c] of l.cols.entries()) {
      const gap = k === 0 ? "" : "─".repeat(c.x - SEP.length - end) + join;
      put(
        buf,
        theme,
        rect,
        "separator",
        k === 0 ? c.x : end,
        y,
        `${gap}${"─".repeat(c.w)}`,
      );
      end = c.x + c.w;
    }
  };
  // Header.
  for (const [k, c] of l.cols.entries()) {
    if (k > 0)
      put(buf, theme, rect, "separator", c.x - SEP.length, rect.y, SEP);
    put(
      buf,
      theme,
      rect,
      "baseHeader",
      c.x,
      rect.y,
      fit(labelOf(m, c.index), c.w),
      c.w,
    );
  }
  const pinned = l.cols[0];
  if (l.left > 0 && pinned !== undefined)
    put(
      buf,
      theme,
      rect,
      "dim",
      pinned.x + pinned.w + 1,
      rect.y,
      `‹ +${l.left}`,
    );
  if (l.right > 0) {
    const more = `+${l.right} col${l.right > 1 ? "s" : ""} ›`;
    put(buf, theme, rect, "dim", rect.w - len(more), rect.y, more);
  }
  if (rect.h > 1) sepRow(rect.y + 1, "─┼─");
  // Body.
  const focus = o.focus;
  if (m.rows.length === 0 && rect.h > 2) {
    put(
      buf,
      theme,
      rect,
      "dim",
      2,
      rect.y + 2,
      "No notes match this view's filters",
    );
    if (o.empty !== undefined && rect.h > 3)
      put(buf, theme, rect, "dim", 2, rect.y + 3, o.empty);
  }
  /** Lines painted under the edited cell: its error, chips, or suggestions. */
  let under: { x: number; y: number; lines: Part[][] } | undefined;
  for (let i = 0; i < l.bodyRows; i++) {
    const line = l.lines[l.top + i];
    const y = rect.y + 2 + i;
    if (line === undefined) break;
    if (line.kind === "group") {
      put(
        buf,
        theme,
        rect,
        "baseGroup",
        0,
        y,
        ` ▾ ${line.label} (${line.count})`,
        rect.w,
      );
      continue;
    }
    const row = m.rows[line.row];
    const focusedRow = focus?.row === line.row;
    if (focusedRow) put(buf, theme, rect, "baseMarker", 0, y, "▌");
    for (const [k, c] of l.cols.entries()) {
      if (k > 0) put(buf, theme, rect, "separator", c.x - SEP.length, y, SEP);
      const cell = row?.cells[c.index];
      const focused = focusedRow && focus?.column === c.index;
      if (focused && focus?.edit !== undefined) {
        put(
          buf,
          theme,
          rect,
          "baseEdit",
          c.x,
          y,
          fit(focus.edit.value, c.w),
          c.w,
        );
        under = { x: c.x, y: y + 1, lines: underEdit(focus.edit) };
        continue;
      }
      const v = shown(cell);
      const text = fit(v.text, c.w);
      const padded =
        cell?.value.type === "number"
          ? text.padStart(c.w)
          : text + " ".repeat(Math.max(0, c.w - len(text)));
      put(
        buf,
        theme,
        rect,
        focused ? "baseFocus" : v.empty ? "dim" : "text",
        c.x,
        y,
        padded,
        c.w,
      );
    }
  }
  for (const [i, parts] of (under?.lines ?? []).entries()) {
    const y = (under?.y ?? 0) + i;
    if (y >= rect.y + 2 + l.bodyRows) break;
    let x = under?.x ?? 0;
    put(buf, theme, rect, "text", x, y, "", rect.w - x);
    for (const p of parts) {
      put(buf, theme, rect, p.token, x, y, p.text);
      x += len(p.text);
    }
  }
  // Summaries.
  if (l.summaries && rect.h >= 4) {
    const y = rect.y + rect.h - 2;
    sepRow(y, "─┴─");
    put(buf, theme, rect, "dim", 1, y + 1, "Σ");
    for (const [k, c] of l.cols.entries()) {
      if (k > 0)
        put(buf, theme, rect, "separator", c.x - SEP.length, y + 1, "   ");
      const sm = m.summaries[c.index];
      if (sm !== undefined)
        put(buf, theme, rect, "dim", c.x, y + 1, fit(sm.text, c.w), c.w);
    }
  }
  return l;
}

export type BoardFocus = { lane: number; card: number };

export type BoardLayout = {
  /** Shown lanes: model index and x from the rect's left. */
  lanes: { index: number; x: number }[];
  laneW: number;
  /** One-line cards in narrow windows; boxed cards with a meta line otherwise. */
  boxed: boolean;
  /** Rows per card. */
  cardRows: number;
  /** The first card shown in each shown lane, and how many show. */
  shown: Map<number, { first: number; count: number }>;
  /** Screen cell of the focused card's title, when shown. */
  cursor?: { x: number; y: number };
};

const MIN_LANE = 18;
/** Below this many columns cards take one line. */
export const WIDE_BOARD = 100;

/**
 * Where a board's lanes and cards go in `rect`: lanes share the width, at
 * least 18 cells each, scrolled so the focused lane shows; each lane is
 * scrolled so its focused card shows, keeping a row for `↓ N more`.
 */
export function layoutBaseBoard(
  rect: Rect,
  m: KanbanModel,
  focus?: BoardFocus,
  wide = rect.w >= WIDE_BOARD,
): BoardLayout {
  const n = Math.max(1, m.lanes.length);
  const even = Math.floor((rect.w - (n - 1)) / n);
  const laneW = even >= MIN_LANE ? even : Math.min(MIN_LANE, rect.w);
  const visible =
    even >= MIN_LANE ? n : Math.max(1, Math.floor((rect.w + 1) / (laneW + 1)));
  const off =
    focus === undefined
      ? 0
      : clamp(focus.lane - visible + 1, 0, Math.max(0, n - visible));
  const lanes: BoardLayout["lanes"] = [];
  for (let i = off; i < Math.min(m.lanes.length, off + visible); i++)
    lanes.push({ index: i, x: (i - off) * (laneW + 1) });
  const boxed = wide && laneW >= 6;
  const cardRows = boxed ? 4 : 1;
  const body = Math.max(0, rect.h - 1);
  const shown = new Map<number, { first: number; count: number }>();
  for (const lane of lanes) {
    const total = m.lanes[lane.index]?.cards.length ?? 0;
    const all = Math.floor(body / cardRows);
    // A lane that does not fit keeps one row for `↓ N more`.
    const fits =
      total > all ? Math.floor(Math.max(0, body - 1) / cardRows) : all;
    const first =
      focus?.lane === lane.index
        ? clamp(focus.card - fits + 1, 0, Math.max(0, total - fits))
        : 0;
    shown.set(lane.index, { first, count: Math.min(fits, total - first) });
  }
  const at = lanes.find((l) => l.index === focus?.lane);
  const slot = at === undefined ? undefined : shown.get(at.index);
  const k =
    focus === undefined || slot === undefined ? -1 : focus.card - slot.first;
  const cursor =
    at !== undefined && slot !== undefined && k >= 0 && k < slot.count
      ? {
          x: rect.x + at.x + (boxed ? 2 : 1),
          y: rect.y + 1 + k * cardRows + (boxed ? 1 : 0),
        }
      : undefined;
  return {
    lanes,
    laneW,
    boxed,
    cardRows,
    shown,
    ...(cursor === undefined ? {} : { cursor }),
  };
}

/**
 * Paint a board model in `rect` and nowhere else: lane headers `● name
 * count`, cards (boxed with a meta line when wide, one line when narrow)
 * with the focused one marked and its title reversed, `(empty)` lanes,
 * `↓ N more`, and `‹ ›` when lanes are scrolled off.
 */
export function paintBaseBoard(
  buf: OptimizedBuffer,
  theme: Theme,
  rect: Rect,
  m: KanbanModel,
  o: { focus?: BoardFocus; wide?: boolean } = {},
): BoardLayout {
  const l = layoutBaseBoard(rect, m, o.focus, o.wide);
  for (let i = 0; i < rect.h; i++)
    put(buf, theme, rect, "text", 0, rect.y + i, "", rect.w);
  if (rect.h <= 0) return l;
  const w = l.laneW;
  for (const lane of l.lanes) {
    const model = m.lanes[lane.index];
    if (model === undefined) continue;
    const head = fit(
      `${model.label} ${model.cards.length}`,
      Math.max(0, w - 2),
    );
    put(buf, theme, rect, `baseLane${lane.index % 4}`, lane.x, rect.y, "●");
    put(buf, theme, rect, "baseTitle", lane.x + 2, rect.y, head);
    if (len(head) + 3 < w)
      put(
        buf,
        theme,
        rect,
        "separator",
        lane.x + len(head) + 3,
        rect.y,
        "─".repeat(w - len(head) - 3),
      );
    if (model.cards.length === 0) {
      if (rect.h > 1)
        put(buf, theme, rect, "dim", lane.x, rect.y + 1, fit("  (empty)", w));
      continue;
    }
    const slot = l.shown.get(lane.index) ?? { first: 0, count: 0 };
    for (let k = 0; k < slot.count; k++) {
      const card = model.cards[slot.first + k];
      if (card === undefined) break;
      const y = rect.y + 1 + k * l.cardRows;
      const focused =
        o.focus?.lane === lane.index && o.focus.card === slot.first + k;
      if (!l.boxed) {
        put(buf, theme, rect, "baseMarker", lane.x, y, focused ? "▌" : " ");
        put(
          buf,
          theme,
          rect,
          focused ? "baseFocus" : "baseTitle",
          lane.x + 1,
          y,
          fit(card.title, w - 1),
          w - 1,
        );
        continue;
      }
      const border = focused ? "baseMarker" : "separator";
      const inner = w - 4;
      put(buf, theme, rect, border, lane.x, y, `╭${"─".repeat(w - 2)}╮`);
      put(buf, theme, rect, border, lane.x, y + 1, "│");
      put(
        buf,
        theme,
        rect,
        focused ? "baseFocus" : "baseTitle",
        lane.x + 2,
        y + 1,
        fit(card.title, inner),
        inner,
      );
      put(buf, theme, rect, border, lane.x + w - 1, y + 1, "│");
      put(buf, theme, rect, border, lane.x, y + 2, "│");
      put(
        buf,
        theme,
        rect,
        "dim",
        lane.x + 2,
        y + 2,
        fit(card.fields.slice(0, 2).join(" · "), inner),
        inner,
      );
      put(buf, theme, rect, border, lane.x + w - 1, y + 2, "│");
      put(buf, theme, rect, border, lane.x, y + 3, `╰${"─".repeat(w - 2)}╯`);
    }
    const more = model.cards.length - slot.first - slot.count;
    const y = rect.y + 1 + slot.count * l.cardRows;
    if (more > 0 && y < rect.y + rect.h)
      put(buf, theme, rect, "dim", lane.x, y, fit(`  ↓ ${more} more`, w));
  }
  const first = l.lanes[0]?.index ?? 0;
  const last = l.lanes.at(-1)?.index ?? 0;
  if (first > 0) put(buf, theme, rect, "dim", 0, rect.y, "‹");
  if (last < m.lanes.length - 1)
    put(buf, theme, rect, "dim", rect.w - 1, rect.y, "›");
  return l;
}

/**
 * A base embedded in a note, read-only: a framed title, the table or a
 * one-line board inside the frame (with the view's notice on the title
 * row), and `↓ N more` when the table is capped. A model with nothing to
 * show has its notice in the frame; `loading…` shows while the base is read,
 * and the title in the unresolved style with a notice when it cannot be shown.
 */
export const paintBaseEmbed: WidgetPainter = (t, w) => {
  const d = w.data as BaseEmbedData;
  const rect: Rect = { x: t.x, y: t.y, w: t.width, h: t.rows };
  const row = (i: number, parts: [string, string][]) => {
    let x = 0;
    for (const [text, token] of parts) {
      put(t.buf, t.theme, rect, token, x, t.y + i, text);
      x += len(text);
    }
    put(t.buf, t.theme, rect, "text", x, t.y + i, "", Math.max(0, t.width - x));
  };
  if (d.state === "missing") {
    row(0, [[`↳ ${d.title}`, "linkUnresolved"]]);
    for (let i = 1; i < t.rows; i++)
      row(i, i === 1 ? [[`  ${d.notice}`, "dim"]] : []);
    return;
  }
  const m = d.state === "ok" ? d.model : undefined;
  const shows = m?.table !== undefined || m?.board !== undefined;
  const title: [string, string][] = [
    ["╭ ", "dim"],
    [`↳ ${d.title}`, "mdLink"],
  ];
  if (shows && m?.notice !== undefined) title.push([`  ${m.notice}`, "dim"]);
  row(0, title);
  for (let i = 1; i < t.rows; i++) row(i, [["│", "dim"]]);
  if (m === undefined || !shows) {
    const text = m === undefined ? "loading…" : (m.notice ?? "");
    if (t.rows > 1) row(1, [[`│ ${text}`, "dim"]]);
    return;
  }
  const body = Math.min(m.bodyRows, Math.max(0, t.rows - 1));
  const inner: Rect = {
    x: t.x + 2,
    y: t.y + 1,
    w: Math.max(0, t.width - 2),
    h: body,
  };
  if (m.table !== undefined) paintBaseTable(t.buf, t.theme, inner, m.table);
  else if (m.board !== undefined)
    paintBaseBoard(t.buf, t.theme, inner, m.board, { wide: false });
  if (m.more > 0 && body + 1 < t.rows)
    row(body + 1, [[`╰ ↓ ${m.more} more`, "dim"]]);
};
