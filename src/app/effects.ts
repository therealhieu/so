import { join } from "node:path";
import { parseConfig } from "../core/config/toml";
import { applySpanEdits } from "../core/features/links/rename";
import { restoreFile } from "../core/state/buffers";
import type { Action, Effect, FsOp, Stamp, TimerId } from "../core/state/types";
import { readConfigText } from "../workspace/config-file";
import {
  atomicWrite,
  createEntry,
  FsError,
  listDir,
  moveEntry,
  readTextFile,
  removeEntry,
  sameStamp,
} from "../workspace/fs";
import type { ExclusionMatcher } from "../workspace/ignore";
import type { Logger } from "../workspace/log";
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
  /** The debug log; effect failures are recorded with paths and reasons only. */
  logger: Logger;
  /** config.toml, read again for each `loadConfig`. */
  configPath: string;
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
  /** Per path, the stamp this runner's last write replaced and the one it left. */
  const own = new Map<string, { from: Stamp; to: Stamp }>();
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

  /**
   * A write whose `expected` is the version this runner itself just replaced
   * (its `saved` not yet seen by `update`, e.g. a shutdown flush behind an
   * autosave) expects the version that write left instead. Any other change
   * on disk still fails with a conflict.
   */
  async function write(path: string, text: string, expected?: Stamp) {
    const last = own.get(path);
    const seen = last && sameStamp(expected, last.from) ? last.to : expected;
    const stamp = await atomicWrite(abs(path), text, seen);
    if (seen === undefined) own.delete(path);
    else own.set(path, { from: seen, to: stamp });
    return stamp;
  }

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
      const reason = msg(x);
      d.logger.error("file operation failed", {
        op: op.kind,
        path: op.from,
        reason,
      });
      return { type: "fsResult", op, ok: false, reason };
    }
  }

  const run = (e: Effect): void => {
    switch (e.kind) {
      case "read":
        void readTextFile(abs(e.path))
          .catch((x) => {
            d.logger.error("read failed", { path: e.path, reason: msg(x) });
            return { refused: "io" as const };
          })
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
          (x) => {
            d.logger.error("listing failed", { path: e.dir, reason: msg(x) });
            d.dispatch({
              type: "dirListed",
              dir: e.dir,
              entries: null,
              reason: msg(x),
            });
          },
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
            const stamp = await write(path, e.text, e.expected);
            d.ownOps.noteWrite(path, stamp);
            d.dispatch({ type: "saved", path, stamp });
          } catch (x) {
            d.logger.error("write failed", { path, reason: msg(x) });
            d.dispatch({ type: "saveFailed", path, reason: msg(x) });
          }
        });
        return;
      }
      case "applyEdits": {
        const before = [...unreported];
        void serial(async () => {
          const { batch, edit } = e;
          const followed = follow(edit.path, before);
          const path = followed ?? edit.path;
          const fail = (reason: string) => {
            d.logger.error("link edit skipped", { path, reason });
            d.dispatch({
              type: "editsApplied",
              batch,
              path,
              ok: false,
              reason,
            });
          };
          if (followed === null) return fail("removed");
          const cur = await readTextFile(abs(path)).catch(() => ({
            refused: "io" as const,
          }));
          if ("refused" in cur) return fail(`not readable (${cur.refused})`);
          const text = applySpanEdits(cur.text, edit.edits);
          if (text === null) return fail("changed on disk");
          try {
            const stamp = await write(path, restoreFile(cur, text), cur.stamp);
            d.ownOps.noteWrite(path, stamp);
            d.dispatch({
              type: "editsApplied",
              batch,
              path,
              ok: true,
              text,
              stamp,
            });
          } catch (x) {
            fail(msg(x));
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
      case "loadConfig":
        void readConfigText(d.configPath)
          .then((text) => parseConfig(text ?? ""))
          .catch((x): ReturnType<typeof parseConfig> => {
            d.logger.error("config read failed", { reason: msg(x) });
            return { ok: false, errors: [{ line: 1, message: msg(x) }] };
          })
          .then((result) => {
            if (!result.ok)
              d.logger.error("config invalid", {
                errors: result.errors.length,
              });
            d.dispatch({ type: "configLoaded", result, reload: true });
          });
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
            if (path !== null) await write(path, w.text, w.expected);
          }),
        ),
      ).then(() => {});
    },
  };
}
