import assert from 'node:assert/strict';
import test from 'node:test';

import { detectCameraCapabilities, type CameraCapabilityDevice } from './camera-capabilities.ts';

const fullyCapableDevice: CameraCapabilityDevice = {
  id: 'back-wide',
  localizedName: 'Back Wide Camera',
  supportsFocusMetering: true,
  supportsFocusLocking: true,
  supportsExposureMetering: true,
  supportsExposureLocking: true,
  supportsExposureBias: true,
  minExposureBias: -3,
  maxExposureBias: 3,
};

test('reports focus, exposure compensation, ISO and exposure-time ranges', () => {
  const capabilities = detectCameraCapabilities(fullyCapableDevice, {
    minISO: 32,
    maxISO: 3200,
    minExposureDuration: 1 / 10_000,
    maxExposureDuration: 1,
  });

  assert.deepEqual(capabilities.device, { id: 'back-wide', name: 'Back Wide Camera' });
  assert.deepEqual(capabilities.focus, {
    meteringSupported: true,
    lockingSupported: true,
    fallback: 'tap-to-focus',
  });
  assert.equal(capabilities.exposure.lockingSupported, true);
  assert.deepEqual(capabilities.exposureCompensation, {
    status: 'supported',
    unit: 'ev',
    minimum: -3,
    maximum: 3,
    fallback: 'automatic-exposure',
  });
  assert.deepEqual(capabilities.iso, {
    status: 'supported',
    unit: 'iso',
    minimum: 32,
    maximum: 3200,
    fallback: 'automatic-exposure',
  });
  assert.equal(capabilities.exposureTime.status, 'supported');
  assert.equal(capabilities.exposureTime.minimum, 1 / 10_000);
  assert.equal(capabilities.exposureTime.maximum, 1);
});

test('keeps controller-backed ranges pending until the preview is ready', () => {
  const capabilities = detectCameraCapabilities(fullyCapableDevice);

  assert.equal(capabilities.iso.status, 'pending');
  assert.equal(capabilities.exposureTime.status, 'pending');
  assert.equal(capabilities.iso.minimum, null);
});

test('defines safe automatic fallbacks when manual controls are absent', () => {
  const capabilities = detectCameraCapabilities({
    ...fullyCapableDevice,
    supportsFocusLocking: false,
    supportsExposureLocking: false,
    supportsExposureBias: true,
  });

  assert.equal(capabilities.focus.fallback, 'tap-to-focus');
  assert.equal(capabilities.exposure.fallback, 'exposure-compensation');
  assert.equal(capabilities.iso.status, 'unsupported');
  assert.equal(capabilities.iso.fallback, 'automatic-exposure');
  assert.equal(capabilities.exposureTime.status, 'unsupported');
});

test('falls back to system defaults when the device exposes no camera controls', () => {
  const capabilities = detectCameraCapabilities({
    ...fullyCapableDevice,
    supportsFocusMetering: false,
    supportsFocusLocking: false,
    supportsExposureMetering: false,
    supportsExposureLocking: false,
    supportsExposureBias: false,
    minExposureBias: 0,
    maxExposureBias: 0,
  });

  assert.equal(capabilities.focus.fallback, 'system-default');
  assert.equal(capabilities.exposure.fallback, 'system-default');
  assert.equal(capabilities.exposureCompensation.status, 'unsupported');
});

test('rejects invalid native ranges instead of exposing unsafe controls', () => {
  const capabilities = detectCameraCapabilities(fullyCapableDevice, {
    minISO: 3200,
    maxISO: 32,
    minExposureDuration: Number.NaN,
    maxExposureDuration: 1,
  });

  assert.equal(capabilities.iso.status, 'unsupported');
  assert.equal(capabilities.exposureTime.status, 'unsupported');
});
