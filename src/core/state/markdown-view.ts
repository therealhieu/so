import { resolveLink } from "../features/links/resolve";
import type { Doc } from "../lang/markdown/doc";
import type { PreviewCtx } from "../lang/markdown/live-preview";
import { bufferForPath } from "./buffers";
import type { Registries } from "./update";
import type { ViewContextBuilder, ViewHost } from "./view-context";

/**
 * Image rows at the image's natural size, shrunk to the window width when
 * wider, keeping the aspect ratio; capped at 80% of the window rows.
 */
export function imageRows(
  px: { width: number; height: number },
  host: ViewHost,
): number {
  const cols = Math.min(host.width, px.width / host.cell.width);
  const rows = Math.ceil(
    (px.height / px.width) * cols * (host.cell.width / host.cell.height),
  );
  return Math.max(1, Math.min(rows, Math.floor(host.rows * 0.8)));
}

/**
 * The live-preview context of a Markdown window: links resolve from the
 * window's note, embeds answer from open buffers and that note's own embed
 * requests (other file types through their embed models in `reg`), and
 * images from the sizes the UI knows.
 */
export const markdownViewContextFor =
  (reg: Registries): ViewContextBuilder =>
  (s, windowId, host): PreviewCtx => {
    const window = s.windows.byId[windowId];
    const own = window && s.buffers[window.content.bufferId];
    const from = own?.path ?? "";
    const resolve = (target: string) => {
      const r = resolveLink(s.index.ix, from, { target });
      return "path" in r ? r.path : undefined;
    };
    const { embedMaxRows, images, justify, sizedText, zoom } = s.config.preview;
    const { wrap, tabWidth } = s.config.editor;
    return {
      resolve,
      isResolved: (t) => resolve(t) !== undefined,
      embed: (path) => {
        const b = bufferForPath(s, path);
        if (b?.analysis !== undefined)
          return { doc: b.analysis as Doc, text: b.text };
        if (own?.embeds?.refused.includes(path)) return "missing";
        return own?.embeds?.requested.includes(path) ? "loading" : "missing";
      },
      embedModel: (path, subpath) => {
        if (own?.embeds?.refused.includes(path)) return "missing";
        const b = bufferForPath(s, path);
        if (b === undefined)
          return own?.embeds?.requested.includes(path) ? "loading" : "missing";
        return reg.embedModels.build(b.fileType, s, path, subpath, reg);
      },
      image: (path) => {
        const px = host.imageSize(path);
        return px === undefined ? "unknown" : { rows: imageRows(px, host) };
      },
      folds: new Set(window?.content.folds ?? []),
      embedMaxRows,
      images,
      justify,
      sizedText: host.sizedText && sizedText,
      zoom,
      wrap,
      tabWidth,
    };
  };
