import type { Profile } from "../profile";
import { bases } from "./bases";
import { brokenConfig } from "./broken-config";
import { empty } from "./empty";
import { gitRepo } from "./git";
import { gitConflict } from "./git-conflict";
import { gitEol } from "./git-eol";
import { gitSubfolder } from "./git-subfolder";
import { gitUnborn } from "./git-unborn";
import { gitWorktree } from "./git-worktree";
import { large } from "./large";
import { lsp } from "./lsp";
import { tour } from "./tour";

/** Every profile, in `--list` order. */
export const PROFILES: readonly Profile[] = [
  tour,
  empty,
  large,
  bases,
  brokenConfig,
  gitRepo,
  gitConflict,
  gitUnborn,
  gitSubfolder,
  gitWorktree,
  gitEol,
  lsp,
];

export const DEFAULT_PROFILE = tour.name;
