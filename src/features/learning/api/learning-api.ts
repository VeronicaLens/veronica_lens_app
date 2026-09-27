import type {
  Lesson,
  LessonProgress,
  LearningTrack,
  LessonProgressResponse,
  LessonProgressListResponse,
  LearningProgressStatus,
  LearningTracksResponse,
  LessonsResponse,
} from '../../../shared/api/index.ts';
import { apiRequest } from '../../../shared/api/index.ts';

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

export async function getLearningTracks(
  accessToken: string,
  request: Request = apiRequest,
): Promise<LearningTrack[]> {
  return (
    await request<LearningTracksResponse>('/learning/tracks', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  ).data;
}

export async function getLessons(
  accessToken: string,
  trackId: string,
  request: Request = apiRequest,
): Promise<Lesson[]> {
  return (
    await request<LessonsResponse>(`/learning/tracks/${trackId}/lessons`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  ).data;
}

export async function getLearningProgress(
  accessToken: string,
  request: Request = apiRequest,
): Promise<LessonProgress[]> {
  return (
    await request<LessonProgressListResponse>('/learning/progress', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  ).data;
}

export async function upsertLessonProgress(
  accessToken: string,
  lessonId: string,
  input: { status: LearningProgressStatus; progressPercent: number },
  request: Request = apiRequest,
): Promise<LessonProgress> {
  return (
    await request<LessonProgressResponse>(`/learning/lessons/${lessonId}/progress`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(input),
    })
  ).data;
}
