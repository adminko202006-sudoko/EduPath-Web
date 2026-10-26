import test from 'node:test';
import assert from 'node:assert/strict';
import { hasRecordedEntranceScore, isFheScholarship, needsEntranceExamReview, summarizeEntranceExamRecords } from '../src/utils/entranceExamReview.js';

test('FHE records remain visible for entrance-exam review even when misclassified as Other', () => {
  assert.equal(needsEntranceExamReview({ name: 'Free Higher Education (FHE)', category: 'other', requires_online_exam: true }), true);
  assert.equal(needsEntranceExamReview({ name: 'Another program', requires_face_to_face_exam: true }), true);
  assert.equal(needsEntranceExamReview({ name: 'TES', requires_face_to_face_exam: false }), false);
  assert.equal(needsEntranceExamReview(null), false);
  assert.equal(isFheScholarship({ name: 'Another program', requires_face_to_face_exam: true }), false);
  assert.equal(isFheScholarship({ name: 'Support', program_type: 'Free Higher Education' }), true);
  assert.equal(isFheScholarship(null), false);
});

test('a zero score is a recorded score; blank, null and invalid values are not', () => {
  for (const score of [0, '0.00', 75]) assert.equal(hasRecordedEntranceScore({ score }), true);
  for (const score of [null, undefined, '', ' ', 'invalid']) assert.equal(hasRecordedEntranceScore({ score }), false);
});

test('scheduled, absent and unscored records do not become completed results', () => {
  const summary = summarizeEntranceExamRecords([
    { status: 'scheduled', score: 80 },
    { status: 'absent', score: null },
    { status: 'completed', score: null },
  ]);
  assert.deepEqual(summary, { total: 3, completedScored: 0, releasedScored: 0 });
});

test('result release is counted separately and no pass or scholarship eligibility is inferred', () => {
  assert.deepEqual(summarizeEntranceExamRecords([
    { status: 'completed', score: 0, entrance_exam: { results_released_at: '2026-10-20T00:00:00Z' } },
    { status: 'completed', score: 90, entrance_exam: { results_released_at: null } },
  ]), { total: 2, completedScored: 2, releasedScored: 1 });
  assert.deepEqual(summarizeEntranceExamRecords([]), { total: 0, completedScored: 0, releasedScored: 0 });
});
