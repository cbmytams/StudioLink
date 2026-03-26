import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
  buildMissionWritePayload,
  countApplicationRows,
  normalizeMissionStatus,
} from './phase1Compat';

test('normalizeMissionStatus keeps modern values and maps legacy ones', () => {
  assert.equal(normalizeMissionStatus('open'), 'open');
  assert.equal(normalizeMissionStatus('published'), 'open');
  assert.equal(normalizeMissionStatus('filled'), 'in_progress');
  assert.equal(normalizeMissionStatus('rated'), 'completed');
  assert.equal(normalizeMissionStatus('closed'), 'cancelled');
  assert.equal(normalizeMissionStatus(null), 'draft');
});

test('countApplicationRows reads relational count rows safely', () => {
  assert.equal(countApplicationRows([{ count: 3 }]), 3);
  assert.equal(countApplicationRows([]), 0);
  assert.equal(countApplicationRows(null), 0);
});

test('buildMissionWritePayload writes modern and legacy mission fields together', () => {
  const payload = buildMissionWritePayload({
    studioId: 'studio-id',
    title: '  Mission photo  ',
    description: '  Shooting packshot  ',
    category: 'Photo',
    location: 'Paris 11e',
    city: '',
    date: '2026-03-30',
    endDate: '2026-03-31',
    dailyRate: '450',
    skillsRequired: ['Lumière', 'Retouche'],
    status: 'open',
  });

  assert.deepEqual(payload, {
    studio_id: 'studio-id',
    title: 'Mission photo',
    description: 'Shooting packshot',
    category: 'Photo',
    location: 'Paris 11e',
    city: 'Paris 11e',
    date: '2026-03-30',
    end_date: '2026-03-31',
    daily_rate: 450,
    skills_required: ['Lumière', 'Retouche'],
    status: 'open',
    service_type: 'Photo',
    genres: ['Lumière', 'Retouche'],
    price: '450 €/j',
  });
});
