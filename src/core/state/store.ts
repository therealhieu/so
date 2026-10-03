import type { Action, AppState, Effect } from "./types";
import type { Update } from "./update";

export type Store = {
  get(): AppState;
  dispatch(action: Action): void;
  subscribe(f: (state: AppState) => void): () => void;
};

/** The only mutable cell: runs effects in the order returned, then notifies once. */
export function createStore(
  initial: AppState,
  update: Update,
  run: (e: Effect) => void,
): Store {
  let state = initial;
  const subs = new Set<(s: AppState) => void>();
  return {
    get: () => state,
    dispatch(action) {
      const r = update(state, action);
      state = r.state;
      for (const e of r.effects) run(e);
      for (const f of subs) f(state);
    },
    subscribe(f) {
      subs.add(f);
      return () => subs.delete(f);
    },
  };
}
