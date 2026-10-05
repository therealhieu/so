import { makeNoteWorkspace } from "../../../test/fixtures/generate";
import type { Profile } from "../profile";

export const large: Profile = {
  name: "large",
  summary:
    "10,000 generated notes: startup, indexing, pickers, and search at scale",
  journeys: [
    {
      title: "Startup while indexing",
      steps: ["Launch", "Watch the statusline"],
      expect: [
        "The first frame appears before indexing ends",
        "Progress ends with ◆ index ready within a few seconds",
      ],
    },
    {
      title: "Typing while indexing",
      steps: [
        "Relaunch, open a note at once with <leader>ff, and type [[ in insert mode",
      ],
      expect: ["Keys never stall", "Link completion opens"],
    },
    {
      title: "Pickers and search",
      steps: [
        "Press <leader>ff, <leader>sg, and <leader>st and type a query in each",
      ],
      expect: ["Results narrow as you type without lag"],
    },
  ],
  stage: async (vault) => {
    await makeNoteWorkspace(vault);
  },
};
