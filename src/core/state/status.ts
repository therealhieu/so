import { backlinksOf } from "../features/links/note-index";
import type { Pos } from "../kernel/text/pos";
import type { TextBuffer } from "../kernel/text/text-buffer";
import { markdownFileType } from "../lang/markdown/file-type";
import { activeBuffer, activeWindow } from "./buffers";
import type { AppState } from "./types";

export type StatusSegments = {
  mode: string;
  dirty: boolean;
  view?: string;
  path?: string;
  /** Markdown buffers only. */
  words?: number;
  saveError?: { reason: string; retryAt: number };
  position?: Pos;
  /** Notes only, once the index has finished a scan. */
  backlinks?: number;
  /** Absent until the first batch. */
  index?: "indexing" | "ready" | "unavailable";
  indexProgress?: { done: number; total: number };
};

const wordCounts = new WeakMap<TextBuffer, number>();

/** Whitespace-separated words; cached per immutable text version. */
function countWords(text: TextBuffer): number {
  const cached = wordCounts.get(text);
  if (cached !== undefined) return cached;
  let n = 0;
  for (let i = 0; i < text.lineCount; i++)
    n += text.line(i).match(/\S+/g)?.length ?? 0;
  wordCounts.set(text, n);
  return n;
}

/** What the statusline shows; the file-type decision lives here, not in the UI. */
export function statusSegments(s: AppState): StatusSegments {
  const mode = s.panels.explorer.focused ? "explorer" : s.vim.mode;
  const b = activeBuffer(s);
  const w = activeWindow(s);
  const index = s.index.status;
  const seg: StatusSegments =
    b === undefined || w === undefined
      ? { mode, dirty: false }
      : {
          mode,
          dirty: b.dirty,
          view: b.view,
          path: b.path,
          position: w.content.cursor,
        };
  if (b !== undefined && w !== undefined) {
    if (b.fileType === markdownFileType.id) {
      seg.words = countWords(b.text);
      if (index === "ready" || index === "unavailable")
        seg.backlinks = backlinksOf(s.index.ix, b.path).length;
    }
    if (b.save.kind === "failed")
      seg.saveError = { reason: b.save.reason, retryAt: b.save.retryAt };
  }
  if (index !== "idle") seg.index = index;
  if (index === "indexing")
    seg.indexProgress = { done: s.index.done, total: s.index.total };
  return seg;
}
