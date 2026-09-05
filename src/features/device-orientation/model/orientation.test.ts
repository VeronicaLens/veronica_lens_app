import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeHeading, normalizeSignedAngle, toDeviceOrientation } from './orientation.ts';

test('normalizes heading to the 0-360 interval', () => {
  assert.equal(normalizeHeading(-90), 270);
  assert.equal(normalizeHeading(725), 5);
});

test('normalizes pitch and roll to the signed interval', () => {
  assert.equal(normalizeSignedAngle(270), -90);
  assert.equal(normalizeSignedAngle(-270), 90);
});

test('maps Expo rotation radians to normalized degrees and preserves raw samples', () => {
  const acceleration = { x: 1, y: 2, z: 3 };
  const magneticField = { x: 20, y: -3, z: 42 };
  const result = toDeviceOrientation({
    alphaRadians: -Math.PI / 2,
    betaRadians: Math.PI / 4,
    gammaRadians: -Math.PI / 6,
    timestamp: 123,
    acceleration,
    rotationRate: null,
    magneticField,
  });

  assert.equal(result.headingDegrees, 270);
  assert.equal(result.pitchDegrees, 45);
  assert.equal(result.rollDegrees, -30);
  assert.equal(result.acceleration, acceleration);
  assert.equal(result.magneticField, magneticField);
});

test('rejects non-finite orientation values', () => {
  assert.throws(() => normalizeHeading(Number.NaN), RangeError);
});
