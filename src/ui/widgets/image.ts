import { imageTier } from "../images";
import { drawCells } from "../theme";
import type { PaintTarget, WidgetPainter } from "./registry";

/** What core lays out for an image: the reference to load and the name to show. */
type ImageData = { path: string; name: string };

/** `text` on the first row in the placeholder style, the other rows blank. */
function paintText(t: PaintTarget, text: string): void {
  for (let i = 0; i < t.rows; i++)
    drawCells(
      t.buf,
      t.theme.style(i === 0 ? "imagePlaceholder" : "text"),
      t.x,
      t.y + i,
      i === 0 ? text : "",
      t.width,
    );
}

/**
 * An image in the widget's rows: `◌ name` while it loads, `[image: name]`
 * when it cannot be shown, and otherwise the image at its aspect ratio from
 * the left edge. A window bottom that cuts the widget draws only the rows on
 * screen. OpenTUI removes a placement on the first frame that does not draw
 * it, so scrolling it away or switching view or buffer needs no clearing here.
 * The zoom float hides it, since a terminal image draws over the float's cells.
 */
export const paintImage: WidgetPainter = (t, w) => {
  const { path, name } = w.data as ImageData;
  const { caps, hasResolution } = t.deps.capabilities();
  const tier = imageTier(t.state.config.preview.images, caps, hasResolution);
  if (tier === "placeholder") return paintText(t, `[image: ${name}]`);
  if (t.state.overlay.kind === "zoom") return paintText(t, "");
  const got = t.deps.images.get(path);
  if (got === undefined) return paintText(t, `◌ ${name}`);
  if ("failed" in got) return paintText(t, `[image: ${name}]`);
  const { image } = got;
  const full = Math.max(1, w.rows);
  const rows = Math.min(t.rows, full);
  const aspect = t.deps.images.cellAspect();
  const cols = Math.max(
    1,
    Math.min(t.width, Math.round((full * image.width) / image.height / aspect)),
  );
  const cell = t.deps.images.cellPixels();
  const sourceHeight = Math.max(1, Math.round((image.height * rows) / full));
  for (let i = 0; i < t.rows; i++)
    drawCells(t.buf, t.theme.style("text"), t.x, t.y + i, "", t.width);
  t.buf.drawImage(
    image,
    t.x,
    t.y,
    cols,
    rows,
    cell === undefined ? 0 : Math.round(cols * cell.width),
    cell === undefined ? 0 : Math.round(rows * cell.height),
    0,
    0,
    image.width,
    sourceHeight,
    tier,
  );
};
