// Launches so on a demo vault staged from the test fixtures, with config and
// state isolated under .sandbox/. The vault persists between runs; `--reset`
// restages it. Other arguments go to so.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const root = join(import.meta.dir, "..");
const sandbox = join(root, ".sandbox");
const vault = join(sandbox, "vault");
const fixtures = join(root, "test/fixtures");
const SKIP = new Set([
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

/** Local `YYYY-MM-DD` for `daysAgo` days before today. */
function localDay(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function stage(): void {
  cpSync(join(fixtures, "workspace"), vault, {
    recursive: true,
    filter: (src) => !SKIP.has(basename(src)),
  });
  cpSync(join(fixtures, "tour.md"), join(vault, "tour.md"));
  for (const png of new Bun.Glob("*.png").scanSync(join(fixtures, "images")))
    cpSync(join(fixtures, "images", png), join(vault, png));
  writeFileSync(join(vault, "so-roadmap.md"), ROADMAP);
  // Today is left out so `:daily` can create it from the template.
  mkdirSync(join(vault, "daily"), { recursive: true });
  for (const daysAgo of [1, 2, 5]) {
    const day = localDay(daysAgo);
    writeFileSync(
      join(vault, "daily", `${day}.md`),
      `# ${day}\n\n- [ ] Review the [[tour]]\n`,
    );
  }
}

// `bun run` drops a `--` separator, so every argument except `--reset` goes to so.
const argv = process.argv.slice(2).filter((a) => a !== "--");
const reset = argv.includes("--reset");
const passthrough = argv.filter((a) => a !== "--reset");

if (reset) rmSync(sandbox, { recursive: true, force: true });
if (!existsSync(vault)) stage();
const xdgConfig = join(sandbox, "xdg/config");
const xdgState = join(sandbox, "xdg/state");
mkdirSync(xdgConfig, { recursive: true });
mkdirSync(xdgState, { recursive: true });

console.error("sandbox: .sandbox/vault (--reset to restage)");
const proc = Bun.spawn(
  [process.execPath, "src/app/main.ts", vault, ...passthrough],
  {
    cwd: root,
    stdio: ["inherit", "inherit", "inherit"],
    env: {
      ...process.env,
      XDG_CONFIG_HOME: xdgConfig,
      XDG_STATE_HOME: xdgState,
    },
  },
);
// so is a grandchild of the terminal; pass on signals the wrapper receives.
for (const signal of ["SIGHUP", "SIGTERM"] as const)
  process.on(signal, () => proc.kill(signal));
process.exit(await proc.exited);
