import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
  TextAttributes,
} from "@opentui/core";
import { calendarMarks } from "../../core/state/calendar";
import type { AppState, CalendarState } from "../../core/state/types";
import { formatDate } from "../../core/time/format";
import { daysInMonth, mondayIndex } from "../../core/time/local";
import type { Cursor, LayoutClass } from "../shell";
import { drawCells, themeOf } from "../theme";
import { centered, drawFrame } from "./host";

const WIDTH = 36;
const HEIGHT = 12;
/** Cells per day: a lead ("[" when selected), two digits, and the mark. */
const CELL = 4;
const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const calendarOf = (s: AppState): CalendarState | undefined =>
  s.overlay.kind === "calendar" ? s.overlay.calendar : undefined;

const same = (a: CalendarState["today"], b: CalendarState["today"]) =>
  a.year === b.year && a.month === b.month && a.day === b.day;

/** The day's grid cell: Monday-first columns, six week rows. */
function cellOf(cal: CalendarState, day: number): { row: number; col: number } {
  const first = mondayIndex({ ...cal.month, day: 1 });
  const i = first + day - 1;
  return { row: Math.floor(i / 7), col: i % 7 };
}

/**
 * The daily-note calendar: a fixed 36×12 float with the month title, a
 * Monday-first grid, `•` after days that have a note, today underlined, and
 * the selected day in brackets and reverse video with the cursor on it.
 * It paints the core's calendar state; keys go to the core.
 */
export class CalendarOverlay extends Renderable {
  private s: AppState | undefined;
  private marks: ReadonlySet<number> = new Set();
  private cursorAt: Cursor | undefined;

  constructor(ctx: RenderContext) {
    super(ctx, { position: "absolute", left: 0, top: 0 });
  }

  update(s: AppState, _lc: LayoutClass): void {
    this.s = s;
    this.width = s.terminal.cols;
    this.height = s.terminal.rows;
    const cal = calendarOf(s);
    this.visible = cal !== undefined;
    this.cursorAt = undefined;
    if (cal === undefined) return;
    this.marks = calendarMarks(s);
    const box = centered(s, WIDTH, HEIGHT);
    const { row, col } = cellOf(cal, cal.selected.day);
    this.cursorAt = {
      x: box.x + 3 + col * CELL,
      y: box.y + 2 + row,
      style: "block",
    };
  }

  cursor(): Cursor | undefined {
    return this.cursorAt;
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    const cal = s && calendarOf(s);
    if (s === undefined || cal === undefined) return;
    const theme = themeOf(s);
    const box = centered(s, WIDTH, HEIGHT);
    const title = formatDate(
      { ...cal.month, day: 1, hour: 0, minute: 0, second: 0, weekday: 0 },
      "MMMM YYYY",
    );
    drawFrame(buf, theme, box, {
      border: "floatBorder",
      fill: "float",
      title: `‹ ${title} ›`,
      footer: "hjkl move · H/L month",
    });
    const x0 = box.x + 1;
    const y0 = box.y + 1;
    const dim = theme.style("floatDim");
    drawCells(
      buf,
      dim,
      x0,
      y0,
      ` ${DAYS.map((d) => ` ${d} `).join("")}`.slice(0, 29),
      29,
    );
    const base = theme.style("float");
    const sel = theme.style("floatSel");
    const mark = theme.style("calendarMark");
    const underline = (st: typeof base) => ({
      ...st,
      attrs: st.attrs | TextAttributes.UNDERLINE,
    });
    for (
      let day = 1;
      day <= daysInMonth(cal.month.year, cal.month.month);
      day++
    ) {
      const { row, col } = cellOf(cal, day);
      const x = x0 + 1 + col * CELL;
      const y = y0 + 1 + row;
      const date = { ...cal.month, day };
      const selected = same(date, cal.selected);
      const digits = selected ? sel : base;
      if (selected) {
        drawCells(buf, sel, x, y, "[", 1);
        drawCells(buf, sel, x + 3, y, " ", 1);
        drawCells(buf, sel, x + 4, y, "]", 1);
      }
      drawCells(
        buf,
        same(date, cal.today) ? underline(digits) : digits,
        x + 1,
        y,
        String(day).padStart(2),
        2,
      );
      if (this.marks.has(day))
        drawCells(buf, selected ? sel : mark, x + 3, y, "•", 1);
    }
    if (s.index.status !== "ready")
      drawCells(
        buf,
        dim,
        x0,
        y0 + 8,
        " indexing — marks may be missing",
        WIDTH - 2,
      );
    drawCells(buf, dim, x0, y0 + 9, " ⏎ open · t today · esc close", WIDTH - 2);
  }
}
