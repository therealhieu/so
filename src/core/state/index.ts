import {
  addFiles,
  applySummaries,
  movePaths,
  type NoteIndex,
  removePaths,
} from "../features/links/note-index";
import { summarize } from "../features/links/summarize";
import type { Doc } from "../lang/markdown/doc";
import { markdownFileType } from "../lang/markdown/file-type";
import { linesOf, scanDoc } from "../lang/markdown/scan";
import { bufferForPath } from "./buffers";
import { none, toast } from "./result";
import type { Action, AppState, FileEvent, FsOp, Result, Stamp } from "./types";

const isNote = (path: string) => /\.md$/i.test(path);

const withIx = (s: AppState, ix: NoteIndex): AppState => ({
  ...s,
  index: { ...s.index, ix },
});

/**
 * A worker batch. Scan batches report progress and drop files a rescan no
 * longer finds; an update batch after the scan (`done = total = 0`) only
 * refreshes summaries.
 */
export function onIndexBatch(
  s: AppState,
  a: Extract<Action, { type: "indexBatch" }>,
): Result {
  const kept =
    a.removed === undefined ? s.index.ix : removePaths(s.index.ix, a.removed);
  const ix = applySummaries(kept, a.summaries, a.files, a.facts);
  if (a.done === 0 && a.total === 0) return none(withIx(s, ix));
  return none({
    ...s,
    index: { ...s.index, status: "indexing", done: a.done, total: a.total, ix },
  });
}

/** Property types from `.obsidian/types.json` replace the previous ones. */
export function onPropertyTypesLoaded(
  s: AppState,
  a: Extract<Action, { type: "propertyTypesLoaded" }>,
): Result {
  return none({ ...s, index: { ...s.index, types: a.types } });
}

export function onIndexReady(s: AppState): Result {
  const index = { ...s.index, status: "ready" as const, done: s.index.total };
  return toast({ ...s, index }, "info", "index ready");
}

/** A worker crash: the first one rescans, the second leaves the last index in place for good. */
export function onIndexFailed(
  s: AppState,
  a: Extract<Action, { type: "indexFailed" }>,
): Result {
  const index = a.final
    ? { ...s.index, status: "unavailable" as const }
    : { ...s.index, status: "indexing" as const, done: 0 };
  return toast(
    { ...s, index },
    "error",
    a.final ? "index unavailable" : "index unavailable — restarting",
  );
}

/**
 * A note `so` just wrote, summarized from the buffer's own scan. A buffer
 * edited during the write is skipped, so a summary always describes the disk.
 */
export function summarizeSaved(s: AppState, path: string): AppState {
  const b = bufferForPath(s, path);
  if (b === undefined || b.dirty || b.fileType !== markdownFileType.id)
    return s;
  const doc = b.analysis as Doc | undefined;
  if (doc === undefined) return s;
  return withIx(
    s,
    applySummaries(s.index.ix, [
      summarize(path, factsOf(s, path, b.stamp), doc.scan, b.text),
    ]),
  );
}

/** A note's facts after `so` wrote it: the write's stamp, and the created time the index already knows. */
const factsOf = (s: AppState, path: string, stamp: Stamp) => ({
  mtime: stamp.mtimeMs,
  size: stamp.size,
  ctime: s.index.ix.summaries.get(path)?.ctime ?? stamp.mtimeMs,
});

/** A file operation `so` completed; the watcher stays silent about it. */
export function indexAfterFsOp(s: AppState, op: FsOp): AppState {
  const ix = s.index.ix;
  switch (op.kind) {
    case "create":
      if (op.dir === true) return s;
      return withIx(
        s,
        isNote(op.from)
          ? applySummaries(ix, [
              summarize(op.from, { mtime: 0, size: 0, ctime: 0 }, scanDoc("")),
            ])
          : addFiles(ix, [op.from]),
      );
    case "copy":
      // The worker reads the copy when the runner reports it.
      return s;
    case "rename":
    case "move":
      return op.to === undefined || op.outside === true
        ? s
        : withIx(s, movePaths(ix, [{ from: op.from, to: op.to }]));
    case "trash":
      return withIx(s, removePaths(ix, [op.from]));
  }
}

/** Another program's change: removals leave the index; new non-note files join it. Notes go to the worker. */
export function indexAfterFileEvent(s: AppState, e: FileEvent): AppState {
  if (e.kind === "removed") return withIx(s, removePaths(s.index.ix, [e.path]));
  if (e.isDir || isNote(e.path) || s.index.ix.files.has(e.path)) return s;
  return withIx(s, addFiles(s.index.ix, [e.path]));
}

/** A note `so` rewrote on disk, summarized from the text it wrote. */
export const summarizeWritten = (
  s: AppState,
  path: string,
  text: string,
  stamp: Stamp | undefined,
): AppState =>
  withIx(
    s,
    applySummaries(s.index.ix, [
      summarize(
        path,
        factsOf(s, path, stamp ?? { mtimeMs: 0, size: 0, hash: "" }),
        scanDoc(text),
        linesOf(text),
      ),
    ]),
  );
