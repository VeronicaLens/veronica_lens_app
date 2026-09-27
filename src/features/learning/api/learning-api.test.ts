import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { LearningTracksResponse, LessonProgressResponse } from '../../../shared/api/index.ts';
import { getLearningTracks, upsertLessonProgress } from './learning-api.ts';

describe('getLearningTracks', () => {
  it('requests published tracks through the authenticated backend', async () => {
    let path = '';
    let init: RequestInit | undefined;
    const response: LearningTracksResponse = { data: [] };
    const request = <T>(receivedPath: string, receivedInit?: RequestInit) => {
      path = receivedPath;
      init = receivedInit;
      return Promise.resolve(response as T);
    };

    await getLearningTracks('token', request);

    assert.equal(path, '/learning/tracks');
    assert.deepEqual(init?.headers, { Authorization: 'Bearer token' });
  });
});

describe('upsertLessonProgress', () => {
  it('sends the status and progress to the authenticated backend', async () => {
    let path = '';
    let init: RequestInit | undefined;
    const response: LessonProgressResponse = {
      data: {
        lessonId: 'lesson-1',
        status: 'completed',
        progressPercent: 100,
        completedAt: '2026-09-05T12:00:00.000Z',
      },
    };
    const request = <T>(receivedPath: string, receivedInit?: RequestInit) => {
      path = receivedPath;
      init = receivedInit;
      return Promise.resolve(response as T);
    };

    const result = await upsertLessonProgress(
      'token',
      'lesson-1',
      { status: 'completed', progressPercent: 100 },
      request,
    );

    assert.equal(path, '/learning/lessons/lesson-1/progress');
    assert.equal(init?.method, 'PUT');
    assert.deepEqual(JSON.parse(String(init?.body)), {
      status: 'completed',
      progressPercent: 100,
    });
    assert.equal(result.status, 'completed');
  });
});
