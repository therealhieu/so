import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import { type StatusSegments, statusSegments } from "../../core/state/status";
import type { AppState, MouseTarget } from "../../core/state/types";
import type { LayoutClass, ViewDeps } from "../shell";
import { drawCells, middle, themeOf } from "../theme";

const BADGES: Readonly<Record<string, [string, string]>> = {
  normal: ["NORMAL", "modeNormal"],
  insert: ["INSERT", "modeInsert"],
  visual: ["VISUAL", "modeVisual"],
  visualLine: ["V-LINE", "modeVisual"],
  cmdline: ["COMMAND", "modeCmd"],
  explorer: ["EXPLORER", "modeNormal"],
  base: ["BASE", "modeNormal"],
  conflict: ["CONFLICT", "modeCmd"],
};

/** The mode badge text and its theme token. */
const badgeOf = (mode: string): [string, string] =>
  BADGES[mode] ?? [mode.toUpperCase(), "modeNormal"];

type Seg = { text: string; token: string };

const count = (n: number) => n.toLocaleString("en-US");

function indexSegment(seg: StatusSegments): Seg {
  if (seg.index === "ready")
    return { text: "◆ index ready", token: "statusDim" };
  if (seg.index === "unavailable")
    return { text: "✗ index unavailable", token: "statusError" };
  const p = seg.indexProgress ?? { done: 0, total: 0 };
  return {
    text: `◌ indexing ${count(p.done)}/${count(p.total)}`,
    token: "statusDim",
  };
}

function lspSegment(l: NonNullable<StatusSegments["lsp"]>[number]): Seg {
  if (l.state === "ready") return { text: `◆ ${l.text}`, token: "statusDim" };
  if (l.state === "failed")
    return { text: `✗ ${l.text}`, token: "statusError" };
  return { text: `◌ ${l.text}`, token: "statusDim" };
}

const cells = (text: string) => [...text].length;

/**
 * Row h−2: `MODE │ view │ path ● │ ✗ save failed… │ ✗ deleted on disk… │ jump i/n │ ← N backlinks │ N words │ preview │ index │ servers`
 * on the left and `Ln:Col` on the right. Narrow terminals drop the server, view, word, and
 * preview segments; a row too long for the full path drops servers and preview, then words,
 * then view, and the path is cut in the middle when the row is still too long.
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

  /** The status row takes no click. */
  targetAt(x: number, y: number): MouseTarget | undefined {
    const t = this.s?.terminal;
    return t !== undefined &&
      y === Math.max(0, t.rows - 2) &&
      x >= 0 &&
      x < t.cols
      ? { kind: "inert" }
      : undefined;
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    if (s === undefined) return;
    const theme = themeOf(s);
    const seg = statusSegments(s);
    const narrow = this.lc === "narrow";
    const cols = s.terminal.cols;
    const [badge, badgeToken] = badgeOf(
      s.overlay.kind === "conflict" ? "conflict" : seg.mode,
    );
    let segs: Seg[] = [];
    const view: Seg | undefined =
      seg.view === undefined
        ? undefined
        : { text: seg.view, token: "statusDim" };
    const words: Seg | undefined =
      seg.words === undefined
        ? undefined
        : { text: `${seg.words} words`, token: "statusDim" };
    const preview: Seg = { text: seg.preview, token: "statusDim" };
    if (view !== undefined) segs.push(view);
    const path: Seg = { text: seg.path ?? "[No Name]", token: "statusline" };
    segs.push(path);
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
    if (seg.deletedOnDisk)
      segs.push({
        text: "✗ deleted on disk · :w to recreate",
        token: "statusError",
      });
    if (seg.jump !== undefined)
      segs.push({ text: seg.jump, token: "statusDim" });
    if (seg.backlinks !== undefined)
      segs.push({ text: `← ${seg.backlinks} backlinks`, token: "statusDim" });
    if (words !== undefined) segs.push(words);
    segs.push(preview);
    if (seg.index !== undefined) segs.push(indexSegment(seg));
    const servers = (seg.lsp ?? []).map(lspSegment);
    segs.push(...servers);
    const right =
      seg.position === undefined
        ? ""
        : ` ${seg.position.line + 1}:${seg.position.col + 1} `;
    const dirty = seg.dirty ? " ●" : "";
    const fixedWidth = () =>
      cells(badge) +
      2 +
      cells(right) +
      cells(dirty) +
      segs.reduce((n, x) => n + 3 + (x === path ? 0 : cells(x.text)), 0);
    for (const optional of [...servers, preview, words, view]) {
      if (optional === undefined) continue;
      if (narrow || fixedWidth() + cells(path.text) > cols)
        segs = segs.filter((x) => x !== optional);
    }
    path.text = middle(path.text, Math.max(1, cols - fixedWidth()));
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
