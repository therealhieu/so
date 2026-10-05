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

type AppCommand = Command<CommandContext, CommandResult>;

export const gitCommands: readonly AppCommand[] = [
  { id: "git.tool", title: "Lazygit (full screen)", run: openTool },
  { id: "git.stageHunk", title: "Stage hunk", run: stageHunk },
  { id: "git.resetHunk", title: "Reset hunk", run: resetHunk },
  { id: "git.previewHunk", title: "Preview hunk", run: previewHunk },
  { id: "git.nextHunk", title: "Git: next hunk", run: (c) => gotoHunk(c, 1) },
  {
    id: "git.prevHunk",
    title: "Git: previous hunk",
    run: (c) => gotoHunk(c, -1),
  },
  { id: "git.blameLine", title: "Blame line", run: blameLine },
];

export const gitBindings: readonly Binding[] = [
  { scope: { mode: "normal" }, seq: "<leader>gg", id: "git.tool" },
  { scope: { mode: "normal" }, seq: "<leader>ghs", id: "git.stageHunk" },
  { scope: { mode: "normal" }, seq: "<leader>ghr", id: "git.resetHunk" },
  { scope: { mode: "normal" }, seq: "<leader>ghp", id: "git.previewHunk" },
  { scope: { mode: "normal" }, seq: "<leader>ghb", id: "git.blameLine" },
  { scope: { mode: "normal" }, seq: "]h", id: "git.nextHunk" },
  { scope: { mode: "normal" }, seq: "[h", id: "git.prevHunk" },
];
