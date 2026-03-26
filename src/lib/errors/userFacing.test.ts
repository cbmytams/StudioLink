import { test } from 'vitest';
import assert from 'node:assert/strict';

import { toUserFacingErrorMessage } from './userFacing';

test('maps known auth errors to user-friendly messages', () => {
  assert.equal(
    toUserFacingErrorMessage(new Error('Invalid login credentials'), 'Connexion impossible.'),
    'Email ou mot de passe incorrect.',
  );

  assert.equal(
    toUserFacingErrorMessage(new Error('Email not confirmed'), 'Connexion impossible.'),
    'Confirmez votre adresse email avant de vous connecter.',
  );
});

test('falls back when an internal database error would leak implementation details', () => {
  assert.equal(
    toUserFacingErrorMessage(new Error('relation "profiles" does not exist'), 'Une erreur est survenue.'),
    'Une erreur est survenue.',
  );
});

test('preserves already user-friendly messages', () => {
  assert.equal(
    toUserFacingErrorMessage(new Error('Code invalide ou introuvable'), 'Une erreur est survenue.'),
    'Code invalide ou introuvable',
  );
});
