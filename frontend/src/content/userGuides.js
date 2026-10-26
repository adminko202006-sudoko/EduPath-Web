const applicantTopics = [
  {
    id: 'profile', category: 'Getting started', title: 'Complete your profile',
    summary: 'Check your personal information before submitting an application.',
    path: '/applicant/profile', action: 'Open My Profile',
    steps: [
      'Open My Profile and check your name, birth date, contact number, gender and address.',
      'Correct the information you need to change, then save your profile. Wait for the success message.',
      'To add a picture, choose a JPG, PNG or WEBP image up to 2 MB. Preview it, then upload it using the photo control.',
      'Check that the saved information and photo are correct before continuing to admission.',
    ],
    mobileSteps: [
      'Tap Profile in the bottom navigation and open the profile editing control.',
      'Check your personal and contact information, make corrections and save. Wait for confirmation.',
      'Use the profile picture control to choose a supported image, then finish the upload. Allow photo access if your device asks.',
      'Check your saved profile before applying for admission.',
    ],
  },
  {
    id: 'admission', category: 'Admissions', title: 'Submit an admission application',
    summary: 'Select your program during an open admission period and follow its status.',
    path: '/applicant/admission', action: 'Open Admission Application',
    steps: [
      'Complete My Profile, then open Programs to read the available academic programs.',
      'Open Admission Application and check the admission period. If no period is open, wait for the college announcement.',
      'Select your preferred academic program and add optional remarks. Review the details, then select Submit Application once.',
      'Wait for confirmation, then check the application status. Open My Documents to upload the requirements for that application.',
      'Return to Admission Application and Notifications for review updates. Submission does not mean approval.',
    ],
    mobileSteps: [
      'Complete Profile, then open Admission from the bottom navigation.',
      'Check that an admission period is open and start Apply for Admission.',
      'Follow the form steps: choose your program, review the required documents, complete the requested information and review your application.',
      'Attach supported files where offered, then confirm Submit Application once. Wait for the response.',
      'Check Admission for the saved application. If an attachment failed after submission, check Documents Checklist before retrying; do not submit another application just to retry a file.',
    ],
    note: 'Apply within the dates shown by the college. If a request fails, check your application list before submitting again.',
  },
  {
    id: 'documents', category: 'Admissions', title: 'Upload or replace admission documents',
    summary: 'Send clear files and check the feedback on each requirement.',
    path: '/applicant/documents', action: 'Open My Documents',
    steps: [
      'Submit your admission application first, then open My Documents to see its requirement checklist.',
      'Choose Upload beside the requirement you want to provide. Check the selected requirement name.',
      'Choose a clear PDF, JPG, JPEG or PNG file, up to 5 MB. Check that the entire document is readable.',
      'Submit the upload once and wait for confirmation. Verify that it appears in the checklist and review its status.',
      'If a document is rejected, read the remarks, choose Replace when available, and upload the corrected file. Return later to check verification.',
    ],
    mobileSteps: [
      'Submit an admission application, then open the menu and choose Documents Checklist.',
      'Open the relevant requirement or document and use its upload control.',
      'Choose a readable PDF, JPG, JPEG or PNG file, up to 5 MB. Allow file access if your device asks.',
      'Wait for the upload confirmation, then check the document status and details.',
      'For a rejected document, read the reviewer remarks and use the replacement control when offered. Check the saved document before retrying after an interruption.',
    ],
    note: 'An uploaded file is still subject to review. A profile picture is separate from an admission document.',
  },
  {
    id: 'scholarships', category: 'Scholarships', title: 'Apply for a scholarship',
    summary: 'Read the eligibility, dates and requirements of the specific scholarship.',
    path: '/applicant/scholarships', action: 'Open Scholarships',
    steps: [
      'Open Scholarships and read the provider, eligibility, benefits, requirements and application dates.',
      'Check your admission status. Approved admission is required unless that scholarship explicitly allows an exception.',
      'Choose the application action for an available scholarship, complete any requested fields and review the details before submitting.',
      'Wait for confirmation, then open Scholarship Applications to track the submitted request and remarks.',
      'Application review approval is separate from the final scholarship award. Look for an explicit award decision; examination completion does not automatically grant a scholarship.',
      'Follow the scholarship-specific instructions. UniFAST may require a face-to-face exam; TES/TDP selection follows the applicable CHED process. Take an EduPath online exam only where it is configured for your application.',
    ],
    mobileSteps: [
      'Tap Scholarships in the bottom navigation and open a scholarship to read its requirements and application dates.',
      'Check that your admission is approved unless the scholarship explicitly allows an exception.',
      'Application review approval is separate from the final scholarship award. An award is shown only after an administrator explicitly records it.',
      'Use the application control and complete the requested fields or attachment. Review and submit once.',
      'Check the application status in the Scholarships area after confirmation.',
      'Follow the instructions for that scholarship. A scheduled face-to-face exam and an Online Exam are different workflows; TES/TDP selection remains subject to the applicable CHED process.',
    ],
    note: 'Applying, passing an exam and receiving a scholarship award are separate steps. Follow the official decision shown by the college.',
  },
  {
    id: 'online-exam', category: 'Examinations', title: 'Take an online scholarship examination',
    summary: 'Prepare before starting: the server-controlled timer cannot be paused.',
    path: '/applicant/online-scholarship-exam', action: 'Open Online Scholarship Exam',
    steps: [
      'Open Online Scholarship Exam and read the eligibility message and instructions. Resolve any admission or scholarship restriction before starting.',
      'Use a stable internet connection, allow enough uninterrupted time and keep your device charged. Start only when you are ready.',
      'The college configures the question count and time limit. Check the displayed time per question before starting. Select an option and wait for its save response. The official timer advances the question automatically.',
      'Stay on the exam screen. Refreshing, leaving the page or changing your device clock does not pause or reset the official deadlines. After an interruption, reconnect and reopen the exam to load the current server state.',
      'Read any save error and retry while the current question is still open. Do not assume an answer was saved if the request failed.',
      'Use Submit examination only when you intend to finish; early submission ends your attempt. After completion, check your attempt history. Scores remain hidden until official release.',
    ],
    mobileSteps: [
      'Open the menu, select Online Exam and read the eligibility message and examination instructions.',
      'Connect to reliable internet, charge your device and start only when you have uninterrupted time.',
      'The college configures the question count and time limit. Check the displayed time per question before starting. Choose your answer and check the save indicator. Questions advance when their official time expires.',
      'Keep the app open. Backgrounding or leaving it does not stop the server timer. After a connection interruption, reconnect and reopen the exam to resume the current server state.',
      'Read errors and retry available save/recovery controls. An expired question cannot be reopened by restarting the app.',
      'Submit only when you intend to finish, then check attempt history. Official results become available only after the college releases them.',
    ],
    note: 'All active required admission documents must be uploaded and verified before starting or resuming the online examination. The passing score is 50/100. One attempt is allowed by default; an additional attempt requires Admin authorization. Passing is not an automatic scholarship award.',
  },
  {
    id: 'entrance-exams', category: 'Examinations', title: 'Check a scheduled entrance examination',
    summary: 'Find your assigned schedule, time and venue.',
    path: '/applicant/exams', action: 'Open Entrance Exams',
    steps: [
      'Open Entrance Exams and check whether the college has assigned you an examination.',
      'Read the date, start/end time, venue and any instructions. Follow the college instructions for attending the scheduled examination.',
      'If no assignment appears or the schedule is unclear, contact the college admissions office.',
      'Return after the examination to check official results. Scores and remarks remain hidden until the college releases them.',
    ],
    mobileSteps: [
      'Open the menu and select Entrance Exams.',
      'Check your assigned date, time, venue and instructions. Attend as directed by the college.',
      'If no assignment appears, contact the admissions office for guidance.',
      'Check the exam again after official result release. Unreleased scores and remarks are hidden.',
    ],
    note: 'All active required admission documents must be uploaded and verified before examination assignment and participation. An existing schedule is retained if verification becomes incomplete, but you must resolve the document warning before taking the examination. An entrance examination schedule does not start an online scholarship attempt.',
  },
  {
    id: 'notifications', category: 'Account & updates', title: 'Read updates and manage your account',
    summary: 'Follow notifications, announcements and account settings.',
    path: '/applicant/notifications', action: 'Open Notifications',
    steps: [
      'Open Notifications to read updates about your records. Mark a notification as read after reviewing it.',
      'Open Announcements for college-wide information. A notice is guidance; use the relevant application page to check its current status.',
      'Use Settings for supported account controls and the theme control to change appearance.',
      'Sign out when finished on a shared device. Keep your password private and avoid sharing your applicant records.',
    ],
    mobileSteps: [
      'Tap Notifications to read your updates and open its Announcements tab for college notices.',
      'Mark notices as read after reviewing them, then check the relevant application page for its latest status.',
      'Open Settings from the menu for appearance and supported account controls.',
      'Sign out from a shared device and keep your password and applicant documents private.',
    ],
  },
];

const staffTopics = [
  {
    id: 'staff-profile', category: 'Getting started', title: 'Set up your staff profile',
    summary: 'Keep your personal account information up to date.', path: '/staff/profile', action: 'Open My Profile',
    steps: ['Open My Profile and choose Edit Profile.', 'Update your name or email. To change your picture, choose a JPG, PNG or WEBP file up to 2 MB and preview it.', 'Select Save Changes and wait for confirmation. Contact the Admin for changes to assigned programs, staff status or permissions.'],
  },
  {
    id: 'staff-admissions', category: 'Admissions', title: 'Review assigned admission applications',
    permission: 'manage_admissions', summary: 'Review records within your existing program assignments.', path: '/staff/admission-applications', action: 'Open Admission Applications',
    steps: ['Open Admission Applications. Use the search box and submit the search; use the status filter to focus the queue.', 'Open View to inspect the applicant and application details. Check the required documents and review notes.', 'Use a decision control only when it falls within your assigned authority. Review the confirmation carefully and provide remarks where requested.', 'Wait for success and check the updated status. Ask the Admin if the record or action you need is outside your assignment.'],
  },
  {
    id: 'staff-documents', category: 'Admissions', title: 'Verify applicant documents',
    permission: 'verify_documents', summary: 'Check readability and completeness before recording feedback.', path: '/staff/documents', action: 'Open Documents',
    steps: ['Open Documents and locate the assigned applicant or requirement using the available filters.', 'Open the uploaded file and compare it with the requirement. Check that the document is readable and complete.', 'Choose the appropriate verification status and add clear remarks, especially when a corrected file is needed.', 'Save the review once, wait for confirmation and check that the updated status is shown.'],
  },
  {
    id: 'staff-scholarships', category: 'Scholarships', title: 'Record a scholarship recommendation',
    permission: 'manage_scholarships', summary: 'Keep verification and recommendations separate from the final award.', path: '/staff/scholarship-applications', action: 'Open Scholarship Applications',
    steps: ['Open Scholarship Applications and locate an application within your assigned programs.', 'Open its review view and check the applicant information, requirements and scholarship-specific eligibility.', 'Select Recommend, Do Not Recommend or Needs More Information as appropriate, and explain the recommendation in the remarks.', 'Save and check the response. Final scholarship decisions remain with the authorized Admin; a recommendation does not approve an award.'],
    note: 'Online Examination review requires its separate permission. Do not request applicant credentials or use another person’s account.',
  },
  {
    id: 'staff-online-exams', category: 'Examinations', title: 'Monitor and recommend an online examination attempt',
    permission: 'review_online_exams', summary: 'Review attempts only after Admin explicitly grants this permission.', path: '/staff/online-exams', action: 'Open Online Exam Review',
    steps: ['Open Online Exam Review to see applicants with an approved admission in your assigned programs.', 'Search by applicant name or filter by attempt status. Scores appear for completed or expired attempts within your review authority.', 'For an unreleased submitted attempt, choose Record recommendation and explain whether the record is ready for administrator review or needs attention.', 'Save and verify the confirmation. Your recommendation does not change scores, release results, authorize a retake or award a scholarship.'],
    note: 'Only Admin can enable this permission. Released results cannot receive further review changes.',
  },
  {
    id: 'staff-exams', category: 'Examinations', title: 'Review scheduled entrance examinations',
    permission: 'manage_exams', summary: 'Work only with schedules and applicants assigned to your programs.', path: '/staff/exams', action: 'Open Entrance Exams',
    steps: ['Open Entrance Exams and select an available schedule.', 'Check the assigned applicants, date, time and venue. Other programs may not be visible to your account.', 'Use the update controls offered for the schedule within your assigned authority, then save and check the response.', 'Respect official result-release restrictions. Admin-only online result release and retake authorization are not staff actions.'],
  },
  {
    id: 'staff-announcements', category: 'Account & updates', title: 'Prepare a college announcement',
    permission: 'manage_announcements', summary: 'Review the title, message and publication settings before saving.', path: '/staff/announcements', action: 'Open Announcements',
    steps: ['Open Announcements and use its create or edit control.', 'Enter a clear title and message. Check the status and publication date before saving.', 'Save once and verify the announcement in the list. A draft or future publication is not yet an applicant-facing notice.', 'Confirm important scheduled notices with the Admin. In-app publication does not prove delivery by email or push notification.'],
  },
  {
    id: 'staff-notifications', category: 'Account & updates', title: 'Send an applicant notification',
    permission: 'send_notifications', summary: 'Send clear messages to applicants within your existing access.', path: '/staff/notifications', action: 'Open Notifications',
    steps: ['Open Notifications and use the send control.', 'Select an authorized applicant recipient, enter the requested title/message and check the recipient again.', 'Send once and wait for the server response. Check the list before retrying a failed or interrupted request.', 'Avoid passwords, private documents or unreleased examination scores in notification text.'],
  },
  {
    id: 'staff-reports', category: 'Account & updates', title: 'Read authorized reports',
    permission: 'view_reports', summary: 'Use the records and summaries available to your account.', path: '/staff/reports', action: 'Open Reports',
    steps: ['Open Reports and review the available summaries.', 'At the top of the page, drag down with your mouse or swipe down to refresh the data. You can also focus the refresh hint and press Enter.', 'Keep applicant information private. Ask the Admin about missing assignments or access rather than using another person\'s account.'],
  },
];

const troubleshooting = {
  id: 'troubleshooting', category: 'Help', title: 'When something does not work',
  summary: 'Recover from connection problems, missing access or a failed upload.',
  steps: [
    'If a page fails to load, check your connection and use Retry, or pull down from the top of the page to refresh. An empty list and a failed request are different states.',
    'If your session has expired, sign in again. If access is denied, contact the Admin about your account or assignment.',
    'For uploads, check the file type and size, then use a clear, readable file. Wait for confirmation and check the saved record before sending it again.',
    'During an exam, reconnect promptly: the official timer continues even if your device is offline. Do not start another attempt to recover.',
    'If the issue remains, contact the college admissions or scholarship office with the page name, time and a brief description. Do not include your password or private documents in a public message.',
  ],
};

export function getUserGuideTopics(user) {
  if (user?.role === 'applicant') return [...applicantTopics, troubleshooting];
  if (user?.role !== 'staff') return [];
  const staff = user.staff;
  return [...staffTopics.filter((topic) => !topic.permission ||
    (staff?.status === 'active' && Boolean(staff.permissions?.[topic.permission]))), troubleshooting];
}

export function filterGuideTopics(topics, query = '', category = 'All topics') {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return topics.filter((topic) => (category === 'All topics' || topic.category === category) &&
    terms.every((term) => [topic.title, topic.summary, topic.note, ...topic.steps].join(' ').toLowerCase().includes(term)));
}

// Mobile uses the same topic IDs and policy notes, with instructions for its native navigation.
export function getMobileApplicantGuide() {
  return [...applicantTopics, troubleshooting].map(({ id, category, title, summary, steps, mobileSteps, note }) =>
    ({ id, category, title, summary, steps: mobileSteps || steps, ...(note ? { note } : {}) }));
}
