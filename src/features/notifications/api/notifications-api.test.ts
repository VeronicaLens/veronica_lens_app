import assert from 'node:assert/strict';
import test from 'node:test';

import {
  registerPushDevice,
  unregisterPushDevice,
  updateNotificationPreferences,
} from './notifications-api.ts';

test('persists authenticated notification preferences and device lifecycle', async () => {
  const calls: { path: string; init?: RequestInit }[] = [];
  const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    calls.push(init ? { path, init } : { path });
    return { data: [{ eventType: 'rise', enabled: true, leadMinutes: 30 }] } as T;
  };

  await updateNotificationPreferences(
    'access-token',
    [{ eventType: 'rise', enabled: true, leadMinutes: 30 }],
    request,
  );
  await registerPushDevice('access-token', 'ExponentPushToken[device-token]', 'android', request);
  await unregisterPushDevice('access-token', 'ExponentPushToken[device-token]', request);

  assert.equal(calls.length, 3);
  assert.equal(calls[0]?.path, '/notifications/preferences');
  assert.equal(calls[0]?.init?.method, 'PUT');
  assert.equal(new Headers(calls[0]?.init?.headers).get('Authorization'), 'Bearer access-token');
  assert.equal(calls[1]?.init?.method, 'POST');
  assert.equal(calls[2]?.init?.method, 'DELETE');
});
