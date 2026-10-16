import assert from 'node:assert/strict';
import test from 'node:test';

import {
  deleteObservation,
  deleteObservationPhoto,
  getObservationHistory,
} from './observation-history-api.ts';

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

test('deletes a photo with the authenticated DELETE route', async () => {
  let capturedPath = '';
  let capturedMethod = '';
  let capturedAuthorization = '';
  const result = await deleteObservationPhoto(
    'access-token',
    'observation-1',
    'photo-1',
    async <T>(path: string, init?: RequestInit) => {
      capturedPath = path;
      capturedMethod = init?.method ?? '';
      capturedAuthorization = new Headers(init?.headers).get('Authorization') ?? '';
      return { data: { observationDeleted: true } } as T;
    },
  );

  assert.deepEqual(result, { observationDeleted: true });
  assert.equal(capturedPath, '/observations/observation-1/photos/photo-1');
  assert.equal(capturedMethod, 'DELETE');
  assert.equal(capturedAuthorization, 'Bearer access-token');
});

test('deletes an observation with the authenticated DELETE route', async () => {
  let capturedPath = '';
  let capturedMethod = '';
  await deleteObservation(
    'access-token',
    'observation-1',
    async <T>(path: string, init?: RequestInit) => {
      capturedPath = path;
      capturedMethod = init?.method ?? '';
      return undefined as T;
    },
  );

  assert.equal(capturedPath, '/observations/observation-1');
  assert.equal(capturedMethod, 'DELETE');
});
