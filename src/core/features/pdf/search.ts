const literal = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * A text search over PDF pages: plain text, not a pattern; a query without
 * capitals ignores case, and any run of spaces matches any run of
 * whitespace, so a phrase broken across lines still matches.
 */
export function pdfQuery(query: string): RegExp | undefined {
  const words = query
    .trim()
    .split(/\s+/)
    .filter((w) => w !== "");
  if (words.length === 0) return undefined;
  const flags = query === query.toLowerCase() ? "giu" : "gu";
  return new RegExp(words.map(literal).join("\\s+"), flags);
}

const counted = new WeakMap<readonly string[], Map<string, number[]>>();

/** How many times `query` occurs on each page; cached per page list and query. */
export function pdfHits(pages: readonly string[], query: string): number[] {
  let byQuery = counted.get(pages);
  if (byQuery === undefined) {
    byQuery = new Map();
    counted.set(pages, byQuery);
  }
  const cached = byQuery.get(query);
  if (cached !== undefined) return cached;
  const re = pdfQuery(query);
  const hits = pages.map((p) =>
    re === undefined ? 0 : (p.match(re)?.length ?? 0),
  );
  byQuery.set(query, hits);
  return hits;
}

/**
 * The next page after `from` (`dir` 1) or before it (-1) with a hit,
 * wrapping around; `from` itself counts when `inclusive`. Pages are 1-based.
 */
export function nextHitPage(
  hits: readonly number[],
  from: number,
  dir: 1 | -1,
  inclusive: boolean,
): { page: number; wrapped: boolean } | undefined {
  const n = hits.length;
  if (n === 0) return undefined;
  const start = Math.max(1, Math.min(from, n));
  for (let i = inclusive ? 0 : 1; i <= n; i++) {
    const step = start + dir * i;
    const page = ((((step - 1) % n) + n) % n) + 1;
    if ((hits[page - 1] ?? 0) > 0)
      return { page, wrapped: dir === 1 ? step > n : step < 1 };
  }
  return undefined;
}
