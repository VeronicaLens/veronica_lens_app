import type {
  ObservationRecommendation,
  ObservationRecommendationRequest,
  ObservationRecommendationResponse,
} from '../../../shared/api/index.ts';
import { apiRequest } from '../../../shared/api/index.ts';

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

export async function getObservationRecommendation(
  accessToken: string,
  input: ObservationRecommendationRequest,
  request: Request = apiRequest,
): Promise<ObservationRecommendation> {
  const response = await request<ObservationRecommendationResponse>(
    '/planning/observation-window',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(input),
    },
  );
  return response.data;
}
