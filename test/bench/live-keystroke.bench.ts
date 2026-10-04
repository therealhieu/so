// 200 keystrokes in the 5,000-line note in live view, the same key mix as
// the source keystroke bench, each through the store, the reducer, the
// live-preview layout, and a rendered frame. The note embeds tasks.base near
// the typing, with the base and its task notes loaded, so the embedded view
// is evaluated and painted while typing. Prints
// {"metric":"liveKeystrokeP95","ms":<p95>}.
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isBaseEmbedModel } from "../../src/core/features/bases/embed";
import type { PreviewCtx } from "../../src/core/lang/markdown/live-preview";
import { make5000LineNote } from "../fixtures/generate";
import { indexed, TASK_NOTES, TASKS_BASE } from "../support/bases";
import { textFile } from "../support/state";
import { mountShell } from "../support/ui";

const dir = await mkdtemp(join(tmpdir(), "so-bench-"));
const text = await readFile(await make5000LineNote(dir), "utf8");
await rm(dir, { recursive: true });

const m = await mountShell({ cols: 120, rows: 40 });
m.store.dispatch(indexed(TASK_NOTES, ["long.md", "tasks.base"]));
m.keys("<leader>e");
m.open("long.md", text);
m.store.dispatch({
  type: "fileLoaded",
  path: "tasks.base",
  file: textFile(TASKS_BASE),
  embed: true,
});
await m.frame();
if (m.store.get().buffers[1]?.view !== "live")
  throw new Error("the note did not open in live view");
const model = m.reg.viewContexts.build(
  "markdown",
  m.store.get(),
  m.store.get().windows.active,
  { width: 114, rows: 37, imageSize: () => undefined, cellAspect: 0.5 },
) as PreviewCtx;
const embedded = model.embedModel("tasks.base", "#All tasks");
if (!isBaseEmbedModel(embedded) || embedded.table === undefined)
  throw new Error("the base embed did not evaluate to a table");
m.keys("2500G");
await m.frame();

const keys = [
  ...Array.from({ length: 50 }, () => "j"),
  "o",
  ...[..."const value = step1([1, 2, 3]);".repeat(4)].slice(0, 98),
  "<Esc>",
  ...Array.from({ length: 50 }, () => "k"),
];
const embedShown = (frame: string) =>
  frame.includes("╭ ↳ tasks.base#All tasks") && frame.includes("due ↑");
const times: number[] = [];
let embedFrames = 0;
for (const k of keys) {
  const start = performance.now();
  m.keys(k);
  await m.t.renderOnce();
  times.push(performance.now() - start);
  if (embedShown(m.t.captureCharFrame())) embedFrames++;
}
m.destroy();
// The embed must be on screen while the note is edited, or it is not measured.
if (embedFrames < 100)
  throw new Error(`the base embed showed in only ${embedFrames} frames`);
times.sort((a, b) => a - b);
const p95 = times[Math.ceil(times.length * 0.95) - 1] ?? Number.NaN;
console.log(
  JSON.stringify({
    metric: "liveKeystrokeP95",
    ms: p95,
    keys: times.length,
    embedFrames,
  }),
);
