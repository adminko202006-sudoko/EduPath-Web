# EduPath testing readiness — October 20, 2026 (Asia/Manila)

> Later implementation checkpoint: see `COMPLETION_BATCH_2026-10-20.md`. That report supersedes this initial baseline for admission protection, timing, staff review, notification integration, development-server document protection and verification counts.

## Verdict

Ready for controlled local functional testing with fictional accounts. Not established as complete, ready for formal acceptance, or ready for production. Automated checks pass, but admission policy, exam timing, external delivery, and interactive acceptance remain unresolved.

This check made no business-code changes, no migrations, no real application submissions, and no decisions or data corrections. Existing records were preserved. Backend tests used SQLite in memory; live MySQL inspection was read-only. The frontend production output was rebuilt.

## Executed checks

| Check | Actual result |
| --- | --- |
| `php artisan route:list --json` | Passed; 171 registered routes. Inventory: `storage/testing-readiness-routes.json`. |
| `php artisan test --compact` with `DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:` | 164 passed; 1,377 assertions; 40.00 seconds. |
| `npm.cmd run lint` | Passed, exit 0. |
| `npm.cmd run build` | Passed, 1,977 modules; Vite reported 3.10 seconds. Required execution outside sandbox because helper-process spawning was blocked. |
| `npm.cmd test` | 52 passed, zero failed. Standard command passed outside sandbox; `node --test --test-isolation=none tests/*.test.mjs` also passed inside sandbox. Initial sandbox failures were process-spawn errors, not failed application assertions. |
| `php artisan migrate:status --no-ansi` | All 53 listed migrations applied; no migrations executed. |
| `php artisan schedule:list --no-ansi` | Notification dispatcher scheduled every minute. Does not establish that a scheduler process is running. |
| Live Laravel `/up`, Vite `/` | Both HTTP 200. |
| Anonymous applicant admissions, admin dashboard, staff dashboard, online-exam eligibility, applicant document file | All HTTP 401. |
| CORS preflight from `http://localhost:5173` | HTTP 204 with matching `Access-Control-Allow-Origin`. |
| Sample existing legacy document raw storage URL | HTTP 403 without authentication. Checks only the sampled file on the current Laravel server, not every file or deployment configuration. |
| Recent log sample | 20 error entries dated October 20 in last 6,000 lines; all had test stack frames. Includes intentionally simulated failures. Not evidence of a new live-server failure; not a full historical log audit. |

## Prioritized findings

1. **P1: Duplicate admissions remain permitted.** Applicant `AdmissionController::store()` creates a pending application without checking existing admissions. Admin creation has the same gap. Live data contains one applicant/period group with multiple pending, under-review, or approved applications. `AdmissionApplicationPolicyTest::test_applicant_can_submit_multiple_applications_under_current_api_policy` explicitly expects repeat submissions to succeed. This updates the earlier explanation: the implementation and test agree on allowing duplicates, but the intended institutional rule remains unresolved. Do not silently rewrite this policy or delete existing duplicates. Define same-period, different-program, rejected, withdrawn, and later-period behavior before enforcing the approved rule transactionally across web/mobile/admin paths.
2. **P1: Active exam configuration differs from the stated requirement.** Live setting is 5 seconds per question, so a 100-question attempt nominally lasts 8 minutes 20 seconds. The requested standard is 60 seconds / 100 minutes. This may be an intentional quick-test configuration; it was not changed. Existing attempts snapshot timing, so changing settings will not repair already-started attempts. Verify the official setting before timed acceptance testing.
3. **P1: Push delivery is not ready to verify.** Firebase credentials file is absent. There are 22 pending or failed push-delivery rows (combined count, not 22 confirmed failed deliveries). Configure credentials and confirm a scheduler is running, then test a real device. SMTP is configured, but real email delivery was not exercised; no email or notification was sent by this check.
4. **P1: Interactive end-to-end acceptance remains unverified.** No connected browser was available. Desktop/mobile layouts, centered dialogs, uploads through the UI, refresh/resume on a real browser, and all-role click-through acceptance were not executed. Automated API tests do not substitute for these checks. Live concurrent MySQL requests, ordinary network interruptions, and mobile-client integration were not tested in this pass.
5. **P2: Local-only deployment settings.** Environment is `local` with debug enabled. Suitable for local investigation; production hardening and deployed document-access checks remain necessary before release. No secrets were printed.
6. **P2: Inactive duplicate frontend still exists.** `index.html` loads `/src/main.jsx`; active routes import `src/pages`, not `src/src`. No nested-tree import was found in the inspected entry points/routes/configuration. Comparing JS/JSX/CSS files finds 11 identical, 63 different, zero nested-only files relative to their active counterparts. Differing files have not all received a semantic merge review. The duplicate tree is ignored by lint. No duplicate was deleted or merged.
7. **P2: Staff online-exam review requirement remains a scope gap.** Online-exam management/release routes inspected are admin-only; no separate staff online-attempt review endpoint was found. Keep existing permissions intact and define an authorized review role before adding staff access. Existing scheduled-exam staff access is separate and covered by tests.

## Workflow connection checklist

| UI/workflow | Backend / persistence | Evidence and remaining work |
| --- | --- | --- |
| Applicant admission page | `POST /api/applicant/admissions` → applicant AdmissionController → admission_applications/history | Submission/withdrawal tests pass. Duplicate submissions are intentionally accepted by the existing test; policy unresolved. UI displays first returned application, which can obscure earlier records. |
| Scholarship application | `POST /api/applicant/scholarships/{scholarship}/apply` → applicant ScholarshipController → scholarship_applications | Code checks configured admission prerequisite, active/window state, existing application; unique scholarship constraint is applied. Full browser submission not exercised. |
| Online exam eligibility/start/resume/answers/submit | Applicant online-exam routes → OnlineExamController → attempts, question assignments, answers, retake grants | Automated tests cover approved admission/scholarship gates, persisted order and answers, answer-key privacy, server deadlines, expiry, scoring, ownership, repeat attempts and retakes. Live setting is 5 seconds. |
| Question bank, retakes, release | Admin online-exams routes → admin exam controllers → questions/options, attempts, grants, notifications | Tests cover safe question edits/deletion, role restrictions, retakes, score integrity, release privacy and idempotent notification. Staff online review not established. |
| Existing scheduled Entrance Exams | Admin/staff/applicant exam routes → entrance_exams/exam_assignments | Tests cover assignment, scope, score limits, result privacy, release locks, roster access, and FHE approval/award gates. Actual UI acceptance still pending. |
| Applicant documents | Authenticated role-specific document routes → document controllers/storage/history | Ownership, private uploads, replacement/rollback failures tested. Sample raw legacy storage access denied. Real UI upload/download still pending. |
| Roles, profiles, onboarding, recovery | Existing protected API routes/models | Relevant backend tests pass for role/permission/program scope, profile storage, onboarding, account-email uniqueness, password recovery and safe API errors. Real recovery email/device delivery not verified. |
| Notifications and reports | Notification services/deliveries, console scheduler, report endpoints | Tests pass for ownership, unread/idempotency behavior, scheduled announcements, report permissions and export escaping. Live push credentials/scheduler operation remain unverified. |

## Live test-data availability

- 3 active academic programs; 1 currently open admission period.
- 4 active scholarships; 2 active `other` scholarships configured for online exams. This does not certify that each scholarship application window is currently open or every test applicant is eligible.
- Exactly 100 active exam questions. Each has at least two options and exactly one correct option. Content quality, category coverage, and academic suitability were not reviewed.
- App key configured; live database is MySQL.

## Next acceptance pass

Use fictional applicant accounts and approved staff/admin test accounts. Record actual outcomes, screenshots, and console/network errors for:

1. Register/login → profile → admission submission → document upload/review → authorized decision → dashboard and notification update.
2. Confirm the approved duplicate-admission rule, including concurrent requests and parity between web/mobile/admin creation. Preserve existing duplicate records pending authorized resolution.
3. Scholarship submission in open/closed windows, duplicate rejection, configured admission prerequisite, staff recommendation, admin eligibility decision, and separate final award.
4. Fresh 100-question exam at intended timing: refresh, interruption/resume, expired questions, unanswered final question, scoring, exhausted attempts, authorized retake, hidden results, official release.
5. Scheduled exam assignment, attendance, scores, remarks, release and roster download without early result disclosure.
6. Cross-role/other-applicant denial, revoked staff permissions, mobile Chrome layouts, dark/light themes, dialogs, loading states and failed requests.
7. Real password-reset email, device push, scheduled dispatch, deployment document denial, and native MySQL concurrency.

## Artifacts created by this pass

- This report.
- `storage/testing-readiness-routes.json`: current route inventory.
- `storage/testing-readiness-probe.php`: read-only aggregate local configuration/data probe; rerun with `php storage/testing-readiness-probe.php`. It does not emit credentials, applicant identities, answer keys, scores or document paths.

No migration, production policy change, privilege change, data deletion, or duplicate-tree cleanup was performed.
