import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import { isNote, visiblePaths } from "../../core/state/explorer";
import type { AppState, PromptState } from "../../core/state/types";
import { drawFrame } from "../overlays/host";
import type { Cursor, LayoutClass, ViewDeps } from "../shell";
import { drawCells, themeOf } from "../theme";

/** Columns of the tree, not counting its separator or float border. */
export const EXPLORER_WIDTH = 30;

/** Docked beside the windows when open on a terminal of 100 columns or more. */
export const explorerDocked = (s: AppState, lc: LayoutClass): boolean =>
  s.panels.explorer.open && lc !== "narrow";

const basename = (path: string) => path.slice(path.lastIndexOf("/") + 1);
const depthOf = (path: string) => path.split("/").length - 1;

/**
 * `edit` is the name field's text on the row being created or renamed;
 * `note` is the line under a renamed row that tells its link impact.
 */
type Row = {
  path: string;
  depth: number;
  dir: boolean;
  open: boolean;
  edit?: string;
  note?: { text: string; token: string };
};

/**
 * The open create or rename prompt, which the open tree edits in place
 * (otherwise the prompt shows as a float).
 */
export function treeField(s: AppState): PromptState | undefined {
  if (s.overlay.kind !== "prompt" || !s.panels.explorer.open) return undefined;
  const p = s.overlay.prompt;
  return p.kind === "input" &&
    (p.op.kind === "create" ||
      (p.op.kind === "rename" && p.op.from === s.panels.explorer.cursor))
    ? p
    : undefined;
}

const cells = (text: string) => [...text].length;

/**
 * A rename or move prompt's consequence line in the given tokens: why Enter
 * is disabled, or the links the operation updates.
 */
export function impactLine(
  p: PromptState,
  tokens: { warn: string; error: string },
): { text: string; token: string } | undefined {
  if (p.invalid !== undefined)
    return { text: `✗ ${p.invalid}`, token: tokens.error };
  return p.impact === undefined
    ? undefined
    : { text: p.impact, token: tokens.warn };
}

/**
 * The file tree: docked left with a `│` separator, or a rounded float over
 * the windows on narrow terminals. Folders show `▸`/`▾`, notes `◇`, other
 * files `≡`; `●` marks a file with unsaved changes. Create and rename edit
 * the name in the tree: a new row under the target folder, or the selected row.
 */
export class ExplorerView extends Renderable {
  private s: AppState | undefined;
  private float = false;
  private first = 0;
  private w = 0;
  private h = 0;
  private cursorAt: Cursor | undefined;

  constructor(
    ctx: RenderContext,
    private readonly deps: Pick<ViewDeps, "reg">,
  ) {
    super(ctx, { position: "absolute", left: 0, top: 1, zIndex: 20 });
  }

  update(s: AppState, lc: LayoutClass): void {
    this.s = s;
    const ex = s.panels.explorer;
    this.visible = ex.open;
    this.float = lc === "narrow";
    // Layout getters lag until the next frame, so geometry is kept here.
    this.w = Math.min(s.terminal.cols, EXPLORER_WIDTH + (this.float ? 2 : 1));
    this.h = Math.max(0, s.terminal.rows - 3);
    this.width = this.w;
    this.height = this.h;
    const rows = this.rows(s);
    const at = selectedRow(rows, ex.cursor);
    const room = this.listRows();
    if (at >= 0 && at < this.first) this.first = at;
    if (at >= this.first + room) this.first = at - room + 1;
    this.first = Math.max(0, Math.min(this.first, rows.length - room));
    const row = rows[at];
    const box = this.inner();
    const x = box.x + 1 + 2 * (row?.depth ?? 0);
    const y = 1 + box.y + 1 + at - this.first;
    this.cursorAt =
      !ex.open || row === undefined
        ? undefined
        : row.edit !== undefined
          ? {
              x: Math.min(box.x + box.w - 1, x + 2 + cells(row.edit)),
              y,
              style: "line",
            }
          : ex.focused
            ? { x, y, style: "block" }
            : undefined;
  }

  cursor(): Cursor | undefined {
    return this.cursorAt;
  }

  /** The tree's area inside the float border, relative to this view. */
  private inner() {
    return this.float
      ? { x: 1, y: 1, w: this.w - 2, h: this.h - 2 }
      : { x: 0, y: 0, w: this.w - 1, h: this.h };
  }

  /** Rows left for entries below the title row. */
  private listRows(): number {
    return Math.max(0, this.inner().h - 1);
  }

  private rows(s: AppState): Row[] {
    const ex = s.panels.explorer;
    const rows: Row[] = visiblePaths(s).map((path) => ({
      path,
      depth: depthOf(path),
      dir: isDir(s, path),
      open: ex.expanded.includes(path),
    }));
    const field = treeField(s);
    if (field?.op.kind === "create") {
      const folder = field.op.from;
      rows.splice(rows.findIndex((r) => r.path === ex.cursor) + 1, 0, {
        path: "",
        depth: folder === "" ? 0 : depthOf(folder) + 1,
        dir: false,
        open: false,
        edit: field.value,
      });
    } else if (field !== undefined) {
      const at = rows.findIndex((r) => r.path === field.op.from);
      const row = rows[at];
      if (row !== undefined) {
        row.edit = field.value;
        const note = impactLine(field, {
          warn: "explorerWarn",
          error: "explorerError",
        });
        if (note !== undefined)
          rows.splice(at + 1, 0, {
            path: "",
            depth: row.depth + 1,
            dir: false,
            open: false,
            note,
          });
      }
    }
    return rows;
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    if (s === undefined) return;
    const theme = themeOf(s);
    const ex = s.panels.explorer;
    const box = this.inner();
    const x0 = this.x + box.x;
    const y0 = this.y + box.y;
    if (this.float)
      drawFrame(
        buf,
        theme,
        { x: this.x, y: this.y, w: this.width, h: this.height },
        { border: "floatBorder", fill: "explorer" },
      );
    else
      for (let r = 0; r < this.height; r++)
        drawCells(
          buf,
          theme.style("separator"),
          this.x + box.w,
          this.y + r,
          "│",
        );
    drawCells(
      buf,
      theme.style("explorerTitle"),
      x0,
      y0,
      ` NOTES  ${s.workspace.root}`,
      box.w,
    );
    const rows = this.rows(s);
    const dirty = new Set(
      Object.values(s.buffers)
        .filter((b) => b.dirty)
        .map((b) => b.path),
    );
    const sel = selectedRow(rows, ex.cursor);
    for (let i = 0; i < this.listRows(); i++) {
      const y = y0 + 1 + i;
      const row = rows[this.first + i];
      if (row === undefined) {
        const hint = i === 0 && ex.entries[""]?.length === 0;
        drawCells(
          buf,
          theme.style("explorerDim"),
          x0,
          y,
          hint ? " a to create a note" : "",
          box.w,
        );
        continue;
      }
      if (row.note !== undefined) {
        drawCells(
          buf,
          theme.style(row.note.token),
          x0,
          y,
          ` ${"  ".repeat(row.depth)}${row.note.text}`,
          box.w,
        );
        continue;
      }
      const selected = this.first + i === sel;
      const base = selected
        ? ex.focused
          ? "treeSelFocus"
          : "treeSel"
        : "explorer";
      const icon = row.dir
        ? row.open
          ? "▾ "
          : "▸ "
        : row.path === "" || isNote(this.deps.reg.fileTypes, row.path) // a new row shows as a note
          ? "◇ "
          : "≡ ";
      const indent = ` ${"  ".repeat(row.depth)}`;
      drawCells(buf, theme.style(base), x0, y, "", box.w);
      let x = x0;
      const put = (text: string, token: string) => {
        const room = x0 + box.w - x;
        if (room <= 0) return;
        drawCells(
          buf,
          theme.style(selected ? base : token),
          x,
          y,
          text,
          Math.min(room, [...text].length),
        );
        x += [...text].length;
      };
      put(indent, "explorer");
      put(icon, row.dir ? "explorerDir" : "explorerDim");
      if (row.edit !== undefined) {
        const room = x0 + box.w - x;
        if (room > 0)
          drawCells(
            buf,
            theme.style("treeField"),
            x,
            y,
            row.edit,
            Math.min(room, cells(row.edit)),
          );
        continue;
      }
      put(basename(row.path), row.dir ? "explorerDir" : "explorer");
      if (dirty.has(row.path)) put(" ●", "explorerDirty");
    }
  }
}

/** The highlighted row: the name field while one is open, else the selection. */
function selectedRow(rows: Row[], cursor: string): number {
  const field = rows.findIndex((r) => r.edit !== undefined);
  return field >= 0 ? field : rows.findIndex((r) => r.path === cursor);
}

function isDir(s: AppState, path: string): boolean {
  const i = path.lastIndexOf("/");
  const parent = i < 0 ? "" : path.slice(0, i);
  return (
    s.panels.explorer.entries[parent]?.find((e) => e.name === basename(path))
      ?.kind === "dir"
  );
}
