/**
 * A picture's size as the decoder will report it, read from the file's
 * header without decoding: PNG, JPEG (turned by its EXIF orientation), GIF,
 * and WebP. Undefined when the header is not one of those or looks wrong,
 * so the caller decodes instead.
 */
export function pictureSize(
  b: Uint8Array,
): { width: number; height: number } | undefined {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const size = (width: number, height: number) =>
    width > 0 && height > 0 ? { width, height } : undefined;
  if (
    b.length >= 24 &&
    v.getUint32(0) === 0x89504e47 &&
    ascii(b, 12, 4) === "IHDR"
  )
    return size(v.getUint32(16), v.getUint32(20));
  if (b.length >= 10 && ascii(b, 0, 4) === "GIF8")
    return size(v.getUint16(6, true), v.getUint16(8, true));
  if (b.length >= 30 && ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP")
    return webpSize(b, v, size);
  if (b.length >= 4 && v.getUint16(0) === 0xffd8) return jpegSize(b, v, size);
  return undefined;
}

type Size = (
  w: number,
  h: number,
) => { width: number; height: number } | undefined;

function webpSize(b: Uint8Array, v: DataView, size: Size) {
  switch (ascii(b, 12, 4)) {
    case "VP8 ":
      if (b[23] !== 0x9d || b[24] !== 0x01 || b[25] !== 0x2a) return undefined;
      return size(
        v.getUint16(26, true) & 0x3fff,
        v.getUint16(28, true) & 0x3fff,
      );
    case "VP8L": {
      if (b[20] !== 0x2f) return undefined;
      const bits = v.getUint32(21, true);
      return size((bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1);
    }
    case "VP8X":
      // An EXIF block may turn the picture; leave those to the decoder.
      if ((b[20] ?? 0) & 0x08) return undefined;
      return size(u24(b, 24) + 1, u24(b, 27) + 1);
    default:
      return undefined;
  }
}

function jpegSize(b: Uint8Array, v: DataView, size: Size) {
  let turned = false;
  let at = 2;
  while (at + 4 <= b.length) {
    if (b[at] !== 0xff) return undefined;
    const marker = b[at + 1] ?? 0;
    if (marker === 0xff) {
      at++;
      continue;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      at += 2;
      continue;
    }
    const length = v.getUint16(at + 2);
    const data = at + 4;
    if (length < 2 || data + length - 2 > b.length) return undefined;
    if (marker === 0xe1 && ascii(b, data, 6) === "Exif\0\0") {
      const o = exifOrientation(v, data + 6, data + length - 2);
      turned = o !== undefined && o >= 5 && o <= 8;
    }
    const isFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    if (isFrame) {
      if (length < 7) return undefined;
      const height = v.getUint16(data + 1);
      const width = v.getUint16(data + 3);
      return turned ? size(height, width) : size(width, height);
    }
    at = data + length - 2;
  }
  return undefined;
}

/** The orientation tag of the TIFF block at `start`, if it has one. */
function exifOrientation(
  v: DataView,
  start: number,
  end: number,
): number | undefined {
  if (start + 8 > end) return undefined;
  const order = v.getUint16(start);
  if (order !== 0x4949 && order !== 0x4d4d) return undefined;
  const le = order === 0x4949;
  const ifd = start + v.getUint32(start + 4, le);
  if (ifd + 2 > end) return undefined;
  const count = v.getUint16(ifd, le);
  for (let i = 0; i < count; i++) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > end) return undefined;
    if (v.getUint16(entry, le) === 0x0112) return v.getUint16(entry + 8, le);
  }
  return undefined;
}

function ascii(b: Uint8Array, at: number, n: number): string {
  return String.fromCharCode(...b.subarray(at, at + n));
}

function u24(b: Uint8Array, at: number): number {
  return (b[at] ?? 0) | ((b[at + 1] ?? 0) << 8) | ((b[at + 2] ?? 0) << 16);
}
