import { createTestRenderer } from "@opentui/core/testing";
import { splitKeys } from "../../src/core/kernel/vim/keys";
import { initialState } from "../../src/core/state/init";
import { createStore } from "../../src/core/state/store";
import type {
  AppState,
  DirEntry,
  Effect,
  TimerId,
} from "../../src/core/state/types";
import { createUpdate } from "../../src/core/state/update";
import { registerEditorView } from "../../src/ui/editors/registry";
import { EditorView } from "../../src/ui/editors/text-view";
import { createShell } from "../../src/ui/shell";
import { testRegistries, textFile } from "./state";

export type MountOptions = {
  cols: number;
  rows: number;
  color?: AppState["terminal"]["color"];
  theme?: AppState["config"]["theme"];
  kittyKeyboard?: boolean;
};

/** The workspace tree the shell tests list: folder → entries. */
export const TREE: Record<string, DirEntry[]> = {
  "": [
    { name: "notes", kind: "dir" },
    { name: "scripts", kind: "dir" },
    { name: "config.yaml", kind: "file" },
    { name: "todo.md", kind: "file" },
  ],
  notes: [
    { name: "ideas.md", kind: "file" },
    { name: "plan.md", kind: "file" },
  ],
  scripts: [{ name: "sync.ts", kind: "file" }],
};

/**
 * The shell on an OpenTUI test renderer over the real store and reducer.
 * Effects are recorded, not run; timers run on a fixed clock that only
 * `advance` moves, and file contents arrive through `open`.
 */
export async function mountShell(o: MountOptions) {
  registerEditorView("text", (ctx, deps) => new EditorView(ctx, deps));
  const t = await createTestRenderer({
    width: o.cols,
    height: o.rows,
    kittyKeyboard: o.kittyKeyboard ?? false,
  });
  let now = 1_000_000;
  const timers = new Map<TimerId, number>();
  const effects: Effect[] = [];
  const reg = testRegistries();
  const base = initialState({
    root: "~/notes",
    cols: o.cols,
    rows: o.rows,
    color: o.color ?? "color",
  });
  const initial: AppState = {
    ...base,
    config: { ...base.config, theme: o.theme ?? "dark" },
  };
  const store = createStore(initial, createUpdate(reg), (e) => {
    effects.push(e);
    if (e.kind === "startTimer") timers.set(e.id, now + e.ms);
    if (e.kind === "cancelTimer") timers.delete(e.id);
  });
  const shell = createShell(t.renderer, {
    fileTypes: reg.fileTypes,
    commands: reg.commands,
    now: () => now,
  });
  shell.attach(store);
  for (const [dir, entries] of Object.entries(TREE))
    store.dispatch({ type: "dirListed", dir, entries });

  return {
    t,
    store,
    shell,
    effects,
    now: () => now,
    /** Move the clock, firing every timer that falls due on the way. */
    advance(ms: number) {
      const until = now + ms;
      for (;;) {
        const due = [...timers].sort((a, b) => a[1] - b[1])[0];
        if (due === undefined || due[1] > until) break;
        timers.delete(due[0]);
        now = due[1];
        store.dispatch({ type: "timer", id: due[0], now });
      }
      now = until;
    },
    /** Dispatch keys in Vim notation straight to the store. */
    keys(seq: string) {
      for (const key of splitKeys(seq))
        store.dispatch({ type: "key", key, now });
    },
    /** `:e path`, then the file's contents as read from disk. */
    open(path: string, text: string) {
      for (const key of splitKeys(`:e ${path}<CR>`))
        store.dispatch({ type: "key", key, now });
      store.dispatch({ type: "fileLoaded", path, file: textFile(text) });
    },
    async frame(): Promise<string> {
      await t.renderOnce();
      return t.captureCharFrame();
    },
    /** The text of screen row `y` (negative counts from the bottom). */
    async row(y: number): Promise<string> {
      const lines = (await this.frame()).split("\n");
      const rows = store.get().terminal.rows;
      return lines[y < 0 ? rows + y : y] ?? "";
    },
    destroy() {
      shell.destroy();
    },
  };
}

export type Mounted = Awaited<ReturnType<typeof mountShell>>;
