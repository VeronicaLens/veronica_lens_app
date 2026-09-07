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

export async function persistAndUploadAstroPhoto(
  accessToken: string,
  captured: CapturedPhoto,
  metadata: Omit<ObservationPhotoMetadata, keyof AstroPhotoMetadata>,
  dependencies: { store: AstroPhotoStore; uploader: AstroPhotoUploader; randomUUID(): string },
): Promise<'uploaded' | 'queued'> {
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
    return 'uploaded';
  } catch {
    return 'queued';
  }
}

export async function retryPendingAstroPhotos(
  accessToken: string,
  store: AstroPhotoStore,
  uploader: AstroPhotoUploader,
): Promise<number> {
  let uploaded = 0;
  for (const photo of await store.list()) {
    try {
      await uploader.upload(accessToken, photo);
      await store.remove(photo);
      uploaded += 1;
    } catch {
      // Keep durable local files for a later retry.
    }
  }
  return uploaded;
}
