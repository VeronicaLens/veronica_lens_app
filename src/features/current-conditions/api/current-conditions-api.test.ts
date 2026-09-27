import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { CurrentConditionsResponse } from '../../../shared/api/index.ts';
import { getCurrentConditions } from './current-conditions-api.ts';

describe('getCurrentConditions', () => {
  it('requests current conditions for the observer through the authenticated backend', async () => {
    let path = '';
    let init: RequestInit | undefined;
    const response: CurrentConditionsResponse = {
      data: {
        observedAt: '2026-10-04T00:00:00.000Z',
        temperatureCelsius: 18,
        cloudCoverPercent: 10,
        precipitationProbabilityPercent: 5,
        visibilityMeters: 12_000,
        rating: 'good',
        skyLabel: 'Céu limpo',
        visibilityLabel: 'Ótima visibilidade',
      },
    };
    const request = <T>(receivedPath: string, receivedInit?: RequestInit) => {
      path = receivedPath;
      init = receivedInit;
      return Promise.resolve(response as T);
    };

    const result = await getCurrentConditions(
      'token',
      { latitudeDegrees: -23.55, longitudeDegrees: -46.63, elevationMeters: 760 },
      request,
    );

    assert.match(path, /^\/conditions\/current\?/);
    assert.match(path, /latitudeDegrees=-23.55/);
    assert.deepEqual(init?.headers, { Authorization: 'Bearer token' });
    assert.equal(result.rating, 'good');
  });
});
