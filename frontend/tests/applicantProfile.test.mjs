import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProfile, profileCompletion, requiredProfileFields } from '../src/services/applicantProfile.js';

test('completion uses the seven required registration details and excludes optional fields', () => {
  const profile = Object.fromEntries(requiredProfileFields.map(([key]) => [key, 'Provided']));
  assert.equal(profileCompletion(profile).percent, 100);
  assert.equal(profileCompletion({ ...profile, profilePhoto: null, lrn: '' }).percent, 100);
  assert.equal(profileCompletion({ ...profile, address: '   ' }).percent, 86);
  assert.deepEqual(profileCompletion({ ...profile, address: '' }).missing, [['address', 'Address']]);
  assert.equal(profileCompletion(null).percent, 0);
});

test('normalization retains saved education and leading zeros and accepts explicitly cleared fields', () => {
  const result = normalizeProfile({ user: { email: 'applicant@example.test' }, applicant: {
    first_name: 'Applicant', phone: null, address: null, lrn: '001234567890',
    primary_school_year: '2018', senior_high_school: 'Saved school', birth_date: '2007-06-15T00:00:00Z',
  } });
  assert.equal(result.phone, '');
  assert.equal(result.address, '');
  assert.equal(result.lrn, '001234567890');
  assert.equal(result.primary_school_year, '2018');
  assert.equal(result.senior_high_school, 'Saved school');
  assert.equal(result.birth_date, '2007-06-15');
  assert.equal(result.email, 'applicant@example.test');
});
