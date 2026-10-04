import { resolveLink } from "../features/links/resolve";
import type { Doc } from "../lang/markdown/doc";
import type { PreviewCtx } from "../lang/markdown/live-preview";
import { bufferForPath } from "./buffers";
import type { ViewContextBuilder, ViewHost } from "./view-context";

/** Image rows that keep the aspect ratio at the window width, capped at 80% of the window rows. */
export function imageRows(
  px: { width: number; height: number },
  host: ViewHost,
): number {
  const rows = Math.ceil((px.height / px.width) * host.width * host.cellAspect);
  return Math.max(1, Math.min(rows, Math.floor(host.rows * 0.8)));
}

/**
 * The live-preview context of a Markdown window: links resolve from the
 * window's note, embeds answer from open buffers and that note's own embed
 * requests, and images from the sizes the UI knows.
 */
export const markdownViewContext: ViewContextBuilder = (
  s,
  windowId,
  host,
): PreviewCtx => {
  const window = s.windows.byId[windowId];
  const own = window && s.buffers[window.content.bufferId];
  const from = own?.path ?? "";
  const resolve = (target: string) => {
    const r = resolveLink(s.index.ix, from, { target });
    return "path" in r ? r.path : undefined;
  };
  const { embedMaxRows, images } = s.config.preview;
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
    image: (path) => {
      const px = host.imageSize(path);
      return px === undefined ? "unknown" : { rows: imageRows(px, host) };
    },
    folds: new Set(window?.content.folds ?? []),
    embedMaxRows,
    images,
  };
};
