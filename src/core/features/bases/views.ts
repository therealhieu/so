import { type KanbanModel, kanbanModel } from "./kanban";
import type { PropertyTypes } from "./property-types";
import { type TableModel, tableModel } from "./table";
import type { BaseEvaluation, BaseUi } from "./types";

/** How a view type is shown: the model builder for its rows. */
export type BaseLayout = {
  id: "table" | "board";
  model(
    e: BaseEvaluation,
    ui: BaseUi,
    types: PropertyTypes,
  ): TableModel | KanbanModel;
};

export const tableLayout: BaseLayout = {
  id: "table",
  model: (e, ui, types) => tableModel(e, ui, types),
};

export const boardLayout: BaseLayout = {
  id: "board",
  model: (e, ui) => kanbanModel(e, ui),
};

/** View types to layouts; the fallback is registered under its own id and shows every other type. */
export class BaseLayoutRegistry {
  private readonly layouts = new Map<string, BaseLayout>();

  constructor(private readonly fallback: BaseLayout) {
    this.layouts.set(fallback.id, fallback);
  }

  register(type: string, layout: BaseLayout): void {
    this.layouts.set(type, layout);
  }

  /** The layout for `type`; an unregistered type gets the fallback and a notice saying so. */
  resolve(type: string): { layout: BaseLayout; notice?: string } {
    const layout = this.layouts.get(type);
    if (layout !== undefined) return { layout };
    return {
      layout: this.fallback,
      notice: `${type} view is not supported yet; showing a ${this.fallback.id}`,
    };
  }
}
