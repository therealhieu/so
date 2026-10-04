import type { AppState, WindowId } from "./types";

/** Language-neutral facts the UI owns about one window. */
export type ViewHost = {
  /** Text columns and rows of the window. */
  width: number;
  rows: number;
  /** A decoded image's pixel size, when the UI has it. */
  imageSize(path: string): { width: number; height: number } | undefined;
  /** Cell width ÷ cell height. */
  cellAspect: number;
};

/** Builds a view's input context for one window; a pure function of its arguments. */
export type ViewContextBuilder = (
  s: AppState,
  windowId: WindowId,
  host: ViewHost,
) => unknown;

/** One context builder per file type, so the editor view needs no language knowledge. */
export class ViewContextRegistry {
  private readonly builders = new Map<string, ViewContextBuilder>();

  register(fileTypeId: string, b: ViewContextBuilder): void {
    if (this.builders.has(fileTypeId))
      throw new Error(
        `a view context builder for "${fileTypeId}" is already registered`,
      );
    this.builders.set(fileTypeId, b);
  }

  /** The context for `fileTypeId`, or undefined when it has no builder. */
  build(
    fileTypeId: string,
    s: AppState,
    windowId: WindowId,
    host: ViewHost,
  ): unknown {
    return this.builders.get(fileTypeId)?.(s, windowId, host);
  }
}
