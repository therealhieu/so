import type { Pos } from "../../kernel/text/pos";
import type { DocScan } from "../../lang/markdown/scan";
import type { LinkSpan } from "../../lang/markdown/syntax";

const before = (a: Pos, b: Pos) =>
  a.line < b.line || (a.line === b.line && a.col < b.col);

/**
 * The link whose source range holds `at` (end exclusive). The scan lists
 * links by position and has none inside code, math, or comments.
 */
export function linkAt(scan: DocScan, at: Pos): LinkSpan | undefined {
  const links = scan.links;
  let lo = 0;
  let hi = links.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const l = links[mid] as LinkSpan;
    if (before(at, l.range.start)) hi = mid - 1;
    else if (before(at, l.range.end)) return l;
    else lo = mid + 1;
  }
  return undefined;
}
