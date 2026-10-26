import test from 'node:test';
import assert from 'node:assert/strict';
import { onlineExamClock } from '../src/services/onlineExamClock.js';

const start = Date.parse('2026-10-20T09:00:00Z');
const attempt = { navigation_enabled: true, question_count: 100, seconds_per_question: 60,
  started_at: new Date(start).toISOString(), expires_at: new Date(start + 6000000).toISOString(),
  active_question_index: 1, current_question_index: 1 };

test('early next receives unused time without reducing or extending the overall deadline', () => {
  const clock = onlineExamClock(attempt, start + 20000);
  assert.equal(clock.questionIndex, 1);
  assert.equal(clock.questionRemaining, 100);
  assert.equal(clock.overallRemaining, 5980);
});

test('review switches to the active question at exactly 25 seconds while preserving the timer', () => {
  const review = { ...attempt, current_question_index: 0 };
  assert.equal(onlineExamClock(review, start + 94999).questionIndex, 0);
  const boundary = onlineExamClock(review, start + 95000);
  assert.equal(boundary.questionRemaining, 25);
  assert.equal(boundary.questionIndex, 1);
  assert.equal(boundary.reviewing, false);
});

test('elapsed server time advances during interruptions and legacy attempts retain fixed slots', () => {
  assert.equal(onlineExamClock(attempt, start + 180000).activeIndex, 3);
  assert.equal(onlineExamClock({ ...attempt, navigation_enabled: false }, start + 20000).questionIndex, 0);
  assert.equal(onlineExamClock(attempt, start + 6000000).overallRemaining, 0);
  assert.equal(onlineExamClock(attempt, start + 6000000).questionRemaining, 0);
});


test('configured review cutoff returns to the active question at its saved time limit', () => {
  const review = { ...attempt, current_question_index: 0, review_cutoff_seconds: 60 };
  assert.equal(onlineExamClock(review, start + 59999).questionIndex, 0);
  const boundary = onlineExamClock(review, start + 60000);
  assert.equal(boundary.questionRemaining, 60);
  assert.equal(boundary.questionIndex, 1);
  assert.equal(boundary.reviewing, false);
});

test('custom question count clamps progression and expires at its saved deadline', () => {
  const short = { ...attempt, question_count: 3, seconds_per_question: 10,
    review_cutoff_seconds: 10, expires_at: new Date(start + 30000).toISOString() };
  assert.equal(onlineExamClock(short, start + 20000).activeIndex, 2);
  assert.equal(onlineExamClock(short, start + 30000).overallRemaining, 0);
  assert.equal(onlineExamClock(short, start + 30000).questionRemaining, 0);
});
