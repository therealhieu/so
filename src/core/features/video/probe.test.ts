import { expect, test } from "bun:test";
import { byteSize, clock, parseProbe } from "./probe";

const probe = (streams: unknown[], format: unknown = {}) =>
  JSON.stringify({ streams, format });

test("the first video stream gives the size, codec, and frame rate; the format the length and bytes", () => {
  expect(
    parseProbe(
      probe(
        [
          { codec_type: "audio", codec_name: "aac" },
          {
            codec_type: "video",
            codec_name: "h264",
            width: 1920,
            height: 1080,
            avg_frame_rate: "30000/1001",
          },
        ],
        { duration: "92.5", size: "48000000" },
      ),
    ),
  ).toEqual({
    duration: 92.5,
    width: 1920,
    height: 1080,
    videoCodec: "h264",
    fps: 29.97,
    audioCodec: "aac",
    bytes: 48_000_000,
  });
});

test("a turned video swaps its sides; missing facts are left out", () => {
  expect(
    parseProbe(
      probe([
        {
          codec_type: "video",
          codec_name: "hevc",
          width: 1920,
          height: 1080,
          avg_frame_rate: "0/0",
          r_frame_rate: "25/1",
          duration: "3",
          side_data_list: [{ rotation: -90 }],
        },
      ]),
    ),
  ).toEqual({
    duration: 3,
    width: 1080,
    height: 1920,
    videoCodec: "hevc",
    fps: 25,
  });
  expect(
    parseProbe(
      probe([
        {
          codec_type: "video",
          width: 4,
          height: 2,
          tags: { rotate: "270" },
        },
      ]),
    ),
  ).toMatchObject({ width: 2, height: 4, duration: 0, videoCodec: "unknown" });
});

test("no video stream, no size, or not JSON gives nothing", () => {
  expect(parseProbe(probe([{ codec_type: "audio" }]))).toBeUndefined();
  expect(parseProbe(probe([{ codec_type: "video" }]))).toBeUndefined();
  expect(parseProbe("not json")).toBeUndefined();
});

test("times read as m:ss or h:mm:ss, and sizes in powers of 1000", () => {
  expect([clock(0), clock(9.9), clock(92), clock(3725)]).toEqual([
    "0:00",
    "0:09",
    "1:32",
    "1:02:05",
  ]);
  expect([byteSize(512), byteSize(48_000), byteSize(1_500_000)]).toEqual([
    "512 B",
    "48 KB",
    "1.5 MB",
  ]);
});
