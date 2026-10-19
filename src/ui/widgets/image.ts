import type { AppState } from "../../core/state/types";
import { imageTier } from "../images";
import type { NotePictures } from "../note-pictures";
import type { ViewDeps } from "../shell";
import { drawCells } from "../theme";
import type { PaintTarget, WidgetPainter } from "./registry";

/** What core lays out for an image: the reference to load and the name to show. */
type ImageData = { path: string; name: string };

/**
 * The note pictures to draw from: set on a kitty terminal when pictures are
 * read and scaled off the main thread, so drawing never decodes them.
 */
export function kittyPictures(
  deps: ViewDeps,
  s: AppState,
): NotePictures | undefined {
  const { caps, hasResolution } = deps.capabilities();
  return imageTier(s.config.preview.images, caps, hasResolution) === "kitty"
    ? deps.pictures
    : undefined;
}

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

/** Blank rows under an image. */
function paintBlank(t: PaintTarget): void {
  for (let i = 0; i < t.rows; i++)
    drawCells(t.buf, t.theme.style("text"), t.x, t.y + i, "", t.width);
}

/**
 * An image in the widget's rows: `◌ name` while it loads, `[image: name]`
 * when it cannot be shown, and otherwise the image at its aspect ratio from
 * the left edge. A window bottom that cuts the widget draws only the rows on
 * screen. With `kittyPictures`, the terminal gets the picture once at the
 * size it shows, through `imageSlots`, so scrolling only moves or crops it;
 * it shows `◌ name` until that copy is first made. Otherwise it draws here,
 * and OpenTUI removes a placement on the first frame that does not draw it,
 * so scrolling it away or switching view or buffer needs no clearing here.
 * The zoom float hides it, since a terminal image draws over the float's
 * cells.
 */
export const paintImage: WidgetPainter = (t, w) => {
  const { path, name } = w.data as ImageData;
  const { caps, hasResolution } = t.deps.capabilities();
  const tier = imageTier(t.state.config.preview.images, caps, hasResolution);
  if (tier === "placeholder") return paintText(t, `[image: ${name}]`);
  if (t.state.overlay.kind === "zoom") return paintText(t, "");
  const pictures = kittyPictures(t.deps, t.state);
  const got =
    pictures === undefined ? t.deps.images.get(path) : pictures.size(path);
  if (got === undefined) return paintText(t, `◌ ${name}`);
  if ("failed" in got) return paintText(t, `[image: ${name}]`);
  const size = "image" in got ? got.image : got;
  const full = Math.max(1, w.rows);
  const rows = Math.min(t.rows, full);
  const aspect = t.deps.images.cellAspect();
  const cols = Math.max(
    1,
    Math.min(t.width, Math.round((full * size.width) / size.height / aspect)),
  );
  const cell = t.deps.images.cellPixels();
  const pixelWidth = cell === undefined ? 0 : Math.round(cols * cell.width);
  const pixelHeight = cell === undefined ? 0 : Math.round(rows * cell.height);
  if (pictures !== undefined) {
    const copy =
      cell === undefined
        ? pictures.copy(path, size.width, size.height)
        : pictures.copy(path, pixelWidth, Math.round(full * cell.height));
    if (copy === undefined) return paintText(t, `◌ ${name}`);
    if (copy === "failed") return paintText(t, `[image: ${name}]`);
    paintBlank(t);
    t.deps.imageSlots.draw(path, copy, {
      x: t.x,
      y: t.y,
      cols,
      rows,
      pixelWidth,
      pixelHeight,
      shown: rows / full,
    });
    return;
  }
  if (!("image" in got)) return;
  const { image } = got;
  paintBlank(t);
  t.buf.drawImage(
    image,
    t.x,
    t.y,
    cols,
    rows,
    pixelWidth,
    pixelHeight,
    0,
    0,
    image.width,
    Math.max(1, Math.round((image.height * rows) / full)),
    tier,
  );
};
