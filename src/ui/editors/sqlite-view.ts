import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import type { TableModel } from "../../core/features/bases/table";
import type { SqliteWindowState } from "../../core/features/sqlite/file-type";
import { schemaLines } from "../../core/features/sqlite/schema";
import { sqliteTableModel } from "../../core/features/sqlite/table";
import { cellLines } from "../../core/features/sqlite/value";
import { createTextBuffer } from "../../core/kernel/text/text-buffer";
import type { Span } from "../../core/kernel/view/types";
import { windowBuffer } from "../../core/state/pdf";
import { panelFocused } from "../../core/state/side-panel";
import {
  focusedCell,
  rowCount,
  shownPage,
  shownTable,
  sqliteWindow,
} from "../../core/state/sqlite";
import type {
  AppState,
  BufferState,
  MouseTarget,
  WindowId,
  WindowSpot,
} from "../../core/state/types";
import type { Cursor, ViewDeps } from "../shell";
import { drawCells, type Theme, themeOf } from "../theme";
import {
  layoutBaseTable,
  paintBaseTable,
  type TableLayout,
} from "../widgets/base";
import type { WindowView } from "./registry";
import type { Rect } from "./text-view";

const cells = (t: string) => [...t].length;
/** The toolbar drops its status before the title gets narrower than this. */
const TITLE_MIN = 16;
const nameOf = (path: string) => path.split("/").pop() ?? path;
const n = (x: number) => x.toLocaleString("en-US");

/** A line of the schema or cell pane, in spans. */
type PaneLine = Span[];

/** What `show` worked out for the frame; `renderSelf` paints it. */
type Frame = {
  title: string;
  status: { text: string; token: string };
  hint: string;
  body: Rect;
  /** A message in place of the body: loading, not a database, or why it failed. */
  notice?: { lines: string[]; token: string };
  table?: {
    m: TableModel;
    layout: TableLayout;
    focus: { row: number; column: number };
    top: number;
    offset: number;
  };
  pane?: PaneLine[];
  paneTop: number;
};

/** Cut `text` into rows of at most `w` cells, keeping an empty line. */
function wrap(text: string, w: number): string[] {
  const cs = [...text];
  if (cs.length <= w) return [text];
  const out: string[] = [];
  for (let i = 0; i < cs.length; i += w) out.push(cs.slice(i, i + w).join(""));
  return out;
}

/**
 * A SQLite window: a toolbar naming the database and what it shows, then
 * the rows of a table or query in the shared table painter, the table's
 * schema, or one value whole; the last row lists the keys that apply.
 * Everything comes from the window state; the view keeps only the first row
 * it showed, so moving the focus scrolls only as needed.
 */
export class SqliteView extends Renderable implements WindowView {
  private s: AppState | undefined;
  private windowId: WindowId = 0;
  private rect: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private cursorAt: Cursor | undefined;
  private frame: Frame | undefined;
  /** The first row shown, counted from the source's first row. */
  private rowTop = 0;

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
    this.cursorAt = undefined;
    this.frame = undefined;
    const b = windowBuffer(s, id);
    const ws = sqliteWindow(s, id);
    if (b === undefined || ws === undefined || r.h <= 0 || r.w <= 0) return;
    const body: Rect = { x: r.x, y: r.y + 2, w: r.w, h: Math.max(0, r.h - 3) };
    const frame = this.frameOf(b, ws, body);
    this.frame = frame;
    const col = frame.table?.layout.left ?? ws.col;
    const lines = frame.pane?.length ?? 0;
    if (ws.col !== col || ws.bodyRows !== body.h || ws.paneLines !== lines)
      // The core keeps what was drawn so `H`/`L`, half-window moves, and pane scrolls follow it.
      queueMicrotask(() =>
        this.deps.dispatch({
          type: "sqliteLaidOut",
          window: id,
          col,
          rows: body.h,
          lines,
        }),
      );
    const focused =
      id === s.windows.active && !s.panels.explorer.focused && !panelFocused(s);
    const at = frame.table?.layout.cursor;
    if (focused && at !== undefined) this.cursorAt = { ...at, style: "block" };
  }

  private frameOf(b: BufferState, ws: SqliteWindowState, body: Rect): Frame {
    const name = nameOf(b.path);
    const src = ws.source;
    const what =
      src === undefined
        ? ""
        : src.kind === "table"
          ? ` › ${src.name}`
          : ` › ${src.sql.replace(/\s+/g, " ")}`;
    const frame: Frame = {
      title: ` ▤ ${name}${what} `,
      status: { text: "", token: "dim" },
      hint: "",
      body,
      paneTop: ws.paneTop,
    };
    const info = b.sqlite;
    if (info === undefined || info.status === "loading")
      return {
        ...frame,
        notice: { lines: [`Reading ${name}…`], token: "dim" },
      };
    if (info.status === "notSqlite")
      return {
        ...frame,
        notice: {
          lines: [
            `${name} is not a SQLite database.`,
            ":Open shows it in the system viewer.",
          ],
          token: "messageError",
        },
      };
    if (info.status === "failed")
      return {
        ...frame,
        notice: {
          lines: [`Cannot open ${name}: ${info.reason}`],
          token: "messageError",
        },
      };
    if (src === undefined)
      return {
        ...frame,
        notice: { lines: ["No tables or views."], token: "dim" },
      };
    if (ws.pane === "schema") return this.schemaFrame(frame, b, ws);
    if (ws.pane === "cell") return this.cellFrame(frame, ws);
    return this.rowsFrame(frame, b, ws);
  }

  private rowsFrame(
    frame: Frame,
    b: BufferState,
    ws: SqliteWindowState,
  ): Frame {
    const query = ws.source?.kind === "query";
    const back =
      query && ws.back !== undefined ? `esc back to ${ws.back} · ` : "";
    const hint = `${back}⏎ value · y copy · t tables${query ? "" : " · ⇥ schema"} · R reload · s query`;
    const p = shownPage(ws);
    const loading = ws.want !== undefined;
    if (p === undefined)
      return {
        ...frame,
        hint,
        notice: { lines: ["Reading rows…"], token: "dim" },
      };
    if (p.status === "failed")
      return {
        ...frame,
        hint,
        notice: { lines: p.reason.split("\n"), token: "messageError" },
      };
    const count = rowCount(b, ws);
    const total = count === undefined ? "" : ` of ${n(count)}`;
    const shown =
      p.rows.length === 0
        ? "no rows"
        : `rows ${n(p.offset + 1)}–${n(p.offset + p.rows.length)}${total}`;
    const status = {
      text: loading ? `${shown} · reading…` : shown,
      token: "dim",
    };
    const m = sqliteTableModel(p.columns, p.rows, ws.widths);
    if (p.rows.length === 0) {
      const layout = layoutBaseTable(frame.body, m);
      return {
        ...frame,
        hint,
        status,
        table: {
          m,
          layout,
          focus: { row: 0, column: 0 },
          top: 0,
          offset: p.offset,
        },
      };
    }
    // The focus may wait for its page; the nearest loaded row stands in.
    const rel = Math.max(0, Math.min(ws.row - p.offset, p.rows.length - 1));
    const focus = { row: rel, column: ws.column };
    const layout = layoutBaseTable(frame.body, m, focus, {
      top: Math.max(0, this.rowTop - p.offset),
      col: ws.col,
    });
    this.rowTop = layout.top + p.offset;
    return {
      ...frame,
      hint: layout.left + layout.right > 0 ? `${hint} · H/L columns` : hint,
      status,
      table: { m, layout, focus, top: layout.top, offset: p.offset },
    };
  }

  private schemaFrame(
    frame: Frame,
    b: BufferState,
    ws: SqliteWindowState,
  ): Frame {
    const t = shownTable(b, ws);
    const hint = "⇥ rows · j/k scroll · t tables";
    if (t === undefined) return { ...frame, hint };
    const sql = this.deps.reg.fileTypes.get("sql")?.highlighter;
    const lines = schemaLines(t);
    const sqlLines = lines.filter((l) => l.kind === "sql").map((l) => l.text);
    const spans =
      sql === undefined
        ? undefined
        : sql.highlight(createTextBuffer(sqlLines.join("\n")), {
            from: 0,
            to: sqlLines.length,
          });
    let k = 0;
    const pane: PaneLine[] = [];
    for (const l of lines) {
      if (l.kind === "sql") {
        const own = spans?.[k++];
        pane.push(
          own !== undefined && own.length > 0
            ? own
            : [{ text: l.text, style: "text" }],
        );
      } else
        pane.push([
          { text: l.text, style: l.kind === "heading" ? "baseHeader" : "text" },
        ]);
    }
    return {
      ...frame,
      hint,
      status: { text: `${t.kind} · schema`, token: "dim" },
      pane,
    };
  }

  private cellFrame(frame: Frame, ws: SqliteWindowState): Frame {
    const c = focusedCell(ws);
    const p = shownPage(ws);
    const column = p?.status === "ok" ? p.columns[ws.column] : undefined;
    const hint = "q back · j/k scroll · y copy";
    if (c === undefined || column === undefined) return { ...frame, hint };
    const v = cellLines(c);
    const w = Math.max(1, frame.body.w - 2);
    const pane: PaneLine[] = [
      [{ text: `${column}, row ${n(ws.row + 1)}`, style: "baseHeader" }],
      [{ text: v.head, style: "dim" }],
      [],
      ...v.lines.flatMap((l) =>
        wrap(l, w).map((t) => [{ text: t, style: "text" }]),
      ),
    ];
    return { ...frame, hint, status: { text: "value", token: "dim" }, pane };
  }

  cursor(): Cursor | undefined {
    return this.cursorAt;
  }

  /** A grid cell or header separator under (x, y); any other cell is the window itself. */
  targetAt(x: number, y: number): MouseTarget | undefined {
    const r = this.rect;
    if (x < r.x || x >= r.x + r.w || y < r.y || y >= r.y + r.h)
      return undefined;
    const at = (spot: WindowSpot): MouseTarget => ({
      kind: "window",
      window: this.windowId,
      spot,
    });
    const t = this.frame?.table;
    const body = this.frame?.body;
    if (t === undefined || body === undefined) return at({ kind: "sqlite" });
    return at(
      edgeAt(body, t.layout, x, y) ??
        cellAt(body, t.layout, t.offset, x, y) ?? { kind: "sqlite" },
    );
  }

  /** A header separator dragged to column `x` leaves its column the cells left of `x`. */
  dragAt(x: number, _y: number, from: WindowSpot): MouseTarget | undefined {
    const f = this.frame;
    const col = f?.table?.layout.cols.find(
      (c) => from.kind === "sqliteEdge" && c.index === from.column,
    );
    if (f === undefined || col === undefined) return undefined;
    return {
      kind: "window",
      window: this.windowId,
      spot: {
        kind: "sqliteEdge",
        column: col.index,
        width: Math.max(1, x - (f.body.x + col.x) - 1),
      },
    };
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    if (s === undefined) return;
    const theme = themeOf(s);
    const r = this.rect;
    for (let i = 0; i < r.h; i++)
      drawCells(buf, theme.style("text"), r.x, r.y + i, "", r.w);
    const f = this.frame;
    if (f === undefined) return;
    this.paintToolbar(buf, theme, f);
    if (r.h > 1)
      drawCells(
        buf,
        theme.style("separator"),
        r.x,
        r.y + 1,
        "─".repeat(r.w),
        r.w,
      );
    if (r.h > 2)
      drawCells(buf, theme.style("dim"), r.x, r.y + r.h - 1, ` ${f.hint}`, r.w);
    const body = f.body;
    if (f.notice !== undefined) {
      for (const [i, line] of f.notice.lines.slice(0, body.h).entries())
        drawCells(
          buf,
          theme.style(f.notice.token),
          body.x,
          body.y + i,
          ` ${line}`,
          body.w,
        );
      return;
    }
    if (f.table !== undefined) {
      paintBaseTable(buf, theme, body, f.table.m, {
        focus: f.table.focus,
        scroll: { top: f.table.top, col: f.table.layout.left },
      });
      return;
    }
    const pane = f.pane ?? [];
    const top = Math.max(0, Math.min(f.paneTop, pane.length - body.h));
    for (let i = 0; i < body.h; i++) {
      const line = pane[top + i];
      if (line === undefined) break;
      let x = body.x + 1;
      for (const sp of line) {
        const w = Math.min(cells(sp.text), body.x + body.w - x);
        if (w <= 0) break;
        drawCells(buf, theme.style(sp.style), x, body.y + i, sp.text, w);
        x += cells(sp.text);
      }
    }
  }

  /** The database and what it shows on the left; the rows shown, or the pane, on the right. */
  private paintToolbar(buf: OptimizedBuffer, theme: Theme, f: Frame): void {
    const r = this.rect;
    let right = f.status.text === "" ? "" : ` ${f.status.text} `;
    if (r.w - cells(right) < TITLE_MIN) right = "";
    const room = Math.max(0, r.w - cells(right));
    const title =
      cells(f.title) <= room
        ? f.title
        : `${[...f.title].slice(0, Math.max(0, room - 2)).join("")}… `;
    drawCells(buf, theme.style("baseTitle"), r.x, r.y, title, room);
    if (right !== "")
      drawCells(
        buf,
        theme.style(f.status.token),
        r.x + r.w - cells(right),
        r.y,
        right,
        cells(right),
      );
  }
}

/** The header separator right of a shown, unclipped column at screen cell (x, y). */
function edgeAt(
  body: Rect,
  l: TableLayout,
  x: number,
  y: number,
): WindowSpot | undefined {
  if (y !== body.y) return undefined;
  const col = l.cols.find((c) => !c.clipped && x === body.x + c.x + c.w + 1);
  return col === undefined
    ? undefined
    : { kind: "sqliteEdge", column: col.index, width: col.w };
}

/** The grid cell at screen cell (x, y); its row counted from the source's first row. */
function cellAt(
  body: Rect,
  l: TableLayout,
  offset: number,
  x: number,
  y: number,
): WindowSpot | undefined {
  const i = y - body.y - 2;
  if (i < 0 || i >= l.bodyRows) return undefined;
  const line = l.lines[l.top + i];
  const col = l.cols.find((c) => x >= body.x + c.x && x < body.x + c.x + c.w);
  return line?.kind === "row" && col !== undefined
    ? { kind: "sqliteCell", row: offset + line.row, column: col.index }
    : undefined;
}
