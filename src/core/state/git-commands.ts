import type { Binding } from "../kernel/commands/defaults";
import type { Command } from "../kernel/commands/registry";
import type { CommandContext, CommandResult } from "./commands";
import { openTool, resetHunk, stageHunk } from "./git";

type AppCommand = Command<CommandContext, CommandResult>;

export const gitCommands: readonly AppCommand[] = [
  { id: "git.tool", title: "Lazygit (full screen)", run: openTool },
  { id: "git.stageHunk", title: "Stage hunk", run: stageHunk },
  { id: "git.resetHunk", title: "Reset hunk", run: resetHunk },
];

export const gitBindings: readonly Binding[] = [
  { scope: { mode: "normal" }, seq: "<leader>gg", id: "git.tool" },
  { scope: { mode: "normal" }, seq: "<leader>ghs", id: "git.stageHunk" },
  { scope: { mode: "normal" }, seq: "<leader>ghr", id: "git.resetHunk" },
];
