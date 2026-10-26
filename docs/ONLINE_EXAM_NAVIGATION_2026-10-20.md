# Online exam navigation — October 20, 2026

## Confirmed behavior

- Next requires a saved answer on the active question and carries its unused time to the next question. For example, answering Q1 after 20 seconds leaves 40 seconds; Q2 then has 100 seconds.
- Previous permits editing earlier answers while the active question has more than 25 seconds remaining. The active timer continues during review.
- At 25 seconds or less, review ends automatically and only the active question can be answered. Next during review returns toward the active question without granting time.
- Total time remains bounded by the original attempt expiry: 100 minutes for 100 questions at 60 seconds. Skipped-by-timeout questions remain unanswered unless reviewed while permitted. The final question uses Submit.
- These rules apply to new attempts. Existing attempts retain their original fixed windows, duration, answers and question order. Retakes still require explicit administrator authorization.

## Initial findings and connection checklist

| Priority / workflow | Original behavior | Change / verification |
| --- | --- | --- |
| P1: server timing | Fixed question windows; no navigation endpoint or separate review cursor | Added active frontier, review cursor and navigation revision under an attempt row lock; tests cover carry, duplicate/stale requests and exact cutoff. |
| P1: answer access | Earlier answers always closed after their original fixed window | Navigation-mode answers follow the authorized review cursor; old modes retain their existing restrictions. Tests cover editing, cutoff, ownership and option validation. |
| P1: refresh / repeated navigation | Reusing one index for both progression and review would grant time twice | Active frontier only increases; revisits cannot move its deadline. Revision checks reject replayed mutations. Persisted question order is reused. |
| P2: web runner | No working Next / Previous for this policy | Connected controls to POST `/api/applicant/online-exam/attempts/{attempt}/navigate`; guarded writes and stale reads; timer uses server time plus a monotonic clock. |
| P2: mobile runner | Only timer progression; no navigation API integration | Updated provider, models and runner with the same protocol, monotonic timer and automatic review cutoff. Model/widget and approval-regression tests pass. |

The new route passes through the existing applicant authentication/role middleware and checks ownership, admission and scholarship eligibility. Requests include direction, displayed question ID and expected revision; the server ignores client timer claims. Applicant payloads retain hidden answer keys and unreleased scores. Scheduled Entrance Exams remain separate.

## Files and data preservation

- `backend/app/Services/OnlineExamNavigationService.php`: server deadline, synchronization and review cutoff.
- `backend/app/Http/Controllers/Api/Applicant/OnlineExamController.php`: start, navigation, answer validation and canonical timing payloads.
- `backend/app/Models/OnlineExamAttempt.php`, `backend/routes/api.php`: persisted fields and protected route.
- `backend/database/migrations/2026_10_20_000005_add_online_exam_navigation.php`: three additive columns. Applied locally as batch 30. Existing rows default to legacy mode 1; new attempts explicitly use mode 2. Rollback refuses to discard state if mode-2 attempts exist.
- `frontend/src/pages/applicant/OnlineScholarshipExam.jsx`, `frontend/src/services/onlineExamClock.js`: controls and server-aligned presentation clock.
- Mobile project `C:/Users/oseas/StudioProjects/edupath_mobile`: `lib/features/online_exam/models/online_exam_models.dart`, `online_exam_provider.dart`, and `screens/online_exam_runner_screen.dart` plus two affected test files. Original copies retained in workspace `storage/exam-navigation-mobile/originals/`.
- Backend integrity tests, frontend clock tests and mobile model/runner tests cover the new behavior.

Before migration, `php artisan edupath:backup --verify` succeeded: isolated SQL restore, table counts, native row locking and storage checksums passed. Backup directory: `backend/storage/app/edupath-backups/20261020-094724-4aBdKk7s`. No existing attempts, applications, answers or decisions were deleted or reset.

## Executed verification

| Check | Actual result |
| --- | --- |
| `php artisan test` | 199 passed, 1,610 assertions before adding the two final-question/legacy tests. |
| `php artisan test --filter=OnlineExamIntegrityTest` after adding both tests | 59 passed, 481 assertions. An initial date-string formatting assertion was corrected to compare the same instant; the final run passed. |
| `php artisan route:list --path=online-exam` | 19 registered routes, including navigation. |
| Targeted migration and migration status | Applied; status confirms batch 30. |
| Frontend `npm run lint` | Passed. |
| `node --test --test-isolation=none tests/*.test.mjs` | 59 passed. |
| Frontend `npm run build` | Passed, 1,982 modules. |
| Mobile `flutter analyze --no-pub lib/features/online_exam` | No issues found. |
| Mobile model, runner, approval, scheduled-exam and roster tests | 29 passed across five test files. |

## Manual acceptance still required

Browser and physical-device interaction were not performed in this batch. Automated tests do not establish production readiness or prevent external AI use.

1. Reload the web app and hot restart/rebuild the Flutter app with these changes.
2. Use a fictional eligible applicant starting a new attempt (an existing active attempt intentionally keeps its old rules).
3. Answer Q1 at about 40 seconds remaining and press Next. Q2 should show about 100 seconds, reduced by elapsed request time.
4. Press Previous, change Q1's answer, and press Next to return. No additional time should be granted.
5. Review Q1 again and wait until Q2's active timer reaches 25. Q2 should reappear automatically and Previous should be disabled.
6. Refresh/resume on either client and verify the same question order, answer and continuing deadline. Test one client at a time for an attempt; stale requests from a second client must refresh after a position conflict.
7. Verify final submission, hidden results and authorized official release. Do not reset real attempts to repeat testing; use a new fictional account or an administrator-authorized retake.
