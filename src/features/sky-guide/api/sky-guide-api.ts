import type {
  SkyGuideObjectPosition,
  SkyGuidePositionsRequest,
  SkyGuidePositionsResponse,
} from '../../../shared/api/index.ts';
import { apiRequest } from '../../../shared/api/index.ts';

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

export interface SkyGuidePositionsResult {
  positions: SkyGuideObjectPosition[];
  unavailableObjectIds: string[];
}

export async function getSkyGuidePositions(
  accessToken: string,
  input: SkyGuidePositionsRequest,
  request: Request = apiRequest,
): Promise<SkyGuidePositionsResult> {
  const response = await request<SkyGuidePositionsResponse>('/sky-guide/positions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  });

  return {
    positions: response.data,
    unavailableObjectIds: response.meta.unavailableObjectIds,
  };
}
