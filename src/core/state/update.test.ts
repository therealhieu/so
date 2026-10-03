import { expect, test } from "bun:test";
import { deepFreeze, fresh, testRegistries } from "../../../test/support/state";
import { createStore } from "./store";
import type { Action, Effect } from "./types";
import { createUpdate } from "./update";

test("the same action on a deep-frozen state gives equal results", () => {
  const s = deepFreeze(fresh());
  const update = createUpdate(testRegistries());
  const a: Action = { type: "resize", cols: 100, rows: 30 };
  const first = update(s, a);
  expect(first).toEqual(update(s, a));
  expect(first.state.terminal).toEqual({
    cols: 100,
    rows: 30,
    color: "color",
  });
  expect(s.terminal.rows).toBe(24);
});

test("the store runs effects in order, then notifies subscribers once", () => {
  const calls: string[] = [];
  const effects: Effect[] = [
    { kind: "read", path: "a.md" },
    { kind: "listDir", dir: "" },
  ];
  const store = createStore(
    fresh(),
    (state) => ({ state, effects }),
    (e) => calls.push(e.kind),
  );
  const off = store.subscribe(() => calls.push("notify"));
  store.dispatch({ type: "resize", cols: 1, rows: 1 });
  off();
  store.dispatch({ type: "resize", cols: 1, rows: 1 });
  expect(calls).toEqual(["read", "listDir", "notify", "read", "listDir"]);
});

test("a throwing command keeps the previous state and reports the error", () => {
  const reg = testRegistries();
  reg.commands.register({
    id: "test.throw",
    title: "Throw",
    run: () => {
      throw new Error("boom");
    },
  });
  reg.keymap.bind({ mode: "normal" }, "Q", "test.throw");
  const s = deepFreeze({
    ...fresh(),
    panels: { explorer: { ...fresh().panels.explorer, focused: false } },
  });
  const r = createUpdate(reg)(s, { type: "key", key: "Q", now: 0 });
  expect(r.effects).toEqual([]);
  expect(r.state).toEqual({
    ...s,
    notifications: { toasts: [{ id: 1, level: "error", text: "boom" }] },
  });
});
