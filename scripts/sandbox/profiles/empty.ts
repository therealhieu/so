import type { Profile } from "../profile";

export const empty: Profile = {
  name: "empty",
  summary: "Empty vault: first run, new notes, daily notes without a template",
  journeys: [
    {
      title: "First frame",
      steps: ["Launch", "Press <leader>e"],
      expect: ["so starts without errors", "The explorer is empty"],
    },
    {
      title: "New note",
      steps: ["Press <leader>nn and name it hello", "Type a line and wait"],
      expect: [
        "hello.md opens in live view",
        "Autosave writes it to the vault",
      ],
    },
    {
      title: "Daily note without a template",
      steps: ["Run :Today"],
      expect: [
        "daily/ and daily/<today>.md are created even though templates/daily.md is missing",
      ],
    },
  ],
  stage: () => {},
};
