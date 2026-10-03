import type { Range } from "../../kernel/text/pos";
import type { NoteIndex } from "./note-index";
import type { FileEdit } from "./rename";
import { linkText } from "./resolve";

export type MentionHit = { path: string; range: Range; text: string };

const basenameNoExt = (path: string) =>
  path.slice(path.lastIndexOf("/") + 1).replace(/\.[^.]*$/, "");

/** Wrap one unlinked mention in a wikilink to `target`; the edit expects the mention text unchanged. */
export function linkMentionEdit(
  ix: NoteIndex,
  target: string,
  hit: MentionHit,
): FileEdit {
  const name = linkText(ix, hit.path, target);
  const link =
    hit.text === basenameNoExt(target)
      ? `[[${name}]]`
      : `[[${name}|${hit.text}]]`;
  return {
    path: hit.path,
    edits: [{ range: hit.range, expected: hit.text, text: link }],
  };
}
