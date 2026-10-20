/**
 * Reads the EXIF orientation (1–8) from the beginning of a JPEG file. Cameras often store
 * rotation as metadata instead of rotating pixels, and some decoders ignore it.
 */
export function readJpegOrientation(bytes: Uint8Array): number {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return 1;

  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) return 1;
    const marker = bytes[offset + 1] ?? 0;
    if (marker === 0xda || marker === 0xd9) return 1;
    const segmentLength = ((bytes[offset + 2] ?? 0) << 8) | (bytes[offset + 3] ?? 0);
    if (segmentLength < 2) return 1;

    if (marker === 0xe1 && isExifHeader(bytes, offset + 4)) {
      return readTiffOrientation(bytes, offset + 10);
    }
    offset += 2 + segmentLength;
  }
  return 1;
}

/** Clockwise rotation needed to display an image stored with the given EXIF orientation. */
export function orientationToClockwiseDegrees(orientation: number): number {
  switch (orientation) {
    case 3:
    case 4:
      return 180;
    case 5:
    case 6:
      return 90;
    case 7:
    case 8:
      return 270;
    default:
      return 0;
  }
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function isExifHeader(bytes: Uint8Array, start: number): boolean {
  return [0x45, 0x78, 0x69, 0x66, 0x00, 0x00].every(
    (value, index) => bytes[start + index] === value,
  );
}

function readTiffOrientation(bytes: Uint8Array, tiffStart: number): number {
  const littleEndian = bytes[tiffStart] === 0x49 && bytes[tiffStart + 1] === 0x49;
  const bigEndian = bytes[tiffStart] === 0x4d && bytes[tiffStart + 1] === 0x4d;
  if (!littleEndian && !bigEndian) return 1;

  const uint16 = (position: number) => {
    const first = bytes[position] ?? 0;
    const second = bytes[position + 1] ?? 0;
    return littleEndian ? first | (second << 8) : (first << 8) | second;
  };
  const uint32 = (position: number) =>
    littleEndian
      ? (uint16(position) | (uint16(position + 2) << 16)) >>> 0
      : ((uint16(position) << 16) | uint16(position + 2)) >>> 0;

  const directory = tiffStart + uint32(tiffStart + 4);
  if (directory + 2 > bytes.length) return 1;
  const entryCount = uint16(directory);
  for (let index = 0; index < entryCount; index += 1) {
    const entry = directory + 2 + index * 12;
    if (entry + 12 > bytes.length) return 1;
    if (uint16(entry) === 0x0112) {
      const orientation = uint16(entry + 8);
      return orientation >= 1 && orientation <= 8 ? orientation : 1;
    }
  }
  return 1;
}
