import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import { FITTED } from "../../core/features/image/view";
import { frameWidth } from "../../core/features/video/file-type";
import {
  byteSize,
  clock,
  type VideoMeta,
} from "../../core/features/video/probe";
import type {
  AppState,
  BufferState,
  MouseTarget,
  WindowId,
} from "../../core/state/types";
import { videoWindow } from "../../core/state/video";
import { drawFitted, type FittedView, fitView } from "../image-fit";
import { type ImageTier, imageTier } from "../images";
import type { Cursor, ViewDeps } from "../shell";
import { drawCells, themeOf } from "../theme";
import type { WindowView } from "./registry";
import type { Rect } from "./text-view";

/** Half-blocks draw two pixels per cell, so wider frames only cost memory. */
const BLOCKS_PX_PER_COL = 4;

/** Rows under the frame for what the video holds and where the frame is. */
const DETAIL_ROWS = 2;

const nameOf = (path: string) => path.slice(path.lastIndexOf("/") + 1);

/** The cache key of the frame at `at` drawn `width` pixels wide from the file version `b.stamp`. */
const frameKey = (b: BufferState, at: number, width: number) =>
  `video:${b.path}@${b.stamp.mtimeMs}-${b.stamp.size}-${b.stamp.hash}#${at}@${width}`;

/** `clip.mp4 · 1920×1080 · h264 · 30 fps · aac · 48 MB`. */
export function videoFacts(name: string, m: VideoMeta): string {
  return [
    name,
    `${m.width}×${m.height}`,
    m.videoCodec,
    ...(m.fps === undefined ? [] : [`${m.fps} fps`]),
    ...(m.audioCodec === undefined ? [] : [m.audioCodec]),
    ...(m.bytes === undefined ? [] : [byteSize(m.bytes)]),
  ].join(" · ");
}

/** `0:09 / 1:32  ━━━━●──────  Enter plays`, fitted to `width` cells. */
export function videoTimeline(
  at: number,
  duration: number,
  width: number,
): string {
  const time = `${clock(at)} / ${clock(duration)}`;
  const hint = "Enter plays";
  const bar = width - time.length - hint.length - 4;
  if (bar < 5) return `${time}  ${hint}`;
  const head = Math.round((duration > 0 ? at / duration : 0) * (bar - 1));
  return `${time}  ${"━".repeat(head)}●${"─".repeat(bar - head - 1)}  ${hint}`;
}

/**
 * A video window: a still frame fitted above two rows that say what the
 * video holds and where the frame is in it. The last frame drawn stays up
 * while the next one draws. Lines of text stand in while it loads, without
 * ffmpeg, or when it cannot be shown.
 */
export class VideoView extends Renderable implements WindowView {
  private s: AppState | undefined;
  private windowId: WindowId = 0;
  private rect: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private lines: string[] = [];
  private details: string[] = [];
  private placed:
    | {
        view: FittedView;
        tier: Exclude<ImageTier, "placeholder">;
        key: string;
      }
    | undefined;
  /** The frame last drawn, kept to stand in while the next one draws. */
  private last: { path: string; key: string } | undefined;

  constructor(
    ctx: RenderContext,
    private readonly deps: ViewDeps,
  ) {
    super(ctx, { position: "absolute" });
  }

  show(s: AppState, id: WindowId, r: Rect, _split: boolean): void {
    this.s = s;
    this.windowId = id;
    this.rect = r;
    this.left = r.x;
    this.top = r.y;
    this.width = r.w;
    this.height = r.h;
    this.lines = [];
    this.details = [];
    this.placed = undefined;
    const w = s.windows.byId[id];
    const b = w === undefined ? undefined : s.buffers[w.content.bufferId];
    const ws = videoWindow(s, id);
    if (b === undefined || ws === undefined || r.h <= 0 || r.w <= 0) return;
    const name = nameOf(b.path);
    const info = b.video;
    if (info?.status === "missing") {
      this.lines = [
        `Video view needs ffmpeg: ${name} cannot be drawn here.`,
        "Install it (brew install ffmpeg, or apt install ffmpeg),",
        "or press Enter (:Open) to play it in the system player.",
      ];
      return;
    }
    if (info?.status === "failed") {
      this.lines = [
        `Cannot show ${name}: ${info.reason}`,
        "Enter (:Open) plays it in the system player.",
      ];
      return;
    }
    if (info?.status !== "ready") {
      this.lines = [`◌ ${name}`];
      return;
    }
    const { meta } = info;
    this.details = [
      videoFacts(name, meta),
      videoTimeline(ws.at, meta.duration, r.w - 2),
    ];
    const { caps, hasResolution } = this.deps.capabilities();
    const tier = imageTier(s.config.preview.images, caps, hasResolution);
    const box = { ...r, h: Math.max(0, r.h - DETAIL_ROWS) };
    if (tier === "placeholder") {
      this.lines = [`[video: ${name} · ${clock(ws.at)}]`];
      return;
    }
    // A terminal image would draw over the zoom float.
    if (s.overlay.kind === "zoom" || box.h === 0) return;
    const images = this.deps.images;
    const cell = images.cellSize();
    // The frame's cells at fit decide its pixel width; the video's own size caps it.
    const fit = fitView(box, FITTED, meta.width, meta.height, cell);
    const px = fit.cols * (tier === "blocks" ? BLOCKS_PX_PER_COL : cell.width);
    const width = frameWidth(Math.min(px, meta.width));
    const key = frameKey(b, ws.at, width);
    const got = images.get(key, () =>
      this.deps.videoFrame({ path: b.path, at: ws.at, width }),
    );
    if (got !== undefined && "failed" in got) {
      this.lines = [`[the frame at ${clock(ws.at)} could not be drawn]`];
      return;
    }
    const shown =
      got !== undefined
        ? { image: got.image, key }
        : this.last?.path === b.path
          ? { image: images.peek(this.last.key), key: this.last.key }
          : undefined;
    if (shown?.image === undefined) {
      this.lines = [`◌ ${name} · ${clock(ws.at)}`];
      return;
    }
    if (got !== undefined) {
      this.last = { path: b.path, key };
      // Kitty sends PNG; encoded here it is far smaller than when encoded to send.
      if (tier === "kitty") got.image.ensureEncodedPng();
    }
    const view = fitView(
      box,
      FITTED,
      shown.image.width,
      shown.image.height,
      cell,
    );
    this.placed = { view, tier, key: shown.key };
  }

  cursor(): Cursor | undefined {
    return undefined;
  }

  targetAt(x: number, y: number): MouseTarget | undefined {
    const r = this.rect;
    if (x < r.x || x >= r.x + r.w || y < r.y || y >= r.y + r.h)
      return undefined;
    return {
      kind: "window",
      window: this.windowId,
      spot: { kind: "video" },
    };
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    if (s === undefined) return;
    const theme = themeOf(s);
    const r = this.rect;
    for (let i = 0; i < r.h; i++)
      drawCells(buf, theme.style("text"), r.x, r.y + i, "", r.w);
    const body = Math.max(0, r.h - (this.details.length > 0 ? DETAIL_ROWS : 0));
    const top = r.y + Math.max(0, Math.floor((body - this.lines.length) / 2));
    this.lines.slice(0, body).forEach((line, i) => {
      const pad = Math.max(0, Math.floor((r.w - [...line].length) / 2));
      drawCells(
        buf,
        theme.style("imagePlaceholder"),
        r.x + pad,
        top + i,
        line,
        r.w - pad,
      );
    });
    this.details.slice(0, r.h).forEach((line, i) => {
      const y = r.y + r.h - this.details.length + i;
      drawCells(
        buf,
        theme.style(i === 0 ? "text" : "imagePlaceholder"),
        r.x + 1,
        y,
        line,
        r.w - 1,
      );
    });
    const p = this.placed;
    const image = p && this.deps.images.peek(p.key);
    if (p === undefined || image === undefined) return;
    drawFitted(buf, image, p.view, this.deps.images.cellPixels(), p.tier);
  }
}
