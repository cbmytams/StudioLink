import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildScopedStoragePath,
  classifyMissionAsset,
  formatFileSize,
  getBucketFromMissionFileType,
  validateStorageFile,
} from './fileUtils';

test('classifyMissionAsset maps audio, image, and document MIME types', () => {
  assert.equal(classifyMissionAsset({ type: 'audio/wav', name: 'take.wav' }), 'audio');
  assert.equal(classifyMissionAsset({ type: 'image/png', name: 'waveform.png' }), 'image');
  assert.equal(classifyMissionAsset({ type: 'application/pdf', name: 'brief.pdf' }), 'document');
});

test('buildScopedStoragePath prefixes scope id and keeps filename safe', () => {
  assert.equal(
    buildScopedStoragePath('mission-123', 'Référence finale V1.wav', 'uuid-1'),
    'mission-123/uuid-1-reference-finale-v1.wav',
  );
});

test('getBucketFromMissionFileType resolves reference and delivery buckets', () => {
  assert.equal(getBucketFromMissionFileType('reference'), 'mission-files');
  assert.equal(getBucketFromMissionFileType('delivery'), 'delivery-files');
});

test('validateStorageFile rejects oversized files and unsupported mime types', () => {
  const tooLarge = validateStorageFile(
    { size: 600 * 1024 * 1024, type: 'audio/wav', name: 'mix.wav' },
    { accept: 'audio/*,.pdf,.zip', maxSizeMb: 500 },
  );
  assert.equal(tooLarge.ok, false);
  assert.match(tooLarge.error ?? '', /500 Mo/i);

  const unsupported = validateStorageFile(
    { size: 2 * 1024 * 1024, type: 'video/mp4', name: 'clip.mp4' },
    { accept: 'audio/*,.pdf,.zip', maxSizeMb: 500 },
  );
  assert.equal(unsupported.ok, false);
  assert.match(unsupported.error ?? '', /format/i);
});

test('formatFileSize returns readable French labels', () => {
  assert.equal(formatFileSize(512), '512 o');
  assert.equal(formatFileSize(12_800), '12,5 Ko');
  assert.equal(formatFileSize(5_242_880), '5,0 Mo');
});
