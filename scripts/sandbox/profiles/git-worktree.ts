import { join } from "node:path";
import { edit, git, initRepo, type Profile } from "../profile";
import { stageTour } from "./tour";

const WORKTREE = ".sandbox/git-worktree/vault/feature";

export const gitWorktree: Profile = {
  name: "git-worktree",
  summary: "Workspace is a linked worktree on branch feature",
  open: "feature",
  journeys: [
    {
      title: "Linked worktree",
      steps: ["Launch", "Open tour.md"],
      expect: [
        "The statusline shows feature",
        "tour.md shows its edited heading in the change column",
      ],
    },
    {
      title: "Refresh from the worktree's git dir",
      steps: [`In another terminal: git -C ${WORKTREE} add tour.md`],
      expect: [
        "Within a second the explorer marks tour.md staged and the sign clears",
      ],
    },
    {
      title: "Refresh from the common dir",
      steps: [
        `In another terminal: git -C ${WORKTREE} commit --quiet --message=wip`,
      ],
      expect: ["Within a second tour.md has no marker"],
    },
  ],
  stage: (vault) => {
    const main = join(vault, "main");
    stageTour(main);
    initRepo(main);
    git(main, ["worktree", "add", "--quiet", "-b", "feature", "../feature"]);
    edit(
      join(vault, "feature/tour.md"),
      "# Markdown tour",
      "# Markdown tour (feature)",
    );
  },
};
