import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import { statusRow } from "../../core/state/layout";
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
  pdf: ["PDF", "modeNormal"],
  conflict: ["CONFLICT", "modeCmd"],
};

/** The mode badge text and its theme token. */
const badgeOf = (mode: string): [string, string] =>
  BADGES[mode] ?? [mode.toUpperCase(), "modeNormal"];

/** One segment; `parts` paint it in several tokens, and `text` gives its width. */
type Seg = {
  text: string;
  token: string;
  parts?: readonly { text: string; token: string }[];
};

const count = (n: number) => n.toLocaleString("en-US");

/** A state glyph in its state's colour, then the label in the dim token. */
function stateSeg(glyph: string, glyphToken: string, label: string): Seg {
  const token = glyphToken === "statusError" ? glyphToken : "statusDim";
  return {
    text: `${glyph} ${label}`,
    token,
    parts: [
      { text: glyph, token: glyphToken },
      { text: ` ${label}`, token },
    ],
  };
}

function indexSegment(seg: StatusSegments): Seg {
  if (seg.index === "ready") return stateSeg("◆", "statusOk", "index ready");
  if (seg.index === "unavailable")
    return stateSeg("✗", "statusError", "index unavailable");
  const p = seg.indexProgress ?? { done: 0, total: 0 };
  return stateSeg(
    "◌",
    "statusBusy",
    `indexing ${count(p.done)}/${count(p.total)}`,
  );
}

function lspSegment(l: NonNullable<StatusSegments["lsp"]>[number]): Seg {
  if (l.state === "ready") return stateSeg("◆", "statusOk", l.text);
  if (l.state === "failed") return stateSeg("✗", "statusError", l.text);
  return stateSeg("◌", "statusBusy", l.text);
}

const cells = (text: string) => [...text].length;

/** `[3/17]`; past the cap the unknown parts read `>999`. */
function searchText(c: NonNullable<StatusSegments["search"]>): string {
  const over = `>${c.total - 1}`;
  const total = c.capped ? over : String(c.total);
  const current = c.capped && c.current === c.total ? over : String(c.current);
  return `[${current}/${total}]`;
}

/** The folder part dim and the file name bold. */
function pathParts(text: string, named: boolean): NonNullable<Seg["parts"]> {
  if (!named) return [{ text, token: "statusDim" }];
  const cut = text.lastIndexOf("/") + 1;
  return [
    { text: text.slice(0, cut), token: "statusDim" },
    { text: text.slice(cut), token: "statusFile" },
  ];
}

/** `⎇ <ref> [op] [+added] [~changed] [-removed]`, each count only when it is not 0. */
function gitSegment(g: NonNullable<StatusSegments["git"]>): Seg {
  const parts = [{ text: `⎇ ${g.ref}`, token: "statusGitRef" }];
  if (g.op !== undefined)
    parts.push({ text: ` ${g.op}`, token: "statusGitOp" });
  if (g.added > 0) parts.push({ text: ` +${g.added}`, token: "statusGitAdd" });
  if (g.changed > 0)
    parts.push({ text: ` ~${g.changed}`, token: "statusGitChange" });
  if (g.removed > 0)
    parts.push({ text: ` -${g.removed}`, token: "statusGitDelete" });
  return {
    text: parts.map((p) => p.text).join(""),
    token: "statusline",
    parts,
  };
}

/**
 * The last row: `MODE  view  path ●  ⎇ ref  ✗ save failed…  ✗ deleted on disk…` on the left, and
 * `[i/n]  jump i/n  ← N backlinks  N words  preview  index  servers  keys  Ln:Col` on the right. Segments are
 * padded by one space instead of divided by bars; the view and `Ln:Col` sit on a raised background.
 * Narrow terminals drop the server, git, view, word, and preview segments; a row too long for the full
 * path drops servers, then git, then preview, then words, then view, and the path is cut in the middle
 * when the row is still too long.
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
    this.top = statusRow(s.terminal);
    this.width = s.terminal.cols;
  }

  /** The status row takes no click. */
  targetAt(x: number, y: number): MouseTarget | undefined {
    const t = this.s?.terminal;
    return t !== undefined && y === statusRow(t) && x >= 0 && x < t.cols
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
    let left: Seg[] = [];
    let right: Seg[] = [];
    const view: Seg | undefined =
      seg.view === undefined
        ? undefined
        : { text: seg.view, token: "statusAlt" };
    const words: Seg | undefined =
      seg.words === undefined
        ? undefined
        : { text: `${seg.words} words`, token: "statusDim" };
    const preview: Seg = {
      text: seg.preview,
      token: seg.preview.startsWith("preview :") ? "statusOk" : "statusDim",
    };
    if (view !== undefined) left.push(view);
    const path: Seg = { text: seg.path ?? "[No Name]", token: "statusline" };
    left.push(path);
    const git = seg.git === undefined ? undefined : gitSegment(seg.git);
    if (git !== undefined) left.push(git);
    if (seg.saveError !== undefined) {
      const secs = Math.max(
        0,
        Math.ceil((seg.saveError.retryAt - this.deps.now()) / 1000),
      );
      left.push({
        text: `✗ save failed: ${seg.saveError.reason} · retry in ${secs}s`,
        token: "statusError",
      });
    }
    if (seg.deletedOnDisk)
      left.push({
        text: "✗ deleted on disk · :w to recreate",
        token: "statusError",
      });
    if (seg.search !== undefined)
      right.push({ text: searchText(seg.search), token: "statusline" });
    if (seg.jump !== undefined)
      right.push({ text: seg.jump, token: "statusDim" });
    if (seg.backlinks !== undefined)
      right.push({ text: `← ${seg.backlinks} backlinks`, token: "statusLink" });
    if (words !== undefined) right.push(words);
    right.push(preview);
    if (seg.index !== undefined) right.push(indexSegment(seg));
    const servers = (seg.lsp ?? []).map(lspSegment);
    right.push(...servers);
    const position =
      seg.page !== undefined
        ? ` ${seg.page} `
        : seg.position === undefined
          ? ""
          : ` ${seg.position.line + 1}:${seg.position.col + 1} `;
    const pending = s.vim.pending.join("");
    const keys = pending === "" ? "" : ` ${pending} `;
    const dirty = seg.dirty ? " ●" : "";
    const padded = (segs: Seg[]) =>
      segs.reduce((n, x) => n + 2 + (x === path ? 0 : cells(x.text)), 0);
    const rightWidth = () => padded(right) + cells(keys) + cells(position);
    const fixedWidth = () =>
      cells(badge) + 2 + padded(left) + cells(dirty) + rightWidth();
    for (const optional of [...servers, git, preview, words, view]) {
      if (optional === undefined) continue;
      if (narrow || fixedWidth() + cells(path.text) > cols) {
        left = left.filter((x) => x !== optional);
        right = right.filter((x) => x !== optional);
      }
    }
    path.text = middle(path.text, Math.max(1, cols - fixedWidth()));
    path.parts = pathParts(path.text, seg.path !== undefined);
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
    const putSeg = (g: Seg) => {
      const pad = g.token === "statusAlt" ? "statusAlt" : "statusline";
      put(" ", pad);
      if (g.parts === undefined) put(g.text, g.token);
      else for (const p of g.parts) put(p.text, p.token);
      if (g === path && dirty !== "") put(dirty, "statusDirty");
      put(" ", pad);
    };
    put(` ${badge} `, badgeToken);
    for (const g of left) putSeg(g);
    x = Math.max(x, cols - rightWidth());
    for (const g of right) putSeg(g);
    put(keys, "statusDim");
    put(position, "statusAlt");
  }
}
