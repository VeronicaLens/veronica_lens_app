import * as FileSystem from 'expo-file-system/legacy';

import { getPublicEnvironment } from '../../../shared/config/index.ts';
import type { AstroPhotoUploader, PendingAstroPhoto } from '../model/astrophoto-sync.ts';

export class ApiAstroPhotoUploader implements AstroPhotoUploader {
  async upload(accessToken: string, photo: PendingAstroPhoto): Promise<void> {
    const { apiUrl } = getPublicEnvironment();
    const response = await FileSystem.uploadAsync(
      `${apiUrl}/observations/${photo.observationId}/photos/${photo.photoId}`,
      photo.uri,
      {
        httpMethod: 'PUT',
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': photo.contentType,
          'X-Veronica-Observation': encodeURIComponent(JSON.stringify(photo.metadata)),
        },
      },
    );
    if (response.status < 200 || response.status >= 300) {
      const details = readApiError(response.body);
      throw Object.assign(new Error('Astrophoto upload failed'), {
        status: response.status,
        ...details,
      });
    }
  }
}

function readApiError(body: string): { code?: string; message?: string } {
  try {
    const parsed: unknown = JSON.parse(body);
    if (typeof parsed !== 'object' || parsed === null || !('error' in parsed)) return {};
    const error = parsed.error;
    if (typeof error !== 'object' || error === null) return {};
    const code = 'code' in error && typeof error.code === 'string' ? error.code : undefined;
    const message =
      'message' in error && typeof error.message === 'string' ? error.message : undefined;
    return { ...(code ? { code } : {}), ...(message ? { message } : {}) };
  } catch {
    return {};
  }
}
