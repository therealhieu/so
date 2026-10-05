import type { Profile } from "../profile";
import { stageTour } from "./tour";

export const brokenConfig: Profile = {
  name: "broken-config",
  summary:
    "Demo vault with an invalid config.toml: error toast, defaults, :ConfigReload",
  config: 'theme = "neon"\nunknownKey = true\n',
  journeys: [
    {
      title: "Invalid config at startup",
      steps: ["Launch"],
      expect: [
        "A toast shows config.toml:1: … (+1 more)",
        "so runs with the defaults (dark theme)",
      ],
    },
    {
      title: "Reload a fixed config",
      steps: [
        'Replace the config file (path printed at launch) with theme = "light"',
        "Run :ConfigReload",
      ],
      expect: ["The light theme applies without a restart"],
    },
    {
      title: "Reload a broken config",
      steps: ["Break the file again", "Run :ConfigReload"],
      expect: ["An error toast names the line", "The light theme stays"],
    },
  ],
  stage: stageTour,
};
