import { test } from 'vitest';
import assert from 'node:assert/strict';

import {
  fillLastNDays,
  normalizeProDashboard,
  normalizeStudioDashboard,
} from './analyticsUtils';

test('normalizeStudioDashboard applies defaults and preserves recent missions', () => {
  const dashboard = normalizeStudioDashboard({
    total_missions: 6,
    published_missions: 3,
    pending_applications: 2,
    recent_missions: [
      {
        id: 'mission-1',
        title: 'Session mix',
        status: 'open',
        created_at: '2026-03-25T10:00:00.000Z',
        application_count: 4,
      },
    ],
  });

  assert.equal(dashboard.total_missions, 6);
  assert.equal(dashboard.published_missions, 3);
  assert.equal(dashboard.pending_applications, 2);
  assert.equal(dashboard.total_spent, 0);
  assert.equal(dashboard.rating_avg, null);
  assert.equal(dashboard.rating_count, 0);
  assert.deepEqual(dashboard.recent_missions, [
    {
      id: 'mission-1',
      title: 'Session mix',
      status: 'open',
      created_at: '2026-03-25T10:00:00.000Z',
      application_count: 4,
      session_id: null,
    },
  ]);
});

test('normalizeProDashboard applies defaults and preserves recent applications', () => {
  const dashboard = normalizeProDashboard({
    accepted_applications: 4,
    success_rate: 66.7,
    recent_applications: [
      {
        id: 'application-1',
        status: 'accepted',
        created_at: '2026-03-25T10:00:00.000Z',
        mission_title: 'Mastering EP',
        budget: 450,
      },
    ],
  });

  assert.equal(dashboard.total_applications, 0);
  assert.equal(dashboard.accepted_applications, 4);
  assert.equal(dashboard.success_rate, 66.7);
  assert.equal(dashboard.total_earned, 0);
  assert.deepEqual(dashboard.recent_applications, [
    {
      id: 'application-1',
      status: 'accepted',
      created_at: '2026-03-25T10:00:00.000Z',
      mission_id: '',
      mission_title: 'Mastering EP',
      budget: 450,
      session_id: null,
    },
  ]);
});

test('fillLastNDays returns a continuous 30-day series with missing days set to zero', () => {
  const points = fillLastNDays(
    [
      { day: '2026-03-23', count: 2 },
      { day: '2026-03-25', count: 4 },
    ],
    5,
    new Date('2026-03-25T12:00:00.000Z'),
  );

  assert.equal(points.length, 5);
  assert.deepEqual(points, [
    { day: '2026-03-21', count: 0 },
    { day: '2026-03-22', count: 0 },
    { day: '2026-03-23', count: 2 },
    { day: '2026-03-24', count: 0 },
    { day: '2026-03-25', count: 4 },
  ]);
});
