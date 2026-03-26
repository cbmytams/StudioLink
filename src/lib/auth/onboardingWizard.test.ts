import { test } from 'vitest';
import assert from 'node:assert/strict';

import {
  buildOnboardingProfilePayload,
  createInitialOnboardingDraft,
  getCurrentStepErrors,
  normalizeSkills,
} from './onboardingWizard';

test('createInitialOnboardingDraft hydrates compatibility fields from profile and invitation type', () => {
  const draft = createInitialOnboardingDraft(
    {
      display_name: 'Lina',
      city: 'Paris',
      bio: 'Ingenieure du son specialisee mixage et production musicale en studio parisien.',
      skills: ['Mixage'],
      daily_rate: 320,
    },
    'pro',
  );

  assert.equal(draft.role, 'pro');
  assert.equal(draft.displayName, 'Lina');
  assert.equal(draft.city, 'Paris');
  assert.equal(draft.skills.length, 1);
  assert.equal(draft.dailyRate, '320');
});

test('getCurrentStepErrors enforces role and display name requirements', () => {
  assert.deepEqual(getCurrentStepErrors(1, createInitialOnboardingDraft(null, null)), {
    role: 'Choisis ton type de compte.',
  });

  assert.deepEqual(
    getCurrentStepErrors(2, { ...createInitialOnboardingDraft(null, 'studio'), displayName: '' }),
    { displayName: 'Le nom affiché est requis.' },
  );
});

test('getCurrentStepErrors enforces pro-specific requirements', () => {
  const draft = {
    ...createInitialOnboardingDraft(null, 'pro'),
    displayName: 'Lina',
    bio: 'Trop court',
    skills: [],
    dailyRate: '',
  };

  assert.deepEqual(getCurrentStepErrors(3, draft), {
    bio: 'La présentation doit contenir au moins 50 caractères.',
    skills: 'Ajoute au moins une compétence.',
    dailyRate: 'Le tarif journalier est requis.',
  });
});

test('normalizeSkills trims, deduplicates and caps at five skills', () => {
  assert.deepEqual(
    normalizeSkills([' Mixage ', 'Mastering', 'mixage', 'Podcast', 'Editing', 'Voice', 'Bonus']),
    ['Mixage', 'Mastering', 'Podcast', 'Editing', 'Voice'],
  );
});

test('buildOnboardingProfilePayload writes compatibility fields for studio and pro profiles', () => {
  const studioPayload = buildOnboardingProfilePayload('user-1', {
    ...createInitialOnboardingDraft(null, 'studio'),
    role: 'studio',
    displayName: 'Studio Nova',
    city: 'Paris',
    companyName: 'Studio Nova',
    bio: 'Studio de production et mixage pour artistes independants.',
  });

  assert.equal(studioPayload.id, 'user-1');
  assert.equal(studioPayload.type, 'studio');
  assert.equal(studioPayload.user_type, 'studio');
  assert.equal(studioPayload.display_name, 'Studio Nova');
  assert.equal(studioPayload.full_name, 'Studio Nova');
  assert.equal(studioPayload.onboarding_complete, true);
  assert.equal(studioPayload.onboarding_completed, true);

  const proPayload = buildOnboardingProfilePayload('user-2', {
    ...createInitialOnboardingDraft(null, 'pro'),
    role: 'pro',
    displayName: 'Lina',
    bio: 'Ingenieure du son freelance specialisee en mixage, mastering et prises de voix a Paris.',
    skills: ['Mixage', 'Mastering'],
    dailyRate: '450',
  });

  assert.equal(proPayload.type, 'pro');
  assert.equal(proPayload.daily_rate, 450);
  assert.deepEqual(proPayload.skills, ['Mixage', 'Mastering']);
  assert.equal(proPayload.company_name, null);
});
