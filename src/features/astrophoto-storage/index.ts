import * as Crypto from 'expo-crypto';

import { ApiAstroPhotoUploader } from './api/astrophoto-api.ts';
import { ExpoAstroPhotoStore } from './api/expo-astrophoto-store.ts';
import { persistAndUploadAstroPhoto, retryPendingAstroPhotos } from './model/astrophoto-sync.ts';

const store = new ExpoAstroPhotoStore();
const uploader = new ApiAstroPhotoUploader();

export async function saveCapturedAstroPhoto(
  ...args: Parameters<typeof persistAndUploadAstroPhoto> extends [...infer Head, unknown]
    ? Head
    : never
) {
  return await persistAndUploadAstroPhoto(...args, {
    store,
    uploader,
    randomUUID: Crypto.randomUUID,
  });
}

export async function flushPendingAstroPhotos(accessToken: string) {
  return await retryPendingAstroPhotos(accessToken, store, uploader);
}

export async function getPendingAstroPhotoCount() {
  return (await store.list()).length;
}

export * from './model/astrophoto-sync.ts';
