import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getRecoveryAccessToken } from './recovery-link.ts';

describe('getRecoveryAccessToken', () => {
  it('reads only recovery access tokens from the deep-link fragment', () => {
    assert.equal(
      getRecoveryAccessToken('veronicalens://auth/reset-password#access_token=token&type=recovery'),
      'token',
    );
    assert.equal(
      getRecoveryAccessToken('veronicalens://auth/reset-password#access_token=token&type=signup'),
      null,
    );
    assert.equal(getRecoveryAccessToken(null), null);
  });
});
