import type {
  UpcomingAstronomicalEventType,
  UpcomingEventsResponse,
} from '../../../shared/api/index.ts';
import { apiRequest } from '../../../shared/api/index.ts';

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

export interface UpcomingEventsFilters {
  from: string;
  to: string;
  type?: UpcomingAstronomicalEventType;
  observer: {
    latitudeDegrees: number;
    longitudeDegrees: number;
    elevationMeters: number;
  };
}

export async function getUpcomingEvents(
  accessToken: string,
  filters: UpcomingEventsFilters,
  request: Request = apiRequest,
): Promise<UpcomingEventsResponse> {
  const query = new URLSearchParams({
    from: filters.from,
    to: filters.to,
    latitudeDegrees: String(filters.observer.latitudeDegrees),
    longitudeDegrees: String(filters.observer.longitudeDegrees),
    elevationMeters: String(filters.observer.elevationMeters),
  });
  if (filters.type) query.set('type', filters.type);
  return await request<UpcomingEventsResponse>(`/events?${query.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
