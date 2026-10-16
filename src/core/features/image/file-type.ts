import type { EditorKindSpec, FileType } from "../../filetypes/registry";
import { lowlightHighlighter } from "../../lang/code/highlight";
import { IMAGE_EXTENSIONS } from "../../lang/markdown/render-key";
import { FITTED, type FrameGrab, type ImageFrame } from "./view";

/**
 * What one image window remembers: how the image sits in it, the last press
 * in it while a drag pans, and the image's pixel size once the view drew it.
 */
export type ImageWindowState = ImageFrame & {
  grab?: FrameGrab;
  size?: { width: number; height: number };
};

export function isImageWindowState(v: unknown): v is ImageWindowState {
  if (typeof v !== "object" || v === null) return false;
  const w = v as Partial<ImageWindowState>;
  return (
    typeof w.level === "number" &&
    typeof w.cx === "number" &&
    typeof w.cy === "number" &&
    typeof w.fill === "object"
  );
}

/** Pictures the terminal can draw, never read as text. */
export const imageFileType: FileType = {
  id: "image",
  match: {
    extensions: [...IMAGE_EXTENSIONS]
      .filter((e) => e !== "svg")
      .map((e) => `.${e}`),
  },
  editor: "image",
  readOnly: true,
  binary: true,
  views: [{ id: "image", readOnly: true, decorations: [] }],
};

/** SVG drawings: shown drawn, their source edited as text. */
export const svgFileType: FileType = {
  id: "svg",
  match: { extensions: [".svg"] },
  editor: "image",
  views: [{ id: "source", decorations: [] }],
  highlighter: lowlightHighlighter("xml"),
};

export const imageEditorKind: EditorKindSpec<ImageWindowState> = {
  id: "image",
  open: () => FITTED,
};
