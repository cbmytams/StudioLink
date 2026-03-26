import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSignupEmailRedirect,
  extractClaimSuccess,
  getAuthMode,
  getInvitationContext,
} from './invitationFlow';

test('getInvitationContext prefers route state when present', () => {
  const context = getInvitationContext({
    routeCode: 'pro2024',
    routeType: 'pro',
    routeEmail: 'route@example.com',
    storageCode: 'STUDIO2024',
    storageType: 'studio',
    storageEmail: 'studio@example.com',
  });

  assert.deepEqual(context, {
    code: 'PRO2024',
    type: 'pro',
    email: 'route@example.com',
  });
});

test('getInvitationContext returns session storage values when present', () => {
  const context = getInvitationContext({
    storageCode: ' studio2024 ',
    storageType: 'studio',
    storageEmail: 'studio@example.com',
    userMetadata: {
      invitation_code: 'PRO2024',
      invitation_type: 'pro',
      invitation_email: 'pro@example.com',
    },
  });

  assert.deepEqual(context, {
    code: 'STUDIO2024',
    type: 'studio',
    email: 'studio@example.com',
  });
});

test('getInvitationContext falls back to user metadata when storage is missing', () => {
  const context = getInvitationContext({
    storageCode: null,
    storageType: null,
    storageEmail: null,
    userMetadata: {
      invitationCode: 'pro2024',
      invitationType: 'pro',
      invitationEmail: 'pro@example.com',
    },
  });

  assert.deepEqual(context, {
    code: 'PRO2024',
    type: 'pro',
    email: 'pro@example.com',
  });
});

test('buildSignupEmailRedirect targets auth callback onboarding route', () => {
  assert.equal(
    buildSignupEmailRedirect('https://studiolink-paris.vercel.app'),
    'https://studiolink-paris.vercel.app/auth/callback?next=%2Fonboarding',
  );
});

test('getAuthMode uses route state or query string signup hint', () => {
  assert.equal(getAuthMode('signup', null), 'signup');
  assert.equal(getAuthMode(null, 'signup'), 'signup');
  assert.equal(getAuthMode(null, null), 'signin');
});

test('extractClaimSuccess accepts both boolean and rpc object payloads', () => {
  assert.equal(extractClaimSuccess(true), true);
  assert.equal(extractClaimSuccess({ claimed: true }), true);
  assert.equal(extractClaimSuccess({ claimed: false }), false);
  assert.equal(extractClaimSuccess(null), false);
});
