import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { ObservationHistoryItem } from '../../../shared/api/index.ts';
import { buildPhotoGallery, describeCapture } from './photo-gallery.ts';

function localIso(year: number, month: number, day: number, hour = 21): string {
  return new Date(year, month - 1, day, hour).toISOString();
}

function observation(
  id: string,
  name: string,
  photoDates: string[],
  observedAt = photoDates[0] ?? localIso(2026, 10, 15),
): ObservationHistoryItem {
  return {
    id,
    title: `Astrofoto de ${name}`,
    notes: '',
    celestialObjectName: name,
    observedAt,
    latitude: -23.09,
    longitude: -47.22,
    photos: photoDates.map((capturedAt, index) => ({
      id: `${id}-photo-${index}`,
      storagePath: `user/${id}/${index}.jpg`,
      capturedAt,
      thumbnailUrl: `https://storage.example/${id}/${index}.jpg`,
      capture: null,
    })),
  };
}

const now = new Date(2026, 9, 15, 22);
const observations = [
  observation('moon', 'Lua', [localIso(2026, 10, 15), localIso(2026, 10, 15, 22)]),
  observation('jupiter', 'Júpiter', [localIso(2026, 10, 14)]),
  observation('orion', 'Órion', [localIso(2026, 9, 2)]),
  observation('sirius', 'Sirius', [localIso(2025, 12, 31)]),
];

describe('buildPhotoGallery', () => {
  it('lists every photo from newest to oldest and labels recent days', () => {
    const gallery = buildPhotoGallery(observations, { grouping: 'day', now });

    assert.deepEqual(
      gallery.photos.map(({ id }) => id),
      ['moon-photo-1', 'moon-photo-0', 'jupiter-photo-0', 'orion-photo-0', 'sirius-photo-0'],
    );
    assert.deepEqual(
      gallery.sections.map(({ title, photos }) => [title, photos.length]),
      [
        ['Hoje', 2],
        ['Ontem', 1],
        [gallery.sections[2]?.title, 1],
        [gallery.sections[3]?.title, 1],
      ],
    );
    assert.match(gallery.sections[3]?.title ?? '', /2025/);
  });

  it('groups photos by month and by year', () => {
    const byMonth = buildPhotoGallery(observations, { grouping: 'month', now });
    const byYear = buildPhotoGallery(observations, { grouping: 'year', now });

    assert.deepEqual(
      byMonth.sections.map(({ key, photos }) => [key, photos.length]),
      [
        ['2026-10', 3],
        ['2026-09', 1],
        ['2025-12', 1],
      ],
    );
    assert.match(byMonth.sections[0]?.title ?? '', /^Outubro de 2026$/i);
    assert.deepEqual(
      byYear.sections.map(({ title, photos }) => [title, photos.length]),
      [
        ['2026', 4],
        ['2025', 1],
      ],
    );
  });

  it('filters by celestial category', () => {
    const gallery = buildPhotoGallery(observations, { grouping: 'year', category: 'planet', now });

    assert.deepEqual(
      gallery.photos.map(({ observation: item }) => item.id),
      ['jupiter'],
    );
  });

  it('keeps observations without media as placeholder tiles', () => {
    const gallery = buildPhotoGallery([observation('notes', 'Vega', [], localIso(2026, 10, 10))], {
      grouping: 'day',
      now,
    });

    assert.equal(gallery.photos[0]?.uri, null);
    assert.equal(gallery.photos[0]?.photo, null);
  });
});

describe('describeCapture', () => {
  it('formats recorded manual settings', () => {
    assert.deepEqual(
      describeCapture({
        deviceName: 'Back Camera',
        iso: 1600,
        exposureTimeSeconds: 0.25,
        exposureCompensationEv: 0,
        focusMode: 'manual',
        focusLensPosition: 1,
        whiteBalanceKelvin: 4000,
      }),
      [
        { label: 'ISO', value: '1600' },
        { label: 'Tempo', value: '1/4 s' },
        { label: 'Foco', value: 'Infinito ∞' },
        { label: 'WB', value: '4000K' },
        { label: 'Câmera', value: 'Back Camera' },
      ],
    );
  });

  it('shows automatic values and exposure compensation', () => {
    const details = describeCapture({
      deviceName: null,
      iso: null,
      exposureTimeSeconds: null,
      exposureCompensationEv: -1.5,
      focusMode: 'center-metering',
      focusLensPosition: null,
      whiteBalanceKelvin: null,
    });

    assert.deepEqual(details, [
      { label: 'ISO', value: 'Auto' },
      { label: 'Tempo', value: 'Auto' },
      { label: 'Foco', value: 'Auto (centro)' },
      { label: 'WB', value: 'Auto' },
      { label: 'Exposição', value: '-1,5 EV' },
    ]);
    assert.deepEqual(describeCapture(null), []);
  });
});
