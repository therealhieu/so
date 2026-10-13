import type { FileEdit } from "../features/links/rename";
import { applyBufferEdits, bufferForPath } from "./buffers";
import { settle, skippedText } from "./closed-edits";
import { nextEditBatch } from "./link-edits";
import type { CodeEdit, CodeEditBatch, ServerKey } from "./lsp-types";
import { chain, message, none, toast } from "./result";
import type { Action, AppState, Effect, Result } from "./types";
import type { Registries } from "./update";

type Reply = { key: ServerKey; requestId: number | string };

const withEdit = (s: AppState, edit: CodeEditBatch | undefined): AppState => {
  if (edit !== undefined) return { ...s, lsp: { ...s.lsp, edit } };
  const { edit: _, ...lsp } = s.lsp;
  return { ...s, lsp };
};

const files = (n: number) => (n === 1 ? "1 file" : `${n} files`);

/** Answer the server's edit request, when the edit answers one. */
function replied(
  s: AppState,
  reply: Reply | undefined,
  failureReason: string | undefined,
): Result {
  if (reply === undefined) return none(s);
  const effect: Effect = {
    kind: "lspReply",
    key: reply.key,
    requestId: reply.requestId,
    applied: failureReason === undefined,
    ...(failureReason === undefined ? {} : { failureReason }),
  };
  return { state: s, effects: [effect] };
}

/**
 * Why the whole edit is refused: another edit still writes files, a file is
 * outside the workspace, or an open buffer moved past the version the server
 * edited.
 */
function refusal(
  s: AppState,
  edit: CodeEdit,
): { text: string; reason: string } | undefined {
  if (s.lsp.edit !== undefined) {
    const busy = "another edit is still being applied";
    return { text: busy, reason: busy };
  }
  if (edit.outside > 0) {
    const outside = `${files(edit.outside)} outside the workspace`;
    return { text: outside, reason: outside };
  }
  const moved = edit.files
    .filter((f) => {
      const b = bufferForPath(s, f.path);
      return (
        f.version !== undefined &&
        b !== undefined &&
        b.text.version !== f.version
      );
    })
    .map((f) => f.path)
    .join(", ");
  return moved === ""
    ? undefined
    : {
        text: `${moved} changed in the editor`,
        reason: `${moved} (changed in the editor)`,
      };
}

/**
 * Apply a server's workspace edit. Open buffers change in memory (one undo
 * step each, saved by autosave); closed files go to the file queue as one
 * batch. A refused edit changes nothing. `reply` answers the server once,
 * when every file is done or the edit is refused.
 */
export function startCodeEdit(
  s: AppState,
  edit: CodeEdit,
  o: { title: string; reply?: Reply },
  now: number,
  reg: Registries,
): Result {
  const refused = refusal(s, edit);
  if (refused !== undefined)
    return chain(
      message(s, `${o.title}: refused, ${refused.text}`, "error"),
      (st) => replied(st, o.reply, `refused: ${refused.reason}`),
    );
  const batch = nextEditBatch(s, now);
  const pending: string[] = [];
  const updated: string[] = [];
  const skipped: CodeEditBatch["skipped"] = [];
  const queued: Effect[] = [];
  let out = none(s);
  for (const f of edit.files) {
    if (f.edits.length === 0) continue;
    const fileEdit: FileEdit = { path: f.path, edits: f.edits };
    if (bufferForPath(out.state, f.path) === undefined) {
      pending.push(f.path);
      queued.push({ kind: "applyEdits", batch, edit: fileEdit });
      continue;
    }
    out = chain(out, (st) => {
      const applied = applyBufferEdits(st, fileEdit, now, reg);
      if (applied.stale)
        skipped.push({ path: f.path, reason: "edit out of range" });
      else updated.push(f.path);
      return applied;
    });
  }
  const progress: CodeEditBatch = {
    batch,
    pending,
    updated,
    skipped,
    ...(o.reply === undefined ? {} : { reply: o.reply }),
  };
  const started: Result = {
    state: out.state,
    effects: [...out.effects, ...queued],
  };
  return pending.length === 0
    ? chain(started, (st) => finish(st, progress))
    : chain(started, (st) => none(withEdit(st, progress)));
}

/** One closed file of the edit batch was written or skipped; the last one reports the batch. */
export function onCodeEditApplied(
  s: AppState,
  a: Extract<Action, { type: "editsApplied" }>,
): Result {
  const e = s.lsp.edit;
  if (e === undefined || e.batch !== a.batch || !e.pending.includes(a.path))
    return none(s);
  const next: CodeEditBatch = settle(e, a);
  return next.pending.length > 0
    ? none(withEdit(s, next))
    : finish(withEdit(s, undefined), next);
}

/** One "N files changed" toast, one listing skipped files, and the reply. */
function finish(s: AppState, e: CodeEditBatch): Result {
  const n = e.updated.length;
  const changed = n === 0 ? none(s) : toast(s, "info", `${files(n)} changed`);
  if (e.skipped.length === 0)
    return chain(changed, (st) => replied(st, e.reply, undefined));
  const text = skippedText(e.skipped);
  return chain(
    chain(changed, (st) => toast(st, "error", text)),
    (st) => replied(st, e.reply, text),
  );
}
