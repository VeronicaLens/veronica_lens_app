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
