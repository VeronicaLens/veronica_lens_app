import type { CurrentConditionsResponse } from '../../../shared/api/index.ts';
import { apiRequest } from '../../../shared/api/index.ts';

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

export interface CurrentConditionsObserver {
  latitudeDegrees: number;
  longitudeDegrees: number;
  elevationMeters: number;
}

export async function getCurrentConditions(
  accessToken: string,
  observer: CurrentConditionsObserver,
  request: Request = apiRequest,
): Promise<CurrentConditionsResponse['data']> {
  const query = new URLSearchParams({
    latitudeDegrees: String(observer.latitudeDegrees),
    longitudeDegrees: String(observer.longitudeDegrees),
    elevationMeters: String(observer.elevationMeters),
  });
  return (
    await request<CurrentConditionsResponse>(`/conditions/current?${query.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  ).data;
}
