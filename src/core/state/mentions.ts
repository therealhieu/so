import type { Pos, Range } from "../kernel/text/pos";
import type { Doc } from "../lang/markdown/doc";
import { bufferForPath } from "./buffers";
import type { AppState, SearchHit } from "./types";

const before = (a: Pos, b: Pos) =>
  a.line < b.line || (a.line === b.line && a.col < b.col);
const overlaps = (a: Range, b: Range) =>
  before(a.start, b.end) && before(b.start, a.end);

/** Link ranges in `path`: the live scan when it is open, else its summary. */
function linkRanges(s: AppState, path: string): Range[] {
  const doc = bufferForPath(s, path)?.analysis as Doc | undefined;
  if (doc !== undefined) return doc.scan.links.map((l) => l.range);
  return (s.index.ix.summaries.get(path)?.links ?? []).map((l) => l.range);
}

export const hitRange = (h: SearchHit): Range => ({
  start: { line: h.line, col: h.col },
  end: { line: h.line, col: h.col + h.len },
});

/**
 * The newest mentions search's hits, minus those a link now covers, so a
 * mention linked since the search leaves the list at once.
 */
export function unlinkedHits(s: AppState): SearchHit[] {
  const links = new Map<string, Range[]>();
  return (s.panels.side.mentions?.hits ?? []).filter((h) => {
    let ranges = links.get(h.path);
    if (ranges === undefined) {
      ranges = linkRanges(s, h.path);
      links.set(h.path, ranges);
    }
    const range = hitRange(h);
    return !ranges.some((r) => overlaps(r, range));
  });
}
