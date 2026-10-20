import type {
  ObservationCaptureSummary,
  ObservationHistoryItem,
  ObservationHistoryPhoto,
} from '../../../shared/api/index.ts';
import { categorizeObservation, type ObservationCategory } from './observation-category.ts';

export type GalleryGrouping = 'day' | 'month' | 'year';

export interface GalleryPhoto {
  id: string;
  uri: string | null;
  takenAt: string;
  observation: ObservationHistoryItem;
  photo: ObservationHistoryPhoto | null;
}

export interface GallerySection {
  key: string;
  title: string;
  photos: GalleryPhoto[];
}

export interface PhotoGallery {
  photos: GalleryPhoto[];
  sections: GallerySection[];
}

export interface CaptureDetail {
  label: string;
  value: string;
}

/**
 * Flattens observations into individual photos (newest first) and groups them by local
 * calendar day, month or year. Observations without media keep a placeholder tile.
 */
export function buildPhotoGallery(
  observations: readonly ObservationHistoryItem[],
  options: {
    grouping: GalleryGrouping;
    category?: ObservationCategory | 'all';
    now?: Date;
  },
): PhotoGallery {
  const now = options.now ?? new Date();
  const category = options.category ?? 'all';
  const photos = observations
    .filter((observation) => category === 'all' || categorizeObservation(observation) === category)
    .flatMap<GalleryPhoto>((observation) =>
      observation.photos.length > 0
        ? observation.photos.map((photo) => ({
            id: photo.id,
            uri: photo.thumbnailUrl,
            takenAt: photo.capturedAt ?? observation.observedAt,
            observation,
            photo,
          }))
        : [
            {
              id: `${observation.id}:empty`,
              uri: null,
              takenAt: observation.observedAt,
              observation,
              photo: null,
            },
          ],
    )
    .filter((photo) => Number.isFinite(Date.parse(photo.takenAt)))
    .sort((left, right) => Date.parse(right.takenAt) - Date.parse(left.takenAt));

  const sections: GallerySection[] = [];
  for (const photo of photos) {
    const takenAt = new Date(photo.takenAt);
    const key = groupKey(takenAt, options.grouping);
    const current = sections.at(-1);
    if (current?.key === key) {
      current.photos.push(photo);
    } else {
      sections.push({ key, title: groupTitle(takenAt, options.grouping, now), photos: [photo] });
    }
  }

  return { photos, sections };
}

export function describeCapture(capture: ObservationCaptureSummary | null): CaptureDetail[] {
  if (!capture) return [];
  const details: CaptureDetail[] = [
    { label: 'ISO', value: capture.iso === null ? 'Auto' : `${Math.round(capture.iso)}` },
    {
      label: 'Tempo',
      value:
        capture.exposureTimeSeconds === null ? 'Auto' : formatShutter(capture.exposureTimeSeconds),
    },
    { label: 'Foco', value: formatFocus(capture) },
    {
      label: 'WB',
      value:
        capture.whiteBalanceKelvin === null ? 'Auto' : `${Math.round(capture.whiteBalanceKelvin)}K`,
    },
  ];
  if (capture.exposureCompensationEv !== null && capture.exposureCompensationEv !== 0) {
    const ev = Number(capture.exposureCompensationEv.toFixed(1)).toLocaleString('pt-BR');
    details.push({
      label: 'Exposição',
      value: `${capture.exposureCompensationEv > 0 ? '+' : ''}${ev} EV`,
    });
  }
  if (capture.deviceName) details.push({ label: 'Câmera', value: capture.deviceName });
  return details;
}

function groupKey(date: Date, grouping: GalleryGrouping): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  if (grouping === 'year') return `${year}`;
  if (grouping === 'month') return `${year}-${month}`;
  return `${year}-${month}-${day}`;
}

function groupTitle(date: Date, grouping: GalleryGrouping, now: Date): string {
  if (grouping === 'year') return `${date.getFullYear()}`;
  if (grouping === 'month') {
    return capitalize(
      new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date),
    );
  }

  const today = startOfDay(now);
  const dayDifference = Math.round((today - startOfDay(date)) / 86_400_000);
  if (dayDifference === 0) return 'Hoje';
  if (dayDifference === 1) return 'Ontem';
  return capitalize(
    new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
    }).format(date),
  );
}

function formatFocus(capture: ObservationCaptureSummary): string {
  if (capture.focusMode === 'manual' && capture.focusLensPosition !== null) {
    return capture.focusLensPosition >= 0.99 ? 'Infinito ∞' : 'Manual';
  }
  if (capture.focusMode === 'center-metering') return 'Auto (centro)';
  return 'Auto';
}

function formatShutter(seconds: number): string {
  if (seconds >= 1) return `${Number(seconds.toFixed(1)).toLocaleString('pt-BR')} s`;
  return `1/${Math.round(1 / seconds)} s`;
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function capitalize(value: string): string {
  return value.charAt(0).toLocaleUpperCase('pt-BR') + value.slice(1);
}
