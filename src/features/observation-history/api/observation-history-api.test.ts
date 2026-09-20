import assert from 'node:assert/strict';
import test from 'node:test';

import { getObservationHistory } from './observation-history-api.ts';

test('requests the authenticated observation history', async () => {
  let capturedPath = '';
  let capturedAuthorization = '';
  const history = await getObservationHistory(
    'access-token',
    async <T>(path: string, init?: RequestInit) => {
      capturedPath = path;
      capturedAuthorization = new Headers(init?.headers).get('Authorization') ?? '';
      return { data: [] } as T;
    },
  );

  assert.deepEqual(history, []);
  assert.equal(capturedPath, '/observations');
  assert.equal(capturedAuthorization, 'Bearer access-token');
});
