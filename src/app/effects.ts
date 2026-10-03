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

/**
 * Runs effects and answers each fallible one with exactly one action. Every
 * mutating file-system effect shares one promise chain, so the disk sees
 * them in the order `update` emitted them; reads and listings run freely.
 */
export function createEffectRunner(d: RunnerDeps): EffectRunner {
  const now = d.now ?? wallClock;
  const abs = (p: string) => join(d.root, p);
  let tail: Promise<unknown> = Promise.resolve();
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

  async function runFsOp(op: FsOp): Promise<void> {
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
      d.dispatch({ type: "fsResult", op, ok: true });
    } catch (x) {
      d.dispatch({ type: "fsResult", op, ok: false, reason: msg(x) });
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
      case "write":
        void serial(async () => {
          try {
            const stamp = await atomicWrite(abs(e.path), e.text, e.expected);
            d.ownOps.noteWrite(e.path, stamp);
            d.dispatch({ type: "saved", path: e.path, stamp });
          } catch (x) {
            d.dispatch({ type: "saveFailed", path: e.path, reason: msg(x) });
          }
        });
        return;
      case "create":
      case "rename":
      case "move":
      case "trash":
        void serial(() => runFsOp(e.op));
        return;
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
    flush: (writes) =>
      Promise.all(
        writes.map((w) =>
          serial(() => atomicWrite(abs(w.path), w.text, w.expected)),
        ),
      ).then(() => {}),
  };
}
