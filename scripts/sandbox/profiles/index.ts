import type { Profile } from "../profile";
import { bases } from "./bases";
import { brokenConfig } from "./broken-config";
import { empty } from "./empty";
import { gitRepo } from "./git";
import { large } from "./large";
import { tour } from "./tour";

/** Every profile, in `--list` order. */
export const PROFILES: readonly Profile[] = [
  tour,
  empty,
  large,
  bases,
  brokenConfig,
  gitRepo,
];

export const DEFAULT_PROFILE = tour.name;
