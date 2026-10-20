import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import {
  base64ToBytes,
  orientationToClockwiseDegrees,
  readJpegOrientation,
} from '../lib/jpeg-orientation.ts';

const THUMBNAIL_SHORT_SIDE = 384;
const THUMBNAIL_QUALITY = 78;
const EXIF_HEADER_BYTES = 128 * 1024;
const MAX_CONCURRENT_THUMBNAILS = 2;
const thumbnailDirectory = `${FileSystem.cacheDirectory ?? ''}gallery-thumbnails/`;

const resolvedThumbnails = new Map<string, string>();
const pendingThumbnails = new Map<string, Promise<string>>();
const waitingForSlot: (() => void)[] = [];
let activeThumbnails = 0;

/**
 * Returns a small, correctly rotated JPEG for the photo, generating it once from the original
 * and caching it on disk by photo id. Signed URLs change on every request, so caching by id
 * also avoids downloading the same photo again after a refresh.
 */
export function getGalleryThumbnail(photoId: string, remoteUri: string): Promise<string> {
  const resolved = resolvedThumbnails.get(photoId);
  if (resolved) return Promise.resolve(resolved);
  const pending = pendingThumbnails.get(photoId);
  if (pending) return pending;

  const request = withThumbnailSlot(() => createThumbnail(photoId, remoteUri))
    .then((uri) => {
      resolvedThumbnails.set(photoId, uri);
      return uri;
    })
    .finally(() => pendingThumbnails.delete(photoId));
  pendingThumbnails.set(photoId, request);
  return request;
}

export async function removeGalleryThumbnail(photoId: string): Promise<void> {
  resolvedThumbnails.delete(photoId);
  failedThumbnails.delete(photoId);
  await FileSystem.deleteAsync(thumbnailPath(photoId), { idempotent: true }).catch(() => undefined);
}

const failedThumbnails = new Set<string>();

export interface GalleryThumbnails {
  /** Changes whenever a thumbnail resolves; pass it to the list so rows re-render. */
  version: number;
  /** Local thumbnail, the original photo when generation failed, or null while generating. */
  uriFor(photo: { id: string; uri: string | null }): string | null;
}

/**
 * Generates thumbnails for the given photos and exposes them to the screen. State lives in the
 * screen (not inside each tile) so a resolved thumbnail re-renders the list rows reliably.
 */
export function useGalleryThumbnails(
  photos: readonly { id: string; uri: string | null }[],
): GalleryThumbnails {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    for (const photo of photos) {
      if (!photo.uri || resolvedThumbnails.has(photo.id) || failedThumbnails.has(photo.id)) {
        continue;
      }
      void getGalleryThumbnail(photo.id, photo.uri)
        .catch(() => {
          failedThumbnails.add(photo.id);
        })
        .finally(() => {
          if (!cancelled) setVersion((value) => value + 1);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [photos]);

  return useMemo(
    () => ({
      version,
      uriFor: (photo) =>
        resolvedThumbnails.get(photo.id) ?? (failedThumbnails.has(photo.id) ? photo.uri : null),
    }),
    [version],
  );
}

async function createThumbnail(photoId: string, remoteUri: string): Promise<string> {
  const target = thumbnailPath(photoId);
  const existing = await FileSystem.getInfoAsync(target);
  if (existing.exists && !existing.isDirectory && (existing.size ?? 0) > 0) return target;

  await FileSystem.makeDirectoryAsync(thumbnailDirectory, { intermediates: true }).catch(
    () => undefined,
  );
  const source = `${thumbnailDirectory}${encodeURIComponent(photoId)}.source.jpg`;
  try {
    const download = await FileSystem.downloadAsync(remoteUri, source);
    if (download.status < 200 || download.status >= 300) {
      throw new Error(`Thumbnail source download failed with status ${download.status}`);
    }

    // Loaded lazily: if the native image module is unavailable, the tile falls back to the
    // original photo instead of breaking the whole gallery screen.
    const { Images } = await import('react-native-nitro-image');
    const image = await Images.loadFromFileAsync(toFilePath(source));
    const scale = Math.min(1, THUMBNAIL_SHORT_SIDE / Math.min(image.width, image.height));
    let thumbnail =
      scale < 1
        ? await image.resizeAsync(
            Math.max(1, Math.round(image.width * scale)),
            Math.max(1, Math.round(image.height * scale)),
          )
        : image;

    // Android decoders ignore EXIF orientation, so the pixels are rotated explicitly there.
    if (Platform.OS === 'android') {
      const header = await FileSystem.readAsStringAsync(source, {
        encoding: FileSystem.EncodingType.Base64,
        position: 0,
        length: EXIF_HEADER_BYTES,
      });
      const degrees = orientationToClockwiseDegrees(readJpegOrientation(base64ToBytes(header)));
      if (degrees !== 0) thumbnail = await thumbnail.rotateAsync(degrees);
    }

    await thumbnail.saveToFileAsync(toFilePath(target), 'jpg', THUMBNAIL_QUALITY);
    return target;
  } finally {
    await FileSystem.deleteAsync(source, { idempotent: true }).catch(() => undefined);
  }
}

async function withThumbnailSlot<T>(task: () => Promise<T>): Promise<T> {
  if (activeThumbnails >= MAX_CONCURRENT_THUMBNAILS) {
    await new Promise<void>((resolve) => waitingForSlot.push(resolve));
  }
  activeThumbnails += 1;
  try {
    return await task();
  } finally {
    activeThumbnails -= 1;
    waitingForSlot.shift()?.();
  }
}

function thumbnailPath(photoId: string): string {
  return `${thumbnailDirectory}${encodeURIComponent(photoId)}.jpg`;
}

function toFilePath(uri: string): string {
  return decodeURI(uri.replace(/^file:\/\//, ''));
}
