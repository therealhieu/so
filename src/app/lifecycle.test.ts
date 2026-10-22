import { expect, test } from "bun:test";
import { initialState } from "../core/state/init";
import { createStore } from "../core/state/store";
import { installLifecycle } from "./lifecycle";

const EVENTS = [
  "SIGTERM",
  "SIGHUP",
  "SIGINT",
  "uncaughtException",
  "unhandledRejection",
] as const;

/**
 * Install the lifecycle on the real process with doubles for the store,
 * shell, runner, and exit, and remove every handler it added once `body`
 * ends, so emitted signals never reach the test runner's own handlers.
 */
async function withLifecycle(
  body: (
    l: ReturnType<typeof installLifecycle>,
    exits: number[],
  ) => Promise<void>,
): Promise<void> {
  const before = new Map(EVENTS.map((e) => [e, process.listeners(e)]));
  const exits: number[] = [];
  const store = createStore(
    initialState({ root: "/w", cols: 80, rows: 24, color: "nocolor" }),
    (state) => ({ state, effects: [] }),
    () => {},
  );
  try {
    const l = installLifecycle({
      store,
      shell: { destroy() {}, closed: async () => {} },
      runner: { flush: async () => {} },
      exit: (code) => exits.push(code),
    });
    await body(l, exits);
  } finally {
    for (const e of EVENTS)
      for (const f of process.listeners(e))
        if (!before.get(e)?.includes(f)) process.removeListener(e, f);
  }
}

/** Emit a signal to the handlers and let a started shutdown finish. */
async function signal(name: "SIGINT" | "SIGTERM" | "SIGHUP"): Promise<void> {
  process.emit(name, name);
  await Bun.sleep(5);
}

test("interrupts are ignored while held and shut down after release", async () => {
  await withLifecycle(async (l, exits) => {
    const first = l.holdInterrupts();
    await signal("SIGINT");
    expect(exits).toEqual([]);
    first();
    first();
    // A second release must not let a later hold count below one.
    const second = l.holdInterrupts();
    await signal("SIGINT");
    expect(exits).toEqual([]);
    second();
    await signal("SIGINT");
    expect(exits).toEqual([0]);
  });
});

test("nested holds keep interrupts ignored until the last release", async () => {
  await withLifecycle(async (l, exits) => {
    const outer = l.holdInterrupts();
    const inner = l.holdInterrupts();
    inner();
    await signal("SIGINT");
    expect(exits).toEqual([]);
    outer();
    await signal("SIGINT");
    expect(exits).toEqual([0]);
  });
});

test("termination and hangup still shut down while interrupts are held", async () => {
  for (const name of ["SIGTERM", "SIGHUP"] as const)
    await withLifecycle(async (l, exits) => {
      l.holdInterrupts();
      await signal(name);
      expect(exits).toEqual([0]);
    });
});
