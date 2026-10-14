import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import { createTextBuffer } from "../../core/kernel/text/text-buffer";
import type { Span } from "../../core/kernel/view/types";
import { windowBuffer } from "../../core/state/pdf";
import { sqliteWindow } from "../../core/state/sqlite";
import type { AppState, SqliteQueryState } from "../../core/state/types";
import type { Cursor, LayoutClass, ViewDeps } from "../shell";
import { drawCells, themeOf } from "../theme";
import { centered, drawFrame } from "./host";

/** The fewest and most rows the query text takes. */
const TEXT_MIN = 3;
const TEXT_MAX = 10;

const FOOTER = "⏎ run · ⌃J new line · ⇥ complete · ↑↓ history · esc close";

type Piece = { text: string; style: string };
/** One screen row of the query: its pieces and the text offset it starts at. */
type Row = { pieces: Piece[]; from: number; length: number };

const nameOf = (path: string) => path.slice(path.lastIndexOf("/") + 1);

/**
 * The query's rows at `width` cells: each line cut into rows of at most
 * `width` characters, after a space when there is one, coloured by
 * `spans` (one list per line) when there are any.
 */
function rowsOf(
  value: string,
  width: number,
  spans: Span[][] | undefined,
): Row[] {
  const rows: Row[] = [];
  let offset = 0;
  value.split("\n").forEach((line, i) => {
    const pieces: Piece[] = [];
    for (const sp of spans?.[i] ?? [{ text: line, style: "float" }])
      for (const ch of sp.text) pieces.push({ text: ch, style: sp.style });
    const chars = [...line];
    let at = 0;
    let units = 0;
    do {
      let n = Math.min(width, chars.length - at);
      if (at + n < chars.length) {
        const space = chars.slice(at, at + n).lastIndexOf(" ");
        if (space > 0) n = space + 1;
      }
      const length = chars.slice(at, at + n).join("").length;
      rows.push({
        pieces: pieces.slice(at, at + n),
        from: offset + units,
        length,
      });
      at += n;
      units += length;
    } while (at < chars.length);
    offset += line.length + 1;
  });
  return rows;
}

/** The row and column of text offset `caret`; a caret where a line wraps starts the next row. */
function caretAt(rows: Row[], caret: number) {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] as Row;
    const end = row.from + row.length;
    const last = r === rows.length - 1 || (rows[r + 1]?.from ?? 0) > end;
    if (caret >= row.from && (caret < end || (caret === end && last))) {
      const text = row.pieces.map((p) => p.text).join("");
      return { row: r, col: [...text.slice(0, caret - row.from)].length };
    }
  }
  return { row: Math.max(0, rows.length - 1), col: 0 };
}

/**
 * The SQLite query dialog: the query, coloured as SQL and wrapped, then
 * whether it would run (its columns, or SQLite's reason) and the names `Tab`
 * could not choose between. Keys go to the core, which decides.
 */
export class SqliteQueryView extends Renderable {
  private s: AppState | undefined;
  private cursorAt: Cursor | undefined;

  constructor(
    ctx: RenderContext,
    private readonly deps: ViewDeps,
  ) {
    super(ctx, { position: "absolute", left: 0, top: 0 });
  }

  private layout(s: AppState, q: SqliteQueryState) {
    const box0 = centered(s, Math.min(100, s.terminal.cols - 4), 0);
    const width = Math.max(1, box0.w - 4);
    const sql = this.deps.reg.fileTypes.get("sql")?.highlighter;
    const value = q.field.value;
    const spans =
      value === "" || sql === undefined
        ? undefined
        : sql.highlight(createTextBuffer(value), {
            from: 0,
            to: value.split("\n").length,
          });
    const rows = rowsOf(value, width, spans);
    const textRows = Math.max(TEXT_MIN, Math.min(TEXT_MAX, rows.length));
    const box = centered(s, box0.w, textRows + 6);
    const at = caretAt(rows, q.field.caret);
    const top = Math.max(0, at.row - (textRows - 1));
    return { box, width, rows, textRows, at, top };
  }

  update(s: AppState, _lc: LayoutClass): void {
    this.s = s;
    this.width = s.terminal.cols;
    this.height = s.terminal.rows;
    this.visible = s.overlay.kind === "sqliteQuery";
    this.cursorAt = undefined;
    if (s.overlay.kind !== "sqliteQuery") return;
    const { box, at, top } = this.layout(s, s.overlay.query);
    this.cursorAt = {
      x: box.x + 2 + at.col,
      y: box.y + 2 + at.row - top,
      style: "line",
    };
  }

  cursor(): Cursor | undefined {
    return this.cursorAt;
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    if (s === undefined || s.overlay.kind !== "sqliteQuery") return;
    const q = s.overlay.query;
    const theme = themeOf(s);
    const body = theme.style("float");
    const { box, width, rows, textRows, top } = this.layout(s, q);
    const name = nameOf(windowBuffer(s, q.window)?.path ?? "");
    const failed = q.check.status === "failed";
    drawFrame(buf, theme, box, {
      border: failed ? "floatError" : "floatBorder",
      fill: "float",
      title: `Query · ${name}`,
      footer: FOOTER,
    });
    const x = box.x + 2;
    if (q.field.value === "") {
      const src = sqliteWindow(s, q.window)?.source;
      const table = src?.kind === "table" ? src.name : "a_table";
      drawCells(
        buf,
        theme.style("floatDim"),
        x,
        box.y + 2,
        `select * from ${table} limit 10`,
        width,
      );
    } else
      for (let i = 0; i < textRows; i++) {
        const row = rows[top + i];
        if (row === undefined) break;
        let cx = x;
        for (const p of row.pieces) {
          drawCells(
            buf,
            { ...theme.style(p.style), bg: body.bg },
            cx,
            box.y + 2 + i,
            p.text,
            1,
          );
          cx++;
        }
      }
    const y = box.y + 3 + textRows;
    const check = q.check;
    const line =
      check.status === "ok"
        ? {
            text: `✓ ${check.columns.length === 1 ? "1 column" : `${check.columns.length} columns`}: ${check.columns.join(", ")}`,
            token: "floatDim",
          }
        : check.status === "failed"
          ? {
              text: `✗ ${check.reason.split("\n")[0] ?? ""}`,
              token: "floatError",
            }
          : check.status === "checking"
            ? { text: "… checking", token: "floatDim" }
            : {
                text: "One read-only statement. ⇥ completes table and column names.",
                token: "floatDim",
              };
    drawCells(buf, theme.style(line.token), x, y, line.text, width);
    if (q.matches !== undefined)
      drawCells(
        buf,
        theme.style("floatDim"),
        x,
        y + 1,
        q.matches.join("  "),
        width,
      );
  }
}
