import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { UpcomingEventsResponse } from '../../../shared/api/index.ts';
import { getUpcomingEvents } from './events-api.ts';

describe('getUpcomingEvents', () => {
  it('requests filtered events through the authenticated backend', async () => {
    let path = '';
    let init: RequestInit | undefined;
    const response: UpcomingEventsResponse = {
      data: [],
      meta: {
        count: 0,
        source: 'provider',
        stale: false,
        updatedAt: '2026-10-04T00:00:00.000Z',
      },
    };
    const request = <T>(receivedPath: string, receivedInit?: RequestInit) => {
      path = receivedPath;
      init = receivedInit;
      return Promise.resolve(response as T);
    };
    const result = await getUpcomingEvents(
      'token',
      {
        from: '2026-10-04T00:00:00.000Z',
        to: '2026-10-11T00:00:00.000Z',
        type: 'rise',
        observer: { latitudeDegrees: -23.55, longitudeDegrees: -46.63, elevationMeters: 760 },
      },
      request,
    );

    assert.match(path, /^\/events\?/);
    assert.match(path, /type=rise/);
    assert.match(path, /latitudeDegrees=-23.55/);
    assert.deepEqual(init?.headers, { Authorization: 'Bearer token' });
    assert.equal(result.meta.count, 0);
  });
});
