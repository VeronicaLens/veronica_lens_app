import assert from 'node:assert/strict';
import test from 'node:test';

import type { ObservationRecommendationResponse } from '../../../shared/api/index.ts';
import { getObservationRecommendation } from './observation-planning-api.ts';

test('requests an authenticated observation recommendation', async () => {
  const input = {
    objectId: 'sirius',
    windowFrom: '2026-10-12T22:00:00.000Z',
    windowTo: '2026-10-13T22:00:00.000Z',
    observer: {
      latitudeDegrees: -23.5505,
      longitudeDegrees: -46.6333,
      elevationMeters: 760,
    },
    minimumAltitudeDegrees: 30,
  };
  const response: ObservationRecommendationResponse = {
    data: {
      objectId: 'sirius',
      objectName: 'Sirius',
      status: 'recommended',
      recommendedWindow: {
        from: '2026-10-13T00:00:00.000Z',
        to: '2026-10-13T02:00:00.000Z',
        consideredAt: '2026-10-13T00:00:00.000Z',
      },
      factors: [],
      summary: 'Janela favorável encontrada.',
      meta: { evaluatedSamples: 13, sampleIntervalMinutes: 120, weatherAvailable: true },
    },
  };
  let capturedPath = '';
  let capturedInit: RequestInit | undefined;
  const request = <T>(path: string, init?: RequestInit) => {
    capturedPath = path;
    capturedInit = init;
    return Promise.resolve(response as T);
  };

  const result = await getObservationRecommendation('access-token', input, request);

  assert.deepEqual(result, response.data);
  assert.equal(capturedPath, '/planning/observation-window');
  assert.equal(capturedInit?.method, 'POST');
  assert.equal(
    (capturedInit?.headers as Record<string, string>).Authorization,
    'Bearer access-token',
  );
  assert.deepEqual(JSON.parse(capturedInit?.body as string), input);
});
