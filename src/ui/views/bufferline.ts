import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import { activeBuffer, listedBuffers } from "../../core/state/buffers";
import type { AppState, BufferId, MouseTarget } from "../../core/state/types";
import type { LayoutClass } from "../shell";
import { drawCells, themeOf } from "../theme";

const basename = (path: string) => path.slice(path.lastIndexOf("/") + 1);
const cells = (text: string) => [...text].length;

/**
 * Row 0: one tab per open buffer, the active one raised, `●` on dirty ones,
 * and the workspace root on the right when the terminal is wide enough.
 * Tabs that do not fit scroll so the active one stays visible (`‹ ›`).
 */
export class Bufferline extends Renderable {
  private s: AppState | undefined;
  private lc: LayoutClass = "wide";
  /** The painted tabs' columns, `x0` inclusive and `x1` exclusive. */
  private tabs: { x0: number; x1: number; bufferId: BufferId }[] = [];

  constructor(ctx: RenderContext) {
    super(ctx, { position: "absolute", left: 0, top: 0, height: 1 });
  }

  update(s: AppState, lc: LayoutClass): void {
    this.s = s;
    this.lc = lc;
    this.width = s.terminal.cols;
  }

  /** A painted tab, or any other cell of row 0, which takes no click. */
  targetAt(x: number, y: number): MouseTarget | undefined {
    const s = this.s;
    if (s === undefined || y !== 0 || x < 0 || x >= s.terminal.cols)
      return undefined;
    const tab = this.tabs.find((t) => x >= t.x0 && x < t.x1);
    return tab === undefined
      ? { kind: "inert" }
      : { kind: "bufferTab", bufferId: tab.bufferId };
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    this.tabs = [];
    if (s === undefined) return;
    const theme = themeOf(s);
    const cols = s.terminal.cols;
    drawCells(buf, theme.style("bufferline"), 0, 0, "", cols);
    const right = this.lc === "narrow" ? "" : `${s.workspace.root} `;
    const active = activeBuffer(s)?.id;
    const tabs = listedBuffers(s)
      .sort((a, b) => a.id - b.id)
      .map((b) => ({
        id: b.id,
        name: ` ${basename(b.path)}`,
        dirty: b.dirty,
        active: b.id === active,
      }));
    const widthOf = (t: (typeof tabs)[number]) =>
      cells(t.name) + (t.dirty ? 2 : 0) + 1;
    const room = cols - cells(right) - 2;
    let first = 0;
    const at = Math.max(
      0,
      tabs.findIndex((t) => t.active),
    );
    const span = (from: number, to: number) =>
      tabs.slice(from, to + 1).reduce((n, t) => n + widthOf(t), 0);
    while (first < at && span(first, at) > room) first++;
    let x = 0;
    if (first > 0) x = this.text(buf, theme, x, "‹", "bufferline");
    for (let i = first; i < tabs.length; i++) {
      const t = tabs[i];
      if (t === undefined) continue;
      if (x + widthOf(t) > room) {
        this.text(buf, theme, x, "›", "bufferline");
        break;
      }
      const token = t.active ? "bufferActive" : "bufferline";
      const x0 = x;
      x = this.text(buf, theme, x, t.name, token);
      if (t.dirty) {
        x = this.text(buf, theme, x, " ", token);
        x = this.text(buf, theme, x, "●", "bufferDirty");
      }
      x = this.text(buf, theme, x, " ", token);
      this.tabs.push({ x0, x1: x, bufferId: t.id });
    }
    if (right !== "")
      drawCells(
        buf,
        theme.style("dim"),
        cols - cells(right),
        0,
        right,
        cells(right),
      );
  }

  private text(
    buf: OptimizedBuffer,
    theme: ReturnType<typeof themeOf>,
    x: number,
    text: string,
    token: string,
  ): number {
    drawCells(buf, theme.style(token), x, 0, text);
    return x + cells(text);
  }
}
