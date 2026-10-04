import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import { newNotePath } from "../../core/state/explorer";
import type { AppState, PromptState } from "../../core/state/types";
import type { Cursor, LayoutClass } from "../shell";
import { drawCells, themeOf } from "../theme";
import { impactLine, treeField } from "../views/explorer";
import { centered, drawFrame } from "./host";

type Line = { text: string; token: string };

function impactLines(p: PromptState): Line[] {
  const l = impactLine(p, { warn: "floatWarn", error: "floatError" });
  return l === undefined ? [] : [{ text: ` ${l.text}`, token: l.token }];
}

const basename = (path: string) => path.slice(path.lastIndexOf("/") + 1);
const cells = (text: string) => [...text].length;

/** Title, border token, body lines, and the field's line index, per prompt kind. */
function layout(p: PromptState): {
  title: string;
  border: string;
  lines: Line[];
  field?: number;
  footer: string;
} {
  const field = { text: ` ❯ ${p.value}`, token: "float" };
  if (p.newNote === true)
    return {
      title: p.title,
      border: "floatBorder",
      lines: [
        field,
        { text: "", token: "float" },
        p.invalid === undefined
          ? {
              text: p.value.trim() === "" ? "" : ` → ${newNotePath(p.value)}`,
              token: "floatDim",
            }
          : { text: ` ✗ ${p.invalid}`, token: "floatError" },
      ],
      field: 0,
      footer: "⏎ choose a template · esc cancel",
    };
  if (p.kind === "confirm" && p.op.kind === "create")
    return {
      title: "New note",
      border: "floatBorder",
      lines: [
        { text: ` ${p.title}`, token: "float" },
        { text: "", token: "float" },
        { text: " y create   N cancel", token: "floatDim" },
      ],
      footer: "",
    };
  if (p.kind === "confirm")
    return {
      title: "Delete",
      border: "floatWarn",
      lines: [
        { text: ` ${p.title}`, token: "float" },
        { text: ` ${p.op.from}`, token: "floatTitle" },
        { text: "", token: "float" },
        { text: " y move to Trash   N cancel", token: "floatDim" },
      ],
      footer: "",
    };
  if (p.kind === "typed") {
    const ok = p.value.trim() === basename(p.op.from);
    return {
      title: "Delete permanently",
      border: "floatError",
      lines: [
        { text: " ✗ Trash is not available", token: "floatError" },
        {
          text: " This cannot be undone. Type the file name to confirm:",
          token: "float",
        },
        { text: ` ${basename(p.op.from)}`, token: "floatTitle" },
        { text: "", token: "float" },
        field,
        { text: "", token: "float" },
        ok
          ? { text: " ⏎ delete permanently · esc cancel", token: "floatError" }
          : {
              text: " ⏎ disabled until the name matches · esc cancel",
              token: "floatDim",
            },
      ],
      field: 4,
      footer: "",
    };
  }
  return {
    title: p.title,
    border: "floatBorder",
    lines: [
      { text: ` ${p.op.from}`, token: "floatDim" },
      { text: "", token: "float" },
      field,
      ...impactLines(p),
    ],
    field: 2,
    footer: "⏎ confirm · esc cancel",
  };
}

/**
 * File prompts as a centred float: a `[y/N]` confirm for the Trash or for
 * creating a missing link target, a path field for move, and the typed
 * confirmation for a permanent delete. Create and rename of the explorer
 * selection edit in the tree instead (`ExplorerView`). Keys
 * go to the core, which decides.
 */
export class PromptView extends Renderable {
  private s: AppState | undefined;
  private cursorAt: Cursor | undefined;

  constructor(ctx: RenderContext) {
    super(ctx, { position: "absolute", left: 0, top: 0 });
  }

  /** The float's box for the open prompt. */
  private box(s: AppState, p: PromptState) {
    const { lines } = layout(p);
    return centered(s, Math.min(64, s.terminal.cols - 4), lines.length + 3);
  }

  update(s: AppState, _lc: LayoutClass): void {
    this.s = s;
    this.width = s.terminal.cols;
    this.height = s.terminal.rows;
    this.visible = s.overlay.kind === "prompt" && treeField(s) === undefined;
    this.cursorAt = undefined;
    if (s.overlay.kind !== "prompt" || !this.visible) return;
    const p = s.overlay.prompt;
    const { field } = layout(p);
    if (field === undefined) return;
    const box = this.box(s, p);
    this.cursorAt = {
      x: Math.min(box.x + box.w - 2, box.x + 1 + cells(` ❯ ${p.value}`)),
      y: box.y + 2 + field,
      style: "line",
    };
  }

  cursor(): Cursor | undefined {
    return this.cursorAt;
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    if (s === undefined || s.overlay.kind !== "prompt" || !this.visible) return;
    const theme = themeOf(s);
    const p = s.overlay.prompt;
    const { title, border, lines, footer } = layout(p);
    const box = this.box(s, p);
    drawFrame(buf, theme, box, {
      border,
      fill: "float",
      title,
      ...(footer === "" ? {} : { footer }),
    });
    lines.forEach((l, i) => {
      if (i + 2 < box.h - 1)
        drawCells(
          buf,
          theme.style(l.token),
          box.x + 1,
          box.y + 2 + i,
          l.text,
          box.w - 2,
        );
    });
  }
}
