import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type {
  CurrentConditionsForecastResponse,
  CurrentConditionsResponse,
} from '../../../shared/api/index.ts';
import { getConditionsForecast, getCurrentConditions } from './current-conditions-api.ts';

const observer = { latitudeDegrees: -23.55, longitudeDegrees: -46.63, elevationMeters: 760 };

function currentConditionsResponse(): CurrentConditionsResponse {
  return {
    data: {
      requestedAt: '2026-10-04T00:00:00.000Z',
      observedAt: '2026-10-04T00:00:00.000Z',
      fetchedAt: '2026-10-03T23:50:00.000Z',
      temperatureCelsius: 18,
      relativeHumidityPercent: 60,
      cloudCoverPercent: 10,
      precipitationProbabilityPercent: 5,
      precipitationMillimeters: 0,
      visibilityMeters: 12_000,
      windSpeedKilometersPerHour: 5,
      rating: 'good',
      factors: [],
      skyLabel: 'Céu limpo',
      visibilityLabel: 'Ótima visibilidade',
    },
  };
}

describe('current conditions API', () => {
  it('requests current conditions for the observer through the authenticated backend', async () => {
    let path = '';
    let init: RequestInit | undefined;
    const request = <T>(receivedPath: string, receivedInit?: RequestInit) => {
      path = receivedPath;
      init = receivedInit;
      return Promise.resolve(currentConditionsResponse() as T);
    };

    const result = await getCurrentConditions('token', observer, undefined, request);

    assert.match(path, /^\/conditions\/current\?/);
    assert.match(path, /latitudeDegrees=-23.55/);
    assert.equal(new Headers(init?.headers).has('Authorization'), true);
    assert.equal(result.rating, 'good');
  });

  it('sends a requested future time as an ISO timestamp', async () => {
    let path = '';
    const request = <T>(receivedPath: string) => {
      path = receivedPath;
      return Promise.resolve(currentConditionsResponse() as T);
    };
    const requestedAt = '2026-10-04T22:00:00.000Z';

    await getCurrentConditions('token', observer, requestedAt, request);

    assert.match(path, /at=2026-10-04T22%3A00%3A00.000Z/);
  });

  it('requests the hourly forecast for the next days', async () => {
    let path = '';
    let init: RequestInit | undefined;
    const response: CurrentConditionsForecastResponse = {
      data: {
        from: '2026-10-04T00:00:00.000Z',
        to: '2026-10-11T00:00:00.000Z',
        fetchedAt: '2026-10-03T23:50:00.000Z',
        hourly: [currentConditionsResponse().data],
      },
    };
    const request = <T>(receivedPath: string, receivedInit?: RequestInit) => {
      path = receivedPath;
      init = receivedInit;
      return Promise.resolve(response as T);
    };

    const result = await getConditionsForecast('token', observer, request);

    assert.match(path, /^\/conditions\/forecast\?/);
    assert.match(path, /latitudeDegrees=-23.55/);
    assert.equal(new Headers(init?.headers).has('Authorization'), true);
    assert.equal(result.hourly.length, 1);
  });
});
