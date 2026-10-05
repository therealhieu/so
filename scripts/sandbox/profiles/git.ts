import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { git, type Profile, writeFiles } from "../profile";
import { stageTour } from "./tour";

export const gitRepo: Profile = {
  name: "git",
  summary:
    "Demo vault as its own Git repository with modified, staged, and untracked files",
  journeys: [
    {
      title: "Change markers",
      steps: ["Launch", "Open tour.md", "Open the explorer with <leader>e"],
      expect: [
        "The statusline shows branch main and change counts",
        "tour.md shows added, changed, and deleted lines in the change column",
        "The explorer marks tour.md, notes/ideas.md (staged), and scratch.md (untracked)",
      ],
    },
    {
      title: "Hunks",
      steps: [
        "In tour.md, jump between hunks with ]h and [h",
        "Preview one (<leader>ghp), stage one (<leader>ghs), and reset one (<leader>ghr)",
      ],
      expect: [
        "The preview float shows the hunk's diff",
        "A staged hunk leaves the change column; git diff --cached shows it",
        "A reset hunk restores the committed text",
      ],
    },
    {
      title: "Blame",
      steps: ["In so-roadmap.md, press <leader>ghb on a line under Phases"],
      expect: ["It names Ada and the second commit, Plan phases"],
    },
    {
      title: "Tool hand-off",
      steps: [
        "Edit a note without saving",
        "Press <leader>gg, then quit the tool",
      ],
      expect: [
        "The note is saved first, lazygit opens on the vault",
        "so resumes and shows changes made in the tool",
      ],
    },
  ],
  stage: (vault) => {
    stageTour(vault);
    const roadmap = join(vault, "so-roadmap.md");
    const phases = readFileSync(roadmap, "utf8");
    // The first commit predates the Phases section, so blame shows two commits.
    writeFileSync(roadmap, phases.slice(0, phases.indexOf("## Phases")));
    git(vault, ["init", "--quiet", "--initial-branch=main"]);
    git(vault, ["add", "--all"]);
    git(vault, ["commit", "--quiet", "--message=Import notes"]);
    writeFileSync(roadmap, phases);
    git(
      vault,
      ["commit", "--quiet", "--all", "--message=Plan phases"],
      "2026-01-02T09:00:00Z",
    );

    const tour = join(vault, "tour.md");
    const lines = readFileSync(tour, "utf8").split("\n");
    lines.splice(10, 1); // deleted line
    lines[20] = `${lines[20]} (edited)`; // changed line
    lines.push("Added at the end.", ""); // added lines
    writeFileSync(tour, lines.join("\n"));
    appendFileSync(join(vault, "notes/ideas.md"), "\n- A staged idea\n");
    git(vault, ["add", "notes/ideas.md"]);
    writeFiles(vault, { "scratch.md": "# Scratch\n\nNot tracked yet.\n" });
  },
};
