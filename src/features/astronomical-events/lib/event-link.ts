export function getEventIdFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const segments = [parsed.hostname, ...parsed.pathname.split('/')].filter(Boolean);
    const eventsIndex = segments.indexOf('events');
    const eventId = eventsIndex >= 0 ? segments[eventsIndex + 1] : undefined;
    return eventId ? decodeURIComponent(eventId) : null;
  } catch {
    return null;
  }
}
