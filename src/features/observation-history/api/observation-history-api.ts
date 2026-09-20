import type { ObservationHistoryResponse } from '../../../shared/api/index.ts';
import { apiRequest } from '../../../shared/api/index.ts';

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

export async function getObservationHistory(
  accessToken: string,
  request: Request = apiRequest,
): Promise<ObservationHistoryResponse['data']> {
  const response = await request<ObservationHistoryResponse>('/observations', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}
