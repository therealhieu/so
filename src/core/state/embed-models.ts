import type { AppState } from "./types";
import type { Registries } from "./update";

/**
 * Builds a render-ready model of an embedded non-note file for a note's
 * renderer: the model, `"loading"`, or `"missing"`. Pure and memoized by
 * its inputs.
 */
export type EmbedModelBuilder = (
  s: AppState,
  path: string,
  subpath: string | undefined,
  reg: Registries,
) => unknown;

/**
 * One embed-model builder per file type. A file type with a builder has its
 * embed targets loaded, so notes can show it without knowing the type.
 */
export class EmbedModelRegistry {
  private readonly builders = new Map<string, EmbedModelBuilder>();

  register(fileTypeId: string, b: EmbedModelBuilder): void {
    if (this.builders.has(fileTypeId))
      throw new Error(
        `an embed model builder for "${fileTypeId}" is already registered`,
      );
    this.builders.set(fileTypeId, b);
  }

  has(fileTypeId: string): boolean {
    return this.builders.has(fileTypeId);
  }

  /** The model of `path` at `subpath`; `"missing"` when its file type has no builder. */
  build(
    fileTypeId: string,
    s: AppState,
    path: string,
    subpath: string | undefined,
    reg: Registries,
  ): unknown {
    const b = this.builders.get(fileTypeId);
    return b === undefined ? "missing" : b(s, path, subpath, reg);
  }
}
