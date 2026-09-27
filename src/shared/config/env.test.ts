import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parsePublicEnvironment } from './env.ts';

describe('parsePublicEnvironment', () => {
  it('returns the public application settings', () => {
    assert.deepEqual(
      parsePublicEnvironment({
        EXPO_PUBLIC_API_URL: 'http://localhost:3000/api/v1',
      }),
      {
        apiUrl: 'http://localhost:3000/api/v1',
        googleWebClientId: null,
      },
    );
  });

  it('returns the Google web client id when configured', () => {
    assert.deepEqual(
      parsePublicEnvironment({
        EXPO_PUBLIC_API_URL: 'http://localhost:3000/api/v1',
        EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: 'client-id.apps.googleusercontent.com',
      }),
      {
        apiUrl: 'http://localhost:3000/api/v1',
        googleWebClientId: 'client-id.apps.googleusercontent.com',
      },
    );
  });

  it('rejects a missing required setting', () => {
    assert.throws(
      () => parsePublicEnvironment({}),
      /Missing public environment variable: EXPO_PUBLIC_API_URL/,
    );
  });
});
