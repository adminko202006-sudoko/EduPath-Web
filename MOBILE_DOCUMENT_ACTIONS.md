# Mobile document actions and Admin synchronization

Updated 26 October 2026.

## Behavior

- Rejected documents have Re-upload and Delete actions directly on the mobile My Documents cards. The existing detail-page actions remain available.
- Deletion requires a centered confirmation dialog. Cancel leaves the document unchanged. Actions are disabled while a replacement or deletion is in progress.
- Pending, under-review, verified and approved documents cannot be deleted by applicants. The existing backend restriction is preserved.
- Successful deletion removes the submitted document from the mobile provider and the shared backend record. A new upload is needed to meet that requirement. Existing history and retained files follow the existing retention behavior.
- Re-upload updates the existing record and returns it to Pending, with the old rejection remarks cleared for the new review.
- Admin Documents, Admission Application Details and Applicant Details now refresh every 15 seconds while visible, online and active. Hidden cached pages do not poll. Applicant profile editing and active review/save operations are protected from background refresh where applicable.

## Files

- Mobile `lib/features/documents/screens/documents_screen.dart`: direct Delete control, confirmation, mutation locking and status guidance.
- Mobile `test/document_actions_test.dart`: main-list action visibility and cancellation coverage, alongside the existing detail-action tests.
- Web `src/services/visibleRefresh.js` and `src/hooks/useAutoRefresh.js`: optional visibility-aware polling without overlapping polling requests.
- Three Admin detail/document pages: enable the polling interval using the existing authenticated data loaders.
- Web `tests/visibleRefresh.test.mjs`: visibility, connectivity, cleanup, overlap and recovery checks.
- Backend `tests/Feature/ApplicantDocumentAccessTest.php`: replacement and deletion consistency in the Admin document API.

## Verification

- Document API tests: 19 passed, 94 assertions, using isolated SQLite and fake storage.
- Mobile document action tests: 9 passed.
- Focused web refresh tests: 2 passed.
- Full frontend regression suite passed with process isolation disabled.
- Changed web files: ESLint passed. Production web build passed.
- Changed mobile files: Dart analysis passed with no issues.
- No database migrations or live applicant record changes were performed.

Physical-device and signed-in browser walkthroughs were not performed in this change. Rebuild or hot-restart the mobile app to load the updated screen.
