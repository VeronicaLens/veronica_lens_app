import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CameraCaptureFailure,
  cameraFailureMessage,
  classifyCameraFailure,
} from './camera-capture.ts';

test('classifies the main native camera failure categories', () => {
  assert.equal(classifyCameraFailure(new Error('Camera permission denied')), 'permission-denied');
  assert.equal(
    classifyCameraFailure(new Error('No camera device available')),
    'device-unavailable',
  );
  assert.equal(
    classifyCameraFailure(new Error('Camera device is in use by another app')),
    'camera-in-use',
  );
  assert.equal(classifyCameraFailure(new Error('Session is not ready')), 'not-ready');
  assert.equal(classifyCameraFailure(new Error('Unexpected native failure')), 'capture-failed');
});

test('preserves typed failures and returns a safe user-facing message', () => {
  const failure = new CameraCaptureFailure('device-unavailable');

  assert.equal(classifyCameraFailure(failure), 'device-unavailable');
  assert.equal(
    cameraFailureMessage(failure),
    'Nenhuma câmera traseira está disponível neste aparelho.',
  );
});
