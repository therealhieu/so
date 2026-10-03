import { join } from "node:path";
import type { Action, Effect, FsOp, TimerId } from "../core/state/types";
import {
  atomicWrite,
  createEntry,
  FsError,
  listDir,
  moveEntry,
  readTextFile,
  removeEntry,
} from "../workspace/fs";
import type { ExclusionMatcher } from "../workspace/ignore";
import type { ClipboardProvider } from "../workspace/system";
import type { Trash } from "../workspace/trash";
import type { OwnOps } from "../workspace/watcher";

/**
 * What the runner needs. `exit` is read at call time, so `main` can bind it
 * after the lifecycle exists. `now` is the one clock for timer actions.
 */
export type RunnerDeps = {
  root: string;
  matcher: ExclusionMatcher;
  ownOps: OwnOps;
  trash: Trash;
  clipboard: ClipboardProvider;
  dispatch: (a: Action) => void;
  exit: (code: number) => void;
  now?: () => number;
};

export type EffectRunner = {
  run(e: Effect): void;
  /** Write through the same serial queue, e.g. on shutdown; no actions are dispatched. */
  flush(writes: Extract<Effect, { kind: "write" }>[]): Promise<void>;
};

const wallClock = () => performance.timeOrigin + performance.now();

/** A failure's user-facing reason. */
const msg = (x: unknown): string => FsError.from(x).message;

const under = (path: string, dir: string) =>
  path === dir || path.startsWith(`${dir}/`);

/** A rename, move, or trash whose result `update` has not seen yet. */
type PathOp = { op: FsOp; ok: boolean };

/**
 * Where a write lands after the path operations queued before it: each
 * successful move of the path or a folder above it re-paths the write, and a
 * successful trash or removal cancels it (`null`). Failed operations change nothing.
 */
function follow(path: string, before: PathOp[]): string | null {
  let p: string | null = path;
  for (const { op, ok } of before) {
    if (p === null || !ok || !under(p, op.from)) continue;
    p = op.kind === "trash" ? null : `${op.to}${p.slice(op.from.length)}`;
  }
  return p;
}

const REMOVED = "deleted on disk — :w to recreate";

/**
 * Runs effects and answers each fallible one with exactly one action. Every
 * mutating file-system effect shares one promise chain, so the disk sees
 * them in the order `update` emitted them; reads and listings run freely.
 * A write emitted before an earlier rename, move, or trash reported back
 * still names the old path, so it follows that operation's outcome.
 */
export function createEffectRunner(d: RunnerDeps): EffectRunner {
  const now = d.now ?? wallClock;
  const abs = (p: string) => join(d.root, p);
  let tail: Promise<unknown> = Promise.resolve();
  const unreported = new Set<PathOp>();
  const serial = <T>(job: () => Promise<T>): Promise<T> => {
    const next = tail.then(job, job);
    tail = next.catch(() => {});
    return next;
  };

  const timers = new Map<TimerId, Timer>();
  const startTimer = (id: TimerId, due: number) => {
    clearTimeout(timers.get(id));
    const arm = () =>
      timers.set(
        id,
        setTimeout(
          () => {
            const t = now();
            if (t < due) return arm();
            timers.delete(id);
            d.dispatch({ type: "timer", id, now: t });
          },
          Math.max(0, Math.ceil(due - now())),
        ),
      );
    arm();
  };

  async function runFsOp(
    op: FsOp,
  ): Promise<Extract<Action, { type: "fsResult" }>> {
    try {
      if (op.kind === "create")
        await createEntry(d.root, op.from, op.dir === true);
      else if (op.kind === "trash") {
        if (op.permanent) await removeEntry(d.root, op.from);
        else await d.trash.move(abs(op.from));
        d.ownOps.noteRemove(op.from);
      } else {
        if (op.to === undefined) throw new FsError(`no target for ${op.kind}`);
        await moveEntry(d.root, op.from, op.to);
        d.ownOps.noteMove(op.from, op.to);
      }
      return { type: "fsResult", op, ok: true };
    } catch (x) {
      return { type: "fsResult", op, ok: false, reason: msg(x) };
    }
  }

  const run = (e: Effect): void => {
    switch (e.kind) {
      case "read":
        void readTextFile(abs(e.path))
          .catch(() => ({ refused: "io" as const }))
          .then((r) =>
            d.dispatch(
              "refused" in r
                ? { type: "fileRefused", path: e.path, reason: r.refused }
                : { type: "fileLoaded", path: e.path, file: r },
            ),
          );
        return;
      case "listDir":
        void listDir(d.root, e.dir, d.matcher).then(
          (entries) => d.dispatch({ type: "dirListed", dir: e.dir, entries }),
          (x) =>
            d.dispatch({
              type: "dirListed",
              dir: e.dir,
              entries: null,
              reason: msg(x),
            }),
        );
        return;
      case "write": {
        const before = [...unreported];
        void serial(async () => {
          const path = follow(e.path, before);
          if (path === null) {
            d.dispatch({ type: "saveFailed", path: e.path, reason: REMOVED });
            return;
          }
          try {
            const stamp = await atomicWrite(abs(path), e.text, e.expected);
            d.ownOps.noteWrite(path, stamp);
            d.dispatch({ type: "saved", path, stamp });
          } catch (x) {
            d.dispatch({ type: "saveFailed", path, reason: msg(x) });
          }
        });
        return;
      }
      case "create":
        void serial(async () => d.dispatch(await runFsOp(e.op)));
        return;
      case "rename":
      case "move":
      case "trash": {
        const pathOp: PathOp = { op: e.op, ok: false };
        unreported.add(pathOp);
        void serial(async () => {
          const result = await runFsOp(e.op);
          pathOp.ok = result.ok;
          unreported.delete(pathOp);
          d.dispatch(result);
        });
        return;
      }
      case "startTimer":
        startTimer(e.id, now() + e.ms);
        return;
      case "cancelTimer":
        clearTimeout(timers.get(e.id));
        timers.delete(e.id);
        return;
      case "clipboardWrite":
        void Promise.resolve()
          .then(() => d.clipboard.copy(e.text))
          .catch((x) =>
            d.dispatch({ type: "clipboardText", text: "", error: msg(x) }),
          );
        return;
      case "clipboardRead":
        void Promise.resolve()
          .then(() => d.clipboard.paste?.() ?? "")
          .then(
            (text) => d.dispatch({ type: "clipboardText", text }),
            (x) =>
              d.dispatch({ type: "clipboardText", text: "", error: msg(x) }),
          );
        return;
      case "exit":
        d.exit(e.code);
        return;
    }
  };

  return {
    run,
    flush: (writes) => {
      const before = [...unreported];
      return Promise.all(
        writes.map((w) =>
          serial(async () => {
            const path = follow(w.path, before);
            if (path !== null) await atomicWrite(abs(path), w.text, w.expected);
          }),
        ),
      ).then(() => {});
    },
  };
}
