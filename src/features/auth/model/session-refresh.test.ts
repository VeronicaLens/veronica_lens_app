import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getSessionRefreshDelay } from './session-refresh.ts';

describe('session refresh scheduling', () => {
  it('renews one minute before expiration', () => {
    const now = Date.parse('2026-09-05T12:00:00.000Z');
    assert.equal(getSessionRefreshDelay('2026-09-05T13:00:00.000Z', now), 3_540_000);
  });

  it('renews immediately when the session is expired or invalid', () => {
    const now = Date.parse('2026-09-05T12:00:00.000Z');
    assert.equal(getSessionRefreshDelay('2026-09-05T11:00:00.000Z', now), 0);
    assert.equal(getSessionRefreshDelay('invalid', now), 0);
  });
});
