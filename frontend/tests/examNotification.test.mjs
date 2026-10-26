import test from 'node:test';
import assert from 'node:assert/strict';
import { isOnlineExamNotification } from '../src/services/examNotification.js';

test('online exam destination supports current and existing notices without redirecting entrance exams', () => {
  assert.equal(isOnlineExamNotification({ destination: 'online_exam' }), true);
  assert.equal(isOnlineExamNotification({ type: 'exam', title: 'Online examination result released' }), true);
  assert.equal(isOnlineExamNotification({ type: 'exam', message: 'Open Online Scholarship Examination' }), true);
  assert.equal(isOnlineExamNotification({ type: 'exam', title: 'Entrance examination schedule' }), false);
  assert.equal(isOnlineExamNotification({ type: 'announcement', message: 'Online examination reminder' }), false);
});
