import { join } from "node:path";
import { copyFixture, type Profile, writeFiles } from "../profile";

const BOOKS = {
  "books/dune.md":
    "---\ntags: [book]\nstatus: reading\nprice: 12\npages: 600\n---\n# Dune\n",
  "books/emma.md":
    "---\ntags: [book]\nstatus: done\nprice: 8\npages: 400\n---\n# Emma\n",
};

const EMBED = `# Board

Tasks grouped by status:

![[tasks.base#By status]]
`;

export const bases: Profile = {
  name: "bases",
  summary:
    "Bases: views, grouping, edge-case files, embeds, frontmatter writes",
  journeys: [
    {
      title: "Views and grouping",
      steps: [
        "Open tasks.base and switch between its views",
        "Open edge/group-order.base",
      ],
      expect: [
        "All tasks shows summaries; By status and Late are grouped",
        "Cards (an unsupported layout) falls back to a table with a notice",
        "Groups follow groupOrder: todo, doing, done, then no value",
      ],
    },
    {
      title: "Broken base files",
      steps: [
        "Open each of edge/alfred/broken.base, malformed-group-by.base, no-views.base",
      ],
      expect: ["Each shows a diagnostic instead of a table; so keeps running"],
    },
    {
      title: "Formulas and filters",
      steps: ["Open edge/alfred/books.base"],
      expect: [
        "Only books/ notes (tag book) are listed, with a Price/page column",
      ],
    },
    {
      title: "Filter in the UI",
      steps: [
        "In tasks.base, press / and type part of a status, then Enter",
        "On a Status cell press F, then F on another column, then F again",
        "Press c",
      ],
      expect: [
        "Rows and the count narrow as you type; ⌕ shows the text",
        "F keeps rows with the focused value (⊜ in the toolbar); pins stack and F again removes one",
        "c shows every row again; tasks.base is unchanged",
      ],
    },
    {
      title: "Write back",
      steps: [
        "In tasks.base, edit the status of a closed note",
        "Open that note, then edit another row while it is open",
      ],
      expect: [
        "The closed note's file changes only in that frontmatter key",
        "The open note changes in the buffer as one undo step",
      ],
    },
    {
      title: "Embed",
      steps: ["Open board.md"],
      expect: ["The By status view renders inline below the heading"],
    },
  ],
  stage: (vault) => {
    copyFixture("workspace/tasks", join(vault, "tasks"));
    copyFixture("workspace/tasks.base", join(vault, "tasks.base"));
    copyFixture("bases", join(vault, "edge"), new Set(["README.md"]));
    writeFiles(vault, { ...BOOKS, "board.md": EMBED });
  },
};
