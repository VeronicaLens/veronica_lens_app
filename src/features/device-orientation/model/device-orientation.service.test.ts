import assert from 'node:assert/strict';
import test from 'node:test';

import { DeviceOrientationService } from './device-orientation.service.ts';
import type {
  DeviceOrientationSource,
  DeviceOrientationState,
  OrientationSample,
  SensorAvailability,
} from './orientation.types.ts';

const allSensors: SensorAvailability = {
  deviceMotion: true,
  accelerometer: true,
  gyroscope: true,
  magnetometer: true,
};

class FakeOrientationSource implements DeviceOrientationSource {
  interval: number | null = null;
  subscribed = false;
  removed = false;
  sampleListener: ((sample: OrientationSample) => void) | null = null;
  private readonly permission: boolean;
  private readonly availability: SensorAvailability;

  constructor(permission = true, availability: SensorAvailability = allSensors) {
    this.permission = permission;
    this.availability = availability;
  }

  requestPermission(): Promise<boolean> {
    return Promise.resolve(this.permission);
  }

  getAvailability(): Promise<SensorAvailability> {
    return Promise.resolve(this.availability);
  }

  setUpdateInterval(intervalMs: number): void {
    this.interval = intervalMs;
  }

  subscribe(
    _availability: SensorAvailability,
    listener: (sample: OrientationSample) => void,
  ): () => void {
    this.subscribed = true;
    this.sampleListener = listener;
    return () => {
      this.removed = true;
    };
  }
}

test('starts all available sensors at the overlay-friendly interval', async () => {
  const source = new FakeOrientationSource();
  const states: DeviceOrientationState[] = [];
  const stop = await new DeviceOrientationService(source).start((state) => states.push(state));

  assert.equal(source.interval, 50);
  assert.equal(source.subscribed, true);
  assert.equal(states.at(-1)?.status, 'listening');
  assert.equal(states.at(-1)?.quality, 'full');

  source.sampleListener?.({
    alphaRadians: Math.PI,
    betaRadians: 0,
    gammaRadians: 0,
    timestamp: 10,
    acceleration: null,
    rotationRate: null,
    magneticField: null,
  });
  assert.equal(states.at(-1)?.status, 'active');
  assert.equal(states.at(-1)?.orientation?.headingDegrees, 180);

  stop();
  assert.equal(source.removed, true);
});

test('returns a clear fallback when permission is denied', async () => {
  const states: DeviceOrientationState[] = [];
  const source = new FakeOrientationSource(false);

  await new DeviceOrientationService(source).start((state) => states.push(state));

  assert.equal(states.at(-1)?.status, 'permission-denied');
  assert.match(states.at(-1)?.fallbackMessage ?? '', /configurações/);
  assert.equal(source.subscribed, false);
});

test('returns manual-mode fallback when fused orientation is unavailable', async () => {
  const states: DeviceOrientationState[] = [];
  const source = new FakeOrientationSource(true, {
    ...allSensors,
    deviceMotion: false,
  });

  await new DeviceOrientationService(source).start((state) => states.push(state));

  assert.equal(states.at(-1)?.status, 'unavailable');
  assert.match(states.at(-1)?.fallbackMessage ?? '', /modo manual/);
  assert.equal(source.subscribed, false);
});

test('keeps orientation active in degraded mode when a raw sensor is absent', async () => {
  const states: DeviceOrientationState[] = [];
  const source = new FakeOrientationSource(true, {
    ...allSensors,
    magnetometer: false,
  });

  await new DeviceOrientationService(source).start((state) => states.push(state));

  assert.equal(states.at(-1)?.status, 'listening');
  assert.equal(states.at(-1)?.quality, 'degraded');
  assert.match(states.at(-1)?.fallbackMessage ?? '', /precisão reduzida/);
});
