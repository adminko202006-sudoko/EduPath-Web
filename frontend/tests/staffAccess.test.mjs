import test from 'node:test';
import assert from 'node:assert/strict';
import { STAFF_FEATURES, canAccessStaffPath, hasStaffPermission, staffAccessKey } from '../src/services/staffAccess.js';

const account = (permissions = {}) => ({ id: 9, role: 'staff', staff: { status: 'active', permissions, academic_programs: [{ id: 2 }] } });

test('each real Staff route uses exactly its saved permission', () => {
  for (const feature of STAFF_FEATURES) {
    const user = account({ [feature.permission]: true });
    assert.equal(canAccessStaffPath(user, feature.path), true);
    assert.equal(canAccessStaffPath(user, `${feature.path}/12`), true);
    for (const other of STAFF_FEATURES.filter((f) => f !== feature)) assert.equal(canAccessStaffPath(user, other.path), false);
  }
  assert.equal(STAFF_FEATURES.length, 8);
});

test('fail closed for inactive, missing profiles, wrong roles and malformed permission flags', () => {
  const path = '/staff/documents';
  for (const user of [null, { role: 'staff' }, { ...account({ verify_documents: true }), role: 'applicant' }, { ...account(), staff: { status: 'inactive', permissions: { verify_documents: true } } }, account({ verify_documents: 'false' }), account({ documents: true })]) assert.equal(canAccessStaffPath(user, path), false);
  assert.equal(hasStaffPermission(account(), 'verify_documents'), false);
  assert.equal(canAccessStaffPath(account(), '/staff/profile'), true);
});

test('cache identity changes on revocation, status or scope changes but not ordinary profile edits', () => {
  const user = account({ manage_admissions: true });
  const key = staffAccessKey(user);
  assert.equal(staffAccessKey({ ...user, name: 'Updated name' }), key);
  assert.notEqual(staffAccessKey(account()), key);
  assert.notEqual(staffAccessKey({ ...user, staff: { ...user.staff, status: 'inactive' } }), key);
  assert.notEqual(staffAccessKey({ ...user, staff: { ...user.staff, academic_programs: [{ id: 3 }] } }), key);
  const programs = [{ id: 1 }, { id: 2 }];
  assert.equal(staffAccessKey({ ...user, staff: { ...user.staff, academic_programs: programs } }), staffAccessKey({ ...user, staff: { ...user.staff, academic_programs: [...programs].reverse() } }));
});
