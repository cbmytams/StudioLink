import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getDashboardPath,
  isProfileIncomplete,
  resolveProfileType,
} from './profileCompleteness';

test('resolveProfileType accepts type and user_type compatibility fields', () => {
  assert.equal(resolveProfileType({ user_type: 'studio' }), 'studio');
  assert.equal(resolveProfileType({ type: 'pro' }), 'pro');
  assert.equal(resolveProfileType({ type: 'admin' }), null);
  assert.equal(resolveProfileType(null), null);
});

test('isProfileIncomplete requires a display name and a valid role', () => {
  assert.equal(isProfileIncomplete(null), true);
  assert.equal(isProfileIncomplete({ type: 'studio' }), true);
  assert.equal(isProfileIncomplete({ display_name: 'Studio Nova' }), true);
  assert.equal(isProfileIncomplete({ display_name: 'Studio Nova', type: 'studio' }), false);
});

test('isProfileIncomplete requires a bio for pro profiles only', () => {
  assert.equal(
    isProfileIncomplete({ display_name: 'Lina', type: 'pro', bio: '' }),
    true,
  );
  assert.equal(
    isProfileIncomplete({ display_name: 'Lina', type: 'pro', bio: 'Ingé son indépendante' }),
    false,
  );
  assert.equal(
    isProfileIncomplete({ display_name: 'Studio Nova', type: 'studio', bio: '' }),
    false,
  );
});

test('getDashboardPath resolves role dashboards and falls back to onboarding-safe home', () => {
  assert.equal(getDashboardPath('studio'), '/studio/dashboard');
  assert.equal(getDashboardPath('pro'), '/pro/dashboard');
  assert.equal(getDashboardPath(null), '/');
});
