import test from 'node:test';
import assert from 'node:assert/strict';
import { examDateInput, isUpcomingScheduledExam, parseExamDate } from '../src/services/examSchedule.js';

test('Laravel date-only and ISO timestamps produce the same local calendar date', () => {
  for (const value of ['2026-11-01', '2026-11-01T00:00:00.000000Z']) {
    assert.equal(examDateInput(value), '2026-11-01');
    const date = parseExamDate(value);
    assert.equal(date.getFullYear(), 2026);
    assert.equal(date.getMonth(), 10);
    assert.equal(date.getDate(), 1);
    assert.equal(date.getHours(), 0);
  }
});

test('invalid dates never appear as valid date input values', () => {
  for (const value of [null, '', 'bad-date', '2026-02-31', '2026-13-01', '2026-02-29']) {
    assert.equal(examDateInput(value), '');
    assert.equal(parseExamDate(value), null);
  }
  assert.equal(examDateInput('2028-02-29T00:00:00Z'), '2028-02-29');
});

test('upcoming status uses the local calendar day and existing active flag', () => {
  const today = new Date(2026, 10, 1, 23, 59);
  assert.equal(isUpcomingScheduledExam({ exam_date: '2026-11-01T00:00:00.000000Z', is_active: true }, today), true);
  assert.equal(isUpcomingScheduledExam({ exam_date: '2026-10-31', is_active: true }, today), false);
  assert.equal(isUpcomingScheduledExam({ exam_date: '2026-11-02', is_active: false }, today), false);
  assert.equal(isUpcomingScheduledExam({ exam_date: '', is_active: true }, today), false);
});
