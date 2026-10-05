import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { edit, git, initRepo, type Profile, writeFiles } from "../profile";
import { stageTour } from "./tour";

/** The vault relative to the so repository, for commands in another terminal. */
const REPO = ".sandbox/git/vault";

export const gitRepo: Profile = {
  name: "git",
  summary:
    "Git repository with every hunk kind, staged, untracked, and deleted files",
  journeys: [
    {
      title: "Change column and statusline",
      steps: ["Open tour.md and press <leader>m until the source view"],
      expect: [
        "The change column marks line 9 changed, a deletion where the %% comment was, the added task under Lists and tasks, and the edited table row",
        "Each kind has its own sign; line numbers keep their width",
        "The statusline shows main and the file's counts",
      ],
    },
    {
      title: "Block-rendered changes",
      steps: ["Switch tour.md to reading view and scroll to the table"],
      expect: ["The table's rendered row for the edited line carries the sign"],
    },
    {
      title: "Explorer markers",
      steps: ["Open the explorer with <leader>e and expand notes/ and drafts/"],
      expect: [
        "tour.md is modified, notes/ideas.md staged, scratch.md and drafts/new-idea.md untracked",
        "notes/ and drafts/ mark that they contain changes; deleted notes/todo.md has no row",
      ],
    },
    {
      title: "Hunk navigation and preview",
      steps: [
        "In tour.md, press ]h until the last hunk, then [h back to the first",
        "Press <leader>ghp on a hunk",
      ],
      expect: [
        "Each jump shows hunk n/4; past the ends: no next hunk / no previous hunk",
        "A float shows the hunk's diff against the index",
      ],
    },
    {
      title: "Stage one of several hunks",
      steps: [
        "On the line 9 hunk, press <leader>ghs",
        `In another terminal: git -C ${REPO} diff --cached tour.md, then git -C ${REPO} diff tour.md`,
      ],
      expect: [
        "Toast: staged hunk 1/4; that hunk's sign disappears",
        "diff --cached shows only line 9; diff shows the other three hunks",
      ],
    },
    {
      title: "Stage a hunk of an untracked file",
      steps: [
        "Open scratch.md and press <leader>ghs",
        `git -C ${REPO} status --short scratch.md`,
      ],
      expect: ["status shows AM: added, with the staged hunk only"],
    },
    {
      title: "Save before staging",
      steps: [
        "Edit a line of tour.md without saving",
        "Press <leader>ghs on it",
      ],
      expect: ['Toast: "tour.md" written · staged hunk n/m'],
    },
    {
      title: "Reset a hunk",
      steps: ["Press <leader>ghr on the added task", "Press u"],
      expect: [
        "The line returns to the indexed text: reset hunk n/m · buffer changed, autosave pending",
        "One u brings the change back",
      ],
    },
    {
      title: "Live diff while typing",
      steps: ["Type on a clean line of tour.md and pause"],
      expect: ["Keys never lag; the sign appears about 100 ms after you stop"],
    },
    {
      title: "Blame",
      steps: [
        "In so-roadmap.md, press <leader>ghb on a line under Phases, then on the title",
        "In tour.md, press <leader>ghb on the added task",
      ],
      expect: [
        "Ada, <age> · Plan phases (<sha>), then Ada, <age> · Import notes (<sha>)",
        "not committed yet",
      ],
    },
    {
      title: "Outside changes",
      steps: [
        `In another terminal: git -C ${REPO} commit --quiet --all --message=wip`,
      ],
      expect: [
        "Within a second the change column, statusline counts, and explorer markers clear (untracked files stay)",
      ],
    },
    {
      title: "Tool hand-off",
      steps: [
        "Open tour.md in live view with diagram.png on screen and edit a line without saving",
        "Press <leader>gg; in lazygit, stage and commit a file; quit lazygit",
      ],
      expect: [
        'The message "tour.md" written · opening lazygit shows before lazygit takes the screen',
        "so draws nothing while lazygit runs",
        "After quitting, so repaints with the image, the mouse works, and markers reflect the commit",
      ],
    },
    {
      title: "Which-key",
      steps: ["Press <leader>g and wait, then <leader>gh and wait"],
      expect: [
        "+git lists Lazygit (full screen); +hunk lists Stage hunk, Reset hunk, Preview hunk, Blame line",
      ],
    },
    {
      title: "Mouse with the change column",
      steps: ["Click a character on a line that has a sign"],
      expect: ["The cursor lands on the clicked character"],
    },
    {
      title: "Tool configuration",
      steps: [
        'Write [git] tool = ["no-such-tool"] to the config file (path printed at launch), run :ConfigReload, press <leader>gg',
        "Change it to tool = [] and run :ConfigReload",
      ],
      expect: [
        "Notice: no-such-tool not found (git.tool), and so is not suspended",
        "A config error toast names the tool line",
      ],
    },
  ],
  stage: (vault) => {
    stageTour(vault);
    const roadmap = join(vault, "so-roadmap.md");
    const phases = readFileSync(roadmap, "utf8");
    // The first commit predates the Phases section, so blame shows two commits.
    writeFileSync(roadmap, phases.slice(0, phases.indexOf("## Phases")));
    initRepo(vault);
    writeFileSync(roadmap, phases);
    git(vault, ["commit", "--quiet", "--all", "--message=Plan phases"], {
      date: "2026-01-02T09:00:00Z",
    });

    const tour = join(vault, "tour.md");
    edit(tour, "Text can be **bold**", "Text can be **strong**");
    edit(tour, "%%This comment is hidden in live preview.%%\n\n", "");
    edit(
      tour,
      "- [x] Already done\n",
      "- [x] Already done\n- [ ] Added task\n",
    );
    edit(tour, "| Jump back |", "| Jump back (edited) |");
    edit(
      join(vault, "notes/ideas.md"),
      "- Link [[todo]]",
      "- Link [[todo]]\n- A staged idea",
    );
    git(vault, ["add", "notes/ideas.md"]);
    rmSync(join(vault, "notes/todo.md"));
    writeFiles(vault, {
      "scratch.md": "# Scratch\n\nNot tracked yet.\n",
      "drafts/new-idea.md": "# New idea\n",
    });
  },
};
