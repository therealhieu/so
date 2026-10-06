import type { BaseLayoutRegistry } from "../features/bases/views";
import type {
  EditorKindRegistry,
  FileTypeRegistry,
} from "../filetypes/registry";
import type { Binding } from "../kernel/commands/defaults";
import type { CommandRegistry } from "../kernel/commands/registry";
import { onFrontmatterPatched } from "./base-write";
import { fullText, onFileLoaded, onFileRefused } from "./buffers";
import type { CommandContext, CommandResult } from "./commands";
import { onConfigLoaded } from "./config";
import { onFileChanged } from "./disk";
import type { EmbedModelRegistry } from "./embed-models";
import { syncEmbeds } from "./embeds";
import { onDirListed, onFsResult, withTrash } from "./explorer";
import {
  onGitBlamed,
  onGitDetected,
  onGitDiffTimer,
  onGitDirChanged,
  onGitIndexRead,
  onGitRefreshTimer,
  onGitStaged,
  onGitStatus,
  onToolExited,
  syncGitFiles,
} from "./git";
import {
  onIndexBatch,
  onIndexFailed,
  onIndexReady,
  onPropertyTypesLoaded,
} from "./index";
import { handleKeyAction, onClipboardText } from "./keys";
import { onEditsApplied } from "./link-edits";
import {
  onLspApplyEdit,
  onLspAttached,
  onLspDiagnostics,
  onLspInlayHints,
  onLspMessage,
  onLspResult,
  onLspServer,
  syncDiagnostics,
  syncFloat,
  syncHighlight,
  syncLineShift,
} from "./lsp";
import { onMouse } from "./mouse";
import { onNoteCreated } from "./note-commands";
import {
  onPickerResize,
  onPreviewLoaded,
  onSearchResults,
  onSearchTimer,
} from "./picker";
import {
  onOpenUrlFailed,
  onPreviewFailed,
  onPreviewStarted,
  onPreviewStopped,
} from "./preview";
import { clearMessage, none, notifyError } from "./result";
import { onSaved, onSaveFailed, onTimer } from "./save";
import {
  onStateLoaded,
  SAVE_STATE_MS,
  sessionChanged,
  snapshotSession,
} from "./session";
import { onSettingFailed } from "./settings";
import {
  answersMentions,
  followShownNote,
  onMentionResults,
} from "./side-panel";
import type { Action, AppState, Effect, Result } from "./types";
import type { ViewContextRegistry } from "./view-context";
import { onWhichKeyTimer } from "./whichkey";
import { onZoomFill } from "./zoom";

export type Update = (
  state: AppState,
  action: Action,
) => { state: AppState; effects: Effect[] };

export type Registries = {
  fileTypes: FileTypeRegistry;
  editorKinds: EditorKindRegistry;
  commands: CommandRegistry<CommandContext, CommandResult>;
  /** Built-in and registered bindings; config overrides are merged per config by `keymapFor`. */
  bindings: readonly Binding[];
  /** Which-key group labels by prefix sequence ("<leader>f" → "find"). */
  groups: Readonly<Record<string, string>>;
  /** Per-file-type builders of a view's input context. */
  viewContexts: ViewContextRegistry;
  /** Per-file-type builders of what a note shows for an embedded non-note file. */
  embedModels: EmbedModelRegistry;
  /** Base view types to the layouts that show them. */
  layouts: BaseLayoutRegistry;
};

/**
 * Each window shows its buffer in the editor kind the buffer's file type
 * names when that kind is registered, and in "text" otherwise. A window that
 * becomes a non-text kind, or is opened at a subpath, gets its kind state
 * from the kind's `open`; one that becomes text drops it. A new base window
 * reads the property types. Unchanged windows keep their identity.
 */
function syncEditorKinds(r: Result, reg: Registries): Result {
  const s = r.state;
  let byId: AppState["windows"]["byId"] | undefined;
  const effects: Effect[] = [];
  for (const w of Object.values(s.windows.byId)) {
    const b = s.buffers[w.content.bufferId];
    if (b === undefined) continue;
    const kind = reg.fileTypes.get(b.fileType)?.editor;
    const editor =
      kind !== undefined && reg.editorKinds.get(kind) !== undefined
        ? kind
        : "text";
    const changed = editor !== w.content.editor;
    if (!changed && w.content.subpath === undefined) continue;
    const spec = editor === "text" ? undefined : reg.editorKinds.get(editor);
    const { kindState: _, subpath, ...rest } = w.content;
    const content =
      spec === undefined
        ? { ...rest, editor }
        : {
            ...rest,
            editor,
            kindState: spec.open(b.path, fullText(b.text), subpath),
          };
    byId ??= { ...s.windows.byId };
    byId[w.id] = { ...w, content };
    if (changed && editor === "base")
      effects.push({ kind: "readPropertyTypes" });
  }
  return byId === undefined
    ? r
    : {
        state: { ...s, windows: { ...s.windows, byId } },
        effects: [...r.effects, ...effects],
      };
}

/**
 * A pure reducer over the given registries; a thrown error keeps the
 * previous state. A change to the persisted session (re)starts the save
 * debounce, the backlinks panel follows the active note, notes' embed
 * targets stay loaded while they are embedded, and each window's editor
 * kind follows its file type.
 */
export function createUpdate(reg: Registries): Update {
  const step = (state: AppState, action: Action): Result => {
    switch (action.type) {
      case "key":
        // A message lasts until the next key; one the key itself sets still shows.
        return handleKeyAction(clearMessage(state), action, reg);
      case "clipboardText":
        return onClipboardText(state, action, reg);
      case "fileLoaded":
        return onFileLoaded(state, action, reg);
      case "fileRefused":
        return onFileRefused(state, action);
      case "fileChanged":
        return onFileChanged(state, action.event);
      case "dirListed":
        return onDirListed(state, action);
      case "fsResult":
        return onFsResult(state, action, reg);
      case "trashAvailable":
        return none(withTrash(state, action.available));
      case "timer":
        return onTimerAction(state, action, reg);
      case "saved":
        return onSaved(state, action);
      case "saveFailed":
        return onSaveFailed(state, action);
      case "resize":
        return onResize(state, action);
      case "zoomFill":
        return onZoomFill(state, action);
      case "mouse":
        return onMouse(state, action, reg);
      case "configLoaded":
        return onConfigLoaded(state, action, reg);
      case "settingFailed":
        return onSettingFailed(state, action);
      case "indexBatch":
        return onIndexBatch(state, action);
      case "indexReady":
        return onIndexReady(state);
      case "indexFailed":
        return onIndexFailed(state, action);
      case "editsApplied":
        return onEditsApplied(state, action);
      case "stateLoaded":
        return onStateLoaded(state, action);
      case "searchResults":
        return answersMentions(state, action)
          ? onMentionResults(state, action, reg)
          : onSearchResults(state, action);
      case "previewLoaded":
        return onPreviewLoaded(state, action);
      case "previewStarted":
        return onPreviewStarted(state, action);
      case "previewStopped":
        return onPreviewStopped(state);
      case "previewFailed":
        return onPreviewFailed(state, action);
      case "openUrlFailed":
        return onOpenUrlFailed(state, action);
      case "noteCreated":
        // The runner's answer has no time, so a save of the note left is due now (0).
        return onNoteCreated(state, action, 0, reg);
      case "propertyTypesLoaded":
        return onPropertyTypesLoaded(state, action);
      case "frontmatterPatched":
        return onFrontmatterPatched(state, action);
      case "lspServer":
        return onLspServer(state, action);
      case "lspAttached":
        return onLspAttached(state, action);
      case "lspDiagnostics":
        return onLspDiagnostics(state, action);
      case "lspInlayHints":
        return onLspInlayHints(state, action);
      case "lspResult":
        return onLspResult(state, action, reg);
      case "lspMessage":
        return onLspMessage(state, action);
      case "lspApplyEdit":
        return onLspApplyEdit(state, action, reg);
      case "gitDetected":
        return onGitDetected(state, action);
      case "gitStatus":
        return onGitStatus(state, action);
      case "gitIndexRead":
        return onGitIndexRead(state, action);
      case "toolExited":
        return onToolExited(state, action);
      case "gitDirChanged":
        return onGitDirChanged(state);
      case "gitStaged":
        return onGitStaged(state, action);
      case "gitBlamed":
        return onGitBlamed(state, action);
    }
    const unhandled: never = action;
    return unhandled;
  };
  return (state, action) => {
    try {
      const r = syncGitFiles(
        state,
        syncHighlight(
          state,
          syncFloat(
            state,
            syncDiagnostics(
              state,
              syncLineShift(
                state,
                syncEmbeds(
                  state,
                  followShownNote(
                    state,
                    syncEditorKinds(step(state, action), reg),
                  ),
                  reg,
                ),
              ),
            ),
          ),
        ),
      );
      const withSession: Result =
        action.type !== "stateLoaded" && sessionChanged(state, r.state)
          ? {
              state: r.state,
              effects: [
                ...r.effects,
                { kind: "startTimer", id: "saveState", ms: SAVE_STATE_MS },
              ],
            }
          : r;
      return withGitDiffTimers(state, withSession);
    } catch (e) {
      return { state: notifyError(state, e), effects: [] };
    }
  };
}

/** Quiet time after the last edit before a buffer is diffed against the index. */
const GIT_DIFF_MS = 100;

/**
 * Every edit restarts its buffer's diff timer, wherever it came from (keys,
 * buffer edits, reloads), so the diff runs once per quiet period. A buffer
 * that just appeared is diffed when its index read answers.
 */
function withGitDiffTimers(prev: AppState, r: Result): Result {
  const files = r.state.git.files;
  if (r.state.git.repo === null || prev.buffers === r.state.buffers) return r;
  const timers: Effect[] = [];
  for (const b of Object.values(r.state.buffers)) {
    const before = prev.buffers[b.id];
    if (
      before !== undefined &&
      before.text.version !== b.text.version &&
      files[b.path] !== undefined
    )
      timers.push({
        kind: "startTimer",
        id: `gitDiff:${b.id}`,
        ms: GIT_DIFF_MS,
      });
  }
  return timers.length === 0
    ? r
    : { state: r.state, effects: [...r.effects, ...timers] };
}

/** A timer fired: which-key, grep, the session save, git, or a buffer or toast timer. */
function onTimerAction(
  s: AppState,
  a: Extract<Action, { type: "timer" }>,
  reg: Registries,
): Result {
  if (a.id === "whichKey") return onWhichKeyTimer(s, reg);
  if (a.id === "search") return onSearchTimer(s);
  if (a.id === "saveState")
    return {
      state: s,
      effects: [{ kind: "saveState", state: snapshotSession(s) }],
    };
  if (a.id === "gitRefresh") return onGitRefreshTimer(s);
  if (a.id.startsWith("gitDiff:"))
    return onGitDiffTimer(s, Number(a.id.slice("gitDiff:".length)));
  return onTimer(s, a, reg);
}

function onResize(s: AppState, a: Extract<Action, { type: "resize" }>): Result {
  return onPickerResize(
    { ...s, terminal: { ...s.terminal, cols: a.cols, rows: a.rows } },
    s.terminal.cols,
  );
}
