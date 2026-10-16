/** What a video holds, as `ffprobe` reports it; `width`×`height` as shown, after rotation. */
export type VideoMeta = {
  /** Seconds. */
  duration: number;
  width: number;
  height: number;
  videoCodec: string;
  fps?: number;
  audioCodec?: string;
  bytes?: number;
};

type ProbeStream = {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  avg_frame_rate?: string;
  r_frame_rate?: string;
  duration?: string;
  tags?: { rotate?: string };
  side_data_list?: { rotation?: number }[];
};

type Probe = {
  streams?: ProbeStream[];
  format?: { duration?: string; size?: string };
};

/** A positive number from ffprobe's text, or nothing. */
const positive = (v: string | number | undefined): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/** A frame rate such as `30000/1001`, rounded to two decimals. */
function rate(v: string | undefined): number | undefined {
  const [num, den = "1"] = (v ?? "").split("/");
  const n = positive(num);
  const d = positive(den);
  return n === undefined || d === undefined
    ? undefined
    : Math.round((n / d) * 100) / 100;
}

/** A stream's rotation in degrees: the display matrix's, else the legacy `rotate` tag. */
function rotation(s: ProbeStream): number {
  const r =
    s.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ??
    Number(s.tags?.rotate ?? 0);
  return Number.isFinite(r) ? r : 0;
}

/**
 * The first video stream of `ffprobe -print_format json -show_format
 * -show_streams` output; undefined when there is none or it is not JSON.
 */
export function parseProbe(json: string): VideoMeta | undefined {
  let p: Probe;
  try {
    p = JSON.parse(json) as Probe;
  } catch {
    return undefined;
  }
  const streams = p.streams ?? [];
  const video = streams.find((s) => s.codec_type === "video");
  if (video === undefined) return undefined;
  const w = positive(video.width);
  const h = positive(video.height);
  if (w === undefined || h === undefined) return undefined;
  const turned = Math.abs(rotation(video)) % 180 === 90;
  const audio = streams.find((s) => s.codec_type === "audio");
  const fps = rate(video.avg_frame_rate) ?? rate(video.r_frame_rate);
  const bytes = positive(p.format?.size);
  return {
    duration: positive(p.format?.duration) ?? positive(video.duration) ?? 0,
    width: turned ? h : w,
    height: turned ? w : h,
    videoCodec: video.codec_name ?? "unknown",
    ...(fps === undefined ? {} : { fps }),
    ...(audio?.codec_name === undefined
      ? {}
      : { audioCodec: audio.codec_name }),
    ...(bytes === undefined ? {} : { bytes }),
  };
}

/** Seconds as `m:ss`, or `h:mm:ss` from an hour. */
export function clock(seconds: number): string {
  const t = Math.max(0, Math.floor(seconds));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = String(t % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/** A byte count as `512 B`, `48 KB`, `1.5 MB`, or `2.1 GB` (powers of 1000). */
export function byteSize(n: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = n;
  let i = 0;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i++;
  }
  const shown = i === 0 || v >= 10 ? Math.round(v) : Math.round(v * 10) / 10;
  return `${shown} ${units[i]}`;
}
