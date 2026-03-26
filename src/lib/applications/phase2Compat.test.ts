import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
  buildApplicationWritePayload,
  formatApplicationInsertError,
  normalizeApplicationStatus,
} from './phase2Compat';

test('normalizeApplicationStatus maps legacy selected to accepted', () => {
  assert.equal(normalizeApplicationStatus('pending'), 'pending');
  assert.equal(normalizeApplicationStatus('accepted'), 'accepted');
  assert.equal(normalizeApplicationStatus('selected'), 'accepted');
  assert.equal(normalizeApplicationStatus('rejected'), 'rejected');
  assert.equal(normalizeApplicationStatus(null), 'pending');
});

test('buildApplicationWritePayload writes canonical and legacy fields together', () => {
  assert.deepEqual(
    buildApplicationWritePayload({
      missionId: 'mission-id',
      proId: 'pro-id',
      coverLetter: '  Je suis disponible dès lundi.  ',
    }),
    {
      mission_id: 'mission-id',
      pro_id: 'pro-id',
      cover_letter: 'Je suis disponible dès lundi.',
      message: 'Je suis disponible dès lundi.',
      status: 'pending',
    },
  );
});

test('formatApplicationInsertError returns a friendly duplicate message', () => {
  assert.equal(
    formatApplicationInsertError({
      code: '23505',
      message: 'duplicate key value violates unique constraint "applications_mission_id_pro_id_key"',
    }),
    'Vous avez déjà candidaté à cette mission.',
  );
});
