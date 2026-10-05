import { git, type Profile } from "../profile";
import { stageTour } from "./tour";

const REPO = ".sandbox/git-unborn/vault";

export const gitUnborn: Profile = {
  name: "git-unborn",
  summary: "Git repository with no commits yet; notes/ is staged",
  journeys: [
    {
      title: "Unborn branch",
      steps: ["Open tour.md", "Open the explorer with <leader>e"],
      expect: [
        "The statusline shows main with zero counts",
        "notes/ files are staged; the other files are untracked",
      ],
    },
    {
      title: "Blame before the first commit",
      steps: ["Press <leader>ghb on any line"],
      expect: ["not committed yet"],
    },
    {
      title: "Stage in an unborn repository",
      steps: [
        "In tour.md, press <leader>ghs",
        `git -C ${REPO} status --short tour.md`,
      ],
      expect: ["status shows AM"],
    },
    {
      title: "First commit from outside",
      steps: [
        `In another terminal: git -C ${REPO} commit --quiet --message=first`,
      ],
      expect: [
        "Within a second the notes/ markers clear and the statusline shows the commit's branch; other files stay untracked",
      ],
    },
  ],
  stage: (vault) => {
    stageTour(vault);
    git(vault, ["init", "--quiet", "--initial-branch=main"]);
    git(vault, ["add", "notes"]);
  },
};
