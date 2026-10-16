import type { EditorKindSpec, FileType } from "../../filetypes/registry";

/** What one video window remembers: the moment its still frame shows, in seconds. */
export type VideoWindowState = { at: number };

export function isVideoWindowState(v: unknown): v is VideoWindowState {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as Partial<VideoWindowState>).at === "number"
  );
}

/** What a still frame request names: a workspace video, a moment in seconds, and a pixel width. */
export type VideoFrameRequest = { path: string; at: number; width: number };

/** The widest still frame drawn, in pixels. */
const MAX_FRAME_WIDTH = 2048;

/** An even pixel width from 2 to 2048: ffmpeg's scaler wants even sizes. */
export const frameWidth = (width: number): number =>
  Math.max(2, Math.min(MAX_FRAME_WIDTH, Math.round(width / 2) * 2));

export const VIDEO_EXTENSIONS = [
  ".mp4",
  ".m4v",
  ".mov",
  ".webm",
  ".mkv",
  ".avi",
] as const;

/** Videos: a still frame and what they hold, played by the system player. */
export const videoFileType: FileType = {
  id: "video",
  match: { extensions: VIDEO_EXTENSIONS },
  editor: "video",
  readOnly: true,
  binary: true,
  views: [{ id: "video", readOnly: true, decorations: [] }],
};

export const videoEditorKind: EditorKindSpec<VideoWindowState> = {
  id: "video",
  open: () => ({ at: 0 }),
};
