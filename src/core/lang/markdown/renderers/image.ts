import { embedLink, wholeBlock } from "../block-text";
import type { BlockRenderer } from "../live-preview";

/** An `http(s)` image reference, loaded by URL rather than resolved in the workspace. */
export const isWebUrl = (target: string) => /^https?:\/\//i.test(target);

export const baseName = (target: string) =>
  target.split(/[?#]/, 1)[0]?.split("/").pop() || target;

/**
 * An image as an `image` widget reserving the rows `ctx.image` computed for
 * this window (one row until the size is known), or `[image: name]` text when
 * images are off or the target does not resolve. It never decodes.
 */
export const imageRenderer: BlockRenderer = (block, v, { doc, ctx }) => {
  const { target, alt } = embedLink(doc, block, v.buf);
  const path = isWebUrl(target) ? target : ctx.resolve(target);
  const name = alt ?? baseName(target);
  const range = wholeBlock(v.buf, block);
  if (ctx.images === "off" || path === undefined)
    return [
      {
        kind: "replace",
        range,
        block: true,
        spans: [{ text: `[image: ${name}]`, style: "imagePlaceholder" }],
      },
    ];
  const size = ctx.image(path);
  return [
    {
      kind: "replace",
      range,
      block: true,
      widget: {
        type: "image",
        data: { path, name },
        rows: size === "unknown" ? 1 : size.rows,
      },
    },
  ];
};
