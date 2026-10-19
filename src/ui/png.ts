import { deflateSync } from "node:zlib";

const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

/** Whether `bytes` start like a PNG file. */
export const isPng = (bytes: Uint8Array): boolean =>
  SIGNATURE.every((b, i) => bytes[i] === b);

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  out.set(data, 8);
  out.writeUInt32BE(
    Bun.hash.crc32(out.subarray(4, 8 + data.length)),
    8 + data.length,
  );
  return out;
}

/**
 * RGBA rows `stride` bytes apart as a PNG file, in a buffer of its own, so
 * moving it to another thread detaches nothing else.
 */
export function encodePng(
  rgba: Uint8Array,
  width: number,
  height: number,
  stride = width * 4,
): Uint8Array {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 6, 0, 0, 0], 8);
  const row = width * 4;
  const rows = Buffer.alloc(height * (1 + row));
  for (let y = 0; y < height; y++)
    rows.set(rgba.subarray(y * stride, y * stride + row), y * (1 + row) + 1);
  return new Uint8Array(
    Buffer.concat([
      Buffer.from(SIGNATURE),
      chunk("IHDR", header),
      // Level 3 is within a tenth of the default's size at two thirds of its time.
      chunk("IDAT", deflateSync(rows, { level: 3 })),
      chunk("IEND", new Uint8Array()),
    ]),
  );
}
