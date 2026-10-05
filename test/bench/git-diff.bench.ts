// 200 keystrokes in the 5,000-line note inside a repository whose index blob
// differs from the note on every line, the same key mix as the live
// keystroke bench. Each key goes through the store, the reducer, the 100 ms
// diff against the index, the change column, and a rendered frame. Prints
// {"metric":"gitDiffKeystrokeP95","ms":<p95>}.
import { readFile } from "node:fs/promises";
import { normalizeIndexText } from "../../src/core/features/git/index-text";
import { make5000LineNote } from "../fixtures/generate";
import { gitRepo } from "../support/git-repo";
import { mountShell } from "../support/ui";

const repo = await gitRepo();
let text: string;
let blob: string;
try {
  text = await readFile(await make5000LineNote(repo.root), "utf8");
  await repo.write(
    "long.md",
    text
      .split("\n")
      .map((l) => `~ ${l}`)
      .join("\n"),
  );
  await repo.run(["add", "long.md"]);
  blob = await repo.run(["cat-file", "blob", ":long.md"]);
} finally {
  await repo.cleanup();
}

const m = await mountShell({
  cols: 120,
  rows: 40,
  config: '[preview]\nmode = "live"\n',
});
m.store.dispatch({
  type: "gitDetected",
  repo: {
    top: "~/notes",
    gitDir: "~/notes/.git",
    commonDir: "~/notes/.git",
    prefix: "",
    head: { kind: "branch", name: "main" },
  },
});
m.keys("<leader>e");
m.open("long.md", text);
m.store.dispatch({
  type: "gitIndexRead",
  path: "long.md",
  entry: {
    kind: "tracked",
    oid: "a".repeat(40),
    mode: "100644",
    conflicted: false,
    text: normalizeIndexText(blob, "lf"),
  },
});
m.advance(100);
await m.frame();
if ((m.store.get().git.files["long.md"]?.hunks.length ?? 0) === 0)
  throw new Error("the note has no hunks against the index");
m.keys("2500G");
await m.frame();

const keys = [
  ...Array.from({ length: 50 }, () => "j"),
  "o",
  ...[..."const value = step1([1, 2, 3]);".repeat(4)].slice(0, 98),
  "<Esc>",
  ...Array.from({ length: 50 }, () => "k"),
];
const times: number[] = [];
for (const k of keys) {
  const start = performance.now();
  m.keys(k);
  m.advance(100);
  await m.t.renderOnce();
  times.push(performance.now() - start);
}
const hunks = m.store.get().git.files["long.md"]?.hunks.length ?? 0;
m.destroy();
if (hunks === 0) throw new Error("the diff dropped every hunk while typing");
times.sort((a, b) => a - b);
const p95 = times[Math.ceil(times.length * 0.95) - 1] ?? Number.NaN;
console.log(
  JSON.stringify({
    metric: "gitDiffKeystrokeP95",
    ms: p95,
    keys: times.length,
  }),
);
