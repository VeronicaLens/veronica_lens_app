import assert from 'node:assert/strict';
import test from 'node:test';

import { getObservationHistory } from './observation-history-api.ts';

test('requests the authenticated observation history', async () => {
  let capturedPath = '';
  let capturedAuthorization = '';
  const history = await getObservationHistory(
    'access-token',
    2,
    20,
    async <T>(path: string, init?: RequestInit) => {
      capturedPath = path;
      capturedAuthorization = new Headers(init?.headers).get('Authorization') ?? '';
      return { data: [], page: 2, pageSize: 20, hasMore: true } as T;
    },
  );

  assert.deepEqual(history, { data: [], page: 2, pageSize: 20, hasMore: true });
  assert.equal(capturedPath, '/observations?page=2&pageSize=20');
  assert.equal(capturedAuthorization, 'Bearer access-token');
});
