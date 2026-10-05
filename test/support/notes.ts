import { applySpanEdits } from "../../src/core/features/links/rename";
import { summarize } from "../../src/core/features/links/summarize";
import { linesOf, scanDoc } from "../../src/core/lang/markdown/scan";
import type { Effect, SearchHit } from "../../src/core/state/types";
import { textFile } from "./state";
import type { Mounted } from "./ui";

export const SYNC_TS = `import { readFile } from "node:fs/promises";

export async function sync(dir: string): Promise<number> {
\tconst text = await readFile(dir, "utf8"); // whole file
\treturn text.length;
}
`;

const day = (n: number, links: string[]) =>
  `# Day ${String(n).padStart(2, "0")}\n\n${links.map((l) => `- ${l} today`).join("\n")}\n`;
const THREE = ["[[plan]]", "[[plan#Goals]]", "[[plan|the plan]]"];
const TWO = ["[[plan]]", "[[notes/plan]]"];

/**
 * The link fixture: `notes/plan.md` is linked 31 times from 12 files
 * (`projects/so.md` and eleven daily logs). `notes/ideas.md` and `todo.md`
 * mention it in prose; `projects/so.md` also has an unresolved link.
 */
export const NOTES: Readonly<Record<string, string>> = {
  "notes/plan.md":
    "# Plan\n\nWhy this exists.\n\n## Goals\n\nShip the editor. ^ship\n\n## Risks\n\nScope.\n",
  "notes/ideas.md": "# Ideas\n\nThe plan is to keep files plain.\n",
  "todo.md": "- [ ] review the plan\n",
  "projects/so.md": `# So\n\n${Array.from({ length: 24 }, (_, i) => `Line ${i + 1} of the roadmap.`).join("\n")}\n\nNext: [[plan#Goals]] and [[plan]].\nDraft: [[projects/plan]]\n`,
  "projects/so-roadmap.md": "# So roadmap\n",
  ...Object.fromEntries(
    Array.from({ length: 11 }, (_, i) => [
      `log/day-${String(i + 1).padStart(2, "0")}.md`,
      day(i + 1, i < 7 ? THREE : TWO),
    ]),
  ),
};

/** Every file in the fixture workspace: the notes plus code and config files. */
export const FILES: Readonly<Record<string, string>> = {
  ...NOTES,
  "scripts/sync.ts": SYNC_TS,
  "config.yaml": "theme: dark\n",
};

/** The index finishes a scan of the fixture. */
export function indexFixture(m: Mounted): void {
  const notes = Object.keys(NOTES);
  m.store.dispatch({
    type: "indexBatch",
    summaries: notes.map((p) => {
      const text = NOTES[p] ?? "";
      return summarize(
        p,
        { mtime: 1, size: 0, ctime: 1 },
        scanDoc(text),
        linesOf(text),
      );
    }),
    files: Object.keys(FILES),
    done: notes.length,
    total: notes.length,
  });
  m.store.dispatch({ type: "indexReady" });
}

/** The newest recorded effect of `kind`. */
export function lastEffect<K extends Effect["kind"]>(
  m: Mounted,
  kind: K,
): (Effect & { kind: K }) | undefined {
  return m.effects.findLast((e): e is Effect & { kind: K } => e.kind === kind);
}

/** Answer the newest `search` with `hits`. */
export function answerSearch(m: Mounted, hits: SearchHit[]): void {
  const e = lastEffect(m, "search");
  if (e === undefined) throw new Error("no search");
  m.store.dispatch({ type: "searchResults", id: e.id, hits, capped: false });
}

/** Answer the newest `readPreview` from the fixture files. */
export function answerPreview(m: Mounted): void {
  const e = lastEffect(m, "readPreview");
  if (e === undefined) throw new Error("no preview read");
  m.store.dispatch({
    type: "previewLoaded",
    id: e.id,
    path: e.path,
    result: textFile(FILES[e.path] ?? ""),
  });
}

/** Answer the newest `read` from the fixture files, as the runner would. */
export function answerRead(m: Mounted): void {
  const e = lastEffect(m, "read");
  if (e === undefined) throw new Error("no read");
  m.store.dispatch({
    type: "fileLoaded",
    path: e.path,
    file: textFile(FILES[e.path] ?? ""),
  });
}

/**
 * Report every `applyEdits` recorded since effect `from` as written: the
 * fixture text with the edits applied.
 */
export function answerEdits(m: Mounted, from: number): void {
  for (const e of m.effects.slice(from)) {
    if (e.kind !== "applyEdits") continue;
    const text = applySpanEdits(FILES[e.edit.path] ?? "", e.edit.edits);
    m.store.dispatch({
      type: "editsApplied",
      batch: e.batch,
      path: e.edit.path,
      ...(text === null
        ? { ok: false, reason: "changed on disk" }
        : { ok: true, text, stamp: { mtimeMs: 2, size: 2, hash: "h2" } }),
    });
  }
}
