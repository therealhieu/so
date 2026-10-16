import { resolveServers } from "../config/lsp";
import { svgSizeOfLines } from "../features/image/svg-size";
import { backlinksOf } from "../features/links/note-index";
import { clock } from "../features/video/probe";
import type { Pos } from "../kernel/text/pos";
import type { TextBuffer } from "../kernel/text/text-buffer";
import {
  matchStarts,
  type SearchCount,
  searchCount,
  searchPattern,
} from "../kernel/vim/search";
import type { Doc } from "../lang/markdown/doc";
import { markdownFileType } from "../lang/markdown/file-type";
import { RenderCache } from "../lang/markdown/render-cache";
import { baseWindow } from "./base-model";
import { browserWindow } from "./browser";
import { activeBuffer, activeWindow } from "./buffers";
import { gitSegment } from "./git";
import { imageWindow } from "./image";
import { jumpSegment } from "./jumps";
import { pdfPages, pdfWindow } from "./pdf";
import { pdfSearchCount } from "./pdf-tools";
import { rowCount, sqliteWindow } from "./sqlite";
import type { AppState, BufferState } from "./types";
import { videoDuration, videoWindow } from "./video";

export type StatusSegments = {
  mode: string;
  dirty: boolean;
  view?: string;
  path?: string;
  /** Markdown buffers only. */
  words?: number;
  saveError?: { reason: string; retryAt: number };
  /** The file was removed outside so; edits are kept but not autosaved. */
  deletedOnDisk?: true;
  position?: Pos;
  /** PDFs only, in place of `position`: "3/12", or "3/?" until the count is known, then the zoom ("3/12 156%"). */
  page?: string;
  /** Notes only, once the index has finished a scan. */
  backlinks?: number;
  /** Absent until the first batch. */
  index?: "indexing" | "ready" | "unavailable";
  indexProgress?: { done: number; total: number };
  /** The cursor's place among the last search's matches, when there are any. */
  search?: SearchCount;
  /** "jump i/n" once a jump is recorded. */
  jump?: string;
  /** The browser preview: "preview :<port>", "preview …" while it starts, or "preview off". */
  preview: string;
  /** Language servers attached to the active buffer that are starting, ready, or failed. */
  lsp?: { text: string; state: "starting" | "ready" | "failed" }[];
  /**
   * Inside a repository: the branch, unborn branch, or short sha, the
   * operation in progress, and the active file's line counts.
   */
  git?: {
    ref: string;
    op?: "rebasing" | "merging";
    added: number;
    changed: number;
    removed: number;
  };
};

function previewSegment(s: AppState): string {
  const p = s.preview;
  if (p.status === "on") return `preview :${p.port}`;
  return p.status === "starting" ? "preview …" : "preview off";
}

const wordCounts = new WeakMap<TextBuffer, number>();
/** Words per block by block content, so an edit recounts only its own block. */
const blockWords = new RenderCache<number>(8192);

/**
 * Whitespace-separated words; cached per immutable text version. With the
 * note's current `Doc`, unchanged blocks reuse their earlier counts.
 */
function countWords(text: TextBuffer, doc: Doc | undefined): number {
  const cached = wordCounts.get(text);
  if (cached !== undefined) return cached;
  const words = (from: number, to: number) => {
    let n = 0;
    for (let i = from; i <= to; i++)
      n += text.line(i).match(/\S+/g)?.length ?? 0;
    return n;
  };
  const n =
    doc?.version === text.version
      ? doc.blocks.reduce(
          (sum, b) =>
            sum + blockWords.get(b.hash, () => words(b.startLine, b.endLine)),
          0,
        )
      : words(0, text.lineCount - 1);
  wordCounts.set(text, n);
  return n;
}

/** Counting stops past this many matches and shows `>999`, like Neovim's `maxcount`. */
export const SEARCH_COUNT_CAP = 999;

const searchStarts = new WeakMap<
  TextBuffer,
  { pattern: string; starts: Pos[] }
>();

/** Match starts of `pattern`; cached per immutable text version and pattern. */
function startsOf(text: TextBuffer, pattern: string): Pos[] {
  const cached = searchStarts.get(text);
  if (cached?.pattern === pattern) return cached.starts;
  const re = searchPattern(pattern);
  const starts =
    re === undefined ? [] : matchStarts(text, re, SEARCH_COUNT_CAP + 1);
  searchStarts.set(text, { pattern, starts });
  return starts;
}

/**
 * The mode the badge names: the explorer, a browser window (`browse` while
 * keys go to the page), a PDF window, a base window
 * (`insert` while one of its cells is edited or its filter input is open),
 * or the vim mode.
 */
function modeOf(s: AppState): string {
  if (s.panels.explorer.focused) return "explorer";
  const page = browserWindow(s, s.windows.active);
  if (page !== undefined && s.vim.mode === "normal")
    return page.mode === "browse" ? "browse" : "web";
  if (pdfWindow(s, s.windows.active) !== undefined && s.vim.mode === "normal")
    return "pdf";
  if (
    sqliteWindow(s, s.windows.active) !== undefined &&
    s.vim.mode === "normal"
  )
    return "sqlite";
  if (imageWindow(s, s.windows.active) !== undefined && s.vim.mode === "normal")
    return "image";
  if (videoWindow(s, s.windows.active) !== undefined && s.vim.mode === "normal")
    return "video";
  const base = baseWindow(s, s.windows.active);
  if (base === undefined || s.vim.mode !== "normal") return s.vim.mode;
  return base.edit === undefined && base.search === undefined
    ? "base"
    : "insert";
}

/** What the statusline shows; the file-type decision lives here, not in the UI. */
export function statusSegments(s: AppState): StatusSegments {
  const mode = modeOf(s);
  const b = activeBuffer(s);
  const w = activeWindow(s);
  const index = s.index.status;
  const seg: StatusSegments =
    b === undefined || w === undefined
      ? { mode, dirty: false, preview: previewSegment(s) }
      : {
          mode,
          dirty: b.dirty,
          view: b.view,
          path: b.path,
          position: w.content.cursor,
          preview: previewSegment(s),
        };
  const pdf = pdfWindow(s, s.windows.active);
  if (b !== undefined && pdf !== undefined) {
    delete seg.position;
    seg.page = `${pdf.page}/${pdfPages(b) ?? "?"}`;
    if (pdf.fit === "width" && pdf.zoom !== undefined)
      seg.page += ` ${Math.round(pdf.zoom * 100)}%`;
    const found = pdfSearchCount(s);
    if (found !== undefined) seg.search = found;
  }
  const page = browserWindow(s, s.windows.active);
  if (b !== undefined && page !== undefined) {
    delete seg.position;
    const shown = page.loading ? "loading…" : page.title || page.url;
    if (shown) seg.page = shown;
    if (page.zoom !== 1)
      seg.page = `${seg.page ?? ""} ${Math.round(page.zoom * 100)}%`.trim();
  }
  const image = imageWindow(s, s.windows.active);
  if (b !== undefined && image !== undefined) {
    delete seg.position;
    // An SVG is drawn larger than its own size so zooming stays sharp.
    const size = b.fileType === "svg" ? svgSizeOfLines(b.text) : image.size;
    const parts = [
      ...(size === undefined
        ? []
        : [`${Math.round(size.width)}×${Math.round(size.height)}`]),
      ...(image.level === 1 ? [] : [`${Math.round(image.level * 100)}%`]),
    ];
    if (parts.length > 0) seg.page = parts.join(" ");
  }
  const video = videoWindow(s, s.windows.active);
  if (b !== undefined && video !== undefined) {
    delete seg.position;
    const duration = videoDuration(b);
    seg.page = `${clock(video.at)} / ${duration === undefined ? "?" : clock(duration)}`;
  }
  const db = sqliteWindow(s, s.windows.active);
  if (b !== undefined && db !== undefined) {
    delete seg.position;
    if (db.source !== undefined && db.pane !== "schema") {
      const count = rowCount(b, db);
      const n = (x: number) => x.toLocaleString("en-US");
      seg.page = `row ${n(db.row + 1)}/${count === undefined ? "?" : n(count)}`;
    }
  }
  if (b !== undefined && w !== undefined) {
    if (b.fileType === markdownFileType.id) {
      seg.words = countWords(b.text, b.analysis as Doc | undefined);
      if (index === "ready" || index === "unavailable")
        seg.backlinks = backlinksOf(s.index.ix, b.path).length;
    }
    if (s.vim.search !== undefined && s.vim.search.hidden !== true) {
      const starts = startsOf(b.text, s.vim.search.pattern);
      if (starts.length > 0)
        seg.search = searchCount(starts, w.content.cursor, SEARCH_COUNT_CAP);
    }
    if (b.save.kind === "failed")
      seg.saveError = { reason: b.save.reason, retryAt: b.save.retryAt };
    if (b.disk === "deleted") seg.deletedOnDisk = true;
    const git = gitSegment(s, b);
    if (git !== undefined) seg.git = git;
  }
  if (index !== "idle") seg.index = index;
  if (index === "indexing")
    seg.indexProgress = { done: s.index.done, total: s.index.total };
  const jump = jumpSegment(s.jumps);
  if (jump !== undefined) seg.jump = jump;
  const lsp = b === undefined ? undefined : lspSegments(s, b);
  if (lsp !== undefined) seg.lsp = lsp;
  return seg;
}

/**
 * The servers attached to the active buffer, starting or ready, with their
 * progress; then failed ones that served its file type under a root holding
 * it (a failed server is no longer attached). Missing and unavailable
 * servers stay silent.
 */
function lspSegments(s: AppState, b: BufferState): StatusSegments["lsp"] {
  const out: NonNullable<StatusSegments["lsp"]> = [];
  for (const key of s.lsp.attached[b.path] ?? []) {
    const v = s.lsp.servers[key];
    if (v?.state !== "starting" && v?.state !== "ready") continue;
    const text = v.progress === undefined ? v.name : `${v.name} ${v.progress}`;
    out.push({ text, state: v.state });
  }
  const failed = Object.values(s.lsp.servers).filter(
    (v) => v.state === "failed",
  );
  if (failed.length > 0) {
    const file = `${s.workspace.root}/${b.path}`;
    const served = new Set(
      resolveServers(s.config.lsp)
        .filter((spec) => spec.fileTypes.includes(b.fileType))
        .map((spec) => spec.name),
    );
    for (const v of failed)
      if (
        served.has(v.name) &&
        (v.root === undefined || file.startsWith(`${v.root}/`))
      )
        out.push({ text: v.name, state: "failed" });
  }
  return out.length === 0 ? undefined : out;
}
