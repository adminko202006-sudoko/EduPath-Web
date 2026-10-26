# Online examination configuration — 24 October 2026

## Findings and scope

The required count was fixed at 100 in attempt creation, eligibility, answer
validation, scoring, result release, availability notices, and both exam screens.
Review navigation used a separate fixed 25-second cutoff in the backend and
frontend clock. Updating only the settings form would have left smaller exams
unable to complete or release results.

This update implements the requested configuration changes. It is not a new
audit of unrelated admission or scholarship policies.

## Behavior

- Admin → Online Scholarship Examination → Examination settings now accepts
  **1–500 required questions**, minutes, and seconds. The 500-question maximum
  matches the existing scholarship configuration validation limit.
- Default settings remain 100 questions and 60 seconds per question.
- New attempts randomly select exactly the configured number of eligible active
  questions and save their order, count, timing, and review cutoff.
- The Previous cutoff equals the attempt's saved time per question. For example,
  a 60-second setting permits Previous only above 60 remaining seconds. At 60
  seconds, review returns to the active question. Carried time permits review;
  reviewing does not extend the total deadline.
- Settings changes affect new attempts. Existing attempts retain their assigned
  count and timing; attempts predating this update retain the 25-second cutoff.
- Bank warnings show the configured requirement. Applicants still cannot start
  with fewer valid active questions than required.
- Scoring and official release validate the attempt's saved question count.
  Scores remain percentages out of 100, with the existing 50% passing rule.
- Availability notices use the configured requirement and are checked again
  when the count changes, retaining existing per-attempt deduplication.
- Admission approval, eligible scholarship approval, ownership, retake rules,
  answer-key privacy, and official-release permissions remain enforced.

## Main files

- `backend/app/Models/OnlineExamSetting.php`: count defaults, bounds, persistence.
- `backend/app/Models/OnlineExamAttempt.php`: saved cutoff field.
- Admin and Applicant `OnlineExamController.php`: settings, snapshot creation,
  eligibility, navigation, grading, and official release.
- `OnlineExamNavigationService.php`: saved review cutoff enforcement.
- `OnlineExamAvailabilityService.php`: configurable bank requirement.
- Admin `ScholarshipController.php`: use current shared exam configuration when
  populating exam metadata for a scholarship.
- `OnlineExamManagement.jsx`: required-count input, settings save, duration
  preview, and dynamic availability warning.
- `OnlineScholarshipExam.jsx` and `services/onlineExamClock.js`: variable counts
  and saved cutoff presentation.
- `Scholarships.jsx` and `content/userGuides.js`: remove fixed-count claims.
- `OnlineExamIntegrityTest.php` and `onlineExamClock.test.mjs`: regression tests.

The active entry is `frontend/src/main.jsx`, using `src/App.jsx` and its routes.
The nested `frontend/src/src` tree has no online-exam screen and was not edited,
merged, or deleted.

## Migration and verification

Applied only `2026_10_24_000001_configure_online_exam_question_count.php` after
inspecting its SQL with `migrate --pretend`. It adds a default-100 count to the
settings table and a default-25 cutoff to attempts. It does not delete records,
replace assignments, change scores, or reset attempts.

- `php artisan route:list --path=online-exam`: passed, 19 routes; existing
  Admin-only PUT settings endpoint reused.
- `php artisan test --compact`: **246 passed, 2022 assertions**, using the test
  configuration's isolated SQLite databases.
- Online exam suite: **65 passed, 586 assertions**. Covers custom-size grading
  and release, saved settings after edits, insufficient bank, count validation,
  expiration, legacy cutoff, ownership, privacy, retakes, navigation, and the
  existing scheduled entrance-exam regressions.
- Frontend suite: **78 passed** with process isolation disabled.
- Frontend lint and production build: passed. Vite build and renderer-based
  tests require local subprocess access outside the restricted sandbox.
- Authenticated browser interactions and the separate mobile client were not
  exercised. Mobile clients must consume the attempt count and
  `review_cutoff_seconds` instead of hardcoding 100 or 25.

No institutional approval is pending for this requested configuration change.
The separate FHE rule/data questions in `FHE_ENTRANCE_EXAM_REVIEW.md` remain
outside this update.
