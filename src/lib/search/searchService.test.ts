import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildURL,
  parseFiltersFromURL,
  parseProFiltersFromURL,
} from './searchService';

test('parseFiltersFromURL reads mission filters and normalizes numbers', () => {
  const filters = parseFiltersFromURL(
    new URLSearchParams('q=mix%20rock&genre=Hip-Hop&location=Paris&budget_min=200&budget_max=800'),
  );

  assert.deepEqual(filters, {
    query: 'mix rock',
    genre: 'Hip-Hop',
    location: 'Paris',
    budgetMin: 200,
    budgetMax: 800,
  });
});

test('parseProFiltersFromURL reads pro filters and ignores empty values', () => {
  const filters = parseProFiltersFromURL(
    new URLSearchParams('q=ing%C3%A9%20son&location=Lyon&skill=Mixage'),
  );

  assert.deepEqual(filters, {
    query: 'ingé son',
    location: 'Lyon',
    skill: 'Mixage',
  });
});

test('buildURL omits empty values and preserves valid filters', () => {
  assert.equal(
    buildURL({
      query: 'mix rock',
      genre: 'Hip-Hop',
      location: '',
      budgetMin: 150,
      budgetMax: undefined,
      page: 2,
    }),
    '?q=mix+rock&genre=Hip-Hop&budget_min=150&page=2',
  );
});
