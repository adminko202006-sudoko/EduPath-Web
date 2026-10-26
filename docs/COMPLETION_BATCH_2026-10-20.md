# EduPath completion batch — October 20, 2026 (Asia/Manila)

> Firebase follow-up, October 20: the owner saved the server credentials at the default private path. JSON structure, required fields, RSA private key (at least 2,048 bits), and Android/backend project agreement passed. A live Google OAuth exchange for the Firebase Messaging scope returned HTTP 200. Both credential filenames are ignored by Git. No notification was sent, and no token or private-key content was printed. Missing Firebase credentials are resolved; FCM send authorization, API availability and real-device delivery still require a controlled test. The initial sandbox network attempt failed, then authentication passed with network access. Reusable diagnostics: `php storage/verify-firebase-credentials.php --android-config=PATH --authenticate` from the repository root.

## Outcome

Implemented the identified application-code repairs and verified them locally. This is not a production sign-off: owner-provided Firebase credentials, official question content, institutional review of historical approvals, deployment configuration and interactive acceptance remain outstanding. Existing scheduled Entrance Exams are preserved.

## Authorized admission rule and implementation

The owner explicitly confirmed one pending, under-review, or approved admission per applicant per admission period. Rejection or withdrawal permits resubmission; approval in an earlier period does not block the current period.

- Added `backend/app/Services/AdmissionSubmissionService.php`; applicant and admin creation now use the same transaction and applicant row lock. Web/mobile use the shared applicant endpoint. Repeat submissions return HTTP 409 with `ADMISSION_APPLICATION_EXISTS` and no duplicate history.
- Admission creation, active-program validation, open-period validation and history creation are atomic. Failed history writes roll back the application. Inactive programs cannot be used to bypass the UI.
- `WorkflowDecisionService` uses the same parent lock and duplicate check when moving another record into an active status, preventing approval of an old rejected application while a new active application exists.
- `frontend/src/pages/applicant/AdmissionApplication.jsx` now displays application history, prioritizes an approved current-period record over a newer legacy pending duplicate, offers resubmission when permitted, labels withdrawals correctly and prevents duplicate submit handlers.
- Added `frontend/src/services/admissionApplication.js` and tests for historical/current-period selection and resubmission behavior.
- Existing duplicate records were not deleted, withdrawn or demoted. Private review: `backend/storage/app/private/admission-duplicates-review.json`. Applicant #2 / period #1 has approved records #6, #16 and #19, all for the same program. These are protected final decisions; institutional correction needs explicit authorization. New duplicates are blocked, but this historical group still fails the readiness gate.

## Online examination fixes

- Restored the live setting from 5 to 60 seconds per question with the owner's explicit authorization. New 100-question attempts have a nominal 100-minute duration. Existing attempts retain their original timing. A maintenance workflow event records the restoration without impersonating an administrator.
- Admin timing changes now create an actor-attributed audit event when the value changes.
- `OnlineExamQuestion::eligible()` requires active nonblank questions, 2–6 nonblank options and exactly one correct option. Applicant availability, random selection and admin counts use this query. Invalid active questions no longer let an applicant start an unusable exam.
- Existing question-order persistence, server timing, answer ownership, attempt limits, retakes, scoring, result privacy and result release remain covered by regression tests.
- The live bank has 100 structurally valid active questions, including 10 tagged sample/test. Replace these with institution-approved content before production; this batch did not invent official assessment content or alter existing assigned question keys.

## Staff monitoring and recommendations

- Added `review_online_exams`, default false. No existing staff member was granted access. Only Admin can enable/revoke it through Staff Management.
- New routes:
  - `GET /api/staff/online-exams/attempts`
  - `PUT /api/staff/online-exams/attempts/{attempt}/review`
- Added `Staff/OnlineExamReviewController`, `OnlineExamReview` and the attempt review relationship. Access requires the explicit permission, active staff status and an approved applicant admission in an assigned program.
- Staff receive an explicit response allowlist without answer keys, answer options, individual answers, private contact fields or admin remarks. Authorized staff can see completed-attempt scores, record recommendations on completed/expired unreleased attempts, and cannot change scores, release results or authorize retakes.
- Recommendations retain reviewer and timestamps, create workflow audit events, and are idempotent on identical retries. Released attempts reject review changes.
- Added the staff review page, navigation, route preloading, permission controls, staff-profile permission labels, permission-cache invalidation support, and guide content. Admin attempt details now display staff recommendations through `OnlineExamReviewNotes.jsx`.

## Notifications and deployment diagnostics

- Added `OnlineExamAvailabilityService` and durable per-applicant/per-attempt notification keys. Approved admissions/scholarships and authorized retakes notify eligible applicants; scheduled dispatch also catches applicants approved before the bank became ready. Eligibility includes both approvals, a valid bank, no active attempt and an unused authorized attempt. Retries do not duplicate notices, including after an applicant deletes the notification.
- Availability notices disclose no grades or keys and do not award scholarships. Failed notification recording rolls back the notice key for safe retry. No live dispatcher or real email/device send was manually triggered during this batch.
- Firebase credentials can be supplied through `FIREBASE_CREDENTIALS` as a private absolute path, retaining the previous default path. FCM failures no longer log device-token prefixes or provider response bodies. Partially failed device batches return failure.
- Added configuration documentation to `.env.example` and ignore rules for private credentials, local environment files, private artifacts and backups.
- Extended `edupath:operations-check --production` to fail on pending migrations, invalid/insufficient bank, nonstandard timing, historical duplicate active admissions, sample content, nonproduction/debug/HTTP configuration, missing private Firebase configuration and missing/failed raw-document verification. Checks do not print keys, applicant data or SQL diagnostics.
- Production configuration checks do not prove real email/device delivery, scheduler execution or complete browser acceptance. The command explicitly says so.

## Storage security correction

The original sampled legacy document returned 403, but a stronger disposable-canary test exposed a text file under `/storage/documents` through PHP's built-in development server. Apache `.htaccess` rules do not apply to that server.

- Added `backend/server.php`, which Laravel automatically selects for `artisan serve`. It blocks document paths before static-file serving, including encoded separators, dot segments and Windows separators, while preserving public static assets and authenticated API handling.
- The existing development server reloaded after the `.env` timestamp changed; its contents were not changed by that reload trigger.
- Live canary probe subsequently returned HTTP 403. `/up` and `/robots.txt` remained HTTP 200. The existing Apache document-denial rule remains in place. The actual production host still needs its own probe.

## Migrations and data preservation

Three additive migrations were reviewed and applied successfully to MySQL:

1. `2026_10_20_000002_add_online_exam_staff_review.php`: retained reviews, reviewer attribution and unique per-reviewer/per-attempt records. Referenced attempts cannot be cascade-deleted through these records; rollback refuses to discard populated reviews.
2. `2026_10_20_000003_add_online_exam_review_permission.php`: opt-in permission default false.
3. `2026_10_20_000004_create_online_exam_availability_notices.php`: durable unique applicant/attempt notice keys; deleting a notification does not permit duplicate availability messages. Rollback refuses to discard populated notice records.

All 56 migrations are now applied. No reset, fresh migration, real application deletion or approved-admission correction occurred. PHPUnit now forces SQLite `:memory:` by default to avoid accidentally testing against configured MySQL records.

A private pre-change backup was created with `php artisan edupath:backup --verify`. SQL restore into a disposable database, table counts, native row locking and storage checksums passed. The backup remains under the ignored private `backend/storage/app/edupath-backups/` directory.

## Actual executed verification

| Check | Result |
| --- | --- |
| Full `php artisan test --compact` | **191 passed, 1,531 assertions**, 17.12 seconds. |
| `node --test --test-isolation=none tests/*.test.mjs` | **54 passed**, zero failed. Standard `npm test` had passed the earlier 52-test baseline outside sandbox; the final expanded suite was run without child-process isolation because the sandbox blocks worker spawning. |
| `npm.cmd run lint` | Passed, zero warnings/errors on final frontend source. |
| `npm.cmd run build` | Passed; 1,980 modules, Vite reported 3.08 seconds. Required helper-process access outside the sandbox. |
| New operational and development-router targeted tests | Four passed, 34 assertions; included in the full 191-test count. |
| Native MySQL concurrent creation | Passed: simultaneous applicant/admin service calls produced one 201, one 409, one application and one history record in an isolated database. This is native service/database concurrency, not a full HTTP concurrency test. |
| Backup restore, row lock, storage checksums | Passed. |
| New migrations | All three applied successfully on MySQL; no destructive operations on source data. |
| Route inventory | 173 routes; both staff-review routes registered. |
| Live HTTP | Staff online review without auth: 401; `/up`: 200; public robots: 200; private raw canary: 403. |
| Local operational readiness command | Correctly exits 1 because historical duplicate approvals remain; database, migrations, valid bank and 60-second timing checks pass. |
| Strict production operational command | Correctly exits 1 for documented release gates. |
| Scheduler inspection | Dispatcher is registered every minute. Actual external scheduler execution was not proven or started by this batch. |
| Browser | No connected browser available on repeated discovery. No visual, click-through or mobile-browser sign-off. |

The final full suite covers admissions (including missing-profile denial), staff authorization/program scope, online attempts/retakes/timing/release, scheduled-exam regression, private documents, recovery/security, profiles/onboarding, notifications and reports. Tests are evidence for those cases, not proof that every possible workflow is complete.

## Native probe incident and correction

The first native test fixture lacked `academic_year`. Investigation also found a harness isolation error: copying a connection configuration retained its original connection name, causing Eloquent to create two fictional probe users and one unused fictional applicant profile in the source database. The harness now explicitly overrides the connection name and asserts both model/query database isolation before writing.

Before cleanup, the private pre-probe backup confirmed those exact fixture emails did not previously exist. Identity, empty workflow relationships and absence of account activity were verified; only the probe-created users/profile were removed. No existing applicant/application record was deleted or modified. A subsequent source check found zero probe accounts, and the corrected concurrency test passed. Disposable databases were removed by guarded generated-name cleanup. No auto-increment counters were reset.

Initial frontend route-preload verification also failed because it expected the old route count; the added staff page required updating that assertion. The final expanded suite passes. These failed attempts are retained here rather than represented as successful runs.

## Remaining release gates requiring external input or acceptance

1. **Firebase key:** no server service-account key was found in the project or common user folders. Filename matches in Downloads were Flutter documentation, not server credentials. Owner can locate a downloaded `firebase-adminsdk` / service-account JSON file with File Explorer and use Shift + right-click → Copy as path. Provide only the path; do not paste the private key. Real push remains unverified; 22 delivery rows were pending/failed at inspection.
2. **Mail and device delivery:** provide an explicitly authorized test recipient/device for a controlled real delivery check. SMTP configuration alone is insufficient. Do not send to real applicants to test setup.
3. **Historical approvals:** institutional authority must choose the canonical admission and authorize a correction for the three existing approvals. The new rule does not silently rewrite prior decisions.
4. **Academic content:** replace/review the 10 active sample questions with approved assessment content. Do not rename sample tags merely to bypass the production check.
5. **Deployment:** provide the intended HTTPS host, configure production environment/debug settings there, verify secure document serving, configure a continuously running scheduler, and verify backups/restoration on the target host. The local development environment was intentionally not converted into a production deployment.
6. **Browser/mobile acceptance:** connect a browser and execute the scenario checklist in `TESTING_READINESS_2026-10-20.md` with fictional accounts. Complete all-role navigation, uploads/review/decisions, timing/resume/network interruptions, release, notifications, modals, themes, and responsive checks. Real mobile-client and full HTTP race acceptance were not executed here.

## Useful local commands

From `backend/`:

```powershell
php artisan test --compact
php artisan route:list
php artisan edupath:operations-check --url=http://127.0.0.1:8000
php tests/native/admission-concurrency.php
```

For a configured deployment, use `php artisan edupath:operations-check --production --url=https://YOUR-BACKEND-HOST` and still perform real delivery and browser acceptance separately. The optional URL probe writes and removes only a uniquely named disposable public canary, never an existing document.

Read-only supporting artifacts: `storage/testing-readiness-probe.php`, `storage/prepare-admission-duplicate-review.php`, `storage/testing-readiness-routes.json`. Duplicate frontend files were preserved; no merge/deletion was attempted.
