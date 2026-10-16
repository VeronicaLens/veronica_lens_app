export function getEventIdFromNotificationData(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const eventId = (data as { eventId?: unknown }).eventId;
  return typeof eventId === 'string' && eventId.trim() ? eventId : null;
}
