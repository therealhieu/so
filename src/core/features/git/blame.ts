/** Who last changed one line, or that the line is not committed yet. */
export type BlameLine =
  | { committed: false }
  | {
      committed: true;
      sha: string;
      author: string;
      /** Author time in seconds since the epoch. */
      time: number;
      summary: string;
    };

const ZERO_SHA = /^0+$/;

/**
 * Parse `git blame --porcelain` output for one line. Lines that are not
 * committed carry a zero SHA and, by Git version, the author
 * "Not Committed Yet" or the mail `<external.file>`.
 */
export function parseBlame(porcelain: string): BlameLine {
  const lines = porcelain.split("\n");
  const sha = lines[0]?.split(" ")[0] ?? "";
  const fields = new Map<string, string>();
  for (const line of lines.slice(1)) {
    if (line.startsWith("\t")) break;
    const space = line.indexOf(" ");
    if (space > 0) fields.set(line.slice(0, space), line.slice(space + 1));
  }
  const author = fields.get("author") ?? "";
  if (
    sha === "" ||
    ZERO_SHA.test(sha) ||
    author === "Not Committed Yet" ||
    fields.get("author-mail") === "<external.file>"
  )
    return { committed: false };
  return {
    committed: true,
    sha,
    author,
    time: Number(fields.get("author-time") ?? 0),
    summary: fields.get("summary") ?? "",
  };
}
