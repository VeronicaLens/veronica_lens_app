import type {
  EventPreference,
  NotificationPreferencesResponse,
  PushDevicePlatform,
} from '../../../shared/api/index.ts';
import { apiRequest } from '../../../shared/api/index.ts';

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

function authorization(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function getNotificationPreferences(
  accessToken: string,
  request: Request = apiRequest,
): Promise<EventPreference[]> {
  return (
    await request<NotificationPreferencesResponse>('/notifications/preferences', {
      headers: authorization(accessToken),
    })
  ).data;
}

export async function updateNotificationPreferences(
  accessToken: string,
  preferences: EventPreference[],
  request: Request = apiRequest,
): Promise<EventPreference[]> {
  return (
    await request<NotificationPreferencesResponse>('/notifications/preferences', {
      method: 'PUT',
      headers: authorization(accessToken),
      body: JSON.stringify({ preferences }),
    })
  ).data;
}

export async function registerPushDevice(
  accessToken: string,
  token: string,
  platform: PushDevicePlatform,
  request: Request = apiRequest,
): Promise<void> {
  await request<void>('/notifications/devices', {
    method: 'POST',
    headers: authorization(accessToken),
    body: JSON.stringify({ token, platform }),
  });
}

export async function unregisterPushDevice(
  accessToken: string,
  token: string,
  request: Request = apiRequest,
): Promise<void> {
  await request<void>('/notifications/devices', {
    method: 'DELETE',
    headers: authorization(accessToken),
    body: JSON.stringify({ token }),
  });
}
