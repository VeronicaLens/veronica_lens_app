import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createAssistedCapturePlan } from './assisted-capture.ts';
import type { CameraCapabilities } from './camera-capabilities.ts';
import { buildCaptureTips, type CaptureTipInput } from './capture-tips.ts';

const manualCamera: CameraCapabilities = {
  device: { id: 'back', name: 'Back Camera' },
  focus: { meteringSupported: true, lockingSupported: true, fallback: 'tap-to-focus' },
  exposure: { meteringSupported: true, lockingSupported: true, fallback: 'exposure-compensation' },
  exposureCompensation: {
    status: 'supported',
    unit: 'ev',
    minimum: -2,
    maximum: 2,
    fallback: 'automatic-exposure',
  },
  iso: {
    status: 'supported',
    unit: 'iso',
    minimum: 50,
    maximum: 3200,
    fallback: 'automatic-exposure',
  },
  exposureTime: {
    status: 'supported',
    unit: 'seconds',
    minimum: 1 / 8000,
    maximum: 1,
    fallback: 'automatic-exposure',
  },
  whiteBalance: { lockingSupported: true, maxGain: 4 },
};

const automaticCamera: CameraCapabilities = {
  ...manualCamera,
  exposure: { meteringSupported: true, lockingSupported: false, fallback: 'exposure-compensation' },
  iso: { ...manualCamera.iso, status: 'unsupported', minimum: null, maximum: null },
  exposureTime: {
    ...manualCamera.exposureTime,
    status: 'unsupported',
    minimum: null,
    maximum: null,
  },
};

function input(overrides: Partial<CaptureTipInput> = {}): CaptureTipInput {
  return {
    profileId: 'deep-sky',
    target: null,
    plan: createAssistedCapturePlan(manualCamera, { iso: 1600, exposureTimeSeconds: 1 / 4 }),
    capabilities: manualCamera,
    zoom: 1,
    zoomRange: { minZoom: 0.5, maxZoom: 8 },
    orientation: { pitchDegrees: 40, rollDegrees: 0, rotationRate: { x: 0, y: 0, z: 0 } },
    ...overrides,
  };
}

describe('buildCaptureTips', () => {
  it('warns that the Moon will be overexposed and offers the recommended values', () => {
    const tips = buildCaptureTips(input({ profileId: 'moon' }));
    const exposure = tips.find(({ topic }) => topic === 'exposure');

    assert.equal(exposure?.id, 'exposure-overexposed');
    assert.equal(exposure?.severity, 'warning');
    assert.deepEqual(exposure?.action?.value, {
      kind: 'exposure',
      iso: 200,
      exposureTimeSeconds: 1 / 125,
    });
  });

  it('suggests the bright-object profile when a planet is selected', () => {
    const tips = buildCaptureTips(input({ target: { name: 'Júpiter', type: 'planet' } }));
    const profile = tips.find(({ topic }) => topic === 'profile');

    assert.match(profile?.title ?? '', /Júpiter/);
    assert.deepEqual(profile?.action?.value, { kind: 'profile', profileId: 'moon' });
  });

  it('confirms ready exposure values when they match the profile', () => {
    const tips = buildCaptureTips(input());

    assert.equal(tips.find(({ topic }) => topic === 'exposure')?.id, 'exposure-ok');
  });

  it('warns about camera movement during long exposures', () => {
    const tips = buildCaptureTips(
      input({
        orientation: { pitchDegrees: 40, rollDegrees: 0, rotationRate: { x: 0.4, y: 0, z: 0 } },
      }),
    );

    assert.equal(tips[0]?.id, 'stability-moving');
  });

  it('uses exposure compensation advice when manual ISO and shutter are unavailable', () => {
    const tips = buildCaptureTips(
      input({
        capabilities: automaticCamera,
        plan: createAssistedCapturePlan(automaticCamera, {}),
      }),
    );
    const exposure = tips.find(({ topic }) => topic === 'exposure');

    assert.equal(exposure?.id, 'exposure-automatic');
  });

  it('recommends compensation for the Moon on automatic cameras', () => {
    const tips = buildCaptureTips(
      input({
        profileId: 'moon',
        capabilities: automaticCamera,
        plan: createAssistedCapturePlan(automaticCamera, { exposureCompensationEv: 1 }),
      }),
    );

    assert.deepEqual(tips.find(({ topic }) => topic === 'exposure')?.action?.value, {
      kind: 'exposure-compensation',
      value: -1.5,
    });
  });

  it('suggests zooming in for the Moon and back out for wide-field shots', () => {
    const moon = buildCaptureTips(input({ profileId: 'moon' }));
    const deepSky = buildCaptureTips(input({ zoom: 3 }));

    assert.deepEqual(moon.find(({ topic }) => topic === 'zoom')?.action?.value, {
      kind: 'zoom',
      zoom: 3,
    });
    assert.deepEqual(deepSky.find(({ topic }) => topic === 'zoom')?.action?.value, {
      kind: 'zoom',
      zoom: 1,
    });
  });

  it('orders warnings before suggestions and informational tips', () => {
    const tips = buildCaptureTips(
      input({
        profileId: 'moon',
        target: { name: 'Sirius', type: 'star' },
        orientation: { pitchDegrees: -10, rollDegrees: 0, rotationRate: null },
      }),
    );
    const order = { warning: 0, suggestion: 1, info: 2 };

    assert.equal(tips[0]?.id, 'framing-sky');
    assert.ok(
      tips.every(
        (tip, index) => index === 0 || order[tips[index - 1]!.severity] <= order[tip.severity],
      ),
    );
  });

  it('flags a tilted horizon for landscape photos', () => {
    const tips = buildCaptureTips(
      input({
        profileId: 'landscape',
        orientation: { pitchDegrees: 10, rollDegrees: 8, rotationRate: null },
      }),
    );

    assert.deepEqual(tips.find(({ topic }) => topic === 'level')?.action?.value, { kind: 'level' });
  });
});
