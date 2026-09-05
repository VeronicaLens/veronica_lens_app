import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Session } from '../../../shared/api/index.ts';
import { clearSession, loadSession, saveSession, type SessionStorage } from './session-storage.ts';

const session: Session = {
  id: '60000000-0000-4000-8000-000000000001',
  user: {
    id: '40000000-0000-4000-8000-000000000001',
    email: 'user@example.com',
    displayName: null,
    avatarUrl: null,
    role: 'user',
    createdAt: '2026-09-05T12:00:00.000Z',
    updatedAt: '2026-09-05T12:00:00.000Z',
  },
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  tokenType: 'bearer',
  expiresAt: '2026-09-05T13:00:00.000Z',
};

function memoryStorage(): SessionStorage {
  const values = new Map<string, string>();
  return {
    getItemAsync: (key) => Promise.resolve(values.get(key) ?? null),
    setItemAsync: (key, value) => {
      values.set(key, value);
      return Promise.resolve();
    },
    deleteItemAsync: (key) => {
      values.delete(key);
      return Promise.resolve();
    },
  };
}

describe('secure session storage', () => {
  it('persists, validates and clears a session', async () => {
    const storage = memoryStorage();
    await saveSession(session, storage);
    assert.deepEqual(await loadSession(storage), session);
    await clearSession(storage);
    assert.equal(await loadSession(storage), null);
  });

  it('rejects malformed persisted data', async () => {
    const storage = memoryStorage();
    await storage.setItemAsync('veronica_lens_session_v1', '{"accessToken":"missing fields"}');
    assert.equal(await loadSession(storage), null);
  });
});
