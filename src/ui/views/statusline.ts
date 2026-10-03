import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import { statusSegments } from "../../core/state/status";
import type { AppState } from "../../core/state/types";
import type { LayoutClass, ViewDeps } from "../shell";
import { drawCells, themeOf } from "../theme";

const BADGES: Readonly<Record<string, [string, string]>> = {
  normal: ["NORMAL", "modeNormal"],
  insert: ["INSERT", "modeInsert"],
  visual: ["VISUAL", "modeVisual"],
  visualLine: ["V-LINE", "modeVisual"],
  cmdline: ["COMMAND", "modeCmd"],
  explorer: ["EXPLORER", "modeNormal"],
};

/** The mode badge text and its theme token. */
const badgeOf = (mode: string): [string, string] =>
  BADGES[mode] ?? [mode.toUpperCase(), "modeNormal"];

type Seg = { text: string; token: string };

const cells = (text: string) => [...text].length;

/** Cut the middle of `text` to `width` cells with `…`. */
function middle(text: string, width: number): string {
  const c = [...text];
  if (c.length <= width) return text;
  if (width <= 1) return "…".slice(0, width);
  const head = Math.ceil((width - 1) / 2);
  return `${c.slice(0, head).join("")}…${c.slice(c.length - (width - 1 - head)).join("")}`;
}

/**
 * Row h−2: `MODE │ view │ path ● │ N words │ ✗ save failed…` on the left and
 * `Ln:Col` on the right. Narrow terminals drop the view and word segments;
 * the path is cut in the middle when the row is still too long.
 */
export class Statusline extends Renderable {
  private s: AppState | undefined;
  private lc: LayoutClass = "wide";

  constructor(
    ctx: RenderContext,
    private readonly deps: Pick<ViewDeps, "now">,
  ) {
    super(ctx, { position: "absolute", left: 0, top: 0, height: 1 });
  }

  update(s: AppState, lc: LayoutClass): void {
    this.s = s;
    this.lc = lc;
    this.top = Math.max(0, s.terminal.rows - 2);
    this.width = s.terminal.cols;
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    if (s === undefined) return;
    const theme = themeOf(s);
    const seg = statusSegments(s);
    const narrow = this.lc === "narrow";
    const cols = s.terminal.cols;
    const [badge, badgeToken] = badgeOf(seg.mode);
    const segs: Seg[] = [];
    if (seg.view !== undefined && !narrow)
      segs.push({ text: seg.view, token: "statusDim" });
    const path: Seg = { text: seg.path ?? "[No Name]", token: "statusline" };
    segs.push(path);
    if (seg.words !== undefined && !narrow)
      segs.push({ text: `${seg.words} words`, token: "statusDim" });
    if (seg.saveError !== undefined) {
      const secs = Math.max(
        0,
        Math.ceil((seg.saveError.retryAt - this.deps.now()) / 1000),
      );
      segs.push({
        text: `✗ save failed: ${seg.saveError.reason} · retry in ${secs}s`,
        token: "statusError",
      });
    }
    const right =
      seg.position === undefined
        ? ""
        : ` ${seg.position.line + 1}:${seg.position.col + 1} `;
    const dirty = seg.dirty ? " ●" : "";
    const fixed =
      cells(badge) +
      2 +
      cells(right) +
      cells(dirty) +
      segs.reduce((n, x) => n + 3 + (x === path ? 0 : cells(x.text)), 0);
    path.text = middle(path.text, Math.max(1, cols - fixed));
    drawCells(buf, theme.style("statusline"), 0, this.y, "", cols);
    let x = 0;
    const put = (text: string, token: string) => {
      if (x >= cols) return;
      drawCells(
        buf,
        theme.style(token),
        x,
        this.y,
        text,
        Math.min(cols - x, cells(text)),
      );
      x += cells(text);
    };
    put(` ${badge} `, badgeToken);
    for (const g of segs) {
      put(" │ ", "statusDim");
      put(g.text, g.token);
      if (g === path && dirty !== "") put(dirty, "statusDirty");
    }
    if (right !== "" && x + cells(right) <= cols)
      drawCells(
        buf,
        theme.style("statusline"),
        cols - cells(right),
        this.y,
        right,
      );
  }
}
