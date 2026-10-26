import test from 'node:test';
import assert from 'node:assert/strict';
import { groupApplicantDocuments } from '../src/services/applicantDocumentGroups.js';

test('groups an applicant across applications without combining people with the same name', () => {
  const documents = [
    { id: 1, admission_application: { id: 10, applicant_id: 5, applicant: { first_name: 'Alex' } } },
    { id: 2, admission_application: { id: 11, applicant_id: 5 } },
    { id: 3, admission_application: { id: 12, applicant_id: 6, applicant: { first_name: 'Alex' } } },
  ];
  assert.deepEqual(groupApplicantDocuments(documents).map((group) => group.documents.map((doc) => doc.id)), [[1, 2], [3]]);
  assert.equal(documents.length, 3);
});

test('missing applicant relationships fall back to application IDs, then individual documents', () => {
  const documents = [{ id: 1, admission_application_id: 10 }, { id: 2, admission_application_id: 10 }, { id: 3 }, { id: 4 }];
  assert.deepEqual(groupApplicantDocuments(documents).map((group) => group.documents.map((doc) => doc.id)), [[1, 2], [3], [4]]);
  assert.deepEqual(groupApplicantDocuments([]), []);
});
