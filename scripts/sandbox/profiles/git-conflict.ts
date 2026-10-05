import { join } from "node:path";
import { edit, git, initRepo, type Profile } from "../profile";
import { stageTour } from "./tour";

const REPO = ".sandbox/git-conflict/vault";

export const gitConflict: Profile = {
  name: "git-conflict",
  summary: "Git repository in the middle of a merge with one conflicted note",
  journeys: [
    {
      title: "Merge state",
      steps: ["Launch", "Open the explorer with <leader>e and expand notes/"],
      expect: [
        "The statusline shows main and merging",
        "notes/ideas.md has the conflict marker; tour.md (merged cleanly) is staged",
      ],
    },
    {
      title: "Stage refused in a conflict",
      steps: ["Open notes/ideas.md and press <leader>ghs inside the conflict"],
      expect: [
        "Notice: notes/ideas.md has conflicts; resolve them in lazygit",
        `git -C ${REPO} diff --cached notes/ideas.md is unchanged`,
      ],
    },
    {
      title: "Resolve the merge",
      steps: [
        "Keep one side in notes/ideas.md and save",
        `In another terminal: git -C ${REPO} commit --quiet --all --no-edit`,
      ],
      expect: [
        "The conflict marker and merging leave the statusline and explorer within a second",
      ],
    },
  ],
  stage: (vault) => {
    stageTour(vault);
    initRepo(vault);
    const ideas = join(vault, "notes/ideas.md");
    git(vault, ["switch", "--quiet", "--create", "other"]);
    edit(ideas, "- Write the first note", "- Write the first note today");
    edit(join(vault, "tour.md"), "# Markdown tour", "# Markdown tour (merged)");
    git(vault, ["commit", "--quiet", "--all", "--message=Plan today"]);
    git(vault, ["switch", "--quiet", "main"]);
    edit(ideas, "- Write the first note", "- Write the first note tonight");
    git(vault, ["commit", "--quiet", "--all", "--message=Plan tonight"]);
    // The merge stops on the conflict, which is the state this profile is for.
    git(vault, ["merge", "--no-edit", "other"], { allowFailure: true });
  },
};
