import { join } from "node:path";
import { git, type Profile, writeFiles } from "../profile";

/** A Rust crate with a type error, split over modules so navigation crosses files. */
const RUST: Record<string, string> = {
  ".gitignore": "target/\n",
  "Cargo.toml":
    '[package]\nname = "geo"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\n',
  "src/geo.rs": `/// A point on a plane.
#[derive(Debug, Clone, Copy)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

/// Straight-line distance between two points.
pub fn distance(a: Point, b: Point) -> f64 {
    ((a.x - b.x).powi(2) + (a.y - b.y).powi(2)).sqrt()
}
`,
  "src/util.rs": `use crate::geo::{distance, Point};

pub fn from_origin(p: Point) -> f64 {
    distance(Point { x: 0.0, y: 0.0 }, p)
}
`,
  "src/main.rs": `mod geo;
mod util;

use geo::{distance, Point};

fn main() {
    let a = Point { x: 1.0, y: 2.0 };
    let b = Point { x: 4.0, y: 6.0 };
    let d = distance(a, b);
    let names: Vec<String> = Vec::new();
    let y = z;
    println!("{} {} {:?}", d, util::from_origin(b), names);
}
`,
};

/** A TypeScript project that installs its own language server. */
const TYPESCRIPT: Record<string, string> = {
  ".gitignore": "node_modules/\npackage-lock.json\n",
  "package.json": `${JSON.stringify(
    {
      name: "demo-ts",
      private: true,
      devDependencies: {
        typescript: "^5.9.3",
        "typescript-language-server": "^5.3.0",
      },
    },
    null,
    2,
  )}\n`,
  "tsconfig.json": `${JSON.stringify(
    {
      compilerOptions: {
        strict: true,
        module: "esnext",
        moduleResolution: "bundler",
        target: "es2022",
      },
    },
    null,
    2,
  )}\n`,
  "src/b.ts": `export function add(a: number, b: number): number {
  return a + b;
}
`,
  "src/a.ts": `import { add } from "./b";

const total = add(1, 2);
const label: number = "sum";
console.log(total, label);
`,
};

/** A Terraform module with unaligned attributes and one attribute a variable block does not take. */
const TERRAFORM: Record<string, string> = {
  "main.tf": `terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

variable "region" {
  type = string
  default = "eu-west-1"
  colour = "blue"
}

provider "aws" {
  region = var.region
}

resource "aws_s3_bucket" "logs" {
  bucket = "\${var.region}-logs"
  tags = { Team = "ops" }
}
`,
  "prod.tfvars": 'region = "eu-central-1"\n',
  "terragrunt.hcl": 'include "root" {\n  path = find_in_parent_folders()\n}\n',
};

export const lsp: Profile = {
  name: "lsp",
  summary:
    "Rust and TypeScript projects with language servers on: hints, diagnostics, navigation",
  config: "[lsp]\nenabled = true\n",
  journeys: [
    {
      title: "Attach",
      steps: [
        "Needs rust-analyzer on PATH",
        "Launch and open rs/src/main.rs",
        "Run :LspInfo",
      ],
      expect: [
        "The statusline shows ◌ rust-analyzer, then ◆ rust-analyzer",
        ":LspInfo lists rust-analyzer with root rs/ and its binary path in full",
      ],
    },
    {
      title: "Inlay hints",
      steps: [
        "In main.rs, look at the let lines",
        "Move the cursor across a hint with l and h",
        "Press A on the let d line, then Esc",
      ],
      expect: [
        "Dim italic hints show : Point after a and b, : f64 after d",
        "The cursor never lands inside a hint",
        "Hints on the line being typed on hide in Insert mode and return after Esc",
      ],
    },
    {
      title: "End-of-line diagnostics",
      steps: [
        "Look at the let y = z line",
        "Press ]d, then <C-w>d",
        "Fix it to let y = d; and wait",
      ],
      expect: [
        "● cannot find value `z` in this scope (+1) follows the line, red",
        "With :set wrap on a narrow window it clips at the edge instead of adding a row",
        "]d jumps to it and <C-w>d shows every message in a float",
        "After the fix, the message and the gutter sign go away",
      ],
    },
    {
      title: "Highlight and hover",
      steps: ["Rest the cursor on distance in the let d line", "Press K"],
      expect: [
        "After about a quarter second, the use in the use line is highlighted too",
        "K shows distance's signature and doc comment in a float",
      ],
    },
    {
      title: "Navigation",
      steps: [
        "On distance, press gd, then <C-o>",
        "On a in let d, press gD, then grt",
        "On Point, press grr",
        "Press gO",
        "Press <leader>xs and type Poi",
      ],
      expect: [
        "gd opens geo.rs at fn distance; <C-o> comes back",
        "gD jumps to let a; grt opens geo.rs at struct Point",
        "grr lists the uses of Point in main.rs, util.rs, and geo.rs",
        "gO lists main.rs's symbols",
        "The workspace picker lists Point Struct rs/src/geo.rs:3:12 and opens it on Enter",
      ],
    },
    {
      title: "Edit with the server",
      steps: [
        "On names, press grn and rename it to list",
        "On a new line in main, type let e = d.po (press <C-Space> if no menu shows), then undo it",
        "Inside distance(, press <C-s> in Insert mode",
      ],
      expect: [
        "Both uses of names become list",
        "The completion menu offers f64 methods such as powf and powi",
        "A float shows distance's parameters",
      ],
    },
    {
      title: "Settings apply on reload",
      steps: [
        "Add inlayHints = false and endOfLineDiagnostics = false under [lsp] in the config file (path printed at launch)",
        "Run :ConfigReload, then restore the file and reload again",
      ],
      expect: [
        "Hints and end-of-line messages disappear; gutter signs stay",
        "They come back after the second reload",
      ],
    },
    {
      title: "TypeScript",
      steps: [
        "Once, run npm install in .sandbox/lsp/vault/ts",
        "Open ts/src/a.ts and run :LspInfo",
      ],
      expect: [
        "Hints show total : number, add(a: 1, b: 2), and console.log(...data: total, label)",
        "The label line ends with ● Type 'string' is not assignable to type 'number'",
        ":LspInfo shows …/ts/node_modules/.bin/typescript-language-server",
      ],
    },
    {
      title: "Terraform",
      steps: [
        "Needs terraform-ls on PATH",
        "Open tf/main.tf and run :LspInfo",
        "Press K on aws_s3_bucket, then ]d",
        "Run :Format",
        "Open tf/prod.tfvars, then tf/terragrunt.hcl, running :LspInfo in each",
      ],
      expect: [
        "Blocks, attributes, strings, the var reference in bucket, and comments are coloured",
        ":LspInfo lists terraform-ls with root tf/",
        "K shows the resource block's docs; ]d lands on colour with an unexpected-attribute message",
        "The = signs in each block line up",
        "prod.tfvars attaches to terraform-ls; terragrunt.hcl is coloured but has no server",
      ],
    },
    {
      title: "Notes stay plain",
      steps: ["Open notes/readme.md"],
      expect: [
        "No server starts and the statusline shows no server mark",
        "The hcl code block is coloured like tf/main.tf",
      ],
    },
    {
      title: "Restart and exit",
      steps: [
        "In main.rs, run :LspRestart",
        "Quit with :q, then run pgrep -fl rust-analyzer",
      ],
      expect: [
        "The mark goes ◌ then ◆ again, and hints come back",
        "No rust-analyzer started by so is left running",
      ],
    },
    {
      title: "A code file opens in its repository",
      steps: [
        "Quit, then run XDG_CONFIG_HOME=.sandbox/lsp/xdg/config bun run dev .sandbox/lsp/vault/rs/src/main.rs",
      ],
      expect: [
        "The workspace is rs/, not rs/src, so rust-analyzer finds Cargo.toml",
        "Hints and diagnostics appear as in the first journeys",
      ],
    },
  ],
  stage: (vault) => {
    writeFiles(vault, {
      "notes/readme.md":
        '# LSP sandbox\n\nrs/ is a Rust crate, ts/ a TypeScript project, and tf/ a Terraform module, each its own repository.\n\n```hcl\nvariable "region" {\n  default = "eu-west-1" # where the bucket lives\n}\n```\n',
    });
    for (const [dir, files] of [
      ["rs", RUST],
      ["ts", TYPESCRIPT],
      ["tf", TERRAFORM],
    ] as const) {
      const root = join(vault, dir);
      writeFiles(root, files);
      git(root, ["init", "--quiet", "--initial-branch=main"]);
      git(root, ["add", "--all"]);
      git(root, ["commit", "--quiet", "--message=Start"]);
    }
  },
};
