import {
  type FrontmatterPatch,
  type FrontmatterValue,
  patchFrontmatter,
} from "../lang/markdown/frontmatter-patch";
import { applyBufferEdits, bufferForPath, fullText } from "./buffers";
import { onClosedFileWritten } from "./closed-edits";
import { chain, toast } from "./result";
import type { Action, AppState, Result } from "./types";
import type { Registries } from "./update";

/** The change a write made, as `path: - old line / + new line`. */
export function diffToast(
  s: AppState,
  path: string,
  removed: readonly string[],
  added: readonly string[],
): Result {
  const lines = [
    ...removed.map((l) => `- ${l}`),
    ...added.map((l) => `+ ${l}`),
  ];
  return toast(s, "info", `${path}: ${lines.join(" / ")}`);
}

/**
 * Change one property of the note at `path`. An open note (an embed target
 * too, as link rewrites do) is edited in its buffer as one undo step and
 * saved by autosave, so unsaved edits are kept and no buffer goes stale;
 * a closed note is patched on disk by the write queue, only while the
 * property still holds `expected`, the value the view showed.
 */
export function writeProperty(
  s: AppState,
  path: string,
  patch: FrontmatterPatch,
  expected: FrontmatterValue | undefined,
  now: number,
  reg: Registries,
): Result {
  const b = bufferForPath(s, path);
  if (b === undefined)
    return {
      state: s,
      effects: [{ kind: "patchFrontmatter", path, patch, expected }],
    };
  const r = patchFrontmatter(fullText(b.text), patch);
  if (!r.ok) return toast(s, "error", `not written: ${path} (${r.reason})`);
  const applied = applyBufferEdits(s, { path, edits: r.edits }, now, reg);
  if (applied.stale)
    return toast(s, "error", `not written: ${path} (changed in the editor)`);
  return chain(applied, (st) => diffToast(st, path, r.removed, r.added));
}

/**
 * A closed note's patch answered: the index takes the written text and a
 * buffer opened meanwhile reads it back, or the failure is shown.
 */
export function onFrontmatterPatched(
  s: AppState,
  a: Extract<Action, { type: "frontmatterPatched" }>,
): Result {
  return a.ok && a.text !== undefined
    ? chain(onClosedFileWritten(s, a), (st) =>
        diffToast(st, a.path, a.removed, a.added),
      )
    : toast(
        s,
        "error",
        `not written: ${a.path} (${a.reason ?? "unknown error"})`,
      );
}
