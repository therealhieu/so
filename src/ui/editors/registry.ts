import type { Renderable, RenderContext } from "@opentui/core";
import type { AppState, MouseTarget, WindowId } from "../../core/state/types";
import type { Cursor, ViewDeps } from "../shell";
import type { Rect } from "./text-view";

/**
 * What `WindowTree` needs from a window's view: place it in `r` and follow
 * window `id` (`split` when there are several windows), say where the
 * hardware cursor goes while the window has focus, and say what is under a
 * screen cell. A view paints only inside `r`; `dragAt` exists only where a
 * drag selects.
 */
export type WindowView = Renderable & {
  show(s: AppState, id: WindowId, r: Rect, split: boolean): void;
  cursor(): Cursor | undefined;
  targetAt(x: number, y: number): MouseTarget | undefined;
  dragAt?(x: number, y: number): MouseTarget | undefined;
};

/** Window content views by editor kind (`WindowState.content.editor`). */
export const editorViews = new Map<
  string,
  (ctx: RenderContext, deps: ViewDeps) => WindowView
>();

/** Register the view for an editor kind; a later registration replaces it. */
export function registerEditorView(
  kind: string,
  create: (ctx: RenderContext, deps: ViewDeps) => WindowView,
): void {
  editorViews.set(kind, create);
}
