import assert from 'node:assert/strict';
import test from 'node:test';

import type { CameraCapabilities } from './camera-capabilities.ts';
import {
  applyAssistedCapturePlan,
  createAssistedCapturePlan,
  createAstroPhotoMetadata,
  describeAppliedCapture,
  type AssistedCaptureController,
} from './assisted-capture.ts';

function capabilities(overrides: Partial<CameraCapabilities> = {}): CameraCapabilities {
  return {
    device: { id: 'back-wide', name: 'Back Wide Camera' },
    focus: { meteringSupported: true, lockingSupported: false, fallback: 'tap-to-focus' },
    exposure: {
      meteringSupported: true,
      lockingSupported: false,
      fallback: 'exposure-compensation',
    },
    exposureCompensation: {
      status: 'supported',
      unit: 'ev',
      minimum: -2,
      maximum: 0.5,
      fallback: 'automatic-exposure',
    },
    iso: {
      status: 'unsupported',
      unit: 'iso',
      minimum: null,
      maximum: null,
      fallback: 'automatic-exposure',
    },
    exposureTime: {
      status: 'unsupported',
      unit: 'seconds',
      minimum: null,
      maximum: null,
      fallback: 'automatic-exposure',
    },
    ...overrides,
  };
}

function controller(overrides: Partial<AssistedCaptureController> = {}): AssistedCaptureController {
  return {
    meterCenter: async () => undefined,
    setExposureBias: async () => undefined,
    setManualExposure: async () => undefined,
    ...overrides,
  };
}

test('recommends only parameters supported by the active Android camera', () => {
  const plan = createAssistedCapturePlan(capabilities());

  assert.deepEqual(plan.meteringModes, ['AF', 'AE']);
  assert.equal(plan.focusMode, 'center-metering');
  assert.equal(plan.exposureMode, 'automatic-metering');
  assert.equal(plan.exposureCompensationEv, 0.5);
  assert.equal(plan.iso, null);
  assert.equal(plan.exposureTimeSeconds, null);
  assert.match(plan.recommendations[1]?.title ?? '', /\+0\.5 EV/);
});

test('clamps assisted manual values to hardware ranges', () => {
  const plan = createAssistedCapturePlan(
    capabilities({
      exposure: {
        meteringSupported: true,
        lockingSupported: true,
        fallback: 'exposure-compensation',
      },
      iso: {
        status: 'supported',
        unit: 'iso',
        minimum: 100,
        maximum: 400,
        fallback: 'automatic-exposure',
      },
      exposureTime: {
        status: 'supported',
        unit: 'seconds',
        minimum: 1 / 1000,
        maximum: 1 / 15,
        fallback: 'automatic-exposure',
      },
    }),
  );

  assert.equal(plan.exposureMode, 'manual');
  assert.equal(plan.iso, 400);
  assert.equal(plan.exposureTimeSeconds, 1 / 15);
});

test('does not apply manual controls when a reported range is incomplete', () => {
  const plan = createAssistedCapturePlan(
    capabilities({
      exposure: {
        meteringSupported: true,
        lockingSupported: true,
        fallback: 'exposure-compensation',
      },
      iso: {
        status: 'supported',
        unit: 'iso',
        minimum: null,
        maximum: 1600,
        fallback: 'automatic-exposure',
      },
      exposureTime: {
        status: 'supported',
        unit: 'seconds',
        minimum: 1 / 1000,
        maximum: 1,
        fallback: 'automatic-exposure',
      },
    }),
  );

  assert.equal(plan.exposureMode, 'automatic-metering');
  assert.equal(plan.iso, null);
  assert.equal(plan.exposureTimeSeconds, null);
});

test('applies center metering and supported exposure compensation', async () => {
  const operations: string[] = [];
  const plan = createAssistedCapturePlan(capabilities());
  const applied = await applyAssistedCapturePlan(
    plan,
    controller({
      meterCenter: async (modes) => {
        operations.push(`meter:${modes.join(',')}`);
      },
      setExposureBias: async (value) => {
        operations.push(`ev:${value}`);
      },
    }),
  );

  assert.deepEqual(operations, ['meter:AF,AE', 'ev:0.5']);
  assert.equal(applied.focusMode, 'center-metering');
  assert.equal(applied.exposureCompensationEv, 0.5);
  assert.deepEqual(applied.fallbacks, []);
});

test('continues in automatic mode when a reported native control fails', async () => {
  const plan = createAssistedCapturePlan(capabilities());
  const applied = await applyAssistedCapturePlan(
    plan,
    controller({
      meterCenter: async () => Promise.reject(new Error('native metering failed')),
      setExposureBias: async () => Promise.reject(new Error('native EV failed')),
    }),
  );

  assert.equal(applied.focusMode, 'automatic');
  assert.equal(applied.exposureMode, 'automatic');
  assert.equal(applied.exposureCompensationEv, 0);
  assert.deepEqual(applied.fallbacks, ['focus-metering', 'exposure-compensation']);
});

test('records capture time, device and parameters in photo metadata', () => {
  const metadata = createAstroPhotoMetadata(
    capabilities(),
    {
      focusMode: 'center-metering',
      exposureMode: 'automatic-metering',
      exposureCompensationEv: 0.5,
      iso: 'automatic',
      exposureTimeSeconds: 'automatic',
      fallbacks: [],
    },
    new Date('2026-09-27T23:15:00.000Z'),
  );

  assert.equal(metadata.capturedAt, '2026-09-27T23:15:00.000Z');
  assert.equal(metadata.device.id, 'back-wide');
  assert.equal(metadata.parameters.iso, 'automatic');
  assert.match(describeAppliedCapture(metadata.parameters), /\+0\.5 EV/);
});
