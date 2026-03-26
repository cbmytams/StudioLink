import test from 'node:test';
import assert from 'node:assert/strict';
import { detectChatFileType, normalizeChatMessageRow } from './chatUtils';

test('detectChatFileType classifies audio, image and documents', () => {
  assert.equal(detectChatFileType({ type: 'audio/mpeg', name: 'voice-note.mp3' }), 'audio');
  assert.equal(detectChatFileType({ type: 'image/png', name: 'preview.png' }), 'image');
  assert.equal(detectChatFileType({ type: 'application/pdf', name: 'brief.pdf' }), 'document');
});

test('normalizeChatMessageRow prefers session chat fields and keeps legacy read compatibility', () => {
  const row = normalizeChatMessageRow({
    id: 'message-1',
    session_id: 'session-1',
    sender_id: 'user-1',
    content: 'Bonjour',
    file_url: null,
    file_name: null,
    file_type: null,
    is_read: null,
    read: false,
    read_at: '2026-03-25T10:00:00.000Z',
    created_at: '2026-03-25T09:00:00.000Z',
  });

  assert.deepEqual(row, {
    id: 'message-1',
    session_id: 'session-1',
    sender_id: 'user-1',
    content: 'Bonjour',
    file_url: null,
    file_name: null,
    file_type: null,
    is_read: true,
    created_at: '2026-03-25T09:00:00.000Z',
  });
});
