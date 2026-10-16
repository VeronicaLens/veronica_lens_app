import assert from 'node:assert/strict';
import test from 'node:test';

import { describePushRegistrationError } from './push-registration-error.ts';

test('explains a missing Firebase configuration on Android', () => {
  assert.match(
    describePushRegistrationError(
      new Error('Default FirebaseApp is not initialized in this process com.veronicalens.app'),
    ),
    /Firebase\/FCM/,
  );
  assert.match(describePushRegistrationError(new Error('fcm token unavailable')), /Firebase\/FCM/);
});

test('explains connectivity and project configuration failures', () => {
  assert.match(describePushRegistrationError(new Error('Network request failed')), /conexão/);
  assert.match(describePushRegistrationError(new Error('No "projectId" found')), /projeto Expo/);
});

test('falls back to a generic message', () => {
  assert.equal(
    describePushRegistrationError(null),
    'Não foi possível registrar este dispositivo para alertas.',
  );
});
