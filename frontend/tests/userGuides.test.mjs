import test from 'node:test';
import assert from 'node:assert/strict';
import { filterGuideTopics, getMobileApplicantGuide, getUserGuideTopics } from '../src/content/userGuides.js';

test('applicants receive admission, documents, scholarship and separate exam guides', () => {
  const topics = getUserGuideTopics({ role: 'applicant' });
  for (const id of ['profile', 'admission', 'documents', 'scholarships', 'online-exam', 'entrance-exams', 'notifications', 'troubleshooting']) {
    assert.ok(topics.some((topic) => topic.id === id));
  }
  assert.equal(topics.length, new Set(topics.map((topic) => topic.id)).size);
  assert.ok(topics.every((topic) => topic.steps.length >= 3));
  assert.ok(topics.filter((topic) => topic.path).every((topic) => topic.path.startsWith('/applicant/')));
});

test('staff topics follow saved permissions without granting online review implicitly', () => {
  const base = getUserGuideTopics({ role: 'staff', staff: { status: 'active', permissions: {} } });
  assert.deepEqual(base.map((topic) => topic.id), ['staff-profile', 'troubleshooting']);
  const allowed = getUserGuideTopics({ role: 'staff', staff: { status: 'active', permissions: { verify_documents: true, manage_scholarships: true } } });
  assert.ok(allowed.some((topic) => topic.id === 'staff-documents'));
  assert.ok(allowed.some((topic) => topic.id === 'staff-scholarships'));
  assert.ok(!allowed.some((topic) => topic.id === 'staff-admissions'));
  assert.ok(allowed.filter((topic) => topic.path).every((topic) => topic.path.startsWith('/staff/') && !topic.path.includes('online')));
  const reviewer = getUserGuideTopics({ role: 'staff', staff: { status: 'active', permissions: { review_online_exams: true } } });
  assert.ok(reviewer.some((topic) => topic.path === '/staff/online-exams'));
});

test('inactive or missing staff assignments do not show restricted topic links', () => {
  for (const staff of [undefined, { status: 'inactive', permissions: { manage_admissions: true } }]) {
    assert.deepEqual(getUserGuideTopics({ role: 'staff', staff }).map((topic) => topic.id), ['staff-profile', 'troubleshooting']);
  }
  assert.deepEqual(getUserGuideTopics(null), []);
  assert.deepEqual(getUserGuideTopics({ role: 'admin' }), []);
});

test('guide search matches step text, ignores case and combines with category', () => {
  const topics = getUserGuideTopics({ role: 'applicant' });
  const matches = filterGuideTopics(topics, '  PDF  5 MB ', 'Admissions');
  assert.deepEqual(matches.map((topic) => topic.id), ['documents']);
  assert.ok(filterGuideTopics(topics, 'authorization').some((topic) => topic.id === 'online-exam'));
  assert.equal(filterGuideTopics(topics, 'no-such-topic').length, 0);
  assert.equal(filterGuideTopics(topics, '').length, topics.length);
});

test('mobile instructions keep the same topics and official policy notes', () => {
  const web = getUserGuideTopics({ role: 'applicant' });
  const mobile = getMobileApplicantGuide();
  assert.deepEqual(mobile.map((topic) => topic.id), web.map((topic) => topic.id));
  for (let i = 0; i < mobile.length; i += 1) {
    assert.equal(mobile[i].note, web[i].note);
    assert.ok(mobile[i].steps.length >= 3);
    assert.ok(!mobile[i].steps.some((step) => step.includes('/applicant/')));
  }
  assert.match(mobile.find((topic) => topic.id === 'online-exam').steps[0], /menu.*Online Exam/);
});
