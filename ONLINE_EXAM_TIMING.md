# Configurable Online Scholarship Examination timing

The Admin Online Scholarship Examination page now has minutes and seconds inputs, Save timing, Cancel, and a total-duration preview for 100 questions. The default remains 60 seconds. Supported limits are 1–3600 whole seconds per question.

## Findings and changes

- Admin question-bank responses and applicant start/overview responses previously hardcoded 60 seconds. They now read the persisted configuration.
- Existing attempt timers already use the attempt's stored seconds_per_question. New attempts snapshot the setting and calculate expiry from it; existing attempts retain their stored duration, answers, and question order.
- The applicant UI previously refused durations other than 60 seconds. It now accepts positive integer durations and continues using server attempt timestamps.
- Updated the static scholarship explanation and applicant guides to refer to the college's configured time limit.
- Added an Admin-only PUT /api/admin/online-exams/settings endpoint, accepting seconds_per_question. Existing GET /api/admin/online-exams/questions returns the current value. Invalid input produces validation errors; Applicant and Staff requests are forbidden.

## Database and files

- Applied only migration 2026_10_19_000001_create_online_exam_settings_table.php. It adds a separate settings table with a default of 60 seconds, last editor user ID, and timestamps. No existing applications, attempts, questions, or scores were modified.
- OnlineExamSetting model reads the shared setting.
- Admin and Applicant OnlineExamController changes connect configuration to new attempts and overview data.
- backend/routes/api.php registers the settings endpoint inside the existing Admin role group.
- frontend/src/pages/admin/OnlineExamManagement.jsx adds the timing form.
- frontend/src/pages/applicant/OnlineScholarshipExam.jsx accepts configured attempt timing.
- frontend/src/content/userGuides.js and frontend/src/pages/admin/Scholarships.jsx remove fixed-duration claims.
- backend/tests/Feature/OnlineExamIntegrityTest.php adds timing validation, role, persistence, manipulation, expiry, and snapshot regression coverage in isolated SQLite.

## Verification

- Targeted migration: applied successfully on the configured local database.
- php artisan route:list --path=online-exams: passed; 8 Admin routes including the new settings endpoint.
- php artisan test --filter=OnlineExamIntegrityTest: 44 passed, 345 assertions. Includes scheduled examination privacy, retakes, score release, ownership, and timer regression checks.
- Targeted ESLint for the examination pages, scholarship page, and user guides: passed.
- npm test: 40 frontend tests passed.
- Production frontend build: passed.
- Authenticated browser visual verification and the separate mobile client's UI were not exercised. The existing seconds_per_question API field remains compatible; separate mobile clients should use it instead of hardcoded timing.
