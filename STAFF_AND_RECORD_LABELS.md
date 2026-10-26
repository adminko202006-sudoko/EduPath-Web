# Staff form and visible record labels — October 24, 2026

## Findings and repairs

- Position appeared in staff creation/editing, search, list descriptions, mobile staff cards, and a table header. Removed it from the admin Staff Management interface and request payloads. Existing database values and API compatibility remain intact; editing another field does not clear historical positions.
- Account email uniqueness was already implemented through UniqueAccountEmail across all roles. Verified case/whitespace normalization, legacy capitalization, and safe database-conflict responses. Added an email hint to the staff form.
- Internal record numbers appeared as standalone badges, headings, fallback names, dropdown labels, and report metadata. Removed those labels from the active web source across Admin, Staff, and Applicant pages. Names, program/period descriptions, statuses, dates, scores, and question counts remain. Admission selection includes submission dates for context.
- Existing admission/scholarship/exam notifications could contain record numbers. Notification title/message accessors now omit recognized record-number references when serializing or delivering notices. Raw stored content, record identifiers, and notification destinations remain intact. Unrelated numbers, such as deadlines and scores, are preserved.
- Flutter result details no longer display the internal attempt ID. Notification presentation getters also format legacy cached notices without changing routing identifiers.
- The inactive frontend/src/src tree was preserved. No account records were created or changed outside isolated tests. No migrations were required.

## Main files changed

- frontend/src/pages/admin/StaffManagement.jsx: Position removal, email hint, unchanged submission safeguards.
- Active pages under frontend/src/pages/admin, staff, and applicant: record badges and headings removed, including admission documents, dashboards, applications, announcements, programs, scholarships, exams, and reports.
- frontend/src/components/EntranceExamReviewPanel.jsx: readable fallback without an internal ID.
- backend/app/Models/Notification.php: format existing notification title/message references without rewriting stored text.
- backend/app/Http/Controllers/Api/Admin/OnlineExamController.php: new result notices omit attempt IDs.
- backend/tests/Feature/AccountEmailUniquenessTest.php: successful staff creation without Position and rejected email reuse.
- backend/tests/Unit/NotificationPresentationTest.php: formatted serialization, retained raw content/destination, null handling, unrelated numeric content.
- C:/Users/oseas/StudioProjects/edupath_mobile/lib/features/online_exam/screens/online_exam_screen.dart: remove attempt ID result field.
- C:/Users/oseas/StudioProjects/edupath_mobile/lib/features/notifications/models/notification_model.dart and screens/notifications_screen.dart: presentation getters for existing notices.
- C:/Users/oseas/StudioProjects/edupath_mobile/test/notification_presentation_test.dart: formatting and routing regressions.

## Executed verification

- Web build: passed, including final metadata cleanup.
- ESLint for admin/staff/applicant pages and changed shared review panel: passed.
- Existing frontend suite: 70 passed.
- Backend AccountEmailUniquenessTest, NotificationPresentationTest, StaffAccessTest and OnlineExam-filtered tests: 84 passed, 859 assertions.
- AccountEmailUniquenessTest after adding successful creation coverage: 10 passed, 109 assertions. The new test initially identified an incomplete isolated fixture (missing staff_role); the fixture now includes the existing migration and audit table. No production schema was changed.
- Five existing admin staff routes confirmed with route:list.
- Flutter analysis of the three changed source files and new test: no issues found.
- Flutter notification presentation, notification navigation and online exam release tests: 12 passed.

Live browser/device visual checks were not performed; no browser was connected. Functional IDs in API requests, route parameters, model relationships, React keys, and existing operational inputs remain available internally. This change removes visible record-number metadata, not meaningful institutional identifiers such as employee IDs or learner reference numbers.
