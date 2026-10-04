import type { OptimizedBuffer } from "@opentui/core";
import type { KanbanModel } from "../../core/features/bases/kanban";
import type { TableCell, TableModel } from "../../core/features/bases/table";
import type { Rect } from "../editors/text-view";
import { drawCells, type Theme } from "../theme";

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
/** The first body line and the first column the window prefers to show. */
export type TableScroll = { top: number; col: number };

type Line =
  | { kind: "group"; label: string; count: number }
  | { kind: "row"; row: number };

export type TableLayout = {
  /** Shown columns: model index, x from the rect's left, width in cells. */
  cols: { index: number; x: number; w: number }[];
  hidden: number;
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
const MAX_COL = 24;
const MORE_COLS = 11;

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

/** A cell as shown: checkboxes as boxes, empty values as a dim dash. */
function shown(c: TableCell | undefined): { text: string; empty: boolean } {
  if (c === undefined || c.value.type === "null" || c.text === "")
    return { text: "—", empty: true };
  if (c.value.type === "boolean")
    return { text: c.value.value ? "☑" : "☐", empty: false };
  return { text: c.text, empty: false };
}

const labelOf = (m: TableModel, i: number) => {
  const c = m.columns[i];
  if (c === undefined) return "";
  return c.sort === undefined
    ? c.label
    : `${c.label} ${c.sort === "ASC" ? "↑" : "↓"}`;
};

/**
 * Where a table's parts go in `rect`: the columns that fit from the
 * preferred first column (moved so the focused column shows), the body lines
 * with group headers, and the first line shown so the focused row shows.
 */
export function layoutBaseTable(
  rect: Rect,
  m: TableModel,
  focus?: TableFocus,
  scroll: TableScroll = { top: 0, col: 0 },
): TableLayout {
  const n = m.columns.length;
  const widths = m.columns.map((_, i) => {
    let w = len(labelOf(m, i));
    for (const r of m.rows) w = Math.max(w, len(shown(r.cells[i]).text));
    w = Math.min(w, MAX_COL);
    if (focus?.edit !== undefined && focus.column === i)
      w = Math.max(w, Math.min(len(focus.edit.value) + 1, rect.w - LEAD));
    return Math.max(1, w);
  });
  const fitFrom = (off: number, room: number) => {
    const out: number[] = [];
    let used = 0;
    for (let i = off; i < n; i++) {
      const w = (widths[i] ?? 1) + (out.length > 0 ? SEP.length : 0);
      if (out.length > 0 && used + w > room) break;
      out.push(i);
      used += w;
    }
    return out;
  };
  const visibleFrom = (off: number) => {
    const all = fitFrom(off, rect.w - LEAD);
    return off === 0 && all.length === n
      ? all
      : fitFrom(off, rect.w - LEAD - MORE_COLS);
  };
  let off = clamp(scroll.col, 0, Math.max(0, n - 1));
  if (focus !== undefined && focus.column < off) off = focus.column;
  let vis = visibleFrom(off);
  while (
    focus !== undefined &&
    off < focus.column &&
    !vis.includes(focus.column)
  )
    vis = visibleFrom(++off);
  const cols: TableLayout["cols"] = [];
  let x = LEAD;
  for (const index of vis) {
    const w = widths[index] ?? 1;
    cols.push({ index, x, w });
    x += w + SEP.length;
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

  const col = cols.find((c) => c.index === focus?.column);
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
    hidden: n - cols.length,
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
 * Paint a table model in `rect` and nowhere else: header with sort arrows
 * and `› +N cols`, group headers, rows with the focused cell reversed and
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
    for (const [k, c] of l.cols.entries())
      put(
        buf,
        theme,
        rect,
        "separator",
        k === 0 ? c.x : c.x - SEP.length,
        y,
        `${k === 0 ? "" : join}${"─".repeat(c.w)}`,
      );
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
  const last = l.cols.at(-1);
  if (l.hidden > 0 && last !== undefined)
    put(
      buf,
      theme,
      rect,
      "dim",
      last.x + last.w + 1,
      rect.y,
      ` › +${l.hidden} col${l.hidden > 1 ? "s" : ""}`,
    );
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
