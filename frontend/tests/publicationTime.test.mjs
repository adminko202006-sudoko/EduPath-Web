import test from 'node:test';
import assert from 'node:assert/strict';
import { publicationTimeForInput, publicationTimeToUtc } from '../src/services/publicationTime.js';

test('Philippine local publication time becomes the correct UTC instant and edits round-trip', () => {
  const previous = process.env.TZ;
  process.env.TZ = 'Asia/Manila';
  try {
    assert.equal(publicationTimeToUtc('2026-10-20T16:47'), '2026-10-20T08:47:00.000Z');
    assert.equal(publicationTimeForInput('2026-10-20T08:47:00.000000Z'), '2026-10-20T16:47');
    assert.equal(publicationTimeForInput('2026-10-20T23:30:00Z'), '2026-10-21T07:30');
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test('a blank time requests immediate publication and malformed times cannot be submitted', () => {
  assert.equal(publicationTimeToUtc(''), null);
  assert.equal(publicationTimeForInput(null), '');
  assert.equal(publicationTimeForInput('invalid'), '');
  assert.throws(() => publicationTimeToUtc('invalid'), /valid publication/);
});
