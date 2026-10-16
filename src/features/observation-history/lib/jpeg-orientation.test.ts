import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  base64ToBytes,
  orientationToClockwiseDegrees,
  readJpegOrientation,
} from './jpeg-orientation.ts';

function jpegWithOrientation(orientation: number, littleEndian: boolean): Uint8Array {
  const u16 = (value: number) =>
    littleEndian ? [value & 0xff, value >> 8] : [value >> 8, value & 0xff];
  const u32 = (value: number) =>
    littleEndian
      ? [value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, value >>> 24]
      : [value >>> 24, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
  const tiff = [
    ...(littleEndian ? [0x49, 0x49] : [0x4d, 0x4d]),
    ...u16(42),
    ...u32(8),
    ...u16(2),
    ...u16(0x010f),
    ...u16(2),
    ...u32(4),
    ...u32(0),
    ...u16(0x0112),
    ...u16(3),
    ...u32(1),
    ...u16(orientation),
    0,
    0,
    ...u32(0),
  ];
  const exif = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff];
  const app1Length = exif.length + 2;
  const app0 = [0xff, 0xe0, 0x00, 0x04, 0x00, 0x00];
  return Uint8Array.from([
    0xff,
    0xd8,
    ...app0,
    0xff,
    0xe1,
    app1Length >> 8,
    app1Length & 0xff,
    ...exif,
    0xff,
    0xda,
  ]);
}

describe('readJpegOrientation', () => {
  it('reads orientation from little- and big-endian EXIF blocks after other segments', () => {
    assert.equal(readJpegOrientation(jpegWithOrientation(6, true)), 6);
    assert.equal(readJpegOrientation(jpegWithOrientation(8, false)), 8);
    assert.equal(readJpegOrientation(jpegWithOrientation(3, true)), 3);
  });

  it('defaults to upright for non-JPEG data, missing EXIF or truncated files', () => {
    assert.equal(readJpegOrientation(Uint8Array.from([0x89, 0x50, 0x4e, 0x47])), 1);
    assert.equal(readJpegOrientation(Uint8Array.from([0xff, 0xd8, 0xff, 0xda])), 1);
    assert.equal(readJpegOrientation(jpegWithOrientation(6, true).slice(0, 30)), 1);
  });
});

describe('orientationToClockwiseDegrees', () => {
  it('maps EXIF orientations to display rotations', () => {
    assert.deepEqual([1, 3, 6, 8].map(orientationToClockwiseDegrees), [0, 180, 90, 270]);
  });
});

describe('base64ToBytes', () => {
  it('decodes base64 into raw bytes', () => {
    assert.deepEqual([...base64ToBytes('/9j/4Q==')], [0xff, 0xd8, 0xff, 0xe1]);
  });
});
