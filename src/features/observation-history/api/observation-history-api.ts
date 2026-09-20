import type { ObservationHistoryResponse } from '../../../shared/api/index.ts';
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
