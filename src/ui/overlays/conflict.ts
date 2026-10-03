import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import { fullText, splitFile } from "../../core/state/buffers";
import type { AppState, TextFile } from "../../core/state/types";
import type { LayoutClass } from "../shell";
import { drawCells, type Theme, themeOf } from "../theme";
import { centered, drawFrame } from "./host";

type Op = { sign: " " | "-" | "+"; text: string };

/** Longest-common-subsequence work above this many cells is shown as a full replace. */
const MAX_LCS = 4_000_000;
const CONTEXT = 3;

/** A line diff from `a` (the buffer) to `b` (the disk). */
function lineDiff(a: string[], b: string[]): Op[] {
  let pre = 0;
  while (pre < a.length && pre < b.length && a[pre] === b[pre]) pre++;
  let suf = 0;
  while (
    suf < a.length - pre &&
    suf < b.length - pre &&
    a[a.length - 1 - suf] === b[b.length - 1 - suf]
  )
    suf++;
  const x = a.slice(pre, a.length - suf);
  const y = b.slice(pre, b.length - suf);
  const same = (t: string): Op => ({ sign: " ", text: t });
  const mid: Op[] = [];
  if (x.length * y.length > MAX_LCS) {
    for (const t of x) mid.push({ sign: "-", text: t });
    for (const t of y) mid.push({ sign: "+", text: t });
  } else {
    // lcs[i][j]: common length of x[i..] and y[j..].
    const lcs = Array.from({ length: x.length + 1 }, () =>
      new Array<number>(y.length + 1).fill(0),
    );
    for (let i = x.length - 1; i >= 0; i--)
      for (let j = y.length - 1; j >= 0; j--)
        (lcs[i] as number[])[j] =
          x[i] === y[j]
            ? (lcs[i + 1]?.[j + 1] ?? 0) + 1
            : Math.max(lcs[i + 1]?.[j] ?? 0, lcs[i]?.[j + 1] ?? 0);
    let i = 0;
    let j = 0;
    while (i < x.length || j < y.length) {
      if (i < x.length && j < y.length && x[i] === y[j]) {
        mid.push(same(x[i++] ?? ""));
        j++;
      } else if (
        j >= y.length ||
        (i < x.length && (lcs[i + 1]?.[j] ?? 0) >= (lcs[i]?.[j + 1] ?? 0))
      )
        mid.push({ sign: "-", text: x[i++] ?? "" });
      else mid.push({ sign: "+", text: y[j++] ?? "" });
    }
  }
  return [
    ...a.slice(0, pre).map(same),
    ...mid,
    ...a.slice(a.length - suf).map(same),
  ];
}

/** Side-by-side rows: changed runs pair deletions with additions. */
function pairRows(ops: Op[]): [Op | undefined, Op | undefined][] {
  const rows: [Op | undefined, Op | undefined][] = [];
  for (let i = 0; i < ops.length; ) {
    const op = ops[i];
    if (op === undefined) break;
    if (op.sign === " ") {
      rows.push([op, op]);
      i++;
      continue;
    }
    const del: Op[] = [];
    const add: Op[] = [];
    while (i < ops.length && ops[i]?.sign !== " ") {
      const o = ops[i++];
      if (o?.sign === "-") del.push(o);
      else if (o !== undefined) add.push(o);
    }
    for (let k = 0; k < Math.max(del.length, add.length); k++)
      rows.push([del[k], add[k]]);
  }
  return rows;
}

const diffs = new WeakMap<TextFile, { version: number; ops: Op[] }>();

/**
 * The conflict dialog (`k` keep mine, `t` take disk, `d` view diff, autosave
 * paused) and its diff: the buffer against the disk text with `−`/`+`
 * prefixes, side by side on 100 columns or more, stacked below that.
 */
export class ConflictView extends Renderable {
  private s: AppState | undefined;
  private lc: LayoutClass = "wide";

  constructor(ctx: RenderContext) {
    super(ctx, { position: "absolute", left: 0, top: 0 });
  }

  update(s: AppState, lc: LayoutClass): void {
    this.s = s;
    this.lc = lc;
    this.width = s.terminal.cols;
    this.height = s.terminal.rows;
    this.visible = s.overlay.kind === "conflict";
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    const o = s?.overlay;
    if (s === undefined || o?.kind !== "conflict") return;
    const b = s.buffers[o.bufferId];
    if (b === undefined) return;
    const theme = themeOf(s);
    if (!o.showDiff) {
      const box = centered(s, Math.min(66, s.terminal.cols - 4), 8);
      drawFrame(buf, theme, box, {
        border: "floatWarn",
        fill: "float",
        title: "File changed on disk",
        footer: "autosave paused until you choose",
      });
      const lines: [string, string][] = [
        [` ▲ ${b.path} changed on disk`, "floatWarn"],
        [
          "   while you have unsaved edits. Nothing was overwritten.",
          "floatDim",
        ],
        ["", "float"],
        [" k keep mine    t take disk    d view diff", "float"],
      ];
      lines.forEach(([text, token], i) => {
        drawCells(
          buf,
          theme.style(token),
          box.x + 1,
          box.y + 2 + i,
          text,
          box.w - 2,
        );
      });
      return;
    }
    let cached = diffs.get(o.disk);
    if (cached?.version !== b.text.version) {
      cached = {
        version: b.text.version,
        ops: lineDiff(
          fullText(b.text).split("\n"),
          splitFile(o.disk).body.split("\n"),
        ),
      };
      diffs.set(o.disk, cached);
    }
    this.paintDiff(buf, theme, s, cached.ops);
  }

  /** The diff over the body, with a key hint on the last row. */
  private paintDiff(
    buf: OptimizedBuffer,
    theme: Theme,
    s: AppState,
    ops: Op[],
  ): void {
    const { cols, rows } = s.terminal;
    const top = 1;
    const height = Math.max(0, rows - 3);
    const firstChange = Math.max(
      0,
      ops.findIndex((op) => op.sign !== " "),
    );
    const cell = (op: Op | undefined, x: number, y: number, w: number) => {
      const token =
        op?.sign === "-" ? "diffDel" : op?.sign === "+" ? "diffAdd" : "text";
      const sign = op?.sign === "-" ? "−" : (op?.sign ?? " ");
      drawCells(
        buf,
        theme.style(token),
        x,
        y,
        op === undefined ? "" : `${sign} ${op.text}`,
        w,
      );
    };
    if (this.lc !== "narrow") {
      const half = Math.floor((cols - 1) / 2);
      const pairs = pairRows(ops);
      const start = Math.max(
        0,
        pairs.findIndex(([l, r]) => l?.sign !== " " || r?.sign !== " ") -
          CONTEXT,
      );
      drawCells(
        buf,
        theme.style("winbarActive"),
        0,
        top,
        " yours (buffer, unsaved)",
        half,
      );
      drawCells(
        buf,
        theme.style("winbarActive"),
        half + 1,
        top,
        " disk",
        cols - half - 1,
      );
      for (let i = 0; i < height; i++) {
        drawCells(buf, theme.style("separator"), half, top + i, "│");
        if (i === 0) continue;
        const [l, r] = pairs[start + i - 1] ?? [undefined, undefined];
        cell(l, 0, top + i, half);
        cell(r, half + 1, top + i, cols - half - 1);
      }
    } else {
      const start = Math.max(0, firstChange - CONTEXT);
      drawCells(
        buf,
        theme.style("winbarActive"),
        0,
        top,
        " yours − · disk +",
        cols,
      );
      for (let i = 1; i < height; i++)
        cell(ops[start + i - 1], 0, top + i, cols);
    }
    drawCells(
      buf,
      theme.style("message"),
      0,
      rows - 1,
      " k keep mine  t take disk  q back to the prompt",
      cols,
    );
  }
}
