import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getEventIdFromUrl } from './event-link.ts';

describe('getEventIdFromUrl', () => {
  it('reads event identifiers from notification and web deep links', () => {
    assert.equal(getEventIdFromUrl('veronicalens://events/event-123'), 'event-123');
    assert.equal(getEventIdFromUrl('https://veronicalens.app/events/event%20456'), 'event 456');
  });

  it('ignores unrelated, empty and malformed links', () => {
    assert.equal(getEventIdFromUrl('veronicalens://auth/recovery#access_token=secret'), null);
    assert.equal(getEventIdFromUrl(null), null);
    assert.equal(getEventIdFromUrl('not a url'), null);
  });
});
