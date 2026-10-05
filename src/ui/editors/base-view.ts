import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import type { BaseWindowState } from "../../core/features/bases/file-type";
import { type BaseViewModel, baseWindow } from "../../core/state/base-model";
import { panelFocused } from "../../core/state/side-panel";
import type { AppState, MouseTarget, WindowId } from "../../core/state/types";
import type { Cursor, ViewDeps } from "../shell";
import { drawCells, type Theme, themeOf } from "../theme";
import {
  layoutBaseBoard,
  layoutBaseTable,
  paintBaseBoard,
  paintBaseTable,
  type TableFocus,
} from "../widgets/base";
import type { WindowView } from "./registry";
import type { Rect } from "./text-view";

const cells = (t: string) => [...t].length;

/** A property id as the toolbar names it: `file.name` → `name`. */
const shortName = (property: string) =>
  property.replace(/^(file|formula|note)\./, "");

type Part = { text: string; token: string };

type Frame = {
  m: BaseViewModel;
  ws: BaseWindowState | undefined;
  notices: Part[];
  body: Rect;
  focus?: TableFocus;
};

/**
 * A base window: a toolbar naming the base, its views, and what the view
 * shows; notices; the table or board; and a row of the keys that apply.
 * Everything comes from the base view model, so the view holds no state but
 * where it last put the cursor.
 */
export class BaseView extends Renderable implements WindowView {
  private s: AppState | undefined;
  private windowId: WindowId = 0;
  private rect: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private cursorAt: Cursor | undefined;
  /** What `show` derived for this frame; `renderSelf` paints it. */
  private frame: Frame | undefined;
  /** The first table line shown, kept so moving the focus scrolls only as needed. */
  private rowTop = 0;

  constructor(
    ctx: RenderContext,
    private readonly deps: ViewDeps,
  ) {
    super(ctx, { position: "absolute" });
  }

  /**
   * Place the view and follow window `id`. The model and body layout are
   * worked out here, so the cursor is known before the frame is painted.
   */
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
    const m = this.deps.reg.viewContexts.build("base", s, id, {
      width: r.w,
      rows: r.h,
      imageSize: () => undefined,
      cellAspect: 0.5,
    }) as BaseViewModel | undefined;
    if (m === undefined || r.h <= 0) return;
    const ws = baseWindow(s, id);
    const notices = noticesOf(m).slice(0, Math.max(0, r.h - 4));
    const y = r.y + 2 + notices.length;
    const hintY = r.y + r.h - 1;
    const body: Rect = { x: r.x, y, w: r.w, h: Math.max(0, hintY - y) };
    const frame: Frame = { m, ws, notices, body };
    let at: { x: number; y: number } | undefined;
    if (m.status === "ok" && m.table !== undefined && m.table.rows.length > 0) {
      const edit = ws?.edit;
      frame.focus = {
        row: m.focus.row,
        column: m.focus.column,
        ...(edit === undefined
          ? {}
          : {
              edit: {
                value: edit.value,
                caret: cells(edit.value.slice(0, edit.caret)),
                ...(edit.error === undefined ? {} : { error: edit.error }),
                ...(edit.items === undefined
                  ? {}
                  : {
                      chips: edit.items.map((x) =>
                        edit.type === "tags" ? `#${x}` : x,
                      ),
                    }),
                ...(m.suggestions === undefined || m.suggestions.length === 0
                  ? {}
                  : { suggestions: m.suggestions }),
              },
            }),
      };
      const l = layoutBaseTable(body, m.table, frame.focus, {
        top: this.rowTop,
        col: ws?.scroll.col ?? 0,
      });
      this.rowTop = l.top;
      at = l.cursor;
    } else if (m.status === "ok" && m.board !== undefined)
      at = layoutBaseBoard(body, m.board, {
        lane: m.focus.lane,
        card: m.focus.card,
      }).cursor;
    this.frame = frame;
    const focused =
      id === s.windows.active && !s.panels.explorer.focused && !panelFocused(s);
    if (focused && at !== undefined)
      this.cursorAt = {
        ...at,
        style: ws?.edit === undefined ? "block" : "line",
      };
  }

  cursor(): Cursor | undefined {
    return this.cursorAt;
  }

  /** Any cell of the window is the base. */
  targetAt(x: number, y: number): MouseTarget | undefined {
    const r = this.rect;
    if (x < r.x || x >= r.x + r.w || y < r.y || y >= r.y + r.h)
      return undefined;
    return { kind: "window", window: this.windowId, spot: { kind: "base" } };
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
    const { m, body } = f;
    this.paintToolbar(buf, theme, m, r.w < 100);
    if (r.h > 1)
      drawCells(
        buf,
        theme.style("separator"),
        r.x,
        r.y + 1,
        "─".repeat(r.w),
        r.w,
      );
    for (const [i, n] of f.notices.entries())
      drawCells(buf, theme.style(n.token), r.x, r.y + 2 + i, ` ${n.text}`, r.w);
    if (r.h > 3)
      drawCells(
        buf,
        theme.style("dim"),
        r.x,
        r.y + r.h - 1,
        ` ${hintOf(m, f.ws)}`,
        r.w,
      );
    if (m.status !== "ok") return;
    if (m.table !== undefined)
      paintBaseTable(buf, theme, body, m.table, {
        ...(f.focus === undefined ? {} : { focus: f.focus }),
        scroll: { top: this.rowTop, col: f.ws?.scroll.col ?? 0 },
        ...(m.filters === "on"
          ? { empty: "f shows the notes this view's filters hide" }
          : {}),
      });
    else if (m.board !== undefined)
      paintBaseBoard(buf, theme, body, m.board, {
        focus: { lane: m.focus.lane, card: m.focus.card },
      });
  }

  /** ` ▦ name  tabs` on the left, what the view shows on the right. */
  private paintToolbar(
    buf: OptimizedBuffer,
    theme: Theme,
    m: BaseViewModel,
    narrow: boolean,
  ): void {
    const r = this.rect;
    const at = m.views.findIndex((v) => v.name === m.selected);
    const left: Part[] = [{ text: ` ▦ ${m.title}  `, token: "baseTitle" }];
    if (m.views.length > 0) {
      const full = m.views.map((v, i) => ({
        text: ` ${i + 1} ${v.name} `,
        token: i === at ? "baseTabActive" : "baseTab",
      }));
      const width = full.reduce((n, p) => n + cells(p.text), 0);
      if (!narrow || cells(left[0]?.text ?? "") + width <= r.w / 2)
        left.push(...full);
      else
        left.push({
          text: ` ${at + 1}/${m.views.length} ${m.selected} `,
          token: "baseTabActive",
        });
    }
    let right = statusOf(m);
    let x = 0;
    for (const p of left) {
      if (x >= r.w) break;
      drawCells(
        buf,
        theme.style(p.token),
        r.x + x,
        r.y,
        p.text,
        Math.min(cells(p.text), r.w - x),
      );
      x += cells(p.text);
    }
    const width = (ps: Part[]) => ps.reduce((n, p) => n + cells(p.text), 0);
    // When it does not fit, without the filter expression, then the count
    // (or the state) alone.
    for (const fallback of ["noFilter", "short"] as const)
      if (width(right) > r.w - x - 2) right = statusOf(m, fallback);
    const rw = width(right);
    let rx = Math.max(x + 1, r.w - rw - 1);
    for (const p of right) {
      if (rx >= r.w) break;
      drawCells(
        buf,
        theme.style(p.token),
        r.x + rx,
        r.y,
        p.text,
        Math.min(cells(p.text), r.w - rx),
      );
      rx += cells(p.text);
    }
  }
}

/** Toolbar cells the filter expression may take before it is cut. */
const MAX_FILTER = 32;

/** Cut `text` to `w` cells with a trailing `…`. */
const clip = (text: string, w: number) =>
  cells(text) <= w ? text : `${[...text].slice(0, w - 1).join("")}…`;

/** The toolbar's right side: filters, sort, and count; or why it shows nothing. */
function statusOf(
  m: BaseViewModel,
  fit: "full" | "noFilter" | "short" = "full",
): Part[] {
  const short = fit === "short";
  if (m.status === "waiting")
    return [{ text: "◌ waiting for index", token: "dim" }];
  if (m.status === "parseError")
    return [{ text: "✗ not valid YAML", token: "messageError" }];
  const parts: string[] = [];
  if (m.filter !== undefined && fit === "full")
    parts.push(`⧩ ${clip(m.filter, MAX_FILTER)}`);
  if (m.filters === "off") parts.push("view filters off");
  if (m.board !== undefined) {
    const cards = m.board.lanes.reduce((n, l) => n + l.cards.length, 0);
    parts.push(
      `group: ${shortName(m.board.property)}`,
      `${cards} card${cards === 1 ? "" : "s"}`,
    );
    const text = (short ? parts.slice(-1) : parts).join(" · ");
    if (short && !m.board.movable)
      return [{ text: "⊘ moves off", token: "baseWarn" }];
    return m.board.movable
      ? [{ text, token: "dim" }]
      : [
          { text: "⊘ moves off", token: "baseWarn" },
          { text: ` · ${text}`, token: "dim" },
        ];
  }
  if (m.sort !== undefined)
    parts.push(
      `⇅ ${shortName(m.sort.property)} ${m.sort.direction === "ASC" ? "↑" : "↓"}`,
    );
  const n = m.table?.total ?? 0;
  parts.push(`${n} row${n === 1 ? "" : "s"}`);
  return [
    { text: (short ? parts.slice(-1) : parts).join(" · "), token: "dim" },
  ];
}

/** Lines under the toolbar: the layout fallback, diagnostics, a parse error. */
function noticesOf(m: BaseViewModel): Part[] {
  const out: Part[] = [];
  if (m.message !== undefined)
    out.push({ text: `✗ ${m.message}`, token: "messageError" });
  if (m.notice !== undefined)
    out.push({ text: `ⓘ ${m.notice}`, token: "baseInfo" });
  const shown = m.diagnostics.filter((d) => d.severity !== "info");
  const first = shown[0];
  if (first !== undefined)
    out.push({
      text: `▲ ${shown.length} diagnostic${shown.length === 1 ? "" : "s"}: ${first.message}`,
      token: "baseWarn",
    });
  return out;
}

/** The keys that apply to what the window shows. */
function hintOf(m: BaseViewModel, ws: BaseWindowState | undefined): string {
  if (m.status !== "ok") return "Tab next view · 1-4 switch view";
  if (ws?.edit?.items !== undefined)
    return "editing — ⏎ add · ⏎ on empty writes · ⌫ removes · esc cancel";
  if (ws?.edit !== undefined)
    return m.suggestions !== undefined && m.suggestions.length > 0
      ? "editing — Tab complete · ⏎ write to frontmatter · esc cancel"
      : "editing — ⏎ write to frontmatter · esc cancel";
  if (m.board !== undefined)
    return m.board.movable
      ? "h/l j/k focus · H/L move card · ⏎ open note · v views · Tab next"
      : "h/l j/k focus · H/L off · ⏎ open note · v views · Tab next";
  return "h/j/k/l cell · i edit · x toggle · s sort · g group · f filter · ⏎ open";
}
