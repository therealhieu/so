import type { AppState, Result, Toast } from "./types";

export const none = (state: AppState): Result => ({ state, effects: [] });

/** Run `f` on the result's state and append its effects. */
export function chain(r: Result, f: (s: AppState) => Result): Result {
  const next = f(r.state);
  return { state: next.state, effects: [...r.effects, ...next.effects] };
}

/** Set the message line. */
export function message(
  s: AppState,
  text: string,
  level: "info" | "error" = "info",
): Result {
  return none({
    ...s,
    notifications: { ...s.notifications, message: { text, level } },
  });
}

const TOAST_MS = 3000;

/** Add a toast; info toasts expire, error toasts stay until dismissed. */
export function toast(
  s: AppState,
  level: Toast["level"],
  text: string,
): Result {
  const id = Math.max(0, ...s.notifications.toasts.map((t) => t.id)) + 1;
  const state: AppState = {
    ...s,
    notifications: {
      ...s.notifications,
      toasts: [...s.notifications.toasts, { id, level, text }],
    },
  };
  return {
    state,
    effects:
      level === "info"
        ? [{ kind: "startTimer", id: `toast:${id}`, ms: TOAST_MS }]
        : [],
  };
}

/** The previous state plus an error toast, for a reducer that threw. */
export function notifyError(s: AppState, e: unknown): AppState {
  return toast(s, "error", e instanceof Error ? e.message : String(e)).state;
}
