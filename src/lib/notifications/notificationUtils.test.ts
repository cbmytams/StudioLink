import test from 'node:test';
import assert from 'node:assert/strict';

import { getNotificationTarget } from './notificationUtils';

test('getNotificationTarget routes chat-centric notifications to the session chat', () => {
  assert.equal(
    getNotificationTarget({
      type: 'application_accepted',
      data: { sessionId: 'session-123', missionId: 'mission-123' },
    }),
    '/chat/session-123',
  );

  assert.equal(
    getNotificationTarget({
      type: 'new_message',
      data: { sessionId: 'session-456' },
    }),
    '/chat/session-456',
  );

  assert.equal(
    getNotificationTarget({
      type: 'delivery_uploaded',
      data: { sessionId: 'session-789', fileId: 'file-1' },
    }),
    '/chat/session-789',
  );
});

test('getNotificationTarget falls back to mission and notifications routes when no session is available', () => {
  assert.equal(
    getNotificationTarget({
      type: 'new_application',
      data: { missionId: 'mission-abc' },
    }),
    '/studio/missions/mission-abc/applications',
  );

  assert.equal(
    getNotificationTarget({
      type: 'application_rejected',
      data: { missionId: 'mission-def' },
    }),
    '/missions/mission-def',
  );

  assert.equal(
    getNotificationTarget({
      type: 'session_completed',
      data: {},
    }),
    '/notifications',
  );
});
