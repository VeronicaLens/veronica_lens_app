import type {
  DeleteObservationPhotoResponse,
  ObservationHistoryResponse,
} from '../../../shared/api/index.ts';
import { apiRequest } from '../../../shared/api/index.ts';

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

export async function getObservationHistory(
  accessToken: string,
  page = 1,
  pageSize = 20,
  request: Request = apiRequest,
): Promise<ObservationHistoryResponse> {
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return await request<ObservationHistoryResponse>(`/observations?${query.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function deleteObservationPhoto(
  accessToken: string,
  observationId: string,
  photoId: string,
  request: Request = apiRequest,
): Promise<DeleteObservationPhotoResponse['data']> {
  const response = await request<DeleteObservationPhotoResponse>(
    `/observations/${encodeURIComponent(observationId)}/photos/${encodeURIComponent(photoId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  return response.data;
}

export async function deleteObservation(
  accessToken: string,
  observationId: string,
  request: Request = apiRequest,
): Promise<void> {
  await request<void>(`/observations/${encodeURIComponent(observationId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
