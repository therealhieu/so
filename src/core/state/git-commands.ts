import type { Binding } from "../kernel/commands/defaults";
import type { Command } from "../kernel/commands/registry";
import type { CommandContext, CommandResult } from "./commands";
import {
  blameLine,
  gotoHunk,
  openTool,
  previewHunk,
  resetHunk,
  stageHunk,
} from "./git";
import { message } from "./result";

type AppCommand = Command<CommandContext, CommandResult>;

/**
 * A command on the editor's cursor line. From the explorer it refuses, since
 * the tree's selection may be another file than the window's.
 */
const atEditorCursor =
  (run: (c: CommandContext) => CommandResult) =>
  (c: CommandContext): CommandResult =>
    c.state.panels.explorer.focused
      ? message(c.state, "hunks act on a window's cursor; focus a window first")
      : run(c);

export const gitCommands: readonly AppCommand[] = [
  { id: "git.tool", title: "Lazygit (full screen)", run: openTool },
  { id: "git.stageHunk", title: "Stage hunk", run: atEditorCursor(stageHunk) },
  { id: "git.resetHunk", title: "Reset hunk", run: atEditorCursor(resetHunk) },
  {
    id: "git.previewHunk",
    title: "Preview hunk",
    run: atEditorCursor(previewHunk),
  },
  {
    id: "git.nextHunk",
    title: "Git: next hunk",
    run: atEditorCursor((c) => gotoHunk(c, 1)),
  },
  {
    id: "git.prevHunk",
    title: "Git: previous hunk",
    run: atEditorCursor((c) => gotoHunk(c, -1)),
  },
  { id: "git.blameLine", title: "Blame line", run: atEditorCursor(blameLine) },
];

export const gitBindings: readonly Binding[] = [
  { scope: { mode: "normal" }, seq: "<leader>gg", id: "git.tool" },
  { scope: { mode: "explorer" }, seq: "<leader>gg", id: "git.tool" },
  { scope: { mode: "normal" }, seq: "<leader>ghs", id: "git.stageHunk" },
  { scope: { mode: "normal" }, seq: "<leader>ghr", id: "git.resetHunk" },
  { scope: { mode: "normal" }, seq: "<leader>ghp", id: "git.previewHunk" },
  { scope: { mode: "normal" }, seq: "<leader>ghb", id: "git.blameLine" },
  { scope: { mode: "normal" }, seq: "]h", id: "git.nextHunk" },
  { scope: { mode: "normal" }, seq: "[h", id: "git.prevHunk" },
];

export const gitGroups = { "<leader>g": "git", "<leader>gh": "hunk" } as const;
