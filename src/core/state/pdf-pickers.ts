import { rankBy } from "../kernel/text/fuzzy";
import { activeBuffer } from "./buffers";
import { showPdfPage } from "./pdf";
import type { PickerSource } from "./picker";
import { none } from "./result";
import type { AppState, PickerItem } from "./types";

type Row = { key: string; text: string; detail: string };

/** The active PDF's contents, indented by level; keys are `<n>:<page>`. */
function rows(s: AppState): Row[] {
  const o = activeBuffer(s)?.pdfOutline;
  if (o?.status !== "ready") return [];
  return o.value.map((item, i) => ({
    key: `${i}:${item.page}`,
    text: `${"  ".repeat(item.depth)}${item.title}`,
    detail: `p. ${item.page}`,
  }));
}

const ranked = (all: readonly Row[], query: string): PickerItem[] =>
  rankBy(all, query, (r) => r.text).map(({ item, match }) => ({
    key: item.key,
    label: item.text,
    detail: item.detail,
    matches: match.positions,
  }));

export const pdfPickerSources: Record<string, PickerSource> = {
  pdfOutline: {
    id: "pdfOutline",
    title: "Contents",
    action: "go",
    items: (s, _r, q) => ranked(rows(s), q),
    total: (s) => rows(s).length,
    empty: (s) => {
      const o = activeBuffer(s)?.pdfOutline;
      if (o === undefined || o.status === "loading") return "Loading contents…";
      if (o.status === "failed") return `No contents: ${o.reason}`;
      return "This PDF has no table of contents";
    },
    accept: (s, item) =>
      none(
        showPdfPage(
          { ...s, overlay: { kind: "none" } },
          s.windows.active,
          Number(item.key.split(":")[1]),
        ),
      ),
  },
};
