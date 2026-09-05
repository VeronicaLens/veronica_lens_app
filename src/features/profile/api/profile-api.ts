import type { Profile, ProfileResponse, UpdateProfileRequest } from '../../../shared/api/index.ts';
import { apiRequest } from '../../../shared/api/index.ts';

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

function authorization(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function getProfile(
  accessToken: string,
  request: Request = apiRequest,
): Promise<Profile> {
  return (await request<ProfileResponse>('/profile', { headers: authorization(accessToken) })).data;
}

export async function updateProfile(
  accessToken: string,
  input: UpdateProfileRequest,
  request: Request = apiRequest,
): Promise<Profile> {
  return (
    await request<ProfileResponse>('/profile', {
      method: 'PATCH',
      headers: authorization(accessToken),
      body: JSON.stringify(input),
    })
  ).data;
}
