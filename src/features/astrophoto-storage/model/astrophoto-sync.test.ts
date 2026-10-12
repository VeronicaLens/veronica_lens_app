import assert from 'node:assert/strict';
import test from 'node:test';

import type { CapturedPhoto } from '../../camera-capture/index.ts';
import {
  persistAndUploadAstroPhoto,
  retryPendingAstroPhotos,
  type AstroPhotoStore,
  type PendingAstroPhoto,
} from './astrophoto-sync.ts';

const captured = {
  uri: 'file:///cache/photo.jpg',
  metadata: {
    capturedAt: '2026-10-04T01:00:00.000Z',
    device: { id: 'back', name: 'Back camera' },
    parameters: {
      focusMode: 'automatic',
      exposureMode: 'automatic',
      exposureCompensationEv: 0,
      iso: 'automatic',
      exposureTimeSeconds: 'automatic',
      fallbacks: [],
    },
  },
} satisfies CapturedPhoto;

test('keeps a durable queued photo when upload fails', async () => {
  let queued: PendingAstroPhoto | null = null;
  const store: AstroPhotoStore = {
    persist: async (photo) => (queued = { ...photo, uri: 'file:///documents/photo.jpg' }),
    list: async () => (queued ? [queued] : []),
    remove: async () => {
      queued = null;
    },
  };
  const status = await persistAndUploadAstroPhoto(
    'token',
    captured,
    { title: 'Astrofoto', notes: '' },
    {
      store,
      uploader: {
        upload: async () => {
          throw new Error('offline');
        },
      },
      randomUUID: () => '71000000-0000-4000-8000-000000000001',
    },
  );
  assert.deepEqual(status, { status: 'queued', failure: { kind: 'connection' } });
  assert.equal((await store.list())[0]?.uri, 'file:///documents/photo.jpg');
});

test('reports an HTTP upload failure while preserving the queued photo', async () => {
  let queued: PendingAstroPhoto | null = null;
  const store: AstroPhotoStore = {
    persist: async (photo) => (queued = photo),
    list: async () => (queued ? [queued] : []),
    remove: async () => {
      queued = null;
    },
  };
  const result = await persistAndUploadAstroPhoto(
    'token',
    captured,
    { title: 'Astrofoto', notes: '' },
    {
      store,
      uploader: {
        upload: async () => {
          throw Object.assign(new Error('HTTP 401'), { status: 401 });
        },
      },
      randomUUID: () => '71000000-0000-4000-8000-000000000001',
    },
  );

  assert.deepEqual(result, {
    status: 'queued',
    failure: { kind: 'http', status: 401, message: 'HTTP 401' },
  });
  assert.ok(queued);
});

test('removes the durable copy only after successful upload', async () => {
  let removed = false;
  const store: AstroPhotoStore = {
    persist: async (photo) => photo,
    list: async () => [],
    remove: async () => {
      removed = true;
    },
  };
  const status = await persistAndUploadAstroPhoto(
    'token',
    captured,
    { title: 'Astrofoto', notes: '' },
    {
      store,
      uploader: { upload: async () => undefined },
      randomUUID: () => '71000000-0000-4000-8000-000000000001',
    },
  );
  assert.deepEqual(status, { status: 'uploaded' });
  assert.equal(removed, true);
});

test('keeps queued photos and reports HTTP status when a retry fails', async () => {
  const photo: PendingAstroPhoto = {
    observationId: '71000000-0000-4000-8000-000000000001',
    photoId: '71000000-0000-4000-8000-000000000002',
    uri: 'file:///documents/photo.jpg',
    contentType: 'image/jpeg',
    metadata: { ...captured.metadata, title: 'Astrofoto', notes: '' },
  };
  const store: AstroPhotoStore = {
    persist: async (value) => value,
    list: async () => [photo],
    remove: async () => undefined,
  };

  const result = await retryPendingAstroPhotos('token', store, {
    upload: async () => {
      throw Object.assign(new Error('HTTP 503'), { status: 503 });
    },
  });

  assert.deepEqual(result, {
    uploadedCount: 0,
    remainingCount: 1,
    lastFailure: { kind: 'http', status: 503, message: 'HTTP 503' },
  });
});
