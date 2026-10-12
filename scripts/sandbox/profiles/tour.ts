import { readdirSync } from "node:fs";
import { join } from "node:path";
import {
  copyFixture,
  fixtures,
  localDay,
  type Profile,
  writeFiles,
} from "../profile";

/** Fixture entries left out of the vault: test-only or unreadable content. */
export const SKIP = new Set([
  "node_modules",
  "build",
  "nul-at-100.bin",
  "invalid-utf8.txt",
]);

const ROADMAP = `---
title: so roadmap
tags: [so, planning]
---
# so roadmap

## Goals

- Fast, vim-modal Markdown notes in the terminal
- Obsidian-compatible links, daily notes, templates, Bases
- A read-only browser preview

## Phases

1. Daily-usable editor — see [[tour]]
2. Obsidian experience — [[tasks/inbox]]
`;

/**
 * Dot folders for `[explorer] dotfiles`: a note the index takes in once dot
 * entries are shown, and Obsidian's plugin code and trash, which
 * `[index] exclude` keeps out. Each holds the word "zebracorn".
 */
const DOT_FOLDERS: Record<string, string> = {
  ".notes/hidden-idea.md":
    "# Hidden idea\n\nA zebracorn lives here, see [[dot-links]].\n",
  ".obsidian/plugins/demo/main.js": "const zebracorn = 1;\n",
  ".trash/old-idea.md": "# Old idea\n\nThe zebracorn was deleted.\n",
  "dot-links.md":
    "# Dot links\n\n- [[hidden-idea]] lives in .notes/\n- [[old-idea]] lives in .trash/\n",
};

/** The demo vault: the fixture workspace, the Markdown tour, images, past daily notes, and dot folders. */
export function stageTour(vault: string): void {
  copyFixture("workspace", vault, SKIP);
  copyFixture("tour.md", join(vault, "tour.md"));
  for (const png of readdirSync(join(fixtures, "images")))
    if (png.endsWith(".png"))
      copyFixture(join("images", png), join(vault, png));
  const files: Record<string, string> = {
    "so-roadmap.md": ROADMAP,
    ...DOT_FOLDERS,
  };
  // Today is left out so `:Today` can create it from the template.
  for (const daysAgo of [1, 2, 5]) {
    const day = localDay(daysAgo);
    files[`daily/${day}.md`] = `# ${day}\n\n- [ ] Review the [[tour]]\n`;
  }
  writeFiles(vault, files);
}

export const tour: Profile = {
  name: "tour",
  summary:
    "Demo vault: Markdown tour, links, images, daily notes, templates, a base, dot folders",
  journeys: [
    {
      title: "Views",
      steps: ["Open tour.md", "Press <leader>m twice, then once more"],
      expect: [
        "Opens in reading view",
        "Cycles live (source on the cursor's lines) → source → reading",
        "Callouts, tables, tasks, footnotes, and images render in reading and live",
      ],
    },
    {
      title: "Links and backlinks",
      steps: [
        "In so-roadmap.md, put the cursor on [[tour]] and press gd",
        "In tour.md, press <leader>lb",
      ],
      expect: [
        "gd opens tour.md",
        "Backlinks list so-roadmap.md and the daily notes",
      ],
    },
    {
      title: "Link-safe rename",
      steps: ["Open tour.md", "Press <leader>lr and rename it to guide"],
      expect: [
        "The file becomes guide.md",
        "[[tour]] in so-roadmap.md and the daily notes becomes [[guide]]",
      ],
    },
    {
      title: "Daily note from the template",
      steps: ["Run :Today", "Run :Today again"],
      expect: [
        "daily/<today>.md is created from templates/daily.md in live view, cursor on the first task",
        "The second :Today opens the same file and overwrites nothing",
      ],
    },
    {
      title: "Base table",
      steps: ["Open tasks.base", "Edit the status cell of one row"],
      expect: [
        "The table lists the tasks/ notes with summaries",
        "Only that note's status frontmatter key changes",
      ],
    },
    {
      title: "Browser preview",
      steps: [
        "Open tour.md",
        "Run :Preview",
        "Edit a line",
        "Run :PreviewStop",
      ],
      expect: [
        "A browser page opens on 127.0.0.1 with the rendered note",
        "The page follows the edit",
        "The page shows that the preview stopped",
      ],
    },
    {
      title: "Dot folders in search and links",
      steps: [
        "Press <leader>sg and search zebracorn",
        "In dot-links.md, press gd on [[hidden-idea]] and decline creating it",
        "Focus the explorer (<leader>e) and press H",
        "Search zebracorn again, press gd on both links in dot-links.md, then <leader>lb there",
        "Press H in the explorer again",
      ],
      expect: [
        "Before H: no hits, and [[hidden-idea]] is unresolved",
        "After H: the search hits only .notes/hidden-idea.md, not .obsidian/ or .trash/",
        "gd on [[hidden-idea]] opens .notes/hidden-idea.md; [[old-idea]] stays unresolved",
        "Backlinks of dot-links.md list .notes/hidden-idea.md",
        "After H again: no hits, and [[hidden-idea]] is unresolved again",
      ],
    },
    {
      title: "Index exclude",
      steps: [
        "With dot entries shown (H), add [index] exclude = [] to the sandbox config.toml and run :ConfigReload",
        "Search zebracorn",
        'Set exclude = ["notes/old"] and run :ConfigReload',
      ],
      expect: [
        "The index rescans",
        "Hits now include .obsidian/plugins/demo/main.js and .trash/old-idea.md",
        "A toast says index.exclude.0: must be a name, not a path",
      ],
    },
    {
      title: "Mouse",
      steps: [
        "Click a file in the explorer (<leader>e)",
        "Wheel-scroll tour.md, double-click a word, drag to select",
      ],
      expect: ["Each action does what its keyboard equivalent does"],
    },
  ],
  stage: stageTour,
};
