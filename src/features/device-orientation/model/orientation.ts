import type { DeviceOrientation, OrientationSample } from './orientation.types.ts';

const radiansToDegrees = (value: number) => (value * 180) / Math.PI;

export function normalizeHeading(value: number): number {
  assertFinite(value);
  return ((value % 360) + 360) % 360;
}

export function normalizeSignedAngle(value: number): number {
  const normalized = normalizeHeading(value);
  return normalized > 180 ? normalized - 360 : normalized;
}

export function toDeviceOrientation(sample: OrientationSample): DeviceOrientation {
  return {
    headingDegrees: normalizeHeading(radiansToDegrees(sample.alphaRadians)),
    pitchDegrees: normalizeSignedAngle(radiansToDegrees(sample.betaRadians)),
    rollDegrees: normalizeSignedAngle(radiansToDegrees(sample.gammaRadians)),
    timestamp: sample.timestamp,
    acceleration: sample.acceleration,
    rotationRate: sample.rotationRate,
    magneticField: sample.magneticField,
  };
}

function assertFinite(value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError('orientation angle must be finite');
  }
}
