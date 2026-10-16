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
    whiteBalance: { lockingSupported: false, maxGain: 0 },
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
  assert.match(plan.recommendations[1]?.title ?? '', /nível \+0\.5/);
});

test('uses a discrete supported exposure-compensation level by default', async () => {
  const plan = createAssistedCapturePlan(
    capabilities({
      exposureCompensation: {
        status: 'supported',
        unit: 'ev',
        minimum: -2,
        maximum: 2,
        fallback: 'automatic-exposure',
      },
    }),
  );
  let appliedBias: number | null = null;

  const applied = await applyAssistedCapturePlan(
    plan,
    controller({
      setExposureBias: async (value) => {
        appliedBias = value;
      },
    }),
  );

  assert.equal(plan.exposureCompensationEv, 1);
  assert.equal(appliedBias, 1);
  assert.equal(applied.exposureCompensationEv, 1);
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

test('uses user-selected values and clamps them to the active camera ranges', () => {
  const plan = createAssistedCapturePlan(
    capabilities({
      exposure: {
        meteringSupported: true,
        lockingSupported: true,
        fallback: 'exposure-compensation',
      },
      exposureCompensation: {
        status: 'supported',
        unit: 'ev',
        minimum: -2,
        maximum: 1,
        fallback: 'automatic-exposure',
      },
      iso: {
        status: 'supported',
        unit: 'iso',
        minimum: 100,
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
    { exposureCompensationEv: -1.2, iso: 6400, exposureTimeSeconds: 2 },
  );

  assert.equal(plan.exposureCompensationEv, -1.2);
  assert.equal(plan.iso, 1600);
  assert.equal(plan.exposureTimeSeconds, 1);
  assert.match(plan.recommendations[1]?.title ?? '', /ISO 1600/);
});

test('applies selected manual exposure values to the camera controller', async () => {
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
    { iso: 400, exposureTimeSeconds: 1 / 4 },
  );
  let appliedExposure: [number, number] | null = null;

  const applied = await applyAssistedCapturePlan(
    plan,
    controller({
      setManualExposure: async (exposureTimeSeconds, iso) => {
        appliedExposure = [exposureTimeSeconds, iso];
      },
    }),
  );

  assert.deepEqual(appliedExposure, [1 / 4, 400]);
  assert.equal(applied.iso, 400);
  assert.equal(applied.exposureTimeSeconds, 1 / 4);
  assert.deepEqual(applied.fallbacks, []);
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
  assert.match(describeAppliedCapture(metadata.parameters), /nível \+0\.5/);
});

test('locks manual focus and white balance when the camera supports them', async () => {
  const manualCamera = capabilities({
    focus: { meteringSupported: true, lockingSupported: true, fallback: 'tap-to-focus' },
    whiteBalance: { lockingSupported: true, maxGain: 4 },
  });
  const plan = createAssistedCapturePlan(manualCamera, {
    focusLensPosition: 1.4,
    whiteBalanceKelvin: 9_000,
  });
  const calls: string[] = [];

  const applied = await applyAssistedCapturePlan(
    plan,
    controller({
      meterCenter: async (modes) => {
        calls.push(`meter:${modes.join(',')}`);
      },
      setFocusLensPosition: async (position) => {
        calls.push(`focus:${position}`);
      },
      setWhiteBalanceTemperature: async (kelvin) => {
        calls.push(`wb:${kelvin}`);
      },
    }),
  );

  assert.equal(plan.focusMode, 'manual');
  assert.ok(!plan.meteringModes.includes('AF'));
  assert.deepEqual(calls, ['meter:AE', 'focus:1', 'wb:7500']);
  assert.equal(applied.focusLensPosition, 1);
  assert.equal(applied.whiteBalanceKelvin, 7_500);
  assert.deepEqual(applied.fallbacks, []);
});

test('keeps focus and white balance automatic on cameras without manual locks', async () => {
  const plan = createAssistedCapturePlan(capabilities(), {
    focusLensPosition: 1,
    whiteBalanceKelvin: 4_000,
  });

  const applied = await applyAssistedCapturePlan(plan, controller());

  assert.equal(plan.focusLensPosition, null);
  assert.equal(plan.whiteBalanceKelvin, null);
  assert.equal(applied.focusLensPosition, 'automatic');
  assert.equal(applied.whiteBalanceKelvin, 'automatic');
});

test('falls back to automatic focus when locking the lens fails', async () => {
  const plan = createAssistedCapturePlan(
    capabilities({
      focus: { meteringSupported: true, lockingSupported: true, fallback: 'tap-to-focus' },
    }),
    { focusLensPosition: 1 },
  );

  const applied = await applyAssistedCapturePlan(
    plan,
    controller({ setFocusLensPosition: () => Promise.reject(new Error('busy')) }),
  );

  assert.equal(applied.focusMode, 'automatic');
  assert.equal(applied.focusLensPosition, 'automatic');
  assert.deepEqual(applied.fallbacks, ['manual-focus']);
});
