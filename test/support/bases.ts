import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { summarize } from "../../src/core/features/links/summarize";
import { linesOf, scanDoc } from "../../src/core/lang/markdown/scan";
import type { Action } from "../../src/core/state/types";

const WORKSPACE = join(import.meta.dir, "../fixtures/workspace");

/** `test/fixtures/workspace/tasks.base`. */
export const TASKS_BASE = readFileSync(join(WORKSPACE, "tasks.base"), "utf8");

/** The notes under `test/fixtures/workspace/tasks/`, by workspace path. */
export const TASK_NOTES: Readonly<Record<string, string>> = Object.fromEntries(
  readdirSync(join(WORKSPACE, "tasks"))
    .sort()
    .map((name) => [
      `tasks/${name}`,
      readFileSync(join(WORKSPACE, "tasks", name), "utf8"),
    ]),
);

/** A note's summary as the index worker makes it; `n` sets its size and times. */
export const noteSummary = (path: string, text: string, n = 1) =>
  summarize(
    path,
    { mtime: n, size: text.length, ctime: n },
    scanDoc(text),
    linesOf(text),
  );

/** One index batch with `notes` summarized and `files` listed. */
export function indexed(
  notes: Readonly<Record<string, string>> = TASK_NOTES,
  files: readonly string[] = [],
): Action {
  return {
    type: "indexBatch",
    summaries: Object.entries(notes).map(([p, t]) => noteSummary(p, t)),
    files: [...files],
    done: 0,
    total: 0,
  };
}
