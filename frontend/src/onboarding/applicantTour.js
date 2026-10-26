export const TOUR_STEPS = [
  { id: 'welcome', path: '/applicant/dashboard', title: 'Welcome to EduPath', text: 'I’ll show you around your applicant portal. This tour only explains navigation. You will not submit applications, upload documents, or start examinations.', image: 'welcome.png' },
  { id: 'profile', path: '/applicant/profile', nav: 'profile', title: 'Your profile', text: 'Select My Profile to find your personal and educational information. Review it carefully when you are ready. No changes are needed for this tour.' },
  { id: 'programs', path: '/applicant/programs', nav: 'programs', title: 'Explore programs', text: 'Programs lists the academic programs available to applicants. Review their descriptions before choosing a program for your admission application.' },
  { id: 'admission', path: '/applicant/admission', nav: 'admission', title: 'Admission application', text: 'Prepare and track your admission application here. Submission depends on an open admission period and server validation. This tour does not submit the form.' },
  { id: 'documents', path: '/applicant/documents', nav: 'documents', title: 'Your documents', text: 'Find required admission documents, uploaded files, and review feedback here. Requirements depend on your application. No file upload is needed for this tour.' },
  { id: 'scholarships', path: '/applicant/scholarships', nav: 'scholarships', title: 'Scholarship opportunities', text: 'Check each scholarship’s requirements and dates. Admission approval is normally required unless an official exception is configured. Track requests in Scholarship Applications. The online exam currently requires approved admission and an approved application for an active “other” scholarship requiring it. Application approval or passing an exam does not guarantee an award.' },
  { id: 'notifications', path: '/applicant/notifications', nav: 'notifications', title: 'Stay informed', text: 'Notifications contains account and application updates. Check the relevant application page for its latest status. This tour will not mark notices as read or delete them.' },
  { id: 'finish', path: '/applicant/settings', title: 'You’re ready to explore', text: 'You’re all set! Restart this tour here in Settings whenever you need it. “How to Use EduPath” in the menu has more help. Select Finish when you’re ready to explore.', image: 'celebrate.png' },
];

export function stepIndex(id) {
  return Math.max(0, TOUR_STEPS.findIndex((step) => step.id === id));
}

export function isExamRoute(pathname) {
  return pathname === '/applicant/online-scholarship-exam' || pathname.startsWith('/applicant/online-scholarship-exam/');
}

export function guideImage(step, target, panel) {
  if (step.image) return step.image;
  if (!target || !panel) return 'explain.png';
  return target.left + target.width / 2 < panel.left + panel.width / 2 ? 'point-left.png' : 'point-right.png';
}
