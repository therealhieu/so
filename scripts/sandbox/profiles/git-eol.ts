import { join } from "node:path";
import { edit, git, type Profile, writeFiles } from "../profile";

const REPO = ".sandbox/git-eol/vault";
const CRLF = "# CRLF\r\n\r\nFirst line\r\nSecond line\r\nThird line\r\n";

export const gitEol: Profile = {
  name: "git-eol",
  summary: "Git repository with core.autocrlf, CRLF notes, and a dropped BOM",
  journeys: [
    {
      title: "Line endings compare equal",
      steps: ["Open crlf.md and autocrlf.md"],
      expect: ["Neither has a sign, although the index holds LF"],
    },
    {
      title: "One edited line stages as one line",
      steps: [
        "In crlf.md, change Second line and press <leader>ghs",
        `git -C ${REPO} diff --cached crlf.md`,
      ],
      expect: ["The diff changes exactly one line; the file keeps CRLF"],
    },
    {
      title: "A dropped BOM",
      steps: ["Open bom.md"],
      expect: ["Only line 1 is marked changed"],
    },
  ],
  stage: (vault) => {
    writeFiles(vault, {
      "crlf.md": CRLF,
      "autocrlf.md": "# Auto\n\nLF in the index, CRLF on checkout.\n",
      "bom.md": "﻿# BOM\n\nThe committed file starts with a BOM.\n",
    });
    git(vault, ["init", "--quiet", "--initial-branch=main"]);
    git(vault, ["config", "core.autocrlf", "true"]);
    git(vault, ["add", "--all"]);
    git(vault, ["commit", "--quiet", "--message=Import notes"]);
    // Check autocrlf.md out again so the worktree gets CRLF.
    git(vault, ["rm", "--quiet", "--cached", "autocrlf.md"]);
    git(vault, ["reset", "--quiet", "--hard"]);
    edit(join(vault, "bom.md"), "﻿", "");
  },
};
