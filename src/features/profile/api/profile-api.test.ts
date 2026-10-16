import assert from 'node:assert/strict';
import test from 'node:test';

import type { ProfileResponse } from '../../../shared/api/index.ts';
import { deleteAccount, getProfile, updateProfile } from './profile-api.ts';

const response: ProfileResponse = {
  data: {
    id: '40000000-0000-4000-8000-000000000001',
    displayName: 'Bianca',
    avatarUrl: null,
    locationName: 'São Paulo',
    latitude: -23.55,
    longitude: -46.63,
    notificationsEnabled: true,
    measurementUnit: 'metric',
    language: 'pt-BR',
    createdAt: '2026-09-05T12:00:00.000Z',
    updatedAt: '2026-09-05T12:00:00.000Z',
  },
};

test('loads the profile with bearer authentication', async () => {
  const request = async <T>(_path: string, init?: RequestInit) => {
    assert.equal(
      init?.headers && (init.headers as Record<string, string>).Authorization,
      'Bearer token',
    );
    return response as T;
  };
  assert.deepEqual(await getProfile('token', request), response.data);
});

test('updates profile preferences through PATCH', async () => {
  const request = async <T>(path: string, init?: RequestInit) => {
    assert.equal(path, '/profile');
    assert.equal(init?.method, 'PATCH');
    assert.deepEqual(JSON.parse(String(init?.body)), { notificationsEnabled: false });
    return response as T;
  };
  await updateProfile('token', { notificationsEnabled: false }, request);
});

test('deletes the account through DELETE /profile with bearer authentication', async () => {
  let called = false;
  const request = async <T>(path: string, init?: RequestInit) => {
    called = true;
    assert.equal(path, '/profile');
    assert.equal(init?.method, 'DELETE');
    assert.equal((init?.headers as Record<string, string>).Authorization, 'Bearer token');
    return undefined as T;
  };
  await deleteAccount('token', request);
  assert.equal(called, true);
});
