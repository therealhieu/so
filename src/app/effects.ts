import {
  lstat,
  mkdir,
  readdir,
  readFile,
  realpath,
  stat,
} from "node:fs/promises";
import { basename, dirname, join, relative } from "node:path";
import { parseConfig } from "../core/config/toml";
import { removeConfigValue, setConfigValue } from "../core/config/toml-edit";
import { applySpanEdits } from "../core/features/links/rename";
import { expandTemplate } from "../core/features/notes/template";
import { annotationsPath } from "../core/features/pdf/annotations";
import {
  frontmatterValue,
  patchFrontmatter,
  seedFrontmatter,
} from "../core/lang/markdown/frontmatter-patch";
import { restoreFile } from "../core/state/buffers";
import type { Action, Effect, FsOp, Stamp, TimerId } from "../core/state/types";
import { readConfigText } from "../workspace/config-file";
import {
  atomicWrite,
  copyEntry,
  createEntry,
  createExclusive,
  exists,
  FsError,
  listDir,
  moveEntry,
  moveInto,
  readBinaryFile,
  readTextFile,
  removeEntry,
  sameStamp,
} from "../workspace/fs";
import type { Git } from "../workspace/git";
import type { GitWatcher } from "../workspace/git-watcher";
import type { ExclusionMatcher } from "../workspace/ignore";
import type { Logger } from "../workspace/log";
import type { PdfRasterizer } from "../workspace/pdf";
import { readPropertyTypes } from "../workspace/property-types";
import { saveStateFile } from "../workspace/state-file";
import type { ClipboardProvider, FileClipboard } from "../workspace/system";
import type { Trash } from "../workspace/trash";
import type { OwnOps } from "../workspace/watcher";
import type { IndexHost } from "./index-host";
import type { LspHost } from "./lsp-host";
import type { PreviewHost } from "./preview-host";
import type { ToolHost } from "./tool-host";

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
  /** The system clipboard's files, for the explorer's copy, cut, and paste. */
  fileClipboard: FileClipboard;
  dispatch: (a: Action) => void;
  exit: (code: number) => void;
  now?: () => number;
  /** The debug log; effect failures are recorded with paths and reasons only. */
  logger: Logger;
  /** config.toml, read again for each `loadConfig`. */
  configPath: string;
  /** The session state file; without one, `saveState` does nothing. */
  statePath?: string;
  /**
   * Answers `search`; without one, every search finds nothing. Own writes
   * are reported to it, since the watcher keeps them silent.
   */
  index?: Pick<IndexHost, "search" | "notify" | "moved">;
  /** Runs language-server effects; without one, every request fails at once. */
  lsp?: Pick<LspHost, "run" | "notify">;
  /** The one preview server's owner. */
  preview: Pick<PreviewHost, "start" | "stop">;
  /** Opens an address in the user's browser; rejects when no browser could be launched. */
  openUrl: (url: string) => Promise<void>;
  /** Every Git call; the effects carry the repository, so the runner keeps no git state. */
  git: Git;
  /** Starts the one git-dir watcher, on the first `gitWatch`. */
  watchGit: (dirs: string[], onChange: () => void) => GitWatcher;
  /** Hands the terminal to the git tool; bound once the lifecycle exists. */
  tool: ToolHost;
  /** Paths whose file type is never read as text; without one, every file is. */
  binaryFile?: (path: string) => boolean;
  /** Counts PDF pages; without one, every PDF answers that Poppler is missing. */
  pdf?: Pick<PdfRasterizer, "info" | "text" | "layout" | "outline">;
};

export type EffectRunner = {
  run(e: Effect): void;
  /**
   * Write through the same serial queue, e.g. on shutdown; no actions are
   * dispatched. Resolves once everything queued before it has run too.
   */
  flush(
    writes: Extract<Effect, { kind: "write" | "writeAnnotations" }>[],
  ): Promise<void>;
};

const wallClock = () => performance.timeOrigin + performance.now();

/** A copy shorter than this shows no progress. */
const COPY_QUIET_MS = 300;
/** The shortest gap between two progress reports of one copy. */
const COPY_TICK_MS = 100;

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
type ListDirEffect = Extract<Effect, { kind: "listDir" }>;

export function createEffectRunner(d: RunnerDeps): EffectRunner {
  const now = d.now ?? wallClock;
  const abs = (p: string) => join(d.root, p);

  let realRoot: Promise<string> | undefined;
  /**
   * A clipboard path inside the workspace spelled from `root`, which may be
   * reached through a symlink (`/tmp` is `/private/tmp` on macOS); any other
   * path as given. The entry itself is not resolved, so a link stays a link.
   */
  async function spelled(path: string): Promise<string> {
    realRoot ??= realpath(d.root).catch(() => d.root);
    const real = join(
      await realpath(dirname(path)).catch(() => dirname(path)),
      basename(path),
    );
    const rootReal = await realRoot;
    return under(real, rootReal)
      ? join(d.root, relative(rootReal, real))
      : path;
  }

  /**
   * Progress of a copy into `to`, told only once it has run 300 ms and then
   * at most every 100 ms, so a quick copy shows nothing.
   */
  function copyProgress(to: string) {
    const start = now();
    let last = Number.NEGATIVE_INFINITY;
    return (done: number, total: number) => {
      const t = now();
      if (t - start < COPY_QUIET_MS || t - last < COPY_TICK_MS) return;
      last = t;
      d.dispatch({ type: "copyProgress", to, done, total });
    };
  }

  /** A copied or moved-in entry: the index and language servers learn of its files. */
  async function announceAdded(op: FsOp): Promise<void> {
    if (op.to === undefined) return;
    d.index?.notify({ kind: "changed", path: op.to, isDir: op.dir === true });
    if (d.lsp === undefined) return;
    for (const path of await watchedFiles(op.to).catch(() => []))
      d.lsp.notify({ kind: "changed", path, isDir: false });
  }

  /** The watched files at or below `rel`: itself when it is a file, none when it is missing. */
  async function watchedFiles(rel: string): Promise<string[]> {
    const st = await lstat(abs(rel)).catch(() => null);
    if (st === null) return [];
    const found = st.isDirectory()
      ? (await readdir(abs(rel), { recursive: true, withFileTypes: true }))
          .filter((e) => !e.isDirectory())
          .map((e) => relative(d.root, join(e.parentPath, e.name)))
      : [rel];
    return found.filter((p) => !d.matcher.isExcludedPath(p)).sort();
  }
  let tail: Promise<unknown> = Promise.resolve();
  const unreported = new Set<PathOp>();
  /** Per path, the stamp this runner's last write replaced and the one it left. */
  const own = new Map<string, { from: Stamp; to: Stamp }>();
  /** Setting writes run one after another, so each edits the last one's file. */
  let settingWrites = Promise.resolve();

  /** Set one config.toml value in place, creating the file and its folder when missing. */
  async function writeSetting(e: Extract<Effect, { kind: "writeSetting" }>) {
    const text = (await readConfigText(d.configPath)) ?? "";
    const edit = setConfigValue(text, e.path, e.value);
    if (!edit.ok) throw new Error(edit.reason);
    await mkdir(dirname(d.configPath), { recursive: true });
    await atomicWrite(d.configPath, edit.text);
  }
  /** Set or remove key bindings in config.toml with one write. */
  async function writeBindings(e: Extract<Effect, { kind: "writeBindings" }>) {
    let text = (await readConfigText(d.configPath)) ?? "";
    for (const b of e.edits) {
      const edit =
        b.id === undefined
          ? removeConfigValue(text, b.path)
          : setConfigValue(text, b.path, b.id);
      if (!edit.ok) throw new Error(edit.reason);
      text = edit.text;
    }
    await mkdir(dirname(d.configPath), { recursive: true });
    await atomicWrite(d.configPath, text);
  }
  /** Replace a PDF's annotations file, creating its folders. */
  async function writeAnnotations(pdf: string, text: string): Promise<void> {
    const path = abs(annotationsPath(pdf));
    await mkdir(dirname(path), { recursive: true });
    await atomicWrite(path, text);
  }
  const serial = <T>(job: () => Promise<T>): Promise<T> => {
    const next = tail.then(job, job);
    tail = next.catch(() => {});
    return next;
  };

  let gitWatcher: GitWatcher | undefined;

  /**
   * One listing per folder at a time: listings asked for meanwhile become
   * one more after it, with the latest options, so a burst of file events
   * reads a growing folder a few times instead of once per event.
   */
  const listings = new Map<string, ListDirEffect | null>();
  const listFolder = (e: ListDirEffect) => {
    if (listings.has(e.dir)) {
      listings.set(e.dir, e);
      return;
    }
    listings.set(e.dir, null);
    void listDir(d.root, e.dir, d.matcher, {
      dotfiles: e.dotfiles === true,
      gitignored: e.gitignored === true,
    })
      .then(
        (entries) => d.dispatch({ type: "dirListed", dir: e.dir, entries }),
        (x) => {
          d.logger.error("fs.listFailed", { path: e.dir, reason: msg(x) });
          d.dispatch({
            type: "dirListed",
            dir: e.dir,
            entries: null,
            reason: msg(x),
          });
        },
      )
      .finally(() => {
        const again = listings.get(e.dir);
        listings.delete(e.dir);
        if (again) listFolder(again);
      });
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

  /** The template text to expand, and what became of the template file. */
  async function templateText(
    e: Extract<Effect, { kind: "createNote" }>,
  ): Promise<{
    text: string;
    template: Extract<Action, { type: "noteCreated" }>["template"];
  }> {
    if (e.template === undefined) return { text: "", template: "none" };
    const file = await readTextFile(abs(e.template)).catch(() => ({
      refused: "io" as const,
    }));
    if (!("refused" in file)) return { text: file.text, template: "used" };
    if (await exists(abs(e.template)))
      return { text: "", template: "unreadable" };
    return { text: e.fallback ?? "", template: "missing" };
  }

  async function runFsOp(
    op: FsOp,
  ): Promise<Extract<Action, { type: "fsResult" }>> {
    try {
      if (op.kind === "create")
        await createEntry(d.root, op.from, op.dir === true);
      else if (op.kind === "copy" || op.outside === true) {
        if (op.to === undefined) throw new FsError(`no target for ${op.kind}`);
        const src = op.outside === true ? op.from : abs(op.from);
        const progress = copyProgress(op.to);
        if (op.kind === "copy") await copyEntry(d.root, src, op.to, progress);
        else await moveInto(d.root, src, op.to, progress);
      } else if (op.kind === "trash") {
        if (op.permanent) await removeEntry(d.root, op.from);
        else await d.trash.move(abs(op.from));
        d.ownOps.noteRemove(op.from);
      } else {
        if (op.to === undefined) throw new FsError(`no target for ${op.kind}`);
        await moveEntry(d.root, op.from, op.to);
        d.ownOps.noteMove(op.from, op.to);
      }
      d.logger.info("fs.op", {
        op: op.kind,
        path: op.from,
        ...(op.to === undefined ? {} : { to: op.to }),
      });
      return { type: "fsResult", op, ok: true };
    } catch (x) {
      const reason = msg(x);
      d.logger.error("fs.opFailed", {
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
        void (d.binaryFile?.(e.path) === true ? readBinaryFile : readTextFile)(
          abs(e.path),
        )
          .catch((x) => {
            d.logger.error("fs.readFailed", { path: e.path, reason: msg(x) });
            return { refused: "io" as const };
          })
          .then((r) => {
            const embed = e.embed === true ? { embed: true as const } : {};
            d.dispatch(
              "refused" in r
                ? {
                    type: "fileRefused",
                    path: e.path,
                    reason: r.refused,
                    ...embed,
                  }
                : { type: "fileLoaded", path: e.path, file: r, ...embed },
            );
          });
        return;
      case "listDir":
        listFolder(e);
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
            d.index?.notify({ kind: "changed", path, isDir: false });
            d.dispatch({ type: "saved", path, stamp });
          } catch (x) {
            d.logger.error("fs.writeFailed", { path, reason: msg(x) });
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
            d.logger.error("links.skipped", { path, reason });
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
            d.index?.notify({ kind: "changed", path, isDir: false });
            d.lsp?.notify({ kind: "changed", path, isDir: false });
            d.logger.info("links.edited", { path, links: edit.edits.length });
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
      case "patchFrontmatter": {
        const before = [...unreported];
        void serial(async () => {
          const followed = follow(e.path, before);
          const path = followed ?? e.path;
          const fail = (reason: string) => {
            d.logger.error("bases.patchFailed", { path, reason });
            d.dispatch({
              type: "frontmatterPatched",
              path,
              ok: false,
              removed: [],
              added: [],
              reason,
            });
          };
          if (followed === null) return fail("removed");
          const cur = await readTextFile(abs(path)).catch(() => ({
            refused: "io" as const,
          }));
          if ("refused" in cur) return fail(`not readable (${cur.refused})`);
          const property = "set" in e.patch ? e.patch.set : e.patch.remove;
          const held = frontmatterValue(cur.text, property);
          if (JSON.stringify(held) !== JSON.stringify(e.expected))
            return fail("changed on disk");
          const r = patchFrontmatter(cur.text, e.patch);
          if (!r.ok) return fail(r.reason);
          try {
            const stamp = await write(
              path,
              restoreFile(cur, r.text),
              cur.stamp,
            );
            d.ownOps.noteWrite(path, stamp);
            d.index?.notify({ kind: "changed", path, isDir: false });
            d.logger.info("bases.patched", { path });
            d.dispatch({
              type: "frontmatterPatched",
              path,
              ok: true,
              text: r.text,
              stamp,
              removed: r.removed,
              added: r.added,
            });
          } catch (x) {
            fail(msg(x));
          }
        });
        return;
      }
      case "create":
        void serial(async () => {
          const result = await runFsOp(e.op);
          d.dispatch(result);
          if (result.ok && e.op.dir !== true)
            d.index?.notify({ kind: "changed", path: e.op.from, isDir: false });
        });
        return;
      case "readPropertyTypes":
        void readPropertyTypes(d.root, (reason) =>
          d.logger.error("bases.typesInvalid", { reason }),
        ).then((types) => d.dispatch({ type: "propertyTypesLoaded", types }));
        return;
      case "createNote":
        void serial(async () => {
          const answer = {
            type: "noteCreated" as const,
            path: e.path,
            after: e.after,
            reason: e.reason,
            ...(e.template === undefined ? {} : { templatePath: e.template }),
          };
          const { text, template } = await templateText(e);
          const expanded = expandTemplate(text, e.vars);
          const written =
            e.frontmatter === undefined
              ? expanded
              : seedFrontmatter(expanded, e.frontmatter);
          try {
            const r = await createExclusive(d.root, e.path, written);
            if (r.created) {
              d.ownOps.noteWrite(e.path, r.stamp);
              d.index?.notify({ kind: "changed", path: e.path, isDir: false });
              if (r.fallback)
                d.logger.info("notes.createFallback", { path: e.path });
            }
            d.logger.info("notes.created", {
              path: e.path,
              created: r.created,
            });
            d.dispatch({
              ...answer,
              template,
              ...(r.created
                ? { outcome: "created", text: written, stamp: r.stamp }
                : { outcome: "exists" }),
            });
          } catch (x) {
            d.logger.error("notes.createFailed", {
              path: e.path,
              reason: msg(x),
            });
            d.dispatch({
              ...answer,
              outcome: "failed",
              template,
              failure: msg(x),
            });
          }
        });
        return;
      case "copy":
        void serial(async () => {
          const result = await runFsOp(e.op);
          d.dispatch(result);
          if (result.ok) await announceAdded(e.op);
        });
        return;
      case "rename":
      case "move":
      case "trash": {
        if (e.op.outside === true) {
          void serial(async () => {
            const result = await runFsOp(e.op);
            d.dispatch(result);
            if (result.ok) await announceAdded(e.op);
          });
          return;
        }
        const pathOp: PathOp = { op: e.op, ok: false };
        unreported.add(pathOp);
        void serial(async () => {
          const { from, to } = e.op;
          // Trashed files are listed while they still exist.
          const trashed =
            d.lsp !== undefined && e.op.kind === "trash"
              ? await watchedFiles(from).catch(() => [])
              : [];
          const result = await runFsOp(e.op);
          pathOp.ok = result.ok;
          unreported.delete(pathOp);
          d.dispatch(result);
          if (!result.ok) return;
          if (to === undefined) {
            d.index?.notify({ kind: "removed", path: from });
            for (const path of trashed)
              d.lsp?.notify({ kind: "removed", path });
            return;
          }
          d.index?.moved(from, to);
          if (d.lsp === undefined) return;
          for (const path of await watchedFiles(to).catch(() => [])) {
            d.lsp.notify({
              kind: "removed",
              path: from + path.slice(to.length),
            });
            d.lsp.notify({ kind: "changed", path, isDir: false });
          }
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
      case "fileClipboardWrite":
        void Promise.resolve()
          .then(() => d.fileClipboard.write(e.clip))
          .catch((x) =>
            d.dispatch({ type: "fileClipboardFailed", reason: msg(x) }),
          );
        return;
      case "fileClipboardRead":
        void Promise.resolve()
          .then(() => d.fileClipboard.read())
          .then(
            async (clip) => {
              const paths =
                clip === null ? [] : await Promise.all(clip.paths.map(spelled));
              const dirs: string[] = [];
              for (const p of paths)
                if ((await stat(p).catch(() => null))?.isDirectory())
                  dirs.push(p);
              d.dispatch({
                type: "fileClip",
                target: e.target,
                clip: clip === null ? null : { op: clip.op, paths },
                dirs,
                now: now(),
              });
            },
            (x) =>
              d.dispatch({
                type: "fileClip",
                target: e.target,
                clip: null,
                dirs: [],
                now: now(),
                error: msg(x),
              }),
          );
        return;
      case "exit":
        d.exit(e.code);
        return;
      case "search":
        if (d.index === undefined)
          d.dispatch({
            type: "searchResults",
            id: e.id,
            hits: [],
            capped: false,
          });
        else d.index.search(e);
        return;
      case "readPreview":
        void readTextFile(abs(e.path))
          .catch((x) => {
            d.logger.error("fs.readFailed", { path: e.path, reason: msg(x) });
            return { refused: "io" as const };
          })
          .then((result) =>
            d.dispatch({
              type: "previewLoaded",
              id: e.id,
              path: e.path,
              result,
            }),
          );
        return;
      case "saveState":
        if (d.statePath !== undefined)
          void saveStateFile(d.statePath, e.state).catch((x) =>
            d.logger.error("state.saveFailed", { reason: msg(x) }),
          );
        return;
      case "loadConfig":
        void readConfigText(d.configPath)
          .then((text) => parseConfig(text ?? ""))
          .catch((x): ReturnType<typeof parseConfig> => {
            d.logger.error("config.readFailed", { reason: msg(x) });
            return { ok: false, errors: [{ line: 1, message: msg(x) }] };
          })
          .then((result) => {
            if (!result.ok)
              d.logger.error("config.invalid", {
                errors: result.errors.length,
              });
            d.dispatch({ type: "configLoaded", result, reload: true });
          });
        return;
      case "startPreview":
        d.preview.start();
        return;
      case "stopPreview":
        void d.preview.stop();
        d.dispatch({ type: "previewStopped" });
        return;
      case "gitStatus":
        void d.git.status(e.repo).then(
          (status) =>
            d.dispatch({ type: "gitStatus", result: { ok: true, status } }),
          (x) =>
            d.dispatch({
              type: "gitStatus",
              result: { ok: false, reason: msg(x) },
            }),
        );
        return;
      case "gitReadIndex":
        void d.git.readIndex(e.repo, e.repoPath).then(
          (entry) => d.dispatch({ type: "gitIndexRead", path: e.path, entry }),
          (x) =>
            d.dispatch({
              type: "gitIndexRead",
              path: e.path,
              entry: { kind: "failed", reason: msg(x) },
            }),
        );
        return;
      // A stage joins the write queue: it lands after the save it follows.
      case "gitStage":
        void serial(() => d.git.stage(e.repo, e)).then(
          (result) =>
            d.dispatch({
              type: "gitStaged",
              path: e.path,
              result,
              report: e.report,
            }),
          (x) =>
            d.dispatch({
              type: "gitStaged",
              path: e.path,
              result: { failed: msg(x) },
              report: e.report,
            }),
        );
        return;
      case "gitBlame":
        void d.git.blame(e.repo, e.repoPath, e.line, e.contents).then(
          (result) =>
            d.dispatch({
              type: "gitBlamed",
              path: e.path,
              line: e.line,
              result,
              now: now(),
            }),
          (x) =>
            d.dispatch({
              type: "gitBlamed",
              path: e.path,
              line: e.line,
              result: { failed: msg(x) },
              now: now(),
            }),
        );
        return;
      case "gitWatch":
        gitWatcher ??= d.watchGit(e.dirs, () =>
          d.dispatch({ type: "gitDirChanged" }),
        );
        gitWatcher.retarget(e.dirs);
        return;
      case "runTool":
        void d.tool.run(e.argv, e.cwd).then(
          (result) => d.dispatch({ type: "toolExited", result }),
          (x) =>
            d.dispatch({
              type: "toolExited",
              result: { kind: "failed", reason: msg(x) },
            }),
        );
        return;
      case "openUrl":
        void d.openUrl(e.url).catch((x) => {
          d.logger.error("browser.openFailed", { reason: msg(x) });
          d.dispatch({ type: "openUrlFailed", url: e.url, reason: msg(x) });
        });
        return;
      case "lsp":
        if (d.lsp !== undefined) {
          d.lsp.run(e);
          return;
        }
        // No language-server host: every request fails at once.
        d.dispatch({
          type: "lspResult",
          id: e.id,
          result: { kind: "error", message: "language servers off" },
          now: now(),
        });
        return;
      case "lspCancel":
      case "lspReply":
      case "lspRestart":
        d.lsp?.run(e);
        return;
      case "writeBindings":
        settingWrites = settingWrites
          .then(() => writeBindings(e))
          .catch((x) => {
            d.logger.error("config.writeFailed", { reason: msg(x) });
            d.dispatch({
              type: "bindingsFailed",
              previous: e.previous,
              reason: msg(x),
            });
          });
        return;
      case "writeSetting":
        settingWrites = settingWrites
          .then(() => writeSetting(e))
          .catch((x) => {
            d.logger.error("config.writeFailed", { reason: msg(x) });
            d.dispatch({
              type: "settingFailed",
              path: e.path,
              previous: e.previous,
              reason: msg(x),
            });
          });
        return;
      case "pdfInfo": {
        const info =
          d.pdf?.info(e.path) ?? Promise.resolve({ kind: "missing" as const });
        void info.then((result) =>
          d.dispatch({ type: "pdfInfo", path: e.path, stamp: e.stamp, result }),
        );
        return;
      }
      case "pdfText": {
        const text =
          d.pdf?.text(e.path) ?? Promise.resolve({ kind: "missing" as const });
        void text.then((result) =>
          d.dispatch({ type: "pdfText", path: e.path, stamp: e.stamp, result }),
        );
        return;
      }
      case "pdfLayout": {
        const layout =
          d.pdf?.layout(e.path, e.page) ??
          Promise.resolve({ kind: "missing" as const });
        void layout.then((result) =>
          d.dispatch({
            type: "pdfLayout",
            path: e.path,
            stamp: e.stamp,
            page: e.page,
            result,
          }),
        );
        return;
      }
      case "pdfOutline": {
        const outline =
          d.pdf?.outline(e.path) ??
          Promise.resolve({ kind: "missing" as const });
        void outline.then((result) =>
          d.dispatch({
            type: "pdfOutline",
            path: e.path,
            stamp: e.stamp,
            result,
          }),
        );
        return;
      }
      case "readAnnotations": {
        const path = abs(annotationsPath(e.pdf));
        void readFile(path, "utf8").then(
          (text) => d.dispatch({ type: "annotationsRead", pdf: e.pdf, text }),
          (x: unknown) =>
            d.dispatch(
              (x as NodeJS.ErrnoException).code === "ENOENT"
                ? { type: "annotationsRead", pdf: e.pdf, text: null }
                : {
                    type: "annotationsRead",
                    pdf: e.pdf,
                    text: null,
                    reason: msg(x),
                  },
            ),
        );
        return;
      }
      case "writeAnnotations": {
        void serial(() => writeAnnotations(e.pdf, e.text)).catch((x: unknown) =>
          d.dispatch({ type: "annotationsFailed", pdf: e.pdf, reason: msg(x) }),
        );
        return;
      }
      case "moveAnnotations": {
        const of = (p: string) =>
          e.dir ? `.so/annotations/${p}` : annotationsPath(p);
        void serial(async () => {
          if (!(await exists(abs(of(e.from))))) return;
          await moveEntry(d.root, of(e.from), of(e.to));
        }).catch((x: unknown) =>
          d.dispatch({ type: "annotationsFailed", pdf: e.to, reason: msg(x) }),
        );
        return;
      }
    }
    const unhandled: never = e;
    throw new Error(`unknown effect: ${JSON.stringify(unhandled)}`);
  };

  return {
    run,
    flush: (writes) => {
      const before = [...unreported];
      return Promise.all(
        writes.map((w) =>
          serial(async () => {
            if (w.kind === "writeAnnotations")
              return writeAnnotations(w.pdf, w.text);
            const path = follow(w.path, before);
            if (path !== null) await write(path, w.text, w.expected);
          }),
        ),
      ).then(() => serial(async () => {}));
    },
  };
}
