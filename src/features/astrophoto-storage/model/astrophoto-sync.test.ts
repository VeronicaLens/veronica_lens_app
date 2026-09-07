import assert from 'node:assert/strict';
import test from 'node:test';

import type { CapturedPhoto } from '../../camera-capture/index.ts';
import {
  persistAndUploadAstroPhoto,
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
  assert.equal(status, 'queued');
  assert.equal((await store.list())[0]?.uri, 'file:///documents/photo.jpg');
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
  assert.equal(status, 'uploaded');
  assert.equal(removed, true);
});
