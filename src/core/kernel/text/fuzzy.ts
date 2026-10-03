/** fzf's published scoring constants. */
export const SCORE = {
  match: 16,
  gapStart: -3,
  gapExtension: -1,
  boundary: 8,
  camel: 7,
  consecutive: 4,
  firstCharMultiplier: 2,
} as const;

export type FuzzyMatch = { score: number; positions: number[] };

const NON_WORD = 0;
const LOWER = 1;
const UPPER = 2;
const NUMBER = 3;
type CharClass = typeof NON_WORD | typeof LOWER | typeof UPPER | typeof NUMBER;

function classOf(c: string): CharClass {
  if (/\p{Lu}/u.test(c)) return UPPER;
  if (/\p{L}/u.test(c)) return LOWER;
  if (/\p{N}/u.test(c)) return NUMBER;
  return NON_WORD;
}

/** The bonus for matching a `cur` character that follows a `prev` character. */
function bonusFor(prev: CharClass, cur: CharClass): number {
  if (prev === NON_WORD && cur !== NON_WORD) return SCORE.boundary;
  if ((prev === LOWER && cur === UPPER) || (prev !== NUMBER && cur === NUMBER))
    return SCORE.camel;
  // fzf gives matched separators ("/", "-", ".", …) the boundary bonus too.
  if (cur === NON_WORD) return SCORE.boundary;
  return 0;
}

/** Score the window `[start, end)` that holds the whole query, matching greedily from its start. */
function scoreWindow(
  text: string,
  query: string,
  fold: (c: string) => string,
  start: number,
  end: number,
): FuzzyMatch {
  const positions: number[] = [];
  let score = 0;
  let q = 0;
  let inGap = false;
  let consecutive = 0;
  let firstBonus = 0;
  let prev = start > 0 ? classOf(text[start - 1] ?? "") : NON_WORD;
  for (let i = start; i < end; i++) {
    const c = text[i] ?? "";
    const cls = classOf(c);
    if (fold(c) === query[q]) {
      let bonus = bonusFor(prev, cls);
      if (consecutive === 0) firstBonus = bonus;
      else {
        if (bonus >= SCORE.boundary && bonus > firstBonus) firstBonus = bonus;
        bonus = Math.max(bonus, firstBonus, SCORE.consecutive);
      }
      score +=
        SCORE.match + (q === 0 ? bonus * SCORE.firstCharMultiplier : bonus);
      positions.push(i);
      inGap = false;
      consecutive++;
      q++;
    } else {
      score += inGap ? SCORE.gapExtension : SCORE.gapStart;
      inGap = true;
      consecutive = 0;
      firstBonus = 0;
    }
    prev = cls;
  }
  return { score, positions };
}

/**
 * fzf v1: forward scan for the first match, backward scan for the shortest window, then scoring;
 * null when `query` is not a subsequence. Smart-case: case-insensitive unless `query` has an
 * uppercase letter.
 */
export function fuzzyScore(text: string, query: string): FuzzyMatch | null {
  if (query === "") return { score: 0, positions: [] };
  const caseSensitive = /\p{Lu}/u.test(query);
  const fold = caseSensitive
    ? (c: string) => c
    : (c: string) => c.toLowerCase();
  const q = caseSensitive ? query : query.toLowerCase();
  let start = -1;
  let end = -1;
  for (let i = 0, k = 0; i < text.length; i++) {
    if (fold(text[i] ?? "") !== q[k]) continue;
    if (k === 0) start = i;
    if (++k === q.length) {
      end = i + 1;
      break;
    }
  }
  if (end === -1) return null;
  for (let i = end - 1, k = q.length - 1; i >= start; i--) {
    if (fold(text[i] ?? "") !== q[k]) continue;
    if (--k < 0) {
      start = i;
      break;
    }
  }
  return scoreWindow(text, q, fold, start, end);
}

/** Matches sorted by score descending, then shorter text, then alphabetical. Empty query → input order. */
export function rankBy<T>(
  items: readonly T[],
  query: string,
  text: (t: T) => string,
): { item: T; match: FuzzyMatch }[] {
  if (query === "")
    return items.map((item) => ({ item, match: { score: 0, positions: [] } }));
  const out: { item: T; match: FuzzyMatch; text: string }[] = [];
  for (const item of items) {
    const s = text(item);
    const match = fuzzyScore(s, query);
    if (match !== null) out.push({ item, match, text: s });
  }
  out.sort(
    (a, b) =>
      b.match.score - a.match.score ||
      a.text.length - b.text.length ||
      (a.text < b.text ? -1 : a.text > b.text ? 1 : 0),
  );
  return out.map(({ item, match }) => ({ item, match }));
}
