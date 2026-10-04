import { cp, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** A 17 MiB text file (over the 16 MiB open limit) in `dir`; returns its path. */
export async function makeLargeFile(dir: string): Promise<string> {
  const path = join(dir, "large.md");
  const line = `${"x".repeat(1023)}\n`;
  await writeFile(path, line.repeat(17 * 1024));
  return path;
}

const WORKSPACE = join(import.meta.dir, "workspace");

/** The 0-based line of the 5,000-line note that embeds `tasks.base`, between blank lines. */
const EMBED_AT = 2540;

/**
 * A 5000-line Markdown note in `dir`, with `tasks.base` and its task notes
 * beside it; the note embeds the base's first view at line `EMBED_AT`, in
 * the stretch the live keystroke bench types in. Returns the note's path.
 */
export async function make5000LineNote(dir: string): Promise<string> {
  const path = join(dir, "long.md");
  const lines = Array.from({ length: 5000 }, (_, i) =>
    i % 50 === 0
      ? `## Section ${i / 50 + 1}`
      : Math.abs(i - EMBED_AT) === 1
        ? ""
        : i === EMBED_AT
          ? "![[tasks.base#All tasks]]"
          : `Line ${i + 1} of a long note with **bold**, _italic_, and \`code\`.`,
  );
  await writeFile(path, `${lines.join("\n")}\n`);
  await cp(join(WORKSPACE, "tasks.base"), join(dir, "tasks.base"));
  await cp(join(WORKSPACE, "tasks"), join(dir, "tasks"), { recursive: true });
  return path;
}

/** A 5,000-line TypeScript module of small functions. */
export function make5000LineTs(): string {
  const lines: string[] = [];
  for (let i = 0; lines.length < 5000; i++)
    lines.push(
      `export function step${i}(input: number[], limit = ${i}): number {`,
      `  // Sum the values below the limit, as a typed reducer.`,
      `  return input.filter((n) => n < limit).reduce((a, b) => a + b, 0);`,
      "}",
      "",
    );
  return `${lines.slice(0, 5000).join("\n")}\n`;
}

/** A seeded generator (mulberry32), so every run writes the same notes. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WORDS = [
  "plan",
  "ship",
  "editor",
  "index",
  "note",
  "link",
  "draft",
  "review",
  "scope",
  "risk",
  "goal",
  "idea",
  "week",
  "focus",
  "folder",
  "search",
  "rename",
  "outline",
  "backlog",
  "release",
];

const noteName = (i: number) => `note-${String(i).padStart(5, "0")}`;

/** Workspace-relative path of note `i`: 100 notes per folder, two folders deep. */
export function notePath(i: number): string {
  const folder = Math.floor(i / 100);
  const area = String(Math.floor(folder / 10)).padStart(3, "0");
  return `area-${area}/topic-${folder % 10}/${noteName(i)}.md`;
}

/**
 * `n` Markdown notes of about 1 KB in nested folders under `dir`, the same
 * on every run. Each has frontmatter tags and an alias, headings, wikilinks
 * to other notes (plain, to a heading, with an alias), a Markdown link,
 * inline and nested tags, and a block id. Returns `dir`.
 */
export async function makeNoteWorkspace(
  dir: string,
  n = 10_000,
): Promise<string> {
  const rand = seeded(0x5eed);
  const word = () => WORDS[Math.floor(rand() * WORDS.length)] as string;
  const other = () => Math.floor(rand() * n);
  const sentence = () => Array.from({ length: 12 }, word).join(" ");
  const notes: [string, string][] = [];
  const folders = new Set<string>();
  for (let i = 0; i < n; i++) {
    const path = notePath(i);
    folders.add(path.slice(0, path.lastIndexOf("/")));
    const [a, b, c] = [other(), other(), other()];
    const text = [
      "---",
      `tags: [${word()}, ${word()}]`,
      `aliases: [Alias ${i}]`,
      "---",
      `# Note ${i}`,
      "",
      `${sentence()} [[${noteName(a)}]] and ${sentence()}.`,
      "",
      "## Goals",
      "",
      `- ${sentence()} #${word()}`,
      `- see [[${noteName(b)}#Goals]] for ${sentence()}`,
      `- [[${noteName(c)}|the ${word()}]] ${sentence()} ^goal-${i}`,
      "",
      "## Notes",
      "",
      `${sentence()} [details](${notePath(a)}) ${sentence()} #${word()}/${word()}.`,
      "",
      `${sentence()} ${sentence()} ${sentence()}.`,
      "",
    ].join("\n");
    notes.push([path, text]);
  }
  for (const f of folders) await mkdir(join(dir, f), { recursive: true });
  for (let i = 0; i < notes.length; i += 256)
    await Promise.all(
      notes
        .slice(i, i + 256)
        .map(([path, text]) => writeFile(join(dir, path), text)),
    );
  return dir;
}
