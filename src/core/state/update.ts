import type {
  EditorKindRegistry,
  FileTypeRegistry,
} from "../filetypes/registry";
import type { Binding } from "../kernel/commands/defaults";
import type { CommandRegistry } from "../kernel/commands/registry";
import { onFileLoaded, onFileRefused } from "./buffers";
import type { CommandContext, CommandResult } from "./commands";
import { onConfigLoaded } from "./config";
import { onFileChanged } from "./disk";
import { syncEmbeds } from "./embeds";
import { onDirListed, onFsResult, withTrash } from "./explorer";
import {
  onIndexBatch,
  onIndexFailed,
  onIndexReady,
  onPropertyTypesLoaded,
} from "./index";
import { handleKeyAction, onClipboardText } from "./keys";
import { onEditsApplied } from "./link-edits";
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
import {
  answersMentions,
  followShownNote,
  onMentionResults,
} from "./side-panel";
import type { Action, AppState, Effect, MouseEvent, Result } from "./types";
import type { ViewContextRegistry } from "./view-context";
import { onWhichKeyTimer } from "./whichkey";

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
};

/**
 * Each window shows its buffer in the editor kind the buffer's file type
 * names when that kind is registered, and in "text" otherwise. Unchanged
 * windows keep their identity.
 */
function syncEditorKinds(r: Result, reg: Registries): Result {
  const s = r.state;
  let byId: AppState["windows"]["byId"] | undefined;
  for (const w of Object.values(s.windows.byId)) {
    const b = s.buffers[w.content.bufferId];
    if (b === undefined) continue;
    const kind = reg.fileTypes.get(b.fileType)?.editor;
    const editor =
      kind !== undefined && reg.editorKinds.get(kind) !== undefined
        ? kind
        : "text";
    if (editor === w.content.editor) continue;
    byId ??= { ...s.windows.byId };
    byId[w.id] = { ...w, content: { ...w.content, editor } };
  }
  return byId === undefined
    ? r
    : { ...r, state: { ...s, windows: { ...s.windows, byId } } };
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
      case "mouse":
        return onMouse(state, action.event);
      case "configLoaded":
        return onConfigLoaded(state, action, reg);
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
    }
    const unhandled: never = action;
    return unhandled;
  };
  return (state, action) => {
    try {
      const r = syncEmbeds(
        state,
        followShownNote(state, syncEditorKinds(step(state, action), reg)),
      );
      return action.type !== "stateLoaded" && sessionChanged(state, r.state)
        ? {
            state: r.state,
            effects: [
              ...r.effects,
              { kind: "startTimer", id: "saveState", ms: SAVE_STATE_MS },
            ],
          }
        : r;
    } catch (e) {
      return { state: notifyError(state, e), effects: [] };
    }
  };
}

/** A timer fired: which-key, grep, the session save, or a buffer or toast timer. */
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
  return onTimer(s, a);
}

function onResize(s: AppState, a: Extract<Action, { type: "resize" }>): Result {
  return onPickerResize(
    { ...s, terminal: { ...s.terminal, cols: a.cols, rows: a.rows } },
    s.terminal.cols,
  );
}

/** Scroll the active window, keeping at least its last line on screen. */
function onMouse(s: AppState, e: MouseEvent): Result {
  const w = s.windows.byId[s.windows.active];
  const b = w && s.buffers[w.content.bufferId];
  if (w === undefined || b === undefined) return none(s);
  const scroll = Math.max(
    0,
    Math.min(w.content.scroll + e.delta, b.text.lineCount - 1),
  );
  return none({
    ...s,
    windows: {
      ...s.windows,
      byId: {
        ...s.windows.byId,
        [w.id]: { ...w, content: { ...w.content, scroll } },
      },
    },
  });
}
