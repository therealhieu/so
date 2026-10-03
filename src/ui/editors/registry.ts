import type { RenderContext } from "@opentui/core";
import type { ViewDeps } from "../shell";
import type { EditorView } from "./text-view";

/** Window content views by editor kind (`WindowState.content.editor`). */
export const editorViews = new Map<
  string,
  (ctx: RenderContext, deps: ViewDeps) => EditorView
>();

/** Register the view for an editor kind; a later registration replaces it. */
export function registerEditorView(
  kind: string,
  create: (ctx: RenderContext, deps: ViewDeps) => EditorView,
): void {
  editorViews.set(kind, create);
}
