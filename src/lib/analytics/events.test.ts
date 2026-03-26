import assert from 'node:assert/strict';
import { beforeEach, test, vi } from 'vitest';

const trackMock = vi.hoisted(() => vi.fn());

vi.mock('./posthog', () => ({
  track: trackMock,
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

test('auth and onboarding events map to stable names and payloads', async () => {
  const events = await import('./events');

  events.trackUserRegistered('studio');
  events.trackUserLoggedIn('pro');
  events.trackUserLoggedOut();
  events.trackOnboardingStepCompleted(2, 'pro');
  events.trackOnboardingCompleted('studio', 4);
  events.trackOnboardingAbandoned('pro', 3);

  assert.deepEqual(trackMock.mock.calls[0], ['user_registered', { role: 'studio' }]);
  assert.deepEqual(trackMock.mock.calls[1], ['user_logged_in', { role: 'pro' }]);
  assert.deepEqual(trackMock.mock.calls[2], ['user_logged_out']);
  assert.deepEqual(trackMock.mock.calls[3], ['onboarding_step_completed', { step: 2, role: 'pro' }]);
  assert.deepEqual(trackMock.mock.calls[4], ['onboarding_completed', { role: 'studio', steps_taken: 4 }]);
  assert.deepEqual(trackMock.mock.calls[5], ['onboarding_abandoned', { role: 'pro', step: 3 }]);
});

test('mission and session events map mission and session payload keys', async () => {
  const events = await import('./events');

  events.trackMissionCreated({
    hasDeadline: true,
    skillsCount: 3,
    budgetType: 'fixed',
  });
  events.trackMissionApplied({ fromSearch: true, missionId: 'mission-1' });
  events.trackApplicationAccepted('mission-1');
  events.trackApplicationRejected('mission-2');
  events.trackSessionStarted('session-1');
  events.trackSessionCompleted({ sessionId: 'session-2', durationDays: 12 });
  events.trackFileUploaded('chat');
  events.trackRatingGiven({ score: 5, role: 'studio', sessionId: 'session-3' });

  assert.deepEqual(trackMock.mock.calls[1], ['mission_applied', { fromSearch: true, missionId: 'mission-1' }]);
  assert.deepEqual(trackMock.mock.calls[2], ['application_accepted', { mission_id: 'mission-1' }]);
  assert.deepEqual(trackMock.mock.calls[3], ['application_rejected', { mission_id: 'mission-2' }]);
  assert.deepEqual(trackMock.mock.calls[4], ['session_started', { session_id: 'session-1' }]);
  assert.deepEqual(trackMock.mock.calls[5], ['session_completed', { session_id: 'session-2', duration_days: 12 }]);
  assert.deepEqual(trackMock.mock.calls[6], ['file_uploaded', { context: 'chat' }]);
  assert.deepEqual(trackMock.mock.calls[7], ['rating_given', { score: 5, role: 'studio', sessionId: 'session-3' }]);
});

test('search event truncates query and notification event maps type', async () => {
  const events = await import('./events');
  const longQuery = 'x'.repeat(120);

  events.trackSearchPerformed({
    query: longQuery,
    resultsCount: 9,
    filtersUsed: ['remote', 'audio'],
  });
  events.trackNotificationClicked('application');

  assert.equal(trackMock.mock.calls.length, 2);
  assert.equal((trackMock.mock.calls[0][1] as { query: string }).query.length, 50);
  assert.deepEqual(trackMock.mock.calls[1], ['notification_clicked', { notification_type: 'application' }]);
});
