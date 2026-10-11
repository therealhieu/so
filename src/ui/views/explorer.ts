import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import { explorerMarkers, type Marker } from "../../core/features/git/status";
import {
  explorerWidth,
  isCutPath,
  isIgnoredPath,
  visiblePaths,
} from "../../core/state/explorer";
import { bodyRows } from "../../core/state/layout";
import { promptField } from "../../core/state/line-field";
import type {
  AppState,
  ExplorerPrompt,
  MouseTarget,
  PromptState,
} from "../../core/state/types";
import { fileIcon, folderIcon } from "../icons";
import { drawFrame } from "../overlays/host";
import type { Cursor, LayoutClass } from "../shell";
import { drawCells, type Style, themeOf } from "../theme";

/** Docked beside the windows when open on a terminal of 100 columns or more. */
export const explorerDocked = (s: AppState, lc: LayoutClass): boolean =>
  s.panels.explorer.open && lc !== "narrow";

/** The terminal edge the explorer sits on, docked or floating. */
export const explorerSide = (s: AppState): "left" | "right" =>
  s.config.explorer.position;

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
export function treeField(s: AppState): ExplorerPrompt | undefined {
  if (s.overlay.kind !== "prompt" || !s.panels.explorer.open) return undefined;
  const p = s.overlay.prompt;
  return p.newNote !== true &&
    p.rename === undefined &&
    p.setting === undefined &&
    p.binding === undefined &&
    p.kind === "input" &&
    (p.op.kind === "create" ||
      (p.op.kind === "rename" && p.op.from === s.panels.explorer.cursor))
    ? p
    : undefined;
}

const cells = (text: string) => [...text].length;

/** A git marker's glyph at the row's right edge, and the token for it and the name. */
const GIT_MARKERS: Readonly<Record<Marker, readonly [string, string]>> = {
  modified: ["M", "explorerGitModified"],
  staged: ["S", "explorerGitStaged"],
  untracked: ["?", "explorerGitUntracked"],
  conflict: ["U", "explorerGitConflict"],
};

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
 * The file tree: docked on its configured edge with a `│` separator toward
 * the windows, or a rounded float on that edge on narrow terminals. Each row starts with an
 * icon for its folder state or file type (`explorer.icons` picks Nerd Font or
 * plain symbols); `●` marks a file with unsaved changes, and a gitignored
 * name, or one cut and not yet pasted, is dimmed. Create and rename edit the name in the tree: a new row under the
 * target folder, or the selected row.
 */
export class ExplorerView extends Renderable {
  private s: AppState | undefined;
  private float = false;
  private onRight = false;
  /** The view's first column on the terminal. */
  private x0 = 0;
  private first = 0;
  private w = 0;
  private h = 0;
  /** The listed rows' paths, "" for a name field or a note line. */
  private paths: string[] = [];
  private cursorAt: Cursor | undefined;

  constructor(ctx: RenderContext) {
    super(ctx, { position: "absolute", left: 0, top: 1, zIndex: 20 });
  }

  update(s: AppState, lc: LayoutClass): void {
    this.s = s;
    const ex = s.panels.explorer;
    this.visible = ex.open;
    this.float = lc === "narrow";
    // Layout getters lag until the next frame, so geometry is kept here.
    this.w = Math.min(s.terminal.cols, explorerWidth(s) + (this.float ? 2 : 1));
    this.h = bodyRows(s.terminal);
    this.onRight = explorerSide(s) === "right";
    this.x0 = this.onRight ? s.terminal.cols - this.w : 0;
    this.left = this.x0;
    this.width = this.w;
    this.height = this.h;
    const rows = this.rows(s);
    this.paths = rows.map((r) => r.path);
    const at = selectedRow(rows, ex.cursor);
    const room = this.listRows();
    // A name field keeps the lines under it in view.
    let end = at;
    if (rows[at]?.edit !== undefined)
      while (rows[end + 1]?.note !== undefined) end++;
    if (end >= this.first + room) this.first = end - room + 1;
    if (at >= 0 && at < this.first) this.first = at;
    this.first = Math.max(0, Math.min(this.first, rows.length - room));
    const row = rows[at];
    const box = this.inner();
    const x = this.x0 + box.x + 1 + 2 * (row?.depth ?? 0);
    const y = 1 + box.y + 1 + at - this.first;
    // Only the name field shows a cursor; the selected row marks the tree's focus.
    const field = treeField(s);
    const caret = field === undefined ? 0 : promptField(field).caret;
    this.cursorAt =
      !ex.open || row?.edit === undefined
        ? undefined
        : {
            x: Math.min(
              this.x0 + box.x + box.w - 1,
              x + 2 + cells(row.edit.slice(0, caret)),
            ),
            y,
            style: "line",
          };
  }

  cursor(): Cursor | undefined {
    return this.cursorAt;
  }

  /**
   * A listed row's path; the title, frame, and empty rows give "" (focus
   * only); the docked separator gives the edge a drag resizes.
   */
  targetAt(ax: number, y: number): MouseTarget | undefined {
    const x = ax - this.x0;
    if (!this.visible || x < 0 || x >= this.w || y < 1 || y >= 1 + this.h)
      return undefined;
    const box = this.inner();
    if (!this.float && x === (this.onRight ? 0 : box.w))
      return { kind: "explorerEdge", width: box.w };
    const i = y - (1 + box.y + 1);
    const listed =
      x >= box.x && x < box.x + box.w && i >= 0 && i < this.listRows();
    const path = listed ? (this.paths[this.first + i] ?? "") : "";
    return { kind: "explorer", path };
  }

  /** A separator dragged to column `ax` leaves the tree the columns between it and the terminal edge. */
  dragAt(ax: number, _y: number, from: MouseTarget): MouseTarget | undefined {
    const cols = this.s?.terminal.cols;
    if (from.kind !== "explorerEdge" || cols === undefined) return undefined;
    return {
      kind: "explorerEdge",
      width: Math.max(0, this.onRight ? cols - ax - 1 : ax),
    };
  }

  /** The tree's area inside the float border, relative to this view. */
  private inner() {
    return this.float
      ? { x: 1, y: 1, w: this.w - 2, h: this.h - 2 }
      : { x: this.onRight ? 1 : 0, y: 0, w: this.w - 1, h: this.h };
  }

  /** Rows left for entries below the title row. */
  private listRows(): number {
    return Math.max(0, this.inner().h - 1);
  }

  /**
   * A cut name in full: from the name's column toward the windows on a left
   * tree, or ending at the tree's edge and reaching left on a right tree.
   */
  private paintFullName(
    buf: OptimizedBuffer,
    theme: ReturnType<typeof themeOf>,
    token: string,
    name: string,
    nameX: number,
    y: number,
  ): void {
    const cols = this.s?.terminal.cols ?? 0;
    const box = this.inner();
    const text = ` ${name} `;
    const w = Math.min(cols, cells(text));
    const x = this.onRight
      ? Math.max(0, this.x0 + box.x + box.w - w)
      : Math.max(0, Math.min(nameX - 1, cols - w));
    drawCells(buf, fullNameStrip(theme, token), x, y, text, w);
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
    if (field === undefined) return rows;
    let at: number;
    let depth: number;
    if (field.op.kind === "create") {
      const folder = field.op.from;
      at = rows.findIndex((r) => r.path === ex.cursor) + 1;
      depth = folder === "" ? 0 : depthOf(folder) + 1;
      rows.splice(at, 0, {
        path: "",
        depth,
        dir: false,
        open: false,
        edit: field.value,
      });
    } else {
      at = rows.findIndex((r) => r.path === field.op.from);
      const row = rows[at];
      if (row === undefined) return rows;
      row.edit = field.value;
      depth = row.depth;
    }
    // Under the field: its keys, then why Enter is off or the links it updates.
    const notes = [
      {
        text: `⏎ ${field.op.kind === "create" ? "create" : "rename"} · esc cancel`,
        token: "explorerDim",
      },
      impactLine(field, { warn: "explorerWarn", error: "explorerError" }),
    ].filter((n) => n !== undefined);
    rows.splice(
      at + 1,
      0,
      ...notes.map((note) => ({
        path: "",
        depth: depth + 1,
        dir: false,
        open: false,
        note,
      })),
    );
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
          this.onRight ? this.x : this.x + box.w,
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
    const markers =
      s.git.status === null ? undefined : explorerMarkers(s.git.status);
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
      // A selected row keeps each part's colour on the selection background.
      const paint = (token: string): Style => {
        const own = theme.style(token);
        if (!selected) return own;
        const sel = theme.style(base);
        return { ...own, bg: sel.bg, attrs: own.attrs | sel.attrs };
      };
      const set = s.config.explorer.icons;
      const icon = row.dir
        ? { glyph: folderIcon(row.open, set), token: "explorerDir" }
        : fileIcon(row.path === "" ? "new.md" : row.path, set); // a new row shows as a note
      const indent = ` ${"  ".repeat(row.depth)}`;
      drawCells(buf, theme.style(base), x0, y, "", box.w);
      let x = x0;
      const put = (text: string, token: string) => {
        const room = x0 + box.w - x;
        if (room <= 0) return;
        drawCells(
          buf,
          paint(token),
          x,
          y,
          text,
          Math.min(room, [...text].length),
        );
        x += [...text].length;
      };
      put(indent, "explorer");
      if (row.edit !== undefined) {
        // The name field: a pencil, then the text on a strip to the edge.
        put("✎ ", "explorerWarn");
        const room = x0 + box.w - x;
        if (room > 0)
          drawCells(buf, theme.style("treeField"), x, y, row.edit, room);
        continue;
      }
      put(`${icon.glyph} `, icon.token);
      const marker = markers?.get(row.path);
      const git = marker === undefined ? undefined : GIT_MARKERS[marker];
      // An open folder's changes show on the rows below it.
      const glyph =
        git !== undefined && !(row.dir && row.open) ? git : undefined;
      // The name stops short of the glyph column: a space, the glyph, a space.
      const end = x0 + box.w - (glyph === undefined ? 0 : 3);
      const name = basename(row.path);
      const nameToken =
        git?.[1] ??
        (isIgnoredPath(s, row.path) || isCutPath(s, row.path)
          ? "explorerDim"
          : row.dir
            ? "explorerDir"
            : "explorer");
      const nameX = x;
      const room = end - x;
      if (room > 0) {
        drawCells(
          buf,
          paint(nameToken),
          x,
          y,
          name,
          Math.min(room, cells(name)),
        );
        x += Math.min(room, cells(name));
      }
      if (dirty.has(row.path) && end - x >= 2) put(" ●", "explorerDirty");
      if (glyph !== undefined && box.w >= 3)
        drawCells(buf, paint(glyph[1]), x0 + box.w - 2, y, glyph[0], 1);
      if (row.path === ex.hover && room < cells(name))
        this.paintFullName(buf, theme, nameToken, name, nameX, y);
    }
  }
}

/** The hovered row's whole name in a float-coloured strip over the windows beside the tree. */
function fullNameStrip(
  theme: ReturnType<typeof themeOf>,
  token: string,
): Style {
  return { ...theme.style(token), bg: theme.style("float").bg };
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
