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

/** The demo vault: the fixture workspace, the Markdown tour, images, and past daily notes. */
export function stageTour(vault: string): void {
  copyFixture("workspace", vault, SKIP);
  copyFixture("tour.md", join(vault, "tour.md"));
  for (const png of readdirSync(join(fixtures, "images")))
    if (png.endsWith(".png"))
      copyFixture(join("images", png), join(vault, png));
  const files: Record<string, string> = { "so-roadmap.md": ROADMAP };
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
    "Demo vault: Markdown tour, links, images, daily notes, templates, a base",
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
