import {
  type FileEdit,
  planRename,
  renameImpact,
} from "../features/links/rename";
import type { Doc } from "../lang/markdown/doc";
import { markdownFileType } from "../lang/markdown/file-type";
import type { DocScan } from "../lang/markdown/scan";
import { applyBufferEdits, bufferForPath } from "./buffers";
import type { CommandContext } from "./commands";
import { dirname, explorerOp } from "./explorer";
import { summarizeWritten } from "./index";
import { chain, message, none, toast } from "./result";
import type {
  Action,
  AppState,
  Effect,
  FsOp,
  LinkRewrite,
  PromptState,
  Result,
} from "./types";
import type { Registries } from "./update";

const NOT_READY = "index not ready — try again when indexing finishes";
const UNAVAILABLE = "links will not be updated (index unavailable)";
const BUSY = "links still updating — try again when the update finishes";

/** The prompt line for a planned rewrite: "31 links in 12 files will be updated". */
export function impactText(n: { links: number; files: number }): string {
  if (n.links === 0) return "No links to update";
  const links = n.links === 1 ? "1 link" : `${n.links} links`;
  const files = n.files === 1 ? "1 file" : `${n.files} files`;
  return `${links} in ${files} will be updated`;
}

/** Link edits need a finished index; while it builds, the operation is refused. */
export function requireIndex(s: AppState): Result | undefined {
  const { status } = s.index;
  return status === "idle" || status === "indexing"
    ? message(s, NOT_READY)
    : undefined;
}

/**
 * One link rewrite runs at a time: a rename or move submitted while an earlier
 * one still waits for its file operation or edit results is refused, because
 * its plan would replace the earlier one and miss the earlier move.
 */
function refuseWhileRewriting(s: AppState): Result | undefined {
  return s.index.rewrite === undefined ? undefined : message(s, BUSY);
}

/** Live scans of the open notes, by path, so planning sees unsaved text. */
function openScans(s: AppState): Map<string, DocScan> {
  const open = new Map<string, DocScan>();
  for (const b of Object.values(s.buffers)) {
    const doc = b.analysis as Doc | undefined;
    if (b.fileType === markdownFileType.id && doc !== undefined)
      open.set(b.path, doc.scan);
  }
  return open;
}

const basename = (path: string) => path.slice(path.lastIndexOf("/") + 1);

/** `path` with "." and ".." segments resolved; `undefined` when it leaves the workspace. */
function normalize(path: string): string | undefined {
  const out: string[] = [];
  for (const part of path.split("/")) {
    if (part === "" || part === ".") continue;
    if (part !== "..") out.push(part);
    else if (out.pop() === undefined) return undefined;
  }
  return out.join("/");
}

/** Where a rename or move prompt's value puts `op.from`, or why it cannot. */
function targetOf(
  s: AppState,
  p: PromptState,
): { to: string } | { invalid: string } {
  const value = p.value.trim();
  if (value === "")
    return {
      invalid: p.op.kind === "rename" ? "name is empty" : "path is empty",
    };
  const dir = dirname(p.op.from);
  const joined =
    p.op.kind === "rename" ? (dir === "" ? value : `${dir}/${value}`) : value;
  const to = normalize(joined);
  if (to === undefined || to === "")
    return { invalid: "outside the workspace" };
  if (to !== p.op.from && s.index.ix.files.has(to))
    return { invalid: `${to} already exists` };
  return { to };
}

const planFor = (s: AppState, from: string, to: string): FileEdit[] =>
  to === from ? [] : planRename(s.index.ix, [{ from, to }], openScans(s));

/** The prompt with `impact` and `invalid` recomputed from its value. */
export function promptImpact(s: AppState, p: PromptState): PromptState {
  const { impact: _, invalid: __, ...rest } = p;
  const t = targetOf(s, p);
  if ("invalid" in t) return { ...rest, invalid: t.invalid };
  if (s.index.status === "unavailable") return { ...rest, impact: UNAVAILABLE };
  return {
    ...rest,
    impact: impactText(renameImpact(planFor(s, p.op.from, t.to))),
  };
}

/** `r` / `m`: the rename or move prompt for `from`, with its link impact. */
export function startRename(
  c: CommandContext,
  kind: "rename" | "move",
  from: string = c.state.panels.explorer.cursor,
): Result {
  const s = c.state;
  if (from === "") return none(s);
  const refused = requireIndex(s) ?? refuseWhileRewriting(s);
  if (refused !== undefined) return refused;
  const prompt: PromptState =
    kind === "rename"
      ? {
          kind: "input",
          title: "Rename",
          value: basename(from),
          op: { kind, from },
        }
      : { kind: "input", title: "Move to", value: from, op: { kind, from } };
  return none({
    ...s,
    overlay: { kind: "prompt", prompt: promptImpact(s, prompt) },
  });
}

/**
 * Enter on a rename or move prompt: plan the link edits now, keep them until
 * the file operation reports back, and emit the operation. An invalid or
 * unchanged value submits nothing; a rewrite still in flight closes the
 * prompt with a message and submits nothing.
 */
export function submitRename(s: AppState, p: PromptState, now: number): Result {
  const busy = refuseWhileRewriting(s);
  if (busy !== undefined) return busy;
  const open: AppState = { ...s, overlay: { kind: "prompt", prompt: p } };
  if (p.invalid !== undefined) return none(open);
  const t = targetOf(s, p);
  if ("invalid" in t) return none(open);
  if (t.to === p.op.from) return none(s);
  const op: FsOp = { kind: p.op.kind, from: p.op.from, to: t.to };
  const edits = s.index.status === "ready" ? planFor(s, op.from, t.to) : [];
  const { rewrite: _, ...index } = s.index;
  const batch = Math.max(now, (s.index.rewrite?.batch ?? 0) + 1);
  const rewrite: LinkRewrite = {
    batch,
    op,
    edits,
    pending: [],
    updated: [],
    skipped: [],
  };
  return explorerOp(
    { ...s, index: edits.length === 0 ? index : { ...index, rewrite } },
    op,
    now,
  );
}

const sameOp = (a: FsOp | undefined, b: FsOp) =>
  a !== undefined && a.kind === b.kind && a.from === b.from && a.to === b.to;

/** Whether `op` is the file operation the stored rewrite waits for. */
export const awaitsOp = (s: AppState, op: FsOp): boolean =>
  sameOp(s.index.rewrite?.op, op);

/** A failed file operation: its link edits are dropped unapplied. */
export function dropRewrite(s: AppState): AppState {
  const { rewrite: _, ...index } = s.index;
  return { ...s, index };
}

const under = (path: string, root: string) =>
  path === root || path.startsWith(`${root}/`);

/** Another rename or move while closed-file edits are queued: their paths follow it. */
export function followMove(s: AppState, from: string, to: string): AppState {
  const r = s.index.rewrite;
  if (r === undefined) return s;
  const pending = r.pending.map((p) =>
    under(p, from) ? to + p.slice(from.length) : p,
  );
  return { ...s, index: { ...s.index, rewrite: { ...r, pending } } };
}

/**
 * The file operation succeeded: edit open buffers in memory (one undo step
 * each, saved by autosave) and send one `applyEdits` per closed file.
 */
export function beginRewrite(s: AppState, reg: Registries): Result {
  const r = s.index.rewrite;
  if (r === undefined) return none(s);
  let out = none(s);
  const pending: string[] = [];
  const updated: string[] = [];
  const skipped: LinkRewrite["skipped"] = [];
  const effects: Effect[] = [];
  for (const edit of r.edits) {
    if (bufferForPath(out.state, edit.path) === undefined) {
      pending.push(edit.path);
      effects.push({ kind: "applyEdits", batch: r.batch, edit });
      continue;
    }
    out = chain(out, (st) => {
      const applied = applyBufferEdits(st, edit, r.batch, reg);
      if (applied.stale)
        skipped.push({ path: edit.path, reason: "changed in the editor" });
      else updated.push(edit.path);
      return applied;
    });
  }
  const rewrite: LinkRewrite = { ...r, pending, updated, skipped };
  return chain(
    { state: out.state, effects: [...out.effects, ...effects] },
    (st) => finish({ ...st, index: { ...st.index, rewrite } }),
  );
}

/** One closed file's result; the batch's last one reports the whole batch. */
export function onEditsApplied(
  s: AppState,
  a: Extract<Action, { type: "editsApplied" }>,
): Result {
  const written =
    a.ok && a.text !== undefined
      ? summarizeWritten(s, a.path, a.text, a.stamp?.mtimeMs ?? 0)
      : s;
  const r = written.index.rewrite;
  if (r === undefined || r.batch !== a.batch || !r.pending.includes(a.path))
    return none(written);
  const rewrite: LinkRewrite = {
    ...r,
    pending: r.pending.filter((p) => p !== a.path),
    updated: a.ok ? [...r.updated, a.path] : r.updated,
    skipped: a.ok
      ? r.skipped
      : [...r.skipped, { path: a.path, reason: a.reason ?? "unknown error" }],
  };
  return finish({ ...written, index: { ...written.index, rewrite } });
}

/** Once nothing is pending: one "N files updated" toast, plus one listing skipped files. */
function finish(s: AppState): Result {
  const r = s.index.rewrite;
  if (r === undefined || r.pending.length > 0) return none(s);
  const n = r.updated.length;
  const done = toast(
    dropRewrite(s),
    "info",
    `${n} ${n === 1 ? "file" : "files"} updated`,
  );
  if (r.skipped.length === 0) return done;
  const byReason = new Map<string, string[]>();
  for (const { path, reason } of r.skipped)
    byReason.set(reason, [...(byReason.get(reason) ?? []), path]);
  const text = [...byReason]
    .map(([reason, paths]) => `${paths.join(", ")} (${reason})`)
    .join("; ");
  return chain(done, (st) => toast(st, "error", `skipped: ${text}`));
}
