import type { OptimizedBuffer } from "@opentui/core";
import type { Widget } from "../../core/kernel/view/types";
import type { AppState } from "../../core/state/types";
import type { ViewDeps } from "../shell";
import type { Theme } from "../theme";

/** The cells a widget owns: `rows` rows of `width` cells from (`x`, `y`). */
export type PaintTarget = {
  buf: OptimizedBuffer;
  theme: Theme;
  x: number;
  y: number;
  width: number;
  rows: number;
  deps: ViewDeps;
  state: AppState;
};

/** Paints one widget inside its target and nowhere else. */
export type WidgetPainter = (t: PaintTarget, w: Widget) => void;

/** Painters by widget type; a later registration replaces an earlier one. */
export const widgetPainters = new Map<string, WidgetPainter>();

export function registerWidgetPainter(type: string, p: WidgetPainter): void {
  widgetPainters.set(type, p);
}
