import type { AstroPhotoMetadata, CapturedPhoto } from '../../camera-capture/index.ts';

export interface ObservationPhotoMetadata extends AstroPhotoMetadata {
  title: string;
  notes: string;
  astronomicalEventId?: string | null;
  celestialObjectName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface PendingAstroPhoto {
  observationId: string;
  photoId: string;
  uri: string;
  contentType: 'image/jpeg';
  metadata: ObservationPhotoMetadata;
}

export interface AstroPhotoStore {
  persist(photo: PendingAstroPhoto): Promise<PendingAstroPhoto>;
  list(): Promise<PendingAstroPhoto[]>;
  remove(photo: PendingAstroPhoto): Promise<void>;
}

export interface AstroPhotoUploader {
  upload(accessToken: string, photo: PendingAstroPhoto): Promise<void>;
}

export type AstroPhotoSaveResult =
  | { status: 'uploaded' }
  | {
      status: 'queued';
      failure:
        { kind: 'http'; status: number; code?: string; message?: string } | { kind: 'connection' };
    };

export type AstroPhotoUploadFailure = Extract<
  AstroPhotoSaveResult,
  { status: 'queued' }
>['failure'];

export interface RetryPendingAstroPhotosResult {
  uploadedCount: number;
  remainingCount: number;
  lastFailure: AstroPhotoUploadFailure | null;
}

export async function persistAndUploadAstroPhoto(
  accessToken: string,
  captured: CapturedPhoto,
  metadata: Omit<ObservationPhotoMetadata, keyof AstroPhotoMetadata>,
  dependencies: { store: AstroPhotoStore; uploader: AstroPhotoUploader; randomUUID(): string },
): Promise<AstroPhotoSaveResult> {
  const photo = await dependencies.store.persist({
    observationId: dependencies.randomUUID(),
    photoId: dependencies.randomUUID(),
    uri: captured.uri,
    contentType: 'image/jpeg',
    metadata: { ...captured.metadata, ...metadata },
  });
  try {
    await dependencies.uploader.upload(accessToken, photo);
    await dependencies.store.remove(photo);
    return { status: 'uploaded' };
  } catch (error) {
    return { status: 'queued', failure: getUploadFailure(error) };
  }
}

function getHttpStatus(error: unknown): number | null {
  if (typeof error !== 'object' || error === null || !('status' in error)) return null;
  const status = error.status;
  return typeof status === 'number' && Number.isInteger(status) ? status : null;
}

function getUploadFailure(error: unknown): AstroPhotoUploadFailure {
  const status = getHttpStatus(error);
  if (status === null) return { kind: 'connection' };
  if (typeof error !== 'object' || error === null) return { kind: 'http', status };
  const code = 'code' in error && typeof error.code === 'string' ? error.code : undefined;
  const message =
    'message' in error && typeof error.message === 'string' ? error.message : undefined;
  return { kind: 'http', status, ...(code ? { code } : {}), ...(message ? { message } : {}) };
}

export async function retryPendingAstroPhotos(
  accessToken: string,
  store: AstroPhotoStore,
  uploader: AstroPhotoUploader,
): Promise<RetryPendingAstroPhotosResult> {
  let uploaded = 0;
  let lastFailure: RetryPendingAstroPhotosResult['lastFailure'] = null;
  for (const photo of await store.list()) {
    try {
      await uploader.upload(accessToken, photo);
    } catch (error) {
      lastFailure = getUploadFailure(error);
      continue;
    }

    try {
      await store.remove(photo);
      uploaded += 1;
    } catch {
      lastFailure = { kind: 'connection' };
    }
  }

  return {
    uploadedCount: uploaded,
    remainingCount: (await store.list()).length,
    lastFailure,
  };
}
