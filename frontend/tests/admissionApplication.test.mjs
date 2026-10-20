import test from 'node:test';
import assert from 'node:assert/strict';
import { activeAdmissionForPeriod, selectAdmissionForPeriod } from '../src/services/admissionApplication.js';

test('an approved record remains visible when a newer legacy duplicate is pending', () => {
  const records = [{ id: 3, admission_period_id: 1, status: 'pending' }, { id: 2, admission_period_id: 1, status: 'approved' }];
  assert.equal(selectAdmissionForPeriod(records, '1').id, 2);
  assert.equal(activeAdmissionForPeriod(records, 1).id, 2);
});

test('rejected, withdrawn and earlier-period applications do not block a new current-period submission', () => {
  const records = [{ id: 4, admission_period_id: 2, status: 'rejected' }, { id: 3, admission_period_id: 2, status: 'withdrawn' }, { id: 2, admission_period_id: 1, status: 'approved' }];
  assert.equal(activeAdmissionForPeriod(records, 2), null);
  assert.equal(selectAdmissionForPeriod(records, 2).id, 4);
  assert.equal(selectAdmissionForPeriod(records, 3).id, 4);
  assert.equal(activeAdmissionForPeriod(records, null), null);
  assert.equal(selectAdmissionForPeriod([], 2), null);
});
