import { pageOf, pdfPageRef } from "../../../features/pdf/page";
import { embedLink, wholeBlock } from "../block-text";
import type { BlockRenderer } from "../live-preview";
import { baseName } from "./image";

/**
 * A PDF embed (`![[paper.pdf#page=3]]`) as an `image` widget of that page,
 * page 1 without a page subpath; `[pdf: name · p. N]` text when images are
 * off or the target does not resolve.
 */
export const pdfRenderer: BlockRenderer = (block, v, { doc, ctx }) => {
  const { target, section, alt } = embedLink(doc, block, v.buf);
  const path = ctx.resolve(target);
  const page = pageOf(section);
  const name = `${alt ?? baseName(target)} · p. ${page}`;
  const range = wholeBlock(v.buf, block);
  if (ctx.images === "off" || path === undefined)
    return [
      {
        kind: "replace",
        range,
        block: true,
        spans: [{ text: `[pdf: ${name}]`, style: "imagePlaceholder" }],
      },
    ];
  const ref = pdfPageRef(path, page);
  const size = ctx.image(ref);
  return [
    {
      kind: "replace",
      range,
      block: true,
      widget: {
        type: "image",
        data: { path: ref, name },
        rows: size === "unknown" ? 1 : size.rows,
      },
    },
  ];
};
