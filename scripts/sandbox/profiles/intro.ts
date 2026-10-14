import { cpSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { edit, initRepo, type Profile } from "../profile";

/** The vault the README intro is recorded in, kept beside its recorder. */
export const INTRO_VAULT = join(import.meta.dir, "../../intro/vault");

export const intro: Profile = {
  name: "intro",
  summary:
    "The README intro vault: Raft notes, a base, a paper PDF, a Rust crate with an uncommitted edit",
  config: "[lsp]\nenabled = true\n",
  journeys: [
    {
      title: "Recorded tour",
      steps: ["Needs rust-analyzer on PATH", "Run bun run record:intro"],
      expect: [
        "Ghostty opens, so plays the tour, and docs/intro.gif is rewritten",
      ],
    },
  ],
  stage: (vault) => {
    cpSync(INTRO_VAULT, vault, { recursive: true });
    initRepo(vault, "Start reading notes");
    // rust-analyzer's build output stays out of git without a dot file in the explorer.
    writeFileSync(join(vault, ".git/info/exclude"), "target/\n");
    // An uncommitted change, so the code file shows the git change column.
    edit(
      join(vault, "raft-sim/src/lib.rs"),
      "use std::time::Duration;\n",
      "use std::time::Duration;\n\n/// How often a leader sends heartbeats: well under the shortest timeout.\npub const HEARTBEAT: Duration = Duration::from_millis(50);\n",
    );
  },
};
