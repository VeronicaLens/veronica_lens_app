import assert from 'node:assert/strict';
import test from 'node:test';

import { getEventIdFromNotificationData } from './notification-event-link.ts';

test('reads an event identifier only from valid push notification data', () => {
  assert.equal(getEventIdFromNotificationData({ eventId: 'event-123' }), 'event-123');
  assert.equal(getEventIdFromNotificationData({ eventId: '' }), null);
  assert.equal(getEventIdFromNotificationData({}), null);
  assert.equal(getEventIdFromNotificationData(null), null);
});
