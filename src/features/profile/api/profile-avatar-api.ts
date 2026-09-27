import * as FileSystem from 'expo-file-system/legacy';

import type { Profile, ProfileResponse } from '../../../shared/api/index.ts';
import { getPublicEnvironment } from '../../../shared/config/index.ts';

export async function uploadProfileAvatar(
  accessToken: string,
  uri: string,
  contentType: 'image/jpeg' | 'image/png' | 'image/webp',
): Promise<Profile> {
  const { apiUrl } = getPublicEnvironment();
  const response = await FileSystem.uploadAsync(`${apiUrl}/profile/avatar`, uri, {
    httpMethod: 'PUT',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': contentType,
    },
  });
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Avatar upload failed with status ${response.status}`);
  }
  return (JSON.parse(response.body) as ProfileResponse).data;
}
