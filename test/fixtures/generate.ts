import { writeFile } from "node:fs/promises";
import { join } from "node:path";

/** A 17 MiB text file (over the 16 MiB open limit) in `dir`; returns its path. */
export async function makeLargeFile(dir: string): Promise<string> {
  const path = join(dir, "large.md");
  const line = `${"x".repeat(1023)}\n`;
  await writeFile(path, line.repeat(17 * 1024));
  return path;
}

/** A 5000-line Markdown note in `dir`; returns its path. */
export async function make5000LineNote(dir: string): Promise<string> {
  const path = join(dir, "long.md");
  const lines = Array.from({ length: 5000 }, (_, i) =>
    i % 50 === 0
      ? `## Section ${i / 50 + 1}`
      : `Line ${i + 1} of a long note with **bold**, _italic_, and \`code\`.`,
  );
  await writeFile(path, `${lines.join("\n")}\n`);
  return path;
}
