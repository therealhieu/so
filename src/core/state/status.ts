import { resolveServers } from "../config/lsp";
import { backlinksOf } from "../features/links/note-index";
import type { Pos } from "../kernel/text/pos";
import type { TextBuffer } from "../kernel/text/text-buffer";
import type { Doc } from "../lang/markdown/doc";
import { markdownFileType } from "../lang/markdown/file-type";
import { RenderCache } from "../lang/markdown/render-cache";
import { baseWindow } from "./base-model";
import { activeBuffer, activeWindow } from "./buffers";
import { gitSegment } from "./git";
import { jumpSegment } from "./jumps";
import type { AppState, BufferState } from "./types";

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
  /** Notes only, once the index has finished a scan. */
  backlinks?: number;
  /** Absent until the first batch. */
  index?: "indexing" | "ready" | "unavailable";
  indexProgress?: { done: number; total: number };
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

/**
 * The mode the badge names: the explorer, a base window (`insert` while one
 * of its cells is edited), or the vim mode.
 */
function modeOf(s: AppState): string {
  if (s.panels.explorer.focused) return "explorer";
  const base = baseWindow(s, s.windows.active);
  if (base === undefined || s.vim.mode !== "normal") return s.vim.mode;
  return base.edit === undefined ? "base" : "insert";
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
  if (b !== undefined && w !== undefined) {
    if (b.fileType === markdownFileType.id) {
      seg.words = countWords(b.text, b.analysis as Doc | undefined);
      if (index === "ready" || index === "unavailable")
        seg.backlinks = backlinksOf(s.index.ix, b.path).length;
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
