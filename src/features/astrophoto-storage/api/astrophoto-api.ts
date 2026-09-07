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
      throw new Error(`Astrophoto upload failed with status ${response.status}`);
    }
  }
}
