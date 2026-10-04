import type { DocScan } from "../../lang/markdown/scan";
import type { NoteIndex } from "../links/note-index";
import { type NoteSummary, summarize } from "../links/summarize";
import type { BaseCandidate } from "./types";

const NO_FACTS = { size: 0, mtime: 0, ctime: 0 };

function fileFields(path: string) {
  const slash = path.lastIndexOf("/");
  const name = path.slice(slash + 1);
  const dot = name.lastIndexOf(".");
  return {
    path,
    name,
    basename: dot > 0 ? name.slice(0, dot) : name,
    folder: slash < 0 ? "" : path.slice(0, slash),
    ext: dot > 0 ? name.slice(dot + 1) : "",
  };
}

const noteFields = (s: NoteSummary) => ({
  properties: s.frontmatter,
  tags: s.tags,
  links: s.links.filter((l) => l.target !== "").map((l) => l.target),
  embeds: s.links
    .filter((l) => l.kind === "embed" && l.target !== "")
    .map((l) => l.target),
});

/**
 * One candidate per indexed file, in path order. Notes take their fields from
 * their summary; an open Markdown buffer's current scan (`overlay`) overrides
 * its properties, tags, and links, so unsaved edits show at once. Other files
 * have file fields only.
 */
export function candidatesFrom(
  ix: NoteIndex,
  overlay: ReadonlyMap<string, DocScan>,
): BaseCandidate[] {
  return [...ix.files].sort().map((path): BaseCandidate => {
    const s = ix.summaries.get(path);
    const facts = s ?? ix.facts.get(path) ?? NO_FACTS;
    const times = { size: facts.size, mtime: facts.mtime, ctime: facts.ctime };
    const scan = overlay.get(path);
    const note =
      scan !== undefined
        ? noteFields(summarize(path, times, scan))
        : s !== undefined
          ? noteFields(s)
          : { properties: {}, tags: [], links: [], embeds: [] };
    return { ...fileFields(path), ...times, ...note };
  });
}
