import { join } from "node:path";
import { edit, initRepo, type Profile, writeFiles } from "../profile";
import { stageTour } from "./tour";

const REPO = ".sandbox/git-subfolder/vault";

export const gitSubfolder: Profile = {
  name: "git-subfolder",
  summary:
    "Workspace is notes/ inside a larger Git repository with changes outside it",
  open: "notes",
  journeys: [
    {
      title: "Only the workspace's changes",
      steps: ["Launch", "Open the explorer with <leader>e", "Open tour.md"],
      expect: [
        "The explorer root is notes/ and marks tour.md modified",
        "Nothing from site/ (also modified) appears anywhere",
        "tour.md's change column and counts match git diff for it",
      ],
    },
    {
      title: "Changes outside are ignored",
      steps: [`In another terminal: echo x >> ${REPO}/site/style.css`],
      expect: ["Nothing in so changes"],
    },
    {
      title: "Stage and blame through the prefix",
      steps: [
        "In tour.md, press <leader>ghs, then <leader>ghb on a clean line",
        `git -C ${REPO} diff --cached --stat`,
      ],
      expect: [
        "Blame names Ada · Import site and notes",
        "Only notes/tour.md is staged",
      ],
    },
  ],
  stage: (vault) => {
    const notes = join(vault, "notes");
    stageTour(notes);
    writeFiles(vault, {
      "site/index.html": "<h1>Site</h1>\n",
      "site/style.css": "h1 { color: teal; }\n",
    });
    initRepo(vault, "Import site and notes");
    edit(join(notes, "tour.md"), "# Markdown tour", "# Markdown tour (edited)");
    edit(join(vault, "site/index.html"), "Site", "Site (edited)");
  },
};
