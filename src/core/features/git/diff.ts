export type HunkKind =
  | "add"
  | "change"
  | "delete"
  | "topdelete"
  | "changedelete"
  | "untracked";

/**
 * One change between the index lines (`old`) and the buffer lines (`new`).
 * Starts are 0-based. A side with `count` 0 starts where the lines would be
 * inserted, so a `delete` sits between `new.start - 1` and `new.start`.
 */
export type Hunk = {
  kind: HunkKind;
  old: { start: number; count: number };
  new: { start: number; count: number };
  /** The index lines this hunk replaces. */
  oldLines: readonly string[];
};

/** The edit distance past which the middle becomes one change hunk. */
export const MAX_EDIT = 2000;

/**
 * Sorted, non-overlapping hunks that turn `old` into `cur`. The cost stays
 * bounded: a middle with no line in common, or one needing more than
 * `MAX_EDIT` edits, is a single change hunk.
 */
export function diffLines(
  old: readonly string[],
  cur: readonly string[],
  opts?: { untracked?: boolean },
): Hunk[] {
  if (opts?.untracked === true)
    return [
      {
        kind: "untracked",
        old: { start: 0, count: 0 },
        new: { start: 0, count: cur.length },
        oldLines: [],
      },
    ];
  // A buffer always has a line, so an empty one matches an empty index entry.
  if (old.length === 0 && cur.length === 1 && cur[0] === "") return [];
  const shorter = Math.min(old.length, cur.length);
  let pre = 0;
  while (pre < shorter && old[pre] === cur[pre]) pre++;
  let suf = 0;
  while (
    suf < shorter - pre &&
    old[old.length - 1 - suf] === cur[cur.length - 1 - suf]
  )
    suf++;
  const a = old.slice(pre, old.length - suf);
  const b = cur.slice(pre, cur.length - suf);
  if (a.length === 0 && b.length === 0) return [];
  const whole = () => [hunk(old, pre, a.length, pre, b.length)];
  // No line in common (the floor is every line) or provably too many edits.
  const floor = editFloor(a, b);
  if (floor === a.length + b.length || floor > MAX_EDIT) return whole();
  const edits = editScript(a, b);
  if (edits === undefined) return whole();
  const out: Hunk[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (
      i < a.length &&
      j < b.length &&
      !edits.deleted[i] &&
      !edits.inserted[j]
    ) {
      i++;
      j++;
      continue;
    }
    const [i0, j0] = [i, j];
    for (;;)
      if (i < a.length && edits.deleted[i]) i++;
      else if (j < b.length && edits.inserted[j]) j++;
      else break;
    out.push(hunk(old, pre + i0, i - i0, pre + j0, j - j0));
  }
  return out;
}

function hunk(
  old: readonly string[],
  oldStart: number,
  oldCount: number,
  newStart: number,
  newCount: number,
): Hunk {
  return {
    kind: kindOf(oldCount, newStart, newCount),
    old: { start: oldStart, count: oldCount },
    new: { start: newStart, count: newCount },
    oldLines: old.slice(oldStart, oldStart + oldCount),
  };
}

function kindOf(oldCount: number, newStart: number, newCount: number) {
  if (oldCount === 0) return "add";
  if (newCount === 0) return newStart === 0 ? "topdelete" : "delete";
  return oldCount > newCount ? "changedelete" : "change";
}

/**
 * A lower bound on the edits turning `a` into `b`: every surplus copy of a
 * line on either side must be deleted or inserted. It equals
 * `a.length + b.length` exactly when the sides share no line.
 */
function editFloor(a: readonly string[], b: readonly string[]): number {
  const surplus = new Map<string, number>();
  for (const l of a) surplus.set(l, (surplus.get(l) ?? 0) + 1);
  for (const l of b) surplus.set(l, (surplus.get(l) ?? 0) - 1);
  let floor = 0;
  for (const n of surplus.values()) floor += Math.abs(n);
  return floor;
}

/**
 * Myers' O(ND) shortest edit script, given up past `MAX_EDIT` edits. Marks
 * each deleted line of `a` and each inserted line of `b`.
 */
function editScript(
  a: readonly string[],
  b: readonly string[],
): { deleted: boolean[]; inserted: boolean[] } | undefined {
  const ids = new Map<string, number>();
  const id = (l: string) => {
    const known = ids.get(l);
    if (known !== undefined) return known;
    ids.set(l, ids.size);
    return ids.size - 1;
  };
  const x0 = Int32Array.from(a, id);
  const y0 = Int32Array.from(b, id);
  const n = x0.length;
  const m = y0.length;
  const limit = Math.min(MAX_EDIT, n + m);
  const off = limit + 1;
  const v = new Int32Array(2 * off + 1);
  // trace[d] is v over diagonals -d..d before step d.
  const trace: Int32Array[] = [];
  let end = -1;
  for (let d = 0; d <= limit && end < 0; d++) {
    trace.push(v.slice(off - d, off + d + 1));
    for (let k = -d; k <= d; k += 2) {
      let x =
        k === -d || (k !== d && (v[off + k - 1] ?? 0) < (v[off + k + 1] ?? 0))
          ? (v[off + k + 1] ?? 0)
          : (v[off + k - 1] ?? 0) + 1;
      let y = x - k;
      while (x < n && y < m && x0[x] === y0[y]) {
        x++;
        y++;
      }
      v[off + k] = x;
      if (x >= n && y >= m) {
        end = d;
        break;
      }
    }
  }
  if (end < 0) return undefined;
  const deleted: boolean[] = new Array(n).fill(false);
  const inserted: boolean[] = new Array(m).fill(false);
  let x = n;
  let y = m;
  for (let d = end; d > 0; d--) {
    const prev = trace[d] as Int32Array;
    const at = (k: number) => prev[k + d] ?? 0;
    const k = x - y;
    const down = k === -d || (k !== d && at(k - 1) < at(k + 1));
    const pk = down ? k + 1 : k - 1;
    const px = at(pk);
    const py = px - pk;
    if (down) inserted[py] = true;
    else deleted[px] = true;
    x = px;
    y = py;
  }
  return { deleted, inserted };
}
