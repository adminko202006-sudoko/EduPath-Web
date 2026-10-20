# EduPath — System Audit & Repair Log

> **Current checkpoint (2026-10-18):** Security/workflow/reporting batches implemented. Final full Laravel suite: 128 passed / 853 assertions; final targeted security suite: 8 passed / 49 assertions. Frontend lint/build and 31 tests passed. Flutter: 83 passed / 1 optional live probe skipped; final targeted 4 passed, analysis clean, APK built. Three additive migrations ran; private backup/isolated restore/native row lock/storage checks passed. Firebase, live mail/device, deployed raw-document denial and full HTTP race acceptance remain pending. See RELIABILITY_IMPLEMENTATION.md and the final checkpoint below.

Maintained per AGENTS.md. Last updated: 2026-10-18. Historical findings and verification results below are preserved; later checkpoints supersede conflicting earlier entries.

## Verification baseline (historical ? 2026-10-16)

| Check | Command | Result |
|---|---|---|
| Route inventory | `php artisan route:list` | ✅ 125 routes (119 `api/*`), exit 0 |
| Backend tests | `php artisan test` | ✅ 2 passed (only stock Example tests exist) |
| Frontend build | `npm run build` | ✅ exit 0 (chunk >500 kB ng) |
| Frontend lint | `npm run lint` | ❌ exit 1 — 43 errors in active `src/` (was), 43 in stale nested copy |
| Migration status | `php artisan migrate:status` | ✅ 14/14 Ran, MySQL re |
| Live API smoke | `curl` against `127.0.0.1:8000` | ✅ public 200, validation 422 JSON, CORS preflight 204 |
| PHP syntax (exam controllers) | `php -l` on Exam controllers/model | ✅ no syntax errors |

## Prioritized checklist

### P0 — Critical (fixed)

1. **Unauthenticated API requests returned HTTP 500 instead of 401.**
   - Symptom: `GET /api/admin/dashboard` (and every protected route) without an
     `Accept: application/json` header returned
     `500 {"message":"Route [login] not defined."}`; with the header it correctly
     returned 401. 19 occurrences in `laravel.log`.
   - Root cause: `ApplicationBuilder::withMiddleware()` installs a default
     guest-redirect `fn () => route('login')`. `Illuminate\Auth\Middleware\Authenticate::redirectTo()`
     invokes it **while building** the `AuthenticationException`, before any exception
     rendering runs — and this app has no named `login` route (the React SPA owns
     `/login`), so a `RouteNotFoundException` escaped as a 500. The
     `shouldRenderJsonWhen`/`render` hooks in `bootstrap/app.php` never got the chance
     to run.
   - Fix: `backend/bootstrap/app.php` — `redirectGuestsTo()` now returns `null` for
     `api/*` (and `/login` otherwise), plus an explicit `render()` callback returning
     `401 {"message":"Unauthenticated."}` JSON for `api/*`.
   - Verified: 4 protected routes tested with and without the `Accept` header → all
     401 JSON; public `GET /api/programs` → 200; wrong method → 405 JSON; no new
     `local.ERROR` entries written after the fix; `php artisan test` → 2 passed.

### P0/P1 — Critical (fixed this session)

1b. **Applicant-uploaded documents were served with no authorization.**
   - Uploads live on the *public* storage disk behind `public/storage` symlink;
     `GET /storage/documents/<file>` returned **200 for anonymous requests**
     (verified), and the five screens built plain `<img>`/`<a>`/`window.open`
     URLs to it. Unpredictable filenames mitigate but do not satisfy
     AGENTS.md Phase 7 ("protect private files").
   - Fix (additive, non-destructive — existing files were not moved):
     - New shared concern `app/Http/Controllers/Concerns/ServesApplicationDocumentFiles.php`
       streams the file with `nosniff` + `no-store` headers after the caller's
       authorization check.
     - New authenticated endpoints, each enforcing the role's existing scoping:
       `GET /api/applicant/documents/{document}/file` (ownership),
       `GET /api/staff/documents/{document}/file` (program assignment +
       `verify_documents`), `GET /api/admin/documents/{document}/file` (admin).
     - Frontend `src/services/documentFile.js` fetches with the Bearer token and
       opens a blob URL; `applicant/Documents`, `staff/Documents`, `admin/Documents`
       and `admin/AdmissionApplicationDetails` now use it. Downloadable admission
     forms in `admin/Requirements` intentionally stay public.
   - Verified with temporary tokens over HTTP (all removed afterwards):
     anonymous → 401; owner applicant → 200 `image/jpeg` (1.1 MB, valid JPEG);
     other applicant → 403; staff with the applicant's program → 200; staff
     without → 403; applicant→staff endpoint → 403; staff→applicant endpoint →
     403; admin → 200; unknown id → 404. `npm run build` exit 0; targeted ESLint
     shows only the pre-existing `set-state-in-effect` errors; `php artisan test`
     2 passed; `php artisan route:list` exit 0 (128 routes = 125 + 3 new).
   - **Remaining (needs approval):** the files themselves are still on the public
     disk, so the raw `/storage/...` URLs keep working. Closing that hole fully
     means moving existing uploads to the private disk and re-pointing reads —
     a data migration that must be approved.

### P1 — High priority (open)

2. **Online Examination module does not exist yet (AGENTS.md Phase 5).**
   - No `question*` / `attempt*` models, migrations, controllers or routes; only the
     pre-existing scheduled Entrance Exams (`entrance_exams`, `exam_assignments`) are
     present. Phase 5 is a full build: question bank, server-side random selection of
     100 questions, eligibility gate (approved admission), 60 s/question server
     timers, transactional scoring, staff review, admin result release, plus all
     applicant/staff/admin screens. Must not touch the scheduled Entrance Exams module.
3. **No project test coverage.** Only stock `Tests\Unit\ExampleTest` and
   `Tests\Feature\ExampleTest` exist — nothing covers admissions, scholarships,
   exams, notifications, or authorization. Phase 9 requires targeted tests,
   especially for the new Online Examination behavior.
4. **`npm run lint` still fails (37 errors in active `src/`):**
   - 31 × `react-hooks/set-state-in-effect` (setState called synchronously in
     `useEffect` bodies during data loading) — needs a deliberate restructure pass
     across ~15 pages, not suppressions.
   - 6 × `react-refresh/only-export-components` (`ConfirmDialog.jsx`,
     `ConfirmDialogHost.jsx`, `Shared.jsx`, `AuthContext.jsx`, `ThemeContext.jsx` ×2)
     — files export both components and non-component values; fix by splitting
     context/hook exports into their own modules.
   - Build (`npm run build`) passes; lint is the failing check.

### P2 — Medium (open)

5. **Duplicate nested frontend tree `frontend/src/src/` (84 tracked files).**
   - Verified **inactive**: entry point is `/src/main.jsx`, no file imports
     `src/src`, and the build never touches it. It is a stale snapshot: 42 files
     identical to the active tree, 25 files where only the active tree changed,
     16 where both diverged, and **5 files that exist only in the nested copy**
     (`components/Modal.jsx`, `components/Navbar.jsx`, `components/ui/ConfirmDialog.jsx`,
     `components/ui/Shared.jsx`, `pages/About.jsx`).
   - Evidence it is superseded, not unique work: `frontend/REPLACEMENT_README.txt`
     states the delivered active tree "intentionally excludes the duplicate nested
     src/src tree", and the active tree contains the newer `ModalPortal.jsx` /
     `ConfirmDialogHost.jsx` centered-dialog implementation the README describes.
   - It also contributes 43 of the 86 lint errors (it is linted by `npx eslint .`).
   - **Not deleted** — AGENTS.md forbids deleting duplicate files until contents are
     verified; approval still required before removal.
6. **Password-reset email delivery unverified.** `PasswordResetOtpNotification`
   sends by mail (`smtp.gmail.com:587`). The log holds 18 historical
   `STARTTLS … failed loading cafile C:\xampp\php\cacert.pem` errors; the file exists
   now and `php.ini` points at it, but a real send has not been exercised.
7. **Bundle size:** single 1.35 MB JS chunk (gzip 259 kB) — route-level
   `React.lazy` code splitting recommended.
8. **Log hygiene:** 188 historical errors in `storage/logs/laravel.log`, mostly
   environmental and already resolved: 37 DB-connection-refused (MySQL was down),
   10+6 access-denied, 13 `Data truncated for column 'status'` (fixed by the
   `application_documents` enum migration — current enum matches live values),
   10 `Class "App\Models\ScholarshipApplication" not found` (model exists and is
   imported now), 4 missing `intl` extension (environment), 4 SQLite
   `personal_access_tokens` (test runs).

### P3 — Verified healthy (no action)

- Admission/scholarship/document status enums match live data
  (`application_documents`: pending/under_review/verified/rejected;
  `admission_applications`: pending/under_review/approved/rejected).
- `entrance_exams.results_released_at` column exists; all 14 migrations marked Ran
  (one historical duplicate-column error when the migration was re-applied).
- CORS (`backend/config/cors.php`) allows localhost + LAN origins; preflight returns
  204 with correct headers.
- Axios layer (`frontend/src/services/api.js`) injects `Bearer` token, sets JSON
  headers, skips FormData content-type, broadcasts a refresh bus after mutations,
  and unwraps paginated payloads.
- 125 backend routes vs frontend service calls sampled: no dangling frontend →
  missing-endpoint calls found (paths in `src/services/*` all exist in `route:list`).

## Change record

| Date | File | Change | Verification |
|---|---|---|---|
| 2026-10-16 | `AGENTS.md` | Added repo-root agent instructions (EDUPATH master prompt) | Structure/keyword check |
| 2026-10-16 | `backend/bootstrap/app.php` | Fixed 500→401 for unauthenticated API requests | 4 routes × 2 header variants → 401; public 200; 405 JSON; no new log errors; `php artisan test` 2 passed |
| 2026-10-16 | `frontend/src/context/ThemeContext.jsx` | Removed 2 unused `catch (error)` bindings | `npm run lint` active errors 43 → 37; `npm run build` exit 0 |
| 2026-10-16 | `frontend/src/pages/admin/Applicants.jsx` | Removed unused `UserRound` import | same as above |
| 2026-10-16 | `frontend/src/pages/{admin,staff,applicant}/Settings.jsx` | Removed unused `useEffect` imports | same as above |
| 2026-10-16 | `backend/app/Http/Controllers/Concerns/ServesApplicationDocumentFiles.php` | New shared file-streaming concern | 9 HTTP authorization scenarios (see finding 1b) |
| 2026-10-16 | `backend/app/Http/Controllers/Api/{Applicant,Staff,Admin}/DocumentController.php` | Added `file()` endpoints reusing each role's authorization | `php -l` clean; HTTP matrix above |
| 2026-10-16 | `backend/routes/api.php` | Registered the 3 `/documents/{document}/file` routes | `route:list` exit 0 |
| 2026-10-16 | `frontend/src/services/documentFile.js` | New authenticated document-open helper | build exit 0 |
| 2026-10-16 | `frontend/src/pages/{applicant,staff}/Documents.jsx`, `admin/Documents.jsx`, `admin/AdmissionApplicationDetails.jsx` | Document viewing now uses the authenticated endpoint instead of public `/storage/` URLs | build exit 0; only pre-existing lint errors remain |

## Phase 2/3 authenticated trace (read-only, temporary Sanctum tokens; all removed afterwards)

Temporary tokens were minted for admin (user 1), applicant (user 5), staff without
exam permission (user 3) and staff with exam permission (user 8), exercised over
HTTP, then deleted (`audit-temp` → 0 rows; token count restored 137 → 137).

| Check | Result |
|---|---|
| `GET /api/admin/dashboard` counts vs DB | ✅ exact match (applicants 11, staff 3, applications 6 = 5 approved + 1 rejected, programs 8, documents 14, scholarships 7, scholarship applicants 4, exams 2, announcements 13) |
| Applicant ownership — `GET /api/applicant/exams` | ✅ only own assignments returned |
| Applicant cross-ownership — `GET /api/applicant/exams/3` (another applicant's) | ✅ 403 `Unauthorized access.` |
| Applicant → `/api/admin/dashboard` | ✅ 403 |
| Staff (no `manage_exams`) → `/api/staff/exams` | ✅ 403 `You do not have permission...` — permission middleware works |
| Staff (has `manage_exams`) → `/api/staff/exams` | ✅ 200, but `data: []` — see finding 9 |
| Staff → `/api/admin/exams` | ✅ 403 |
| Staff `PUT /api/staff/exams/2` (unassigned program) | ✅ 403 `You are not authorized to access this exam.` |
| Applicant dashboard data sources (`applicant/Dashboard.jsx`) | ✅ all six endpoints exist and returned 200: admissions, documents, scholarship-applications, scholarships, exams, notifications |
| Staff/admin dashboards | ✅ `/staff/dashboard`, `/admin/dashboard` are real endpoints (no hardcoded data) |
| Unreleased score exposure in applicant responses | ✅ assignment payloads contain no `score`/`remarks` keys while `results_released_at IS NULL` |

### Finding 9 (data configuration, not code) — staff cannot see any entrance exam

No active staff member currently sees a single exam:

- `staff_id 2` (active, assigned programs 6 & 7) has `manage_exams = 0`.
- `staff_id 4` (active, `manage_exams = 1`) has **no** `staff_programs` rows, and
  `Staff\ExamController@index` scopes exams through
  `examAssignments.applicant.admissionApplications` ∈ staff's programs → empty.

The staff Exams screen is therefore empty for every account. The scoping itself is
correct and secure; the fix is granting `staff_programs` (and/or `manage_exams`) to
the right staff member — **a data/institutional change that needs approval**.
Also note `staff_id 2` has `manage_admissions = 0` despite the `Admission Staff` role.

## Unresolved / needs approval

- Deleting `frontend/src/src/` (84 files) — awaiting approval; evidence says stale.
- Staff program/permission assignment (finding 9) — awaiting approval; no staff can
  currently view entrance exams.
- 31 `set-state-in-effect` + 6 `react-refresh` lint errors.
- Online Examination module (Phase 5) — not started.
- Test coverage for new and existing workflows — not started.

## Final remediation and integration verification (2026-10-17)

### Document access

- Root cause: applicant uploads previously used Laravel's public disk under `public/storage/documents`, so a raw storage URL could bypass ownership checks.
- Current implementation writes new applicant uploads to the private `local` disk (`storage/app/private/documents`) and streams files through authenticated applicant, staff, and admin routes with role/ownership checks. The Flutter app builds the authorized file route and supplies its bearer token for image preview; the React UI uses its authenticated blob helper. Existing storage path fields and API document payload shape remain unchanged.
- `backend/DOCUMENT_STORAGE_SECURITY.md` records the prior migration procedure. Current disk inspection found 23 files in the private documents directory and zero in the public documents directory. The Apache `.htaccess` denies `/storage/documents/`; deployments on Nginx or another server must apply the documented equivalent deny rule. Direct web-server behavior could not be live-tested because the API host was not running.
- `ApplicantDocumentAccessTest`: 5 passed (anonymous 401, owner access, cross-applicant 403, legacy authorized fallback, unlinked applicant 403).

### Announcements

- Flutter `NotificationsProvider` now retains the distinction between a successful empty list and request/response failures. It maps authentication, timeout/connection, and server errors to useful messages; the announcements tab shows retry on failure.
- `notifications_provider_test.dart` covers empty, populated, 401, 500, and malformed payload cases. These focused tests passed as part of the Flutter suite.

### Admission policy

- Laravel `AdmissionController::store` accepts any number of applications during an open admission period. The schema has no applicant/program uniqueness constraint, and no draft edit route exists. The established API behavior therefore permits multiple submissions; adding a one-application restriction would change the business policy.
- Flutter had an unsupported local rule blocking another active application to the same program. That rule was removed. The explicit confirmation and in-flight locks remain to prevent accidental rapid duplicate sends, while the server response remains authoritative.
- `AdmissionApplicationPolicyTest` exercises two submissions against the real Laravel route and passed (1 test, 6 assertions). Flutter's provider test also verifies two accepted responses.

### Verification results

- Flutter: `flutter analyze` — no issues; `flutter test` — 38 passed, 1 skipped (the live API URL probe); `flutter build apk --debug` — passed.
- Laravel: `php artisan test` — 24 passed (75 assertions); modified document PHP controllers/concern passed `php -l`; route inventory confirms applicant document file and admission routes.
- Live integration: not run. `127.0.0.1:8000` refused connection for program, admission, announcement, document, and raw storage probes. No safe applicant credentials or live session were supplied, so no account data was changed and no authenticated workflow is claimed as verified.
- Devices: `adb devices -l` listed no emulator or physical device. Network loss/reconnect, app lifecycle, small-screen, and device document checks remain unverified.
- Online Examination: reviewed Flutter runner/provider and existing server tests. The app resumes from server attempt state, uses the server's current question and remaining seconds, retries pending answer writes, guards repeat submissions, and reloads official results. `OnlineExamIntegrityTest` cases pass within the Laravel suite. This is code/test verification only; timeout and background/foreground behavior were not exercised on a live API/device. The client uses local time for its visible countdown; backend deadlines and answer/attempt endpoints remain authoritative.

### Files and backups for this update

- Flutter policy correction: `lib/features/admission/admission_provider.dart`, `lib/features/admission/screens/apply_admission_screen.dart`, and `test/features/admission/admission_provider_test.dart` in the mobile project. Timestamped `.before_policy_alignment_20261017.bak` copies were created before edits.
- Laravel regression coverage: `backend/tests/Feature/AdmissionApplicationPolicyTest.php`.
- The document storage/controllers, Flutter announcement handling, and their tests were already present in the shared working tree before this update; their current verification is recorded above.

### Remaining steps

- Start Laravel on a reachable host and supply a safe test applicant account before performing real login/profile/admission/document/scholarship/notification/exam integration checks.
- Apply and verify the `/storage/documents/` deny rule in the actual production web server, especially if it is not Apache.
- Attach an Android emulator or device and exercise lifecycle, network recovery, document viewing, and small-screen layouts.

## Continuation checkpoint — 2026-10-18 (web audit and shared UI)

This entry supersedes conflicting historical status statements above; previous findings are retained as history. This was a bounded continuation batch, not a claim of a complete system audit or demonstration readiness.

### Actual phase and initial findings

The project is in the master continuation prompt's Phase 3 (shared web redesign), with Phase 5/6 integration and verification still incomplete. Under the original AGENTS phase numbering, Online Examination Phase 5 is partially implemented and Phase 8/9 work remains. It must not be rebuilt: question/option/answer/attempt/retake models, migrations, applicant runner, admin bank/release UI, routes and meaningful tests already exist. The older claims that Online Examination and project tests do not exist are obsolete.

Before editing, `git status --short` showed extensive modified and untracked Laravel/React work, backup files, AGENTS.md and AUDIT.md. All were preserved; no reset, cleanup, destructive migration, real applicant mutation, permission change or institutional decision was performed. This batch changes no API contract or database schema.

Baseline: Laravel 33 tests passed (120 assertions); frontend lint exit 0 with 30 warnings; production build passed outside the sandbox with a 1,407.97 KB main JS bundle. The sandbox build initially failed with spawn EPERM and native dependency loading errors; the approved unrestricted build succeeded without dependency changes.

### Module status matrix (source and automated evidence, not live acceptance)

| Module | Current classification | Verification / remaining evidence |
|---|---|---|
| Registration, login, logout | Implemented but not fully tested | Auth routes/service/context/protected route exist; no real three-role login/session/logout test in this batch |
| Password reset / OTP | Implemented but not fully tested | OTP request/verify/reset routes exist; SMTP delivery and runtime flow unverified |
| Authentication persistence and role redirects | Implemented but not fully tested | Saved bearer token, user lookup, protected role redirects inspected; network/session recovery needs browser testing |
| Applicant dashboard, profile, programs | Implemented but not fully tested | Routed pages and data calls exist; counts and edit flows need current live validation |
| Admissions | Partially implemented / selectively verified | Existing isolated tests cover submission, withdrawal, admin create/edit, ownership and history; full document-review-decision chain remains unverified |
| Requirements and private documents | Implemented but not fully tested | Five existing applicant file-access tests pass; full upload/review/download and deployed raw-storage denial need live checks |
| Scholarships and scholarship applications | Implemented but not fully tested | Admission prerequisite, configured exceptions and unrestricted awards comments inspected; provider/date/recommendation/decision regression coverage remains |
| Scheduled Entrance Exams | Implemented but not fully tested | Separate existing routes/controllers retained; applicant controller hides unreleased score/remarks; no dedicated scheduled-exam suite in current tests |
| Applicant notifications / announcements / settings | Implemented but not fully tested | Pages/routes exist; unread counts, delivery, retry and account actions need end-to-end checks |
| Staff dashboard / assigned review / documents | Implemented but not fully tested | Staff permission middleware enforces active status and configured permission; program scoping present; cross-role live work queues unverified |
| Staff scholarships / reports / exams / notifications | Implemented but not fully tested | Existing modules preserved; the prior staff assignment finding has not been rechecked against live data |
| Admin dashboard / applicants / staff | Implemented but not fully tested | Routed pages exist; real counts, permissions, archive/restore and CRUD need isolated regression coverage |
| Admin programs / requirements / admission periods | Partially implemented | CRUD exists; program delete directly calls delete despite restricted admission FK, likely producing generic error for referenced programs |
| Admin scholarships / scheduled exams / announcements | Implemented but not fully tested | Existing implementation retained; full release/selection and cross-role regressions outstanding |
| Admin profile | Implemented; tested API subset verified | Existing tests verify admin profile read/update/upload and non-admin rejection |
| Admin reports | Missing dedicated web page | Staff Reports exists; no dedicated admin reports route in AppRoutes |
| Online question bank | Partially implemented | Backend CRUD and used-question retention guards exist; UI adds/toggles, but edit/delete controls remain incomplete |
| Online attempt runner / scoring / retakes | Partially implemented; tested API subset verified | 19 online integrity tests pass; UI/network lifecycle, complete eligibility rechecks and concurrent MySQL behavior still need verification |
| Online review / official release | Partially implemented | Admin release/retake paths exist; staff online review route/UI absent; availability/result notification integration not found in online controllers |
| Shared design / dialogs / theme | Partially implemented | Navy/gold theme and Requirements reference already present; improvements below compile/lint; visual desktop/mobile and keyboard acceptance unavailable |

No whole business module is labeled complete solely because its routes render or its build succeeds.

### Duplicate source tree: current evidence

`frontend/index.html` points to `/src/main.jsx`; main imports active App and index.css; App uses active routes. Vite has React and Tailwind plugins without a nested-source alias. Searches found no active `src/src` reference beyond the exclusion comment and delivery README. ESLint already ignores `src/src/**`.

A fresh recursive byte comparison found 85 nested files including a CSS backup: 26 identical to active counterparts, 59 different, zero nested-only paths. This updates the older file counts above. Different contents may contain historical unique edits; no merge/removal is justified from filename counts alone. The entire nested tree was left untouched.

### Feature connections and repairs

| UI / shared behavior | API/controller/model | Cause / expected behavior | Change / verification |
|---|---|---|---|
| All role page navigation | Existing routes and API calls unchanged | All pages eagerly imported, so login loads every role's page code | Lazy page imports + Suspense and render/chunk error state; build main JS 325.42 KB vs 1,407.97 KB baseline |
| Confirmation dialogs in all roles | Existing caller handlers unchanged | Two dialog implementations diverged; legacy long content could overflow; busy dialogs still canceled | One shared component; internal scroll, busy Cancel/Close/Escape/backdrop guard; lint/build pass, browser verification pending |
| Modal background and nested focus | No backend dependency | Scroll and Tab trapping existed but background lacked inert state | Shared portal now makes background/lower dialogs inert, observes new body children, restores prior state and redirects escaped focus |
| Confirmation promise lifecycle | No backend dependency | Second call overwrote pending resolver; unmount left callers waiting | Earlier request resolves false; unmount cancels unresolved request |
| Sidebar / mobile shell | Existing permission payload | Unstable empty permissions object and incomplete effect dependencies | Stable nullable fallback, optional permission lookup, memoized layout close callbacks and complete Sidebar dependency array; 2 warnings removed |
| Applicant exam refresh | GET attempt/questions, POST answers; Applicant OnlineExamController; online_exam_* tables | Must keep assigned order/answer, never reveal answer key | Added isolated test with two refreshes, unchanged persisted order, selected answer, no score/key; passes |
| Applicant exam timeout | Same controller and tables | Server deadline must reject previous/future answers | Exact deadline advances to question 2; only current answer accepted; test passes |
| Applicant exam expiration | GET attempt/result, POST submit; same tables | Unanswered count wrong; finalization must be stable and hidden until release | New test verifies zero score, expired status, hidden result and repeated submission rejection without changed completion timestamp; passes |

### Exact files changed in this batch

- `frontend/index.html`: EduPath title, description and navy theme-color.
- `frontend/src/App.jsx`: route loading/error boundary integration.
- `frontend/src/routes/AppRoutes.jsx`: lazy page imports; route paths/role protection retained.
- `frontend/src/components/RouteBoundary.jsx` (new): accessible loading and generic retryable page failure state; diagnostic details remain in console. Route changes reset failure without key-remounting the role layouts.
- `frontend/src/components/ui/ConfirmDialog.jsx`: reusable ConfirmationDialog and existing host adapter, busy dismissal guards.
- `frontend/src/components/ui/Shared.jsx`: legacy confirmation adapter preserving its non-destructive default; live loading status.
- `frontend/src/components/ui/ModalPortal.jsx`: inert background lifecycle and focus containment.
- `frontend/src/components/ui/useConfirmDialog.js`: resolve canceled/concurrent/unmounted confirmations safely.
- `frontend/src/components/Sidebar.jsx`: stable permission fallback and mobile-close effect dependencies.
- `frontend/src/layouts/AdminLayout.jsx`, `StaffLayout.jsx`, `ApplicantLayout.jsx`: stable mobile close callbacks.
- `backend/tests/Feature/OnlineExamIntegrityTest.php`: three timing/resumption/privacy regression tests, using isolated SQLite and whole-second test clocks to match persisted timestamps.
- `AUDIT.md`: this appended checkpoint.

### Checks executed

- `php artisan route:list --except-vendor`: exit 0, 145 routes. Existing scheduled and online routes remain distinct.
- `php artisan test`: baseline 33 passed / 120 assertions; final 36 passed / 154 assertions. Online subset final 19 tests included in full suite.
- `php -l tests/Feature/OnlineExamIntegrityTest.php`: no syntax errors (before final test-clock-only adjustment; full final test suite subsequently executed the file successfully).
- `npm run lint`: baseline exit 0 / 30 warnings; after UI changes exit 0 / 28 warnings. Remaining warnings are recorded below. Final rerun recorded after this entry if different.
- `npm run build`: baseline and revised builds exit 0 outside sandbox. Revised main JS 325.42 KB, gzip 103.11 KB, route chunks produced; no >500 KB JS chunk warning.
- Initial new test runs failed due to test fixtures returning models rather than IDs and fractional frozen time versus whole-second DB persistence. Corrected the test setup; did not loosen server validation or deadlines. All final tests pass.
- Browser inventory returned no apps or browsers. No visual/modal keyboard/responsive/theme/runtime-console tests claimed. No frontend test command is configured. No mobile project or live mobile session tested.
- Local environment inspected only for non-secret mode/configuration: local debug environment, MySQL, SMTP and database queue. No credentials/tokens printed. Forty-five migration files found; live migration state was not changed or asserted.

### Remaining priorities and next phase

Critical: no newly confirmed critical vulnerability from this bounded review; this is not a full security clearance.

High:
- [ ] Finish admin Online Examination pagination: API paginates attempts at 25; current UI renders only first response page. Add page controls, request cancellation and action locks/confirmations for official release/retake actions.
- [ ] Finish question editing and safe deletion UI using existing backend rules; test invalid options and assigned-question retention, including concurrency against MySQL.
- [ ] Resolve required staff Online Examination monitoring/recommendation scope with the institution before introducing permissions or a new review workflow; no permissions were granted here.
- [ ] Verify admission/scholarship eligibility on all protected attempt operations. Start enforces prerequisites; ownership-only operation checks need a documented continuation/eligibility policy review before changing behavior mid-attempt.
- [ ] Connect online availability/release notifications and verify idempotency; release must remain distinct from scholarship award.
- [ ] Add friendly referenced-program deletion rejection instead of letting restrictive FK failure surface generically; preserve existing applications.
- [ ] Authentication/OTP rate limiting is not visible in inspected auth routes/controller; audit brute-force protection and add isolated abuse/authorization tests.
- [ ] Confirm staff admission decision authority: existing manage_admissions routes permit staff approve/reject, while the prompt calls for authorized decision makers. Do not silently remove an established permission; institutional clarification is needed if the designated authority differs.

Medium:
- [ ] Address 28 existing hook dependency warnings with stable callbacks/cancellation, without suppressions or request loops.
- [ ] Verify Admin/Staff/Applicant login, expiry/logout, uploads/reviews, admissions, scholarship-specific dates/exams, scheduled exam release and notifications using disposable isolated accounts.
- [ ] Exercise modal nesting, viewport centering while scrolling, busy state, focus return, theme and mobile Chrome. KeepAliveOutlet retains hidden pages; explicitly test portal/timer behavior during navigation.
- [ ] Add dedicated scheduled-exam and scholarship regression tests; validate frontend/mobile API consistency and MySQL locking with concurrent requests.
- [ ] Review failed-session/network recovery in AuthContext (currently clears token on any user-lookup failure) and notification error states.
- [ ] Check queued notification worker and actual OTP mail delivery; use a safe mailbox and explicit test context.

Low:
- [ ] Continue page-by-page academic design consistency against Requirements.jsx; refine excess gradients/glass effects and shared table/form states.
- [ ] Decide whether a dedicated admin reports page is required; do not invent report data.
- [ ] Review divergent nested-source contents before optional archiving/removal; retain all user backup files until deliberately approved.

Next coherent development phase: complete Online Examination admin controls and regression coverage, then isolated cross-role browser integration. This batch is ready for that continuation; full redesign and demonstration acceptance remain open. No data-migration or business-policy approval was needed for the changes made here.

Final validation for this checkpoint: `npm run build` exit 0 after the final modal-focus/lifecycle adjustments; main JS 325.50 KB (gzip 103.14 KB). `php -l tests/Feature/OnlineExamIntegrityTest.php` exit 0 on the final file. `git diff --check` reports pre-existing whitespace in ThemeContext.jsx and the online-exam route block (plus Git CRLF conversion notices); no unrelated formatting cleanup was applied. The aggregate shell command also ran status/stat, so its final exit 0 must not be interpreted as a clean whitespace check.

## Phase 3 continuation — exam management, staff scope and notifications (2026-10-18)

This checkpoint updates the preceding checklist without removing its history. Current phase remains Phase 3 web completion with targeted backend integration/QA. This batch completes the connected admin management controls and fixes verified access/notification defects; full system demonstration acceptance is still pending.

### Inspection and baseline

Read the prior checkpoint and inspected the current admin OnlineExamManagement page; online/scheduled controllers, models, relationships and routes; staff permission middleware and scholarship recommendation handling; applicant/staff notification controllers/pages; admin/staff announcement controllers and shared delivery service. `git status --short` still showed extensive existing modifications/untracked work. No Git cleanup, database reset, migration, real account/record change or permission grant was performed. The inactive `frontend/src/src/` tree was not changed.

Re-ran baseline `php artisan test`: 36 passed / 154 assertions. The exam admin API already paginated at 25, while its UI rendered only page one. Backend question mutation guards already prohibited modifying assigned wording/options or deleting assigned questions; the UI lacked those controls. Staff had scheduled-exam permissions/program assignments, but no explicit Online Examination reviewer permission or route. No such permission was inferred or created.

### Completed work and root causes

1. **Admin attempt management:** connected existing server pagination, total/page controls, applicant name/email/attempt-ID search, status and official-release filters. Filters are optional validated query parameters; existing endpoint and paginator envelope remain compatible. Ordering now uses ID as a timestamp tie-breaker. The responsive horizontally scrollable table shows scored/unscored status, pass status, release state, start/completion timestamps and admin-only details. The detail dialog includes persisted question order, deadline, remarks and release audit fields using the existing authorized response. No applicant score endpoint was broadened.
2. **Question bank:** connected edit text/options/correct answer, activation/deactivation and confirmed deletion. Existing 2–6 option records retain their option count when edited. Exactly one correct option is enforced in the form and Laravel. Used questions display a lock indicator and disable content edit/delete; server validation remains authoritative. Search/status filters and 10-record client pagination preserve the existing all-questions API contract. Used content stays immutable; revisions require a new question rather than altering historical answers. No versioning/soft-delete migration was needed.
3. **Question integrity under concurrent operations:** admin update/delete now recheck assignment use under a question row lock within the mutation transaction; applicant start locks selected question rows until assignments are persisted. This coordinates edits/deletions with the existing transactional start path. Native MySQL contention/deadlock behavior still needs multi-connection testing; SQLite tests cannot verify row-lock semantics.
4. **Mutation/error UX:** admin release, retake and delete use centered shared confirmation dialogs; the request lock and busy buttons prevent repeated writes. Retake reason validation is retained. Loading, successful empty, and failed load states are distinct, with retry actions. Request sequence guards ignore stale exam responses; existing refresh-bus events refresh bank/attempt data. Question edit and attempt details use the shared focus-managed portal, viewport-fixed backdrop and bounded internal scrolling. Navy/gold, white cards and dark variants are retained.
5. **Staff scheduled-exam record scope:** the prior controller scoped which schedules appeared, but eager-loaded *all* assignments on an allowed schedule, including other programs' applicants. List, show and update now scope assignment rows and nested admission rows to the staff member's existing programs. Unreleased score/remarks masking remains intact; released results remain visible only within that scope. No additional staff access or decision authority was granted.
6. **Staff recommendations:** isolated tests confirm an existing authorized scholarship recommendation moves pending to under_review, cannot use a client status field to finalize approval, and cannot modify an already final Admin decision. Staff/applicant calls to every admin online-exam management action are rejected by existing role middleware.
7. **Official online result notifications:** the locked first-release transaction now creates one in-app notification for the owner. Repeated release skips notification creation. Notification text contains no numeric grade and distinguishes examination results from scholarship awards. Historical already-released attempts are not backfilled. This is in-app delivery only; no new FCM/email delivery claim.
8. **Notification correctness:** repeated mark-as-read preserves the initial server read timestamp. Staff notification deletion safely rejects recipients without an applicant profile instead of dereferencing null. Ownership, active permission and program restrictions are tested. Sidebar now uses the shared Axios client/server unread count and refresh bus rather than a disconnected raw-fetch count. Applicant notifications use stable callbacks and stale-response guards; malformed/failed loads do not show a successful empty state and include retry. Applicant announcement failures likewise have a plain user-facing retry message rather than backend route details.
9. **Announcement duplication:** the existing shared Admin/Staff service serializes per-announcement in-app syncs by locking the announcement row and rechecking publication state. Repeated sync test verifies one in-app record per applicant and preserved read state. Draft/future announcements are hidden in applicant feed tests. Existing FCM delivery behavior was not exercised against devices.

### Exact files changed in this batch

| File | Purpose |
|---|---|
| `backend/app/Http/Controllers/Api/Admin/OnlineExamController.php` | Optional attempt filters/order, question usage count, mutation-lock rechecks, transactional in-app result notification |
| `backend/app/Http/Controllers/Api/Applicant/OnlineExamController.php` | Lock selected questions during attempt creation |
| `backend/app/Http/Controllers/Api/Applicant/NotificationController.php` | Idempotent mark-read timestamp |
| `backend/app/Http/Controllers/Api/Staff/ExamController.php` | Scope assignments and nested admissions on existing scheduled exam responses |
| `backend/app/Http/Controllers/Api/Staff/NotificationController.php` | Safe rejection for notification recipients without applicant records |
| `backend/app/Services/AnnouncementNotificationService.php` | Serialize/recheck in-app announcement sync |
| `backend/tests/Feature/OnlineExamIntegrityTest.php` | Thirteen new tests plus isolated schema fixtures for admin management, staff scope/recommendations, scheduled-exam privacy and notifications |
| `frontend/src/pages/admin/OnlineExamManagement.jsx` | Connected bank CRUD, attempt pagination/filters/details, confirmations, mutation locks, responsive states |
| `frontend/src/components/Sidebar.jsx` | Shared API/unread-count/refresh-bus connection |
| `frontend/src/pages/applicant/Notifications.jsx` | Stable load callback, stale-response protection, retry and failed-vs-empty state |
| `frontend/src/pages/applicant/Announcements.jsx` | Malformed-response rejection, clearer failures/retry |
| `AUDIT.md` | This status, verification and continuation record |

No database schema, routes, role definitions, institutional eligibility policy, passing score, timer duration or allowed-attempt policy changed. API additions are optional attempt filters and question `attempts_count`; existing response envelopes remain.

### Updated module status matrix (affected modules)

| Module | Status | Evidence / limits |
|---|---|---|
| Admin online attempt management | Implemented; API subset verified | Page 2, search/status/release filters and validation pass tests; visual interactions pending |
| Admin question bank | Implemented; API subset verified | Unused edit/correct-option change, invalid answer counts, used edit/delete rejection, deactivate and unused delete pass tests; client pagination only |
| Applicant online runner | Existing implementation retained; regression verified | Timing/resume/ownership/scoring/release/retake tests pass; native concurrent-start behavior and browser network recovery pending |
| Staff Online Examination review | Not authorized/configured | No new reviewer permission/route; admin endpoints reject staff; designated reviewer scope requires explicit authorization |
| Staff scheduled-exam review | Scope defect repaired; API verified | Authorized assignments/admissions only on list/show/update; active permission/program rejection tests pass |
| Scheduled applicant results | Privacy/ownership regression verified | Unreleased grades/remarks hidden, other assignment forbidden, official released score visible |
| Staff scholarship recommendations | Existing behavior verified | Recommendation remains distinct from final Admin approval; final decisions locked |
| Online official-result notification | Implemented; in-app API verified | One notification across repeated release, unread count/read timestamp and official result lookup pass |
| Applicant notifications/announcements | Improved; API subset verified | Owner-only reads/mutations, empty result, published feed, retries/malformed-response source checks; browser failures unverified |
| Staff notifications | API scope/null defect verified | No permission rejected; assigned-only listing/sending, other/admin recipient deletion rejected |
| Admin/Staff announcement delivery | In-app repeat-sync verified | Shared service preserves one row/read state; real FCM, scheduling worker and device delivery pending |
| Other modules | Previous checkpoint unchanged | No new full-system completeness claim |

### Executed validation

- Baseline `php artisan test`: **36 passed, 154 assertions**.
- Final `php artisan test`: **49 passed, 259 assertions**. All feature fixtures explicitly use SQLite `:memory:`; no real applicant decisions or live database modifications.
- Final targeted `php artisan test --filter=OnlineExamIntegrityTest`: **32 passed, 198 assertions**, including scheduled/staff/notification regression cases in the expanded suite. A fixture initially cached a staff relationship across permission-state changes; refreshing the test identity between simulated requests fixed the test setup without weakening middleware.
- `php artisan route:list --except-vendor`: exit 0, **145 routes**. A separate JSON-to-PHP counting pipeline initially failed because of Windows CLI quoting; the ordinary route inventory rerun succeeded.
- `php -l` executed for every changed PHP controller/service/test: no syntax errors. Final repeats included the staff notification null-check and latest tests.
- `npm run lint`: exit 0, **0 errors / 27 warnings**, versus the previous 28-warning baseline. Changed frontend files have no remaining hook dependency warnings; no rule was disabled. Temporary cleanup-ref warnings during development were corrected with stable invalidation callbacks.
- `npm run build`: sandbox run failed with spawn EPERM/native dependency loading; approved outside-sandbox rerun **passed**. Main JS **325.43 KB**, gzip **103.13 KB**; exam admin page remains a separate lazy chunk (16.92 KB). No dependency or build-config changes.
- Browser inventory again returned **no apps or browsers**. Browser interaction, console, focus, scrolling, desktop/mobile breakpoints and dark/light screenshots remain **unverified**. No frontend test runner is configured. No real email, FCM/device or mobile application run was performed.

### Remaining issues and recommended next batch

High:
- Explicitly designate Online Examination staff reviewer authority/scope before adding a review endpoint or screen. Keep admin release/retakes restricted.
- Exercise question edit/delete/start contention and release retries on isolated MySQL with concurrent connections. SQLite does not verify locking, native FKs or deadlock handling.
- Finish the previously recorded full protected-operation eligibility review and approved exception policy; do not silently invalidate active attempts.
- Validate scheduled publication dispatch: the announcement service skips future publications, but this batch does not establish a worker/scheduler that later sends them. Repeated sync can still send FCM updates to configured devices; the duplicate tests cover in-app rows, not push idempotency.
- Applicant exam availability notifications and a complete review/recommendation audit trail remain open. New result notices do not backfill old releases or send push/email.
- Existing unrelated program deletion error handling, auth rate-limit audit and full admission/scholarship regressions from the prior checkpoint remain open.

Medium:
- Review the remaining 27 hook dependency warnings and keep-alive background request/timer behavior.
- Large question banks still use the existing all-record response with client pagination; consider optional server pagination in a separately reviewed contract-compatible batch.
- Shared refresh events and explicit mutation reloads can cause redundant GETs. Sequence guards prevent stale exam/notification rendering, but request coalescing and cancellation merit a separate pass.
- Expand frontend automated interaction coverage when a browser/test runner is available. Current UI validation is build/lint and source inspection only.

Manual browser/device acceptance checklist:
- [ ] Admin search/filter/page 2 with 26+ disposable attempts; details and exact timestamps/order.
- [ ] Add/edit 2–6 options, change correct answer, invalid/no correct choice; used-question locks, deactivate/delete confirmations and rapid double-click protection.
- [ ] Release and retake confirmation, network failure/retry, no duplicate writes/notices; applicant grade visibility before/after release.
- [ ] Modal viewport centering while scrolling, internal scrolling, Tab/Shift+Tab/Escape focus return, busy backdrop/Cancel guards.
- [ ] Applicant mark-one/mark-all/delete, sidebar unread refresh, successful empty versus 401/403/500/timeout/malformed payload, retry after reconnect.
- [ ] Staff permissions/program scope in UI, shared schedules containing multiple programs, recommendations distinct from final awards.
- [ ] Admin/Staff announcement publish/edit/schedule flows, real safe-device FCM delivery, dark/light mode and mobile Chrome layouts.

Recommended next coherent batch: isolated MySQL concurrency/API checks and cross-role browser acceptance of these management screens, then explicitly authorized staff online review and scheduled notification dispatch. This checkpoint is not a demonstration-readiness certification.
`php artisan test --compact` final standalone rerun: exit 0, 49 passed / 259 assertions. Targeted `git diff --check` on changed tracked files: exit 0, only Git line-ending conversion notices; untracked new/pre-existing implementation files are not covered by that Git whitespace check.

## Phase 3 continuation — document write integrity and session recovery (2026-10-18)

### Current phase and readiness

EduPath remains in **Phase 3**, with targeted integration/security regression tests running alongside the web work. It has not passed full Phase 4 end-to-end acceptance. Demonstration readiness: **Partially ready**. Existing role modules compile and the automated suites pass, but browser interactions, real cross-role workflows and isolated MySQL concurrency remain unverified. No demonstration accounts or real applicant decisions were changed.

### Repository inspection and baseline

- Inspected Git status, branch and recent commits: branch `main`; recent commits `c3e3663` (Update EduPath web features) and `6e70fa0` (Initial EduPath web project). The extensive pre-existing modified/untracked files were preserved.
- Read the prior audit, active App/routes, protected route, AuthContext/auth service, shared feedback components and Requirements.jsx reference. Active routing still uses lazy page imports and the existing three layouts.
- Rechecked entry/build/import references: the nested `frontend/src/src/` remains inactive; only its ESLint exclusion references that path. No duplicate-tree cleanup or migration was performed. There are 46 JSX page files under the active pages directory; their existence is not a claim that every page received browser acceptance.
- Re-ran baseline `php artisan test --compact`: **49 passed / 259 assertions**.
- Inspected document upload/replacement/access code, local/public filesystem configuration, Apache deny rule and existing document tests. Expected storage directories contain **23 private document files and 0 public document files**. No filenames or applicant records were printed. This checks the expected document directories, not every possible deployment URL or alternate copy.
- No separate `.env.testing` or explicitly configured isolated MySQL target was found. Existing feature suites use SQLite memory fixtures. No live MySQL testing, resets, migration or destructive storage operation was attempted.

### Defects fixed

**Document write integrity:** replacement previously removed the original local/public file before updating metadata and history. Metadata/history writes were separate; a later failure could leave records without the old file or falsely persist a partial operation. Uploads also accepted a false storage return value without an explicit failure response.

- Upload and replacement now return a safe **503** failure response when storage does not produce a path; diagnostic logs do not include file names, credentials or applicant data.
- Metadata and history commit within one database transaction. On failure, the transaction rolls back and cleanup targets only the newly generated file; the original exception is propagated for normal logging. Cleanup failures are logged rather than silently ignored.
- Replacement rechecks ownership and rejected status under a row lock. It preserves the previous file on both successful and failed replacement. Historical-file cleanup is a separate retention task requiring authorization; no existing real upload was moved or removed by this batch.
- New metadata uses the server-detected MIME type. Existing file type/size and ownership validation remain enforced.
- An applicant account without an applicant profile now receives **403** on document deletion instead of a null-profile exception. The existing explicit delete endpoint otherwise retains its behavior; no real deletion request was executed.

**Session restoration:** AuthContext previously removed the saved token on every failed user lookup, including timeout, server outage or malformed response. A temporary network interruption therefore forced a login reset.

- A small tested restoration helper classifies a verified Admin/Staff/Applicant identity, anonymous state, **401** expiration, and retryable/unavailable responses. Unsupported/malformed/failed responses never unlock protected content.
- Only an actual unauthenticated 401 clears the saved token during restoration. Network/403/429/5xx failures withhold identity and display a navy/white academic recovery card, with Retry and Sign in actions and dark-mode styling.
- Retry follows the existing auth API and token format; no authentication architecture or backend role rule changed. Request-version guards prevent stale restoration results from replacing state after login/register/logout or a newer check. Those React lifecycle guards are source-reviewed, not browser-tested.
- The existing session-check loader is reused. `isAuthenticated` now requires both a server-verified user and token. No new role or staff examination access was introduced.

### Exact changed/created files

| File | Change |
|---|---|
| `backend/app/Http/Controllers/Api/Applicant/DocumentController.php` | Storage failure handling, atomic metadata/history, replacement row-lock rechecks, retained prior file, MIME detection, missing-profile delete guard |
| `backend/tests/Feature/ApplicantDocumentAccessTest.php` | Nine new isolated tests plus history schema fixtures for upload/replacement failures and validation |
| `backend/DOCUMENT_STORAGE_SECURITY.md` | Documented rollback, newly generated file cleanup and retained prior-file behavior |
| `frontend/src/context/AuthContext.jsx` | Retryable restoration, 401-only token invalidation, stale-check guards and verified authentication state |
| `frontend/src/components/ProtectedRoute.jsx` | Accessible recovery card instead of redirecting an unverified saved session after an outage |
| `frontend/src/services/sessionRecovery.js` (new) | Testable session response/error classification |
| `frontend/tests/sessionRecovery.test.mjs` (new) | Twelve Node tests for identity roles, outage/401 classification, malformed responses and retry recovery |
| `frontend/package.json` | Added `npm test` using the built-in Node test runner; no dependency additions |
| `AUDIT.md` | Current summary at top, historical baseline label, this checkpoint and continuation instructions |

The Flutter project, route definitions, schema, database records, institution policies, examination settings and permissions were not modified.

### Updated status matrix (affected scope)

| Area | Status | Evidence / limits |
|---|---|---|
| Document upload/replacement | Repaired; isolated API subset verified | Private writes/history, false-storage response, transaction rollback, retained originals, type/ownership/review-state validation pass tests |
| Document download/privacy | Existing protection retained; partial verification | Owner, cross-applicant, anonymous, missing file and legacy authenticated fallback tests pass; 0 files in expected public document directory; deployed raw URL denial unverified |
| Session restoration | Improved; helper behavior verified | Three-role classification and retry/401 behavior covered by Node tests; actual React/browser flows still need acceptance |
| Shared design | Phase 3 ongoing | Recovery UI follows academic colors/shared card/focus styles and existing theme; complete portal visual redesign remains open |
| Online exams, notifications, staff scope | Existing work retained; regression suite passes | Previous exam/result/privacy/retake/recommendation tests still pass; no new staff online access |
| Full integration / demonstration | Partially ready | Browser inventory empty; no real login/upload/review/release/device workflow claimed |

### Verification executed

- `php artisan test --compact`: **58 passed / 298 assertions**, compared with baseline 49 / 259. Added nine document tests; the existing exam/staff/notification/admission tests remain passing.
- `php artisan test --filter=ApplicantDocumentAccessTest`: initial expanded run **12 passed / 39 assertions**, before two further tests for replacement storage failure and missing file were added. Both additional cases pass within the final 58-test suite.
- `php -l app/Http/Controllers/Api/Applicant/DocumentController.php` and `php -l tests/Feature/ApplicantDocumentAccessTest.php`: no syntax errors.
- `npm test`: **12 passed / 0 failed**. Initial sandbox attempt could not spawn Node's test worker (EPERM); approved outside-sandbox reruns passed. These are helper behavior tests, not DOM/component/browser tests.
- `npm run lint`: exit 0, **0 errors / 27 existing warnings**; no lint rule was suppressed.
- `npm run build`: sandbox failed with the known child-process/native dependency EPERM restriction; approved outside-sandbox final build passed. Main JS **327.19 KB**, gzip **103.59 KB**; lazy page chunks retained.
- `php artisan route:list --except-vendor`: exit 0, **145 routes**, unchanged.
- Targeted `git diff --check` on changed tracked source/package files: exit 0, only existing line-ending conversion notices. Untracked files are not covered by Git's diff check.
- Browser inventory returned **no apps or browsers**. Browser layout, keyboard interaction, session navigation/races, mobile breakpoints, dark/light screenshots and runtime console remain unverified.
- No SMTP or push/device delivery test was performed. No live applicant record, old document or permission was modified.

### Security findings and remaining priorities

High:
- Verify deployed `/storage/documents/` denial using the actual Apache/Nginx configuration and a disposable test file. Source/configuration and folder counts cannot prove the web-server response. The authenticated legacy public fallback remains for deployments with older files.
- Run isolated MySQL concurrency tests for replacement versus review, question assignment versus edit/delete, attempt starts and duplicate result release. No isolated target was configured in this session.
- Retained prior replacement files need an explicit retention/cleanup policy; no cleanup is authorized or scheduled here. The database history stores the replacement event, not a full versioned-file retrieval interface.
- Existing local/debug environment is not a production security clearance. Review production error exposure, auth/OTP rate limits, remaining upload/delete transaction boundaries and the previously recorded referenced-program deletion error.
- Staff Online Examination authority remains explicitly unavailable; do not infer it from scheduled-exam access. Full protected-operation eligibility review, scheduled announcement dispatch and availability notices remain open.

Medium:
- Current session recovery addresses initial/explicit restoration. Automatic global handling of mid-session API expiration, multi-tab auth changes and logout failure/revocation feedback still need a deliberate integration pass.
- Review the remaining 27 hook warnings and keep-alive request/timer behavior. Full Admin/Staff/Applicant page-by-page visual acceptance remains unfinished.
- Add DOM/browser tests for protected-route retry, rapid retry/login/logout ordering and stored-token retention. Node tests do not verify React rendering or localStorage updates.

Manual acceptance for this batch:
- [ ] Open a protected route with a saved test token while offline: show recovery UI, preserve token, expose no protected page. Reconnect and Retry to restore the correct role.
- [ ] Test a genuine 401: clear saved token and return to sign in. Test 403/429/500 and malformed payloads without falsely showing authenticated content.
- [ ] Retry rapidly, then login/logout during a delayed session check; ensure stale responses cannot restore old identity.
- [ ] On each role, inspect recovery/loading UI at desktop/tablet/mobile widths and in dark/light mode; keyboard-focus both recovery actions.
- [ ] Upload a disposable PDF/image, inspect private download headers, then reject/replace it through authorized test roles. Force storage/history failure in an isolated environment and confirm the previous record/file remain intact.
- [ ] Complete the existing cross-role admission, scholarship, online/scheduled exam and notification acceptance lists before claiming controlled demonstration readiness.

### Recommended next batch / continuation prompt

“Continue from this checkpoint. Verify the 58-test Laravel and 12-test frontend baseline, then fix referenced-program deletion errors and audit auth/OTP rate limiting with isolated tests. Exercise protected-route retry and document replacement in a connected browser using disposable accounts. Use isolated MySQL only if explicitly configured; preserve existing records, permissions and all prior work.”

## Programs form popup (2026-10-18)

- `frontend/src/pages/admin/Programs.jsx`: replaced the always-visible Add/Edit form with an Add Academic Program button and the existing form inside the shared ModalPortal. The popup stays centered, uses the existing eased scale-in animation, supports internal scrolling and dark/light mode, and has Close/Cancel/Escape/backdrop dismissal. Edit opens the same popup instead of scrolling the page.
- Preserved form fields, API endpoints, payloads, status controls and list behavior. Validation errors remain visible inside the popup. Successful saves close it and refresh the list. A request ref and disabled fields prevent duplicate saves and dismissal/reopening during a save. Added field-label associations and existing backend length limits.
- Verification: `npm run build` passed; `npm run lint` passed with 0 errors / 27 existing warnings. Targeted Git whitespace check passed with only the standard line-ending notice. Browser interaction/visual acceptance remains unverified. No backend/database or duplicate-tree changes.
`Programs.jsx` header adjustment: moved Add Academic Program beside Refresh in a responsive wrapping action group, using the academic gold accent. Popup handlers and save guards are unchanged. Targeted ESLint and Git whitespace checks passed; visual browser verification remains pending.

## Admin inactive program visibility fix (2026-10-18)

- Root cause: `admin/Programs.jsx` loaded public `GET /programs`, which intentionally filters out inactive programs. Successful deactivation followed by refresh therefore removed the row from the Admin view and prevented access to its existing Activate action.
- Changed `frontend/src/pages/admin/Programs.jsx` to load the existing protected `GET /admin/programs` endpoint and its `data` array. Admin now receives active and inactive records; public/applicant program availability stays unchanged. No records were restored, deleted or otherwise changed by this repair.
- Added `backend/tests/Feature/ProgramVisibilityTest.php`: isolated SQLite deactivate → still visible to Admin → hidden in public list → reactivate cycle, preserved record count, and anonymous/applicant/staff denial for the management list.
- Verification: 2 targeted tests passed / 19 assertions; new PHP test syntax valid; targeted Programs ESLint passed; production build passed. Browser interaction remains unverified. Previous full-suite counts are historical and were not rerun for this narrowly scoped fix.
Staff list save UX (2026-10-18): StaffManagement.jsx now inserts the server-returned new staff member at the top of the existing list, updates edited members in place, closes the modal immediately and retains the success notice. Removed the full-page-loading fetch and delayed close after save. New staff creation clears search so the member is visible. Request-version guards ignore stale reads and a ref blocks duplicate saves; background refresh keeps the table mounted. API payloads/permissions are unchanged. Targeted ESLint, production build and Git whitespace check passed. Browser interaction remains unverified.
Admission Requirement popup (2026-10-18): Requirements.jsx now uses the existing ModalPortal for centered, smoothly animated Add/Edit forms with internal scrolling, keyboard/focus/background protection and guarded dismissal while saving. The gold Add Admission Requirement button sits beside Refresh in the header. Validation/file errors display inside the popup; fields and duplicate submissions are locked during save. Existing PDF upload, program assignments, flags and multipart API payloads are preserved. Post-save/background list refreshes no longer replace the page with its initial skeleton. Production build passed; targeted ESLint has 0 errors and the 1 existing effect-dependency warning. Git whitespace check passed. Browser interaction remains unverified.
Applicant Records details popup (2026-10-18): Active Applicants.jsx now opens View in a centered, animated ModalPortal instead of assigning window.location.href. Reuses the lazy-loaded active ApplicantDetails.jsx via an optional applicantId; existing direct detail routes remain supported. Added a fixed popup header/Close button, internal scrolling, backdrop/Escape dismissal and save-time dismissal/duplicate-save guards. Existing profile editing, API authorization, detail sections, loading/errors/retry and list filters remain available. The inactive frontend/src/src duplicate was untouched. Production build passed; targeted ESLint reports 0 errors and 1 existing ApplicantDetails effect-dependency warning. Git whitespace check passed. Browser interaction remains unverified.
Applicant search/filter UX (2026-10-18): Active Applicants.jsx now keeps the page, filter inputs and previous results mounted while requests run. Removed later full-screen loading transitions, separated program-option loading from filter updates, debounced live filters by 250 ms, and retained immediate Apply/Enter behavior. Clear triggers one filter update rather than an extra explicit request. Latest-request guards prevent slow older searches from replacing newer results; a small Updating results status replaces page-wide skeleton flashes. Existing endpoints, sorting and applicant detail popup are preserved; inactive src/src remains untouched. Targeted ESLint and production build passed; Git whitespace check passed. Browser interaction remains unverified.
Admission Applications View popup (2026-10-18): Active AdmissionApplications.jsx now opens the existing lazy-loaded AdmissionApplicationDetails wrapper in a centered, eased ModalPortal, preserving the underlying list and filters. Added optional applicationId/onClose/onBusyChange props while retaining the original direct detail route. Existing document viewing, approval/rejection and confirmation host remain connected; dismissal and duplicate requests are blocked during decisions, and background detail refresh avoids replacing the popup with its initial skeleton. No backend/permission/business-rule changes or real decisions executed. Production build passed; targeted ESLint reports 0 errors / 2 existing dependency warnings. Git whitespace check passed. Browser interaction remains unverified.
Admin user-profile viewing (2026-10-18): StaffManagement.jsx now includes View Profile on desktop/mobile rows, opening new StaffProfileDialog.jsx through the shared modal infrastructure. The read-only viewer fetches the existing admin-only staff detail endpoint and shows saved identity/contact/account details, staff status, programs served and configured permissions, with loading/retry and canceled-request handling. Applicant Records retains its existing profile/detail popup; ApplicantDetails.jsx now displays the stored public profile photo when available, with initials fallback. No new API endpoint, schema, staff permissions or user record mutations. Added two isolated profile access/credential-privacy tests to OnlineExamIntegrityTest.php (2 passed / 28 assertions); targeted ESLint reports 0 errors / 1 existing ApplicantDetails warning; production build passed. Browser interaction remains unverified.
Final full Laravel regression run for admin profile viewing: php artisan test --compact passed with 62 tests / 345 assertions. Passwords and remember tokens are absent from tested profile responses; anonymous, staff and applicant identities cannot use the admin profile endpoints.


## Staff and applicant profile pictures (2026-10-18)

Current phase remains Phase 3; this is a bounded profile enhancement, not full integration or demonstration acceptance.

- Staff Profile now offers an image picker and preview under Edit Profile. Save Changes uploads the picture along with existing identity/email edits through the existing PUT contract (multipart POST with _method=PUT). Admin's Staff View Profile popup displays the saved picture with an icon fallback. The existing Applicant Records popup already reads the applicant photo and remains connected.
- Applicant profile editing/upload remains available. Both roles update the shared authenticated header avatar after saving, without a page reload; authenticated identity restoration now supplies profile_photo_url for all three roles using each role's existing storage field. No migration or additional permissions.
- Both upload endpoints validate JPG/PNG/WEBP up to 2 MB. Staff can update only their own existing personal fields; applicant ownership remains server-derived. Applicant replacement previously deleted the old file before storing its replacement. Both flows now store first, transactionally update profile/account metadata, reject a failed storage write, and clean up only the new generated image if the database transaction fails. Prior uploaded images are retained. A missing applicant profile can no longer produce a false successful update.
- Background refresh cannot overwrite unsaved staff edits or applicant drafts. Save/upload handlers prevent concurrent writes; temporary preview object URLs are released when replaced or unmounted.

Files changed in this batch:
- backend/app/Http/Controllers/Api/Staff/ProfileController.php: validated photo upload and transactional staff/account update.
- backend/app/Http/Controllers/Api/Applicant/ProfileController.php: failure-safe replacement and atomic identity update.
- backend/app/Http/Controllers/Api/Auth/AuthController.php: return the current role's profile photo URL on identity restore.
- frontend/src/pages/staff/Profile.jsx: image picker/preview/save, header avatar sync and edit protection.
- frontend/src/pages/applicant/Profile.jsx: shared avatar sync, draft/write protection and preview cleanup.
- frontend/src/pages/admin/StaffProfileDialog.jsx: display uploaded staff image with fallback.
- backend/tests/Feature/UserProfilePhotoTest.php (new): five isolated SQLite/fake-storage tests covering both roles' edits/uploads, Admin photo retrieval, hidden passwords, invalid/oversized uploads, anonymous/cross-role rejection, failed storage writes and database rollback/file retention.
- AUDIT.md: this checkpoint.

Validation executed:
- php artisan test --compact --filter=UserProfilePhotoTest: 5 passed / 62 assertions.
- php artisan test --compact: 67 passed / 407 assertions.
- php -l on all three changed PHP controllers and the new test: no syntax errors.
- npm test: 12 passed / 0 failed (existing session tests; no claim of image-picker interaction coverage).
- npm run lint: exit 0, 0 errors / 27 existing warnings; targeted changed-page lint also clean.
- npm run build: passed outside sandbox, main JS 327.21 KB / gzip 103.60 KB; route chunks retained.
- Targeted tracked-file git diff --check: passed with line-ending notices only.

Manual acceptance still required: Staff Edit Profile -> choose valid image -> preview -> Save; Applicant choose/upload and personal information Save; check header avatar after save and after login restoration; open both Admin profile popups; test invalid files, canceled selections and slow/failed requests, dark/light and mobile layout. Browser checks were not performed in this batch. Existing public profile-photo storage convention is retained; this change does not alter private applicant-document access. No real accounts/files, database schema, mobile code or inactive nested source tree were changed. Old profile pictures retained on replacement may need a separately scoped retention policy later.


## React hook warning cleanup (2026-10-18)

User requested resolving all 27 existing ESLint warnings before further features. Re-ran baseline npm run lint: 0 errors / 27 warnings. All were react-hooks/exhaustive-deps warnings in active pages. Existing working-tree changes were preserved; no nested src/src files, backend logic, API contracts, database records or lint rules were changed.

Completed:
- Stabilized page data loaders with useCallback and declared their actual token/record/configuration dependencies. Initial effects now include those stable callbacks, avoiding dependencies on a newly created function each render.
- Moved pure document authorization-header helpers and scholarship record formatting helpers outside their components. Memoized scholarship request configuration by token. Applicant document checklist now depends on its stable document lookup callback.
- Moved the static About gallery collection to module scope and stabilized image navigation. Keyboard effects depend on the selected image/navigation callback; zoom updates no longer needlessly reinstall the keyboard listener.
- Staff admission search keeps its explicit-submit behavior: an input ref supplies the latest draft search for search, refresh and status-change requests; typing alone does not recreate the loader or trigger a queue reload.
- No eslint-disable directives, relaxed rules or additional ignore patterns were introduced.

Exact files changed (all under frontend/src/pages, plus this AUDIT.md entry):
- About.jsx
- admin/AdmissionApplicationDetails.jsx
- admin/AdmissionApplications.jsx
- admin/Announcements.jsx
- admin/ApplicantDetails.jsx
- admin/ArchivedApplicants.jsx
- admin/Documents.jsx
- admin/EntranceExams.jsx
- admin/Requirements.jsx
- admin/ScholarshipApplications.jsx
- admin/Scholarships.jsx
- applicant/AdmissionApplication.jsx
- applicant/Dashboard.jsx
- applicant/Documents.jsx
- applicant/Programs.jsx
- applicant/ScholarshipApplication.jsx
- staff/AdmissionApplications.jsx
- staff/Announcements.jsx
- staff/Dashboard.jsx
- staff/Documents.jsx
- staff/EntranceExams.jsx
- staff/Exams.jsx
- staff/Notifications.jsx
- staff/Reports.jsx
- staff/ScholarshipApplications.jsx

Executed validation:
- Final npm run lint: exit 0, 0 errors / 0 warnings (27 warnings resolved).
- npm test: 12 passed / 0 failed; these are existing session tests, not mounted page interaction tests.
- php artisan test --compact: 67 passed / 407 assertions, backend unchanged in this batch.
- Final npm run build: passed outside sandbox; main JS 327.21 KB / gzip 103.59 KB; route-level chunks preserved.
- Targeted git diff --check across all 25 changed pages: exit 0.

During cleanup, a dependency replacement initially landed on the callback instead of its effect in two applicant pages. Lint identified the extra/missing dependencies; both were corrected and final lint/build rerun. No unsuccessful intermediate check is presented as final success.

Current phase remains Phase 3. Browser interactions were not exercised; manually check initial load/manual refresh on affected roles, Staff admission search submit/status filtering, document checklist updates, scholarship filters and About gallery arrow/zoom/Escape keys. Full integration, isolated MySQL concurrency and the earlier institutional authorization questions remain separate open work. This batch resolves the warning backlog without claiming demonstration readiness.


## How to Use EduPath ? web and mobile user guides (2026-10-18)

Implemented the requested guide for Staff and Applicants on the web, plus the existing Applicant Flutter app. This mobile change is specifically within the user's latest request; no Staff mobile portal was invented. Read current Git changes, routes/sidebar, admission/documents/scholarship/exam pages, relevant backend validation/permissions and the mobile drawer/screens before editing. Preserved existing uncommitted changes, including the mobile drawer's previous Online Exam entry. The drawer write verified a pre-edit hash before applying the prepared navigation change.

Completed:
- Added a lazily loaded How to Use EduPath page at /applicant/guide and /staff/guide, under the existing protected role layouts, with visible sidebar links. No Admin guide was added.
- Applicant topics cover profile/photos, admission submission, document upload/replacement, scholarships, online scholarship examination, scheduled entrance exams, notifications/account use and troubleshooting. Instructions match current upload limits, submission controls and server-controlled exam timing, released results and Admin-authorized additional attempts.
- Staff instructions cover personal profile plus admission review, document verification, scholarship recommendations, scheduled exams, announcements, notifications and reports only when their existing active staff permission permits the topic. Guidance does not grant access; existing Laravel checks remain authoritative. No Staff Online Examination review or new permission introduced.
- Search matches titles, summaries, steps and notes; category filters and clear/no-results controls support finding a task. Expandable numbered steps and direct web links avoid starting any actual application or exam. Uses academic navy/gold, existing card styling, dark variants, keyboard-friendly native disclosure controls and responsive wrapping controls.
- Applicant mobile app drawer now opens a native guide with the corresponding eight topics, mobile-specific navigation wording, search/categories, expandable steps and empty-result recovery. Content is bundled locally and usable offline; actual transactions still require a working connection. The mobile topic IDs and policy notes align with getMobileApplicantGuide() in the web content module.
- No API, database schema, applicant record, decision, role/permission, authentication or exam rule changes. The inactive frontend/src/src source tree remains untouched.

Exact files changed/created in the web repository:
- frontend/src/content/userGuides.js (new): role/permission-aware topic content, search/filter helpers and mobile instruction export.
- frontend/src/pages/help/UserGuide.jsx (new): guide interface.
- frontend/src/routes/AppRoutes.jsx: lazy import and two protected guide routes.
- frontend/src/components/Sidebar.jsx: Staff/Applicant guide navigation links.
- frontend/tests/userGuides.test.mjs (new): five tests for topic coverage, active permission filtering, unsupported roles, search/categories and mobile content alignment.
- AUDIT.md: this continuation record.

Exact files changed/created in C:/Users/oseas/StudioProjects/edupath_mobile:
- lib/features/help/user_guide_topics.dart (new): bundled Applicant guide topics and native steps.
- lib/features/help/screens/user_guide_screen.dart (new): native searchable guide.
- lib/shared/widgets/app_drawer.dart: import and guide navigation tile; previous work preserved.
- test/user_guide_screen_test.dart (new): three content/widget tests covering document/exam policy notes, searchable steps/no-result recovery and a 320-pixel dark layout with 1.4x text scaling.

Validation executed:
- npm run lint -- --max-warnings=0: exit 0, 0 errors / 0 warnings.
- npm test: 17 passed / 0 failed, including five new guide tests.
- npm run build: passed outside sandbox, lazy guide chunk 23.39 KB approximately; main JS 327.59 KB / gzip 103.69 KB. No dependency changes.
- php artisan test --compact: 67 passed / 407 assertions; backend unchanged.
- dart format on only the three new mobile files: completed; no broad reformatting of the existing drawer.
- flutter analyze --no-pub: no issues found.
- Final targeted flutter test --no-pub test/user_guide_screen_test.dart: 3 passed.
- Final full flutter test --no-pub: 45 passed / 1 skipped. The skipped test requires an explicitly supplied live API URL. Initial new search widget tests failed because a generic scroller selector matched the TextField's own scroller and the recovery button was off-screen; corrected the test to choose the vertical page scroller and bring the button into view, without suppressing pointer warnings or changing app behavior.
- Browser inventory returned no apps/browsers. No actual web browser or physical-device acceptance, APK installation or live account mutation claimed. Mobile layout evidence above comes from Flutter widget tests.
- Mobile drawer git diff --check: passed with a line-ending notice. Web tracked-file check still reports the pre-existing whitespace in the online scholarship route block; no unrelated cleanup was applied. New files pass lint/analysis.

Current phase remains Phase 3 with targeted integration QA. Guide implementation is complete for this batch; full system demonstration readiness is unchanged. Manual checks: open guide from both web roles and mobile drawer; try search/category/clear and keyboard disclosure controls; open permitted web shortcuts and return to retained list state; verify active Staff account topics against its permissions; check real mobile navigation/back behavior, offline guide availability, light/dark themes and enlarged text. Review guide wording with the college when workflows or official instructions change. Continue the prior isolated browser/MySQL integration checklist after this user-facing batch.


## Mobile Server Configuration timeout ? LAN binding repair (2026-10-18)

User reported a timeout from Test Connection & Save on a physical phone using http://192.168.1.3:8000/api. Inspected the current mobile settings/provider/API normalization and the existing public /api/programs probe. Its validation was behaving correctly; no timeout suppression or unsupported save-success path was added.

Confirmed root cause: the existing Laravel PHP server on port 8000 was bound only to 127.0.0.1. The computer's Wi-Fi IP matched the supplied URL; loopback /api/programs returned HTTP 200 while the Wi-Fi URL could not connect. The physical phone was on the same Wi-Fi subnet. Verified the listening process command contained this repository's Laravel server.php path before stopping that exact process; did not stop unrelated PHP/XAMPP services.

Repair: restarted this backend with php artisan serve --host=0.0.0.0 --port=8000, hidden in the background, with stdout/stderr under backend/storage/logs/lan-server.*. Laravel now listens on all interfaces on port 8000. No firewall rules, app credentials, saved phone settings, database records or Flutter source were changed. The server was left running for the user to retry Test Connection & Save.

Files added:
- backend/start-lan.bat: repeatable foreground development launcher that uses this backend directory and the correct LAN binding, preserving the PHP exit status.
- backend/LOCAL_SERVER.md: physical-phone versus emulator addresses, running/stopping the launcher and diagnosing reachability without bypassing checks.
- AUDIT.md: this evidence/checkpoint. The default php artisan serve command remains Laravel's upstream local-only behavior; use the LAN launcher for phone testing.

Executed checks:
- Windows listener inspection after repair: LocalAddress 0.0.0.0, LocalPort 8000.
- Computer GET http://192.168.1.3:8000/api/programs: HTTP 200, approximately 0.7 seconds.
- Real connected physical phone request to the same public API through its own Wi-Fi network stack: HTTP 200, success true, programs is an array. No applicant login/records used. Initial ADB/PowerShell text conversion inserted extra blank lines into HTTP headers; re-ran using base64 transport to verify the intact JSON payload.
- flutter test --no-pub --dart-define=EDUPATH_LIVE_API_BASE_URL=http://192.168.1.3:8000/api test/server_url_connection_test.dart: 5 passed, including the actual testServerUrl live API probe. No skipped test in this targeted run.
- No PHP/React/Dart application source changed in this repair, so no new full-suite/build claim. The launcher invokes the same already verified start command; a second copy was not launched on the occupied port.

Retry the existing phone URL using Test Connection & Save. Actual in-app button/save persistence was not operated by the agent. If the computer changes Wi-Fi/IP or the server is stopped, reachability must be checked again. Current overall development phase remains Phase 3 with targeted integration verification; previous demonstration limitations remain.


## Scheduled Entrance Examination ? Admin assignment and retention batch (2026-10-18)

User approved the recommended first batch: Admin applicant assignment, safe examination history retention, schedule validation and Staff date fixes. This is the existing scheduled Entrance Examination module; Online Scholarship Examinations remain separate. Phase remains Phase 3 with targeted backend integration QA. Existing modifications/untracked files were inspected and preserved; no Flutter files, duplicate src/src source, migrations or live applicant records were changed.

Completed connections:
- Admin Entrance Exams now has an Assign Applicants action opening the shared centered/focus-managed ModalPortal. Search and program filtering use a new Admin-only paginated candidate endpoint (20/page), returning minimal identity/program data and excluding already assigned/archived/non-applicant accounts. Selection persists across pages, supports up to 100 per request, has loading/empty/error/retry states, request cancellation and busy/double-submit protection. Program filtering uses existing admission-program associations; approved admission is not imposed as a new entrance-exam prerequisite.
- POST assignments validates all selected IDs, locks the exam and applicant rows, and uses the existing unique exam/applicant constraint with firstOrCreate. Repeated requests do not reset attendance, scores or remarks. Inactive or officially released exams reject new assignments. No new venue-capacity enforcement or scholarship slot/award limit was introduced; 100 is a per-request batch limit, not an eligibility or total-assignment limit.
- Successful assignment updates the Admin list from the saved response. Existing mutation refresh remains connected, with a latest-request guard preventing stale list reads from replacing newer data. The latest request always clears initial/loading-refresh flags, including overlapping initial and silent loads.
- Existing Applicant exam endpoints immediately expose the assignment to its owner (web/mobile after their normal reload). Unreleased scores/remarks remain hidden. No applicant data mutation or institution decision was performed in the live database.
- DELETE of an exam with assignments or an official release now returns 409, preserving records instead of triggering the existing cascade-delete FK. Unused unreleased exams retain their existing deletion behavior. Admin UI labels referenced records History retained; Deactivate remains available, and inactive exams stay in the existing all-record Admin list.
- Admin and Staff schedule updates validate the effective end/start pair, including partial updates and existing database HH:mm:ss times. A shared concern enforces end after start, matching the existing creation rule. No new entrance-exam score range or passing threshold was introduced.
- Admin schedule updates, assignment creation, result saving, deletion and official release serialize on the exam row within transactions. Result updates lock only an assignment belonging to that exam. Staff schedule updates use the same exam lock while retaining existing program/permission checks. Existing release-readiness checks, idempotent release and post-release score locks remain intact.
- Staff date display, upcoming filters and date-edit inputs now accept both YYYY-MM-DD and Laravel serialized ISO dates. Invalid dates do not appear as valid input values. Admin activation/deactivation now sends only is_active, avoiding accidental resubmission of raw DB time strings or unrelated stale fields.

API additions (within existing Admin role middleware):
- GET /api/admin/exams/{exam}/candidates with optional search, program_id, page; standard paginator response.
- POST /api/admin/exams/{exam}/assignments with applicant_ids array; existing records preserved and assigned_count/already_assigned_count reported.
Existing endpoints and response envelopes are preserved; referenced deletion now returns an actionable 409.

Exact files changed/created:
- backend/app/Http/Controllers/Api/Admin/ExamController.php: candidate search/pagination, assignment creation, retention guard, schedule validation and exam-row transactions.
- backend/app/Http/Controllers/Api/Staff/ExamController.php: effective schedule validation and transaction, existing access unchanged.
- backend/app/Http/Controllers/Concerns/ValidatesEntranceExamTimes.php (new): shared partial-update time validation.
- backend/routes/api.php: two Admin-only scheduled exam routes.
- backend/tests/Feature/EntranceExamManagementTest.php (new): 11 isolated SQLite tests, with native FK/unique constraints enabled, covering assignment, retry preservation, validation/atomicity, candidate filters/pages, history retention, partial times, cross-role/assignment ownership and official release/privacy.
- frontend/src/pages/admin/EntranceExams.jsx: assignment entry/dialog connection, history-retention UI, status-only updates and stale-read guard.
- frontend/src/pages/admin/ExamAssignmentDialog.jsx (new): applicant picker, pagination/filtering, selected count and guarded save.
- frontend/src/pages/staff/EntranceExams.jsx: date normalization for display/filter/edit.
- frontend/src/services/examSchedule.js (new): local calendar parsing/date-input/upcoming helpers.
- frontend/tests/examSchedule.test.mjs (new): three calendar/ISO/invalid-date/upcoming regressions.
- AUDIT.md: this checkpoint.

Executed verification:
- php artisan test --compact --filter=EntranceExamManagementTest: final 11 passed / 91 assertions.
- php artisan test --compact: final 78 passed / 498 assertions (previous 67 / 407 plus this batch).
- php artisan route:list --except-vendor: exit 0, 147 routes (previous 145 plus two new).
- php -l on both changed controllers, shared concern, new test and routes/api.php: no syntax errors.
- npm test: 20 passed / 0 failed, including three new date tests and existing guide/session tests.
- npm run lint -- --max-warnings=0: final exit 0, 0 errors / 0 warnings.
- npm run build: passed outside sandbox, main JS 327.63 KB / gzip 103.71 KB; Admin Entrance Exams stays a separate lazy chunk (57.58 KB).
- Targeted git diff --check on the two changed controllers and two existing pages: exit 0, line-ending notices only. Unrelated historical route-block whitespace was not reformatted.
- Browser inventory: no apps/browsers; actual web interaction and responsive/modal acceptance remain unverified. No live user record writes were used for verification. MySQL multi-connection lock/contention behavior was not exercised; SQLite proves functional/FK behavior, not native MySQL row locks.

Affected module status:
| Module | Status | Evidence / remaining check |
|---|---|---|
| Admin applicant assignment | Implemented; isolated API verified | Search/program/page 2, safe repeat, invalid/archived IDs, inactive/released rejection pass; browser picker acceptance pending |
| Scheduled exam history | Retention guard API verified | Referenced/released deletion denied; deactivation and unused deletion pass with SQLite FKs |
| Admin/Staff schedule editing | API/date-helper verified | Partial time validation and existing staff program scope pass; visual date inputs pending |
| Official result release and privacy | Existing behavior retained; regression verified | Readiness, duplicate release, post-release edit rejection and owner-only results pass; MySQL contention pending |
| Staff authority | Unchanged | No attendance/score-entry permission or online-review authority granted |
| Applicant/mobile exam display | Existing API connection retained | Newly assigned owner can retrieve record; real browser/device refresh remains pending |

Next batch: schedule assignment/rescheduling/cancellation/result-release notifications with idempotent delivery tests, then applicant examination slips and controlled cross-role browser/device acceptance. Confirm any new Staff attendance/score-entry authority and entrance-exam grading policy before implementing them. Native MySQL contention and deployment acceptance remain on the previous checklist. No demonstration-readiness claim.

Manual checks: Admin Assign Applicants -> search/program/page 2 -> select across pages -> save once; verify count/roster without page navigation; repeat/reconnect without reset; referenced Delete shows History retained and Deactivate preserves the roster; Staff valid ISO date display/edit and invalid time feedback; owner applicant/mobile sees schedule while other applicants cannot; confirm unreleased grades stay hidden until official release. Also test popup focus/scroll/Cancel/busy guards and dark/light/mobile widths.


## Mobile Digital Exam Pass date/time display (2026-10-18)

- Updated only the Digital Exam Pass Date & Time row in mobile lib/features/exams/screens/exams_screen.dart to use the full English month, day, year and 12-hour start time: October 25, 2026  8:00 AM. Seconds, the separator bullet and the end-time range are omitted from this row as requested; other examination time displays and stored/API schedule values are unchanged.
- Handles Laravel ISO dates without shifting their calendar date, formats noon/midnight correctly, and uses Date TBA / Time TBA for missing or invalid values. Existing mobile changes were preserved. No schema, record, web source or exam policy changes.
- dart format completed; dart analyze lib/features/exams/screens/exams_screen.dart: No issues found. Runtime preview using the actual formatter produced October 25, 2026  8:00 AM; October 25, 2026  1:05 PM; October 25, 2026  12:00 AM. Temporary preview file was removed. Targeted mobile git diff --check passed with a line-ending notice.
- No new persistent tests or full-suite/build rerun for this display-only change. Device visual acceptance remains pending; hot reload the running Flutter app to view the updated pass. Updated the stale audit header to the last full verified web checkpoint, without claiming those checks were rerun for this formatting batch.


Mobile Digital Exam Pass layout revision (2026-10-18): supersedes the preceding start-time-only display. Updated lib/features/exams/screens/exams_screen.dart to show the full date on its own line, followed by both saved start and end times in 12-hour format: October 25, 2026 / 8:00 AM - 11:00 AM (the slash here denotes a line break). Missing values retain TBA feedback; no schedule values or other exam time displays changed. dart format completed; targeted dart analyze reports No issues found. Runtime preview of the actual formatter produced the requested two lines. Temporary preview removed. Device visual acceptance and full-suite/build were not rerun for this display-only revision.


## Applicant Educational Background persistence (2026-10-18)

User reported that Applicant Educational Background was disconnected. Traced the existing mobile edit form through AuthProvider, multipart POST /api/applicant/profile with _method=PUT, Applicant ProfileController, Applicant model and the actual applicants table. The form sent seven fields, but Laravel validation/fillable and the database columns did not support them. The web profile has no educational background form; existing web personal/photo updates are preserved.

Completed:
- Added nullable primary_school, primary_school_year, junior_high_school, senior_high_school, shs_strand, lrn and previous_college_university columns through the isolated additive migration 2026_10_18_000001_add_educational_background_to_applicants_table.php. Added model fillable entries and validation to the existing owner-scoped profile update. No new endpoint, eligibility rule or account permission.
- Existing clients may omit education without clearing it; explicit blanks/nulls can clear optional values. School fields accept up to 255 characters, strand 100; optional year uses four digits and LRN uses 12 digits stored as a string to preserve leading zeros. Existing mobile required-school fields remain unchanged.
- Mobile saving verifies every submitted education value against the server-returned applicant before reporting success, updates the shared profile/cache immediately and prevents duplicate saves. Missing/mismatched server confirmation, validation errors and timeouts remain visible. A cache-write failure is logged separately after confirmed server success. Existing profile refresh reads the persisted fields.
- Mobile form preserves saved strand values, validates year/LRN, applies server length limits and disables fields while saving. Prior mobile provider/network/profile work was preserved.

Files changed/created:
- backend/database/migrations/2026_10_18_000001_add_educational_background_to_applicants_table.php (new)
- backend/app/Models/Applicant.php (education fillable entries)
- backend/app/Http/Controllers/Api/Applicant/ProfileController.php (education validation; existing transaction and authorization reused)
- backend/tests/Feature/ApplicantEducationTest.php (new, eight tests)
- C:/Users/oseas/StudioProjects/edupath_mobile/lib/core/auth/auth_provider.dart (education save confirmation/state)
- C:/Users/oseas/StudioProjects/edupath_mobile/lib/features/profile/screens/edit_educational_background_screen.dart (validation and save guards)
- C:/Users/oseas/StudioProjects/edupath_mobile/test/educational_background_test.dart (new, seven tests)
- AUDIT.md (this checkpoint and current verification summary)

Database verification:
- Inspected the exact migration with migrate --pretend before applying only that migration path to the configured local MySQL database. All seven operations add nullable columns; no other pending migration was run.
- Compared every original applicant column/value before and after in memory: existing_applicant_values_unchanged=true. No real profile submissions, decisions, record deletions or database resets were performed.
- Exact-path migrate:status confirms Ran (batch 20). Other deployments must apply this migration before using the education save flow.

Executed validation:
- Targeted Laravel ApplicantEducationTest: 8 passed / 88 assertions. Uses isolated SQLite and executes the actual migration against a legacy fixture; covers persistence/fresh profile and identity reads, omitted/cleared fields, personal/photo update compatibility, invalid values, ownership/role/missing-profile rejection and rollback on account-write failure.
- Full php artisan test --compact: 86 passed / 586 assertions.
- php -l on changed controller/model, new migration and test: no syntax errors.
- Route inventory: 147 routes, unchanged. An initial PowerShell Measure-Object pipeline counted the paginator array as one object; corrected to the parsed array Count and verified 147.
- Targeted Flutter educational_background_test.dart: 7 passed, using isolated HTTP adapters/mock storage; checks all seven multipart fields, method override, reload, cleared values, unconfirmed/mismatched response, validation, timeout/retry and concurrent save guard.
- flutter analyze --no-pub: no issues found. dart format completed on the two modified Dart sources and new test.
- Full flutter test --no-pub: 52 passed / 1 skipped. The skipped live API probe had no explicitly provided URL.
- Targeted mobile git diff --check: passed with line-ending notices only. Targeted web controller/model git diff --check also passed. No React source changed; frontend lint/build/tests were not rerun for this batch.
- During implementation, a staging replacement interpreted Dart regex dollar syntax as JavaScript replacement syntax and caused a temporary form parse failure. Reconstructed the form from its pre-edit-hash-verified original, reapplied scoped edits using literal replacement callbacks, and reran formatting, analysis and the full Flutter suite successfully. No unrelated user changes were reverted.

Current phase remains Phase 3 with targeted integration QA. Device UI acceptance is pending: restart/reload the updated app, open Profile -> Educational Background, fill and save, reopen the form, then log out/in and confirm the same values. Also check invalid LRN/year, slow/failed saves, mobile layouts and theme. No real phone save/login or live authenticated applicant mutation is claimed. Earlier browser, MySQL concurrency and demonstration-readiness limitations remain open.


## Online Examination access after scholarship approval changes (2026-10-18)

User explicitly requested preventing examination resumption when Admin changes scholarship approval back to pending, with an explanatory popup. This authorizes the scholarship continuation rule that prior checkpoints left open. Scope is the existing Online Scholarship Examination on web and mobile; scheduled Entrance Exams remain separate.

Finding: new-attempt eligibility already required an approved application for an active Other Scholarship requiring the online exam. Existing attempt recovery, questions, answers and submission did not recheck that approval. Start could also return its 409 existing-attempt payload before checking current scholarship approval. Mobile refresh swallowed the approval error, and its shared GET cache could return an older authorized exam response when offline.

Completed:
- Central server check returns HTTP 403 with code ONLINE_EXAM_SCHOLARSHIP_APPROVAL_REQUIRED and a plain approval/pending explanation. Applied to active-attempt lookup, in-progress attempt reads, questions, answer writes, submission and start's existing-attempt recovery. Existing ownership checks run first. Mutation transactions recheck approval and use shared reads against qualifying application/scholarship rows on MySQL.
- Answers and assigned question order are retained. No attempt reset, cancellation, extra attempt, score release or timer pause was introduced. Deadlines continue under existing server timing; reapproval permits the same attempt only while it remains active. An expired attempt still follows the existing retake process. Already officially released results remain accessible to their owner.
- Retained the existing global eligibility model: any currently approved qualifying Other Scholarship application permits access. Attempts have no scholarship_application_id association; this batch does not invent a per-scholarship attempt relationship. One approval becoming pending blocks access when no other qualifying approval remains. Admission prerequisites, attempt limits and all other scholarship categories retain their existing rules.
- Web runner clears question/attempt state on the structured denial and opens the shared centered, focus-managed dialog. Check status retries the current API; Close dismisses the dialog without restoring exam content. Active runners revalidate every 10 seconds and on browser focus. A response-version guard prevents older successful question reads from restoring content after denial.
- Mobile Resume always checks the server even with local questions present and reloads the server-authorized question. Denial clears local attempt/question/pending-answer state; the hub displays an AlertDialog and the runner shows a modal with Back to examinations. Runner checks every 10 seconds and on app resume; stale reads cannot reinstate denied content. Question, answer, retry, refresh, start and submission errors recognize the approval code.
- Mobile online-exam GET requests no longer use offline response caching. Offline resume reports connection failure rather than treating an old response as current authorization. Other feature caches remain unchanged. No push channel was added: running-screen notices appear on the next protected request, focus/app return or periodic successful check, rather than instant server push.

Files changed:
- backend/app/Http/Controllers/Api/Applicant/OnlineExamController.php: approval guard and structured response, active recovery/mutation checks.
- backend/tests/Feature/OnlineExamIntegrityTest.php: four new approval withdrawal/retention tests; existing attempt fixtures now include the approval required to use protected exam operations.
- frontend/src/pages/applicant/OnlineScholarshipExam.jsx: denial dialog, state clearing, periodic/focus checks and stale-response guard.
- C:/Users/oseas/StudioProjects/edupath_mobile/lib/features/online_exam/online_exam_provider.dart: explicit blocked state, denial handling, server-verified resume and stale-response rejection.
- C:/Users/oseas/StudioProjects/edupath_mobile/lib/features/online_exam/screens/online_exam_screen.dart: guarded resume and access popup.
- C:/Users/oseas/StudioProjects/edupath_mobile/lib/features/online_exam/screens/online_exam_runner_screen.dart: blocked-runner modal, periodic checks and timer cleanup.
- C:/Users/oseas/StudioProjects/edupath_mobile/lib/core/api/offline_cache_interceptor.dart: exclude online-exam responses from offline authorization.
- C:/Users/oseas/StudioProjects/edupath_mobile/test/online_exam_approval_test.dart (new): eight provider/widget regressions.
- AUDIT.md: this checkpoint.

Executed verification:
- Targeted OnlineExamIntegrityTest initially passed 38 tests / 264 assertions. The new withdrawal test was then strengthened to change approved to pending through the real Admin update endpoint in isolated SQLite, rather than direct fixture mutation; full final Laravel suite passed 90 tests / 625 assertions.
- Backend regressions cover all six blocked access paths, no question payload on denial, no answer/attempt mutation, retained saved answer/order/deadlines, time advancement after reapproval, pending/under_review/rejected/inactive conditions, another qualifying approval and retained released-result access.
- php -l on the changed controller and test: no syntax errors. Route inventory command passed; routes remain unchanged at 147.
- npm run lint -- --max-warnings=0: passed, 0 errors / 0 warnings.
- npm test: 20 passed / 0 failed (existing helper tests, not mounted React modal tests).
- npm run build: passed outside sandbox; main JS 327.63 KB / gzip 103.71 KB, lazy exam page retained.
- Focused Flutter approval tests: 8 passed. Covers blocked resume with existing local questions, fresh reads after reapproval, refresh/questions/answer/submission/start denial, stopped pending writes, offline cached-response rejection, delayed response rejection and actual blocked-runner modal rendering with hidden question content.
- Full flutter test --no-pub: 60 passed / 1 skipped. The optional live API probe had no explicit URL. Final flutter analyze --no-pub: no issues found. Formatting completed; focused approval tests passed again after test-only brace cleanup.
- Targeted tracked web/mobile git diff --check passed; mobile produced only line-ending notices. Untracked online-exam implementation/test files are not covered by Git diff's whitespace check; Dart formatting and analysis cover the mobile files.
- A temporary PHP edit placed the attempt guard outside its method; php -l caught it before API testing and the guard was moved inside. Initial modal-test HTTP setup stalled under Flutter's simulated clock; moved setup to tester.runAsync and reran successfully. Existing user files were hash-checked before staged mobile writes.

No migration, live applicant mutation, permission grant, Admin decision or actual phone/browser interaction was performed. The existing MySQL approval records were not changed by these tests. Current phase remains Phase 3; native MySQL contention and real browser/device acceptance remain pending.

Manual acceptance: use a disposable applicant with one qualifying approved scholarship and an active attempt; Admin changes it to pending; Resume and answer submission must be denied with the popup. Leave the runner open and verify the next request/10-second check hides its question. Reapprove before expiry and confirm saved answers/order and original deadlines, then check expired attempts, app background/foreground, offline reconnect, dark/light layouts and modal navigation. Preserve previous module/readiness limitations.

## Applicant onboarding checkpoint — 2026-10-18

Scope: implemented the specifically approved eight-step applicant tour. No unrelated audit repair, nested-source cleanup, scholarship policy change, application submission, document upload, notification mutation, or examination attempt was performed. Full implementation file inventory, rollout rules, API contract, safeguards, and manual acceptance steps: APPLICANT_ONBOARDING.md.

### Connections and behavior

- Authenticated ApplicantLayout owns an account-keyed onboarding provider. Existing accounts receive no state or automatic prompt; Settings Start Tutorial creates a manual enrollment. New registrations atomically create not_started state while preserving the original authentication response. Interrupted sessions offer Resume rather than automatically reopening the spotlight.
- UI controls call the existing Axios client with skipGlobalRefresh, then GET/PATCH /api/applicant/onboarding or POST /api/applicant/onboarding/restart. Existing Sanctum and applicant-role middleware protect all three routes. OnboardingController writes only the authenticated user's versioned UserOnboardingState row, with validation, user-row locking, a unique constraint, and stale revision rejection.
- Tour progression uses stable sidebar and post-loading heading targets in the active source. Hidden KeepAlive pages are excluded. Body portal, geometry observers, mobile-menu coordination, fallback controls, keyboard focus management, reduced motion, and existing modal coordination were implemented. Progress write failure never displays completion.
- Active online exams suppress the tour. Eligibility checks read attempt status/deadline without advancing its timing or exposing results. Start/resume rechecks the server; web tabs coordinate through BroadcastChannel and focus/visibility checks. Attempts started from other devices are detected at the next 15-second check; no server-push integration was added.
- Actual scholarship checks are described without promising an award. Existing policy discrepancies identified in the inspection were not changed.

### Migration and assets

- Ran php artisan migrate --path=database/migrations/2026_10_18_000002_create_user_onboarding_states_table.php successfully (batch 21); also verified migrate:status. This creates only the new state table and constraints. No existing-account backfill, database reset, seed, or destructive migration was executed.
- The supplied images were actually in frontend/public/images/onboarding/. Copied all five unchanged into tmc-guide/ to satisfy the requested browser URLs; retained originals.
- All five PNGs decode at 1024x1536 and contain alpha-zero background pixels. Each built /images/onboarding/tmc-guide/*.png URL returned HTTP 200 image/png using a temporary loopback-only static server, which was stopped after the check. The raw preview showed apparent background glow, while background pixel samples had alpha 0; browser rendering/edge-halo acceptance remains pending. No image editing was performed.

### Checks actually executed

- Full php artisan test: 105 passed / 708 assertions, including 15 new onboarding tests and the existing scheduled/online exam regressions. Test databases are isolated SQLite in memory; no real applicants were used. Tests cover enrollment, manual start, skip, progress, restart, completion, cross-account/role access, invalid fields/version/revision, stale tabs, failed-registration rollback, version rollout, active exams, expired deadlines, and read-only exam checks.
- php artisan route:list --json: 154 total routes, including three onboarding routes. Focused route inventory also passed. Changed PHP controller syntax checks passed.
- Frontend Node tests: 26 passed / 0 failed using node --test --test-isolation=none tests/*.test.mjs. Default npm test was attempted first but the sandbox blocked child-process spawning with EPERM; in-process execution succeeded. Six new frontend tests cover routes, supplied asset files, character direction, mobile/desktop placement and fallback detection, viewport clipping, exam-route suppression, and hidden-page target lookup. These are helper/contract tests, not mounted-browser interaction tests.
- npm run lint: passed with zero errors/warnings after correcting a cleanup-ref warning. Production npm run build passed outside the sandbox after Windows helper processes were blocked in the initial sandboxed attempt. Final production bundle main JS: 343.22 KB / gzip 109.07 KB.
- Whole-worktree git diff --check found pre-existing whitespace findings in ThemeContext.jsx and AppRoutes.jsx; those files were not edited for onboarding. Existing unrelated working-tree changes were preserved.
- Browser inventory was empty and creating an in-app browser returned 'Browser is not available: iab'. No browser interaction, keyboard/screen-reader acceptance, mobile Chrome acceptance, live account mutation, or multi-tab/MySQL lock-contention test was claimed. Local Apache was unavailable; the loopback static image check used a temporary PHP server instead.

### Remaining acceptance

Use an existing applicant with no active exam: sign in, confirm no invitation, then Settings → Start Tutorial. Exercise all eight steps, close/reload/Resume, Skip, Finish, and Restart. Repeat with mobile menu, scrolling/rotation, dark/light mode, reduced motion, keyboard, offline/retry, and a second tab. Review PNG edges on both themes. New-account invitation should be verified with an authorized test registration. No additional local migration or package installation is required; other installations must run the targeted migration before deploying this registration code.

## Native mobile onboarding checkpoint — 2026-10-18

Implemented the approved mobile tutorial in C:/Users/oseas/StudioProjects/edupath_mobile. Full file inventory, architecture, instructions, and limits: MOBILE_ONBOARDING.md.

- Added OnboardingProvider, OnboardingHost, TutorialTarget, and mobile tutorial content under lib/features/onboarding/. Integrated the existing applicant tab shell, pushed Programs/Documents/Settings pages, Settings start/restart/resume controls, auth account binding, local exam suppression, route/dialog observation, and ready-state heading targets. Profile includes an actual highlighted bottom-navigation action; controls cannot submit real forms or start exams.
- Reused the web's Laravel version-1 step IDs and authenticated GET/PATCH /applicant/onboarding plus POST /applicant/onboarding/restart. No new backend route, database change, migration, reset, seed, or real account/application/examination mutation was executed for this mobile task. Existing users remain unenrolled unless explicitly started; new registrations receive Start/Skip/Later; interrupted progress offers Resume. Web/mobile completion and progress share the same account record.
- Native overlay is outside screen containers, with themed character speech card, progress, Back/Next/Skip/Finish, reduced-motion character animation, focus/background semantics isolation, safe navigation-only spotlight action, scroll/resize measurement, current/onstage target selection, fallback controls, and pause on dialogs/unrelated routes/app backgrounding. Unsupported future tutorial content fails closed.
- Excluded onboarding endpoints from OfflineCacheInterceptor and reject offline-cache responses in the provider. Availability is checked before open/resume, on foreground, and every 15 seconds. Server active exams or local active/starting attempts suppress the tutorial. Cross-device changes are polled; no server push was added. Stale revisions load the latest state and require explicit resume/restart. Late responses cannot populate another account's state.
- Bundled the exact five supplied PNGs under assets/images/onboarding/tmc-guide/ and declared this subdirectory in pubspec.yaml. No dependency was added or upgraded.

Verification actually executed:

- Staged full Flutter suite: 71 passed / 1 skipped. Staged analysis: no issues. Staging caught/fixed Flutter tooltip's requirement for a root Overlay before applying source files.
- Applied 24 files (14 modified originals, 4 new Dart implementation files, 1 new test file, and 5 assets) after preflighting destination hashes. Fourteen original files are preserved under storage/mobile-onboarding-originals/; applied hashes are in storage/mobile-onboarding-patch.json. Unrelated mobile changes were preserved.
- Actual mobile project flutter analyze --no-pub: no issues found. Actual full flutter test --no-pub: 71 passed / 1 optional live API probe skipped because no explicit live URL was configured. Existing exam-approval, admission, profile, document, notification, server configuration, and help regressions passed.
- After final character-direction and dark-mode contrast fixes: analysis clean and all 11 onboarding provider/widget/cache tests passed again. Coverage includes all eight steps, actual highlighted-area tapping, new/existing account behavior, interrupted Resume/Skip, save failures without SQL detail, stale web updates, local/remote exam suppression, offline denial, late account responses, real dialogs, offstage pages, and small dark layout at 180% text with reduced motion.
- flutter build apk --debug --no-pub: passed. Output: C:/Users/oseas/StudioProjects/edupath_mobile/build/app/outputs/flutter-apk/app-debug.apk (185197689 bytes). SHA-256: DE0356419DD0861A93AE9E3CB1B1D853CCF5F9C7EC991804C56D8632BB89E95E. Read-only APK archive inspection confirmed all five guide PNGs.
- All 24 applied file hashes verified against the prepared patch. Temporary staging source was removed after successful application/verification; source backups and test logs were retained in storage/.

Remaining acceptance: install the rebuilt debug APK on an authorized test phone and confirm its configured Laravel server is reachable. Existing account → Profile or drawer → Settings → Start Tutorial (Restart/Resume if already enrolled). Exercise all steps, real-network failures/retry, rotation, TalkBack/keyboard, both themes, and web/mobile progress conflicts. No physical phone/emulator session or live authenticated cross-device flow was exercised. No further local migration or package installation is required. Browser/web tests from the prior checkpoint were not rerun because web/backend code was unchanged by this mobile task.

## Mobile provider-scope repair — 2026-10-18

Reported runtime error: Provider<OnboardingProvider> was absent above EduPathApp. Inspected main.dart: cold startup did register it in main(), but a running pre-onboarding tree does not acquire new main() registrations through hot reload. No nullable fallback or silent disabling of onboarding was used.

Fix: lib/main.dart now lets EduPathApp own a ChangeNotifierProxyProvider2<AuthProvider, OnlineExamProvider, OnboardingProvider>. A separate child builds MaterialApp using a descendant context, so route observer and OnboardingHost read the correct provider. Account/exam bindings moved from manual main() listeners into the proxy update, and notifier disposal belongs to the widget scope. The existing authenticated providers, API, state storage and database were preserved.

Added test/onboarding_app_scope_test.dart: builds EduPathApp under the legacy root providers without calling main() or manually supplying onboarding; asserts provider availability, correct navigator observer and stable instance after rebuilding. Strengthened test also exercises Flutter reassembly. The first reassembly harness waited for a frame before pumping it and was stopped; corrected to Flutter's own unawaited-reassembly/explicit-pump pattern. The strengthened regression then passed.

Executed in the actual mobile project: flutter analyze --no-pub passed with no issues; full flutter test --no-pub passed 72 tests / 1 optional live API probe skipped. Strengthened startup/hot-reload test passed separately. flutter build apk --debug --no-pub passed and replaced the APK at build/app/outputs/flutter-apk/app-debug.apk. Applied-file manifest updated and all 25 current file hashes verified. Pre-fix main.dart and verification logs retained in storage/mobile-provider-fix/.

Development recovery: do one Hot Restart or Stop/Run to clear the old bootstrap tree and listeners. No database reset, reinstall, or preference clearing is required. Physical-device confirmation remains pending. MOBILE_ONBOARDING.md updated.
Rebuilt APK SHA-256: DF0E2721574C9126173A856308921B674EE9436F6A9E8A04DE0456B974A3A52F

## Cropped onboarding character update — 2026-10-18

Used the user's latest cropped PNGs from frontend/public/images/onboarding/. These five crops are square (welcome 780px, explain 800px, point-left 796px, point-right 808px, celebrate 822px); sampled backgrounds are opaque, and the welcome preview shows a black background. Preserved the images exactly; no background removal, image generation, or further cropping was performed.

Root cause: the web guide still requested the now-missing /images/onboarding/tmc-guide/ subfolder, and both web/native guides still reserved a 2:3 portrait frame. Updated active ApplicantTourOverlay.jsx and ApplicantOnboardingProvider.jsx to use /images/onboarding/<filename>.png; adjusted onboarding.css to square 100px desktop, 65px mobile, and 70px invitation frames while retaining contain fitting. Updated the frontend asset-presence check. No nested frontend source was modified.

Synced all five cropped PNGs into the Flutter asset folder assets/images/onboarding/tmc-guide/ and changed OnboardingHost's image height from width * 1.5 to width. Previous native images/source are backed up in storage/cropped-guide-update/mobile-before/. Existing user edits in the native source were hash-checked before applying the one-line size change. Updated asset documentation and six guide entries in the applied-file manifest.

Checks executed: all 26 frontend tests passed using in-process Node tests; npm run lint passed; npm run build passed. Served built web files on a temporary loopback-only PHP server: all five new /images/onboarding/*.png URLs returned HTTP 200 image/png, then stopped that server. Native flutter analyze --no-pub passed with no issues; 12 onboarding/startup tests passed; flutter build apk --debug --no-pub passed. Read-only archive SHA-256 checks confirmed that all five APK PNGs match the current cropped web images byte-for-byte. Full unrelated backend/native suites were not rerun for this asset/layout-only change.

No tutorial version, progress, enrollment, API, authentication, business rule, database record, migration, or dependency was changed. Web: refresh the page and start/resume the tutorial. Native: install the rebuilt debug APK or hot restart the development app so the asset cache reloads. Black backgrounds are part of the supplied crops and will remain visible, especially in light mode. Physical-phone/browser visual acceptance remains pending.
Updated APK SHA-256: 81D4112A1CE21784D699C5CF73E4D93AE755F1DDEE5516407DBE636D01B8D109

## Updated transparent guide artwork — 2026-10-18

User replaced all five web source images again. Inspected the actual files: welcome.png, explain.png, point-left.png, point-right.png and celebrate.png are now all 1254 × 1254px with transparent corners/background samples. Some red edge fringing is visible in the supplied artwork and sampled edge pixels. Used the images byte-for-byte without image generation, cropping or background removal. Existing square web/native frames remain appropriate, so no application source/layout changes were needed.

Synced all five files from frontend/public/images/onboarding/ to the Flutter app's assets/images/onboarding/tmc-guide/ folder. Checked original native hashes before applying and backed up the previous native copies under storage/guide-assets-20261018-1431/mobile-before/. Updated documentation to supersede the earlier opaque-background description and recorded the five new hashes in storage/mobile-onboarding-patch.json.

Executed: all 26 frontend tests passed using Node in-process execution; npm run build passed. Both native onboarding test files passed all 12 tests; flutter build apk --debug --no-pub passed. SHA-256 checks confirmed that every PNG in frontend/dist/images/onboarding/ and the rebuilt APK matches its current web source. Lint/analysis and unrelated backend/full-native suites were not repeated because only image assets and documentation changed. No tutorial state, enrollment, version, authentication, API, database record, migration or dependency changed. No live browser/physical-phone acceptance is claimed.

Web: refresh the site (Ctrl+F5 if older images remain cached). Mobile: install the rebuilt build/app/outputs/flutter-apk/app-debug.apk, or stop/run the development app to reload its bundled assets. Existing tutorial progress is preserved. Physical-device checks of transparency/edge appearance remain pending.
Latest APK SHA-256: 65AAF12F4665EA5E22972302E8A460ABAF967235ABDE6124D4C8C7B656355C9E

## Applicant announcement deletion - 2026-10-18

Added per-account dismissal for announcement items in Notifications across active React and native Flutter clients. Mobile previously exposed only a chevron in the Announcements tab; web's existing notification delete could be undone by announcement publication sync. The new account/announcement dismissal table prevents this reappearance while preserving the college announcement and other recipients. Confirmation and failure handling are present; unread counts and both native feeds update only after successful deletion. Native feed loads bypass offline cache and filter stale in-flight results. Applicant ownership, role middleware, publication visibility, and unrelated notification deletion remain enforced.

Applied only migration 2026_10_18_000003_create_announcement_dismissals_table (batch 22); no database reset, seed, or existing record deletion. Full backend suite 108 passed/739 assertions; final affected suite 42 passed/298 assertions after the additional anonymous-access regression. Web 26 tests, lint and production build passed. Full native suite 76 passed/1 optional live probe skipped; analysis clean after correcting a test style warning; Android debug APK rebuilt successfully. Live browser and physical-phone acceptance remain unperformed. File list, setup command, limitations, and applicant test instructions: APPLICANT_ANNOUNCEMENT_DELETION.md. Native originals and logs: storage/announcement-delete-update/.
## Shared campus image page headers - 2026-10-18

Applied the supplied TrinidadMunicipalCollege.png to 49 inspected header banners across 42 active React page files: Admin, Staff, Applicant, About and User Guide. The actual supplied file is frontend/public/TrinidadMunicipalCollege.png, so CSS uses /TrinidadMunicipalCollege.png. Original artwork is preserved and copied unchanged into the production build by Vite. Added the reusable ep-page-banner class in frontend/src/index.css, with a navy darkening gradient, responsive cover positioning, white titles and pale subtitles. Scoped text rules override the existing legacy !important dark-mode utilities to preserve contrast. Plain page titles now have banner padding and rounded corners; existing banner controls, tutorial targets, layouts, dialogs, and routes are preserved. Matching inspected loading banners use the same image. No inactive frontend/src/src files, native Flutter files, backend code or database records were changed.

Verification: npm run lint passed; all 26 existing Node frontend tests passed; npm run build passed, including a final rebuild after the dark-mode contrast adjustment. Parsed all edited JSX with the existing Babel parser and inventoried all 42 h1 headings in the inspected active page set under the banner class; the reusable Admin Settings SectionHeader is also covered. Confirmed source and built image SHA-256 match (15B00CF3AA96EECAC3A23A08255C9E4155F4DE47796AE2A83953641F5E1BBE73). No live browser or phone visual acceptance is claimed. Pre-change page copies are retained in storage/page-banner-originals/; inventory and build logs are under storage/.
## Mobile applicant drawer campus background - 2026-10-18

Updated the native Flutter drawer in C:/Users/oseas/StudioProjects/edupath_mobile/lib/shared/widgets/app_drawer.dart. The applicant header and college information card now use the supplied TrinidadMunicipalCollege.png as a cover background with a dark navy color filter. Names remain white; email and college subtitle use brighter near-white; the applicant badge uses an opaque navy backing for readable gold text. Existing navigation, profile image, theme, menu behavior, and layout are preserved. Bundled the exact web image as assets/images/TrinidadMunicipalCollege.png; the existing pubspec assets/images/ declaration already includes it. No web, API, authentication, or database changes.

Verification executed: Flutter formatter made no additional changes; flutter analyze --no-pub passed with no issues; full flutter test --no-pub passed 76 tests with 1 optional live API probe skipped; flutter build apk --debug --no-pub passed. Opened the rebuilt APK ZIP and confirmed the bundled campus image SHA-256 matches the web source (15B00CF3AA96EECAC3A23A08255C9E4155F4DE47796AE2A83953641F5E1BBE73). APK: C:/Users/oseas/StudioProjects/edupath_mobile/build/app/outputs/flutter-apk/app-debug.apk; SHA-256 A2A6FB83B6E054C34831CBABA2124A13B898DAA7665685055EBA1FB6420EB390. No physical-device visual acceptance is claimed. Drawer original, reviewed staging file, and verification logs: storage/mobile-drawer-campus/. Install the rebuilt APK or stop/run Flutter to reload the new bundled asset, then open the applicant drawer.
## Applicant Profile mockup redesign - 2026-10-18

Redesigned the active React and native Flutter applicant profile using the supplied reference: compact existing TMC campus cover, overlapping circular account photo/initials, real name/role/email, Edit Profile, Personal Information, Contact & Address, Educational Background, and saved-data completion. Web has a desktop completion sidebar and phone stacking; Flutter uses vertical cards and retains drawer/bottom navigation, personal/photo editor, education editor, account actions, statistics, refresh, and logout. Fixed dark-mode contrast for shared native avatar fallback initials. All seven existing education fields are visible/editable on web via the existing profile endpoint. Web cancel restores snapshots; failure preserves drafts; confirmed server saves normalize cleared optional values and update completion. Existing image type/2 MB limits and explicit photo upload controls remain. No enrollment/award/eligibility gate was introduced.

Completion uses the actual seven non-secret registration-required details (first/last names, birth date, gender, phone, address, email); optional education and photo do not reduce the score. No backend, API contract, database, or migration changes; inactive nested source left untouched. Exact files, preserved behavior, backups, and testing instructions: APPLICANT_PROFILE_REDESIGN.md. Originals/logs/isolated QA scripts and screenshots: storage/profile-redesign/.

Executed verification: web lint and production build passed; 28 frontend tests passed. Headless isolated React browser checks passed for desktop/mobile light/dark layout, no horizontal overflow, background loading, cancel without writing, validation failure preserving drafts, retry, saved completion updates, and education preservation. Successful check had no browser runtime exceptions. The QA harness initially used incorrect middleware/module imports; corrected the harness without changing production routing. Backend education/photo suites: 13 passed/150 assertions against isolated SQLite. Native targeted profile/education tests: 10 passed; native capture checks: 3 passed with optional local font/image loading. Native helper parse syntax and a null-aware-element analyzer warning were corrected during development. Final full Flutter suite: 79 passed, 1 optional live API probe skipped; analysis clean; final debug APK build passed. Desktop/phone React screenshots and native widget previews inspected; shared avatar contrast corrected afterward and full native suite/analysis/build rerun. No physical-phone or live-account save acceptance is claimed. Isolated preview server/headless browser shut down after checks.
Latest profile APK SHA-256: B125F1C75A4ED34E4478B8426CE0A7980D95A699587A89AF557EA7A5C1A2A4BC

## Visual-only modernization across web and mobile - 2026-10-18

Completed three reviewable presentation batches using Requirements.jsx as the web reference. Web changes are limited to shared style tokens/cards/focus colors, a Published badge contrast fix, and CSS hooks on the existing Navbar/Sidebar/Admin/Staff/Applicant layout roots. Unified workspace and table presentation, restricted neutral row hover to rows without their own background classes, and scoped old navigation colors to the sidebar. Flutter changes are limited to AppTheme palette/surface/border/radius/shadow/type/input-padding properties and five shared empty/error-state color expressions. Corrected dark selected-navigation foreground contrast. All nine application files are listed in VISUAL_MODERNIZATION.md; original copies, per-batch diffs and logs are under storage/visual-modernization/.

Recorded/rechecked 393 existing source/config/test fingerprints. Edited React logic ASTs match after allowing class-name presentation strings; backend routes/controllers/migrations, feature screens, exam/onboarding/authentication logic, tests and dependency files are unchanged. Native diffs contain theme/style expressions only. No database/API/workflow change, dependency installation, component rewrite, feature removal, or real-account write was performed.

Checks run per batch: web lint, all 28 existing Node tests, and production builds passed. Headless real-component test-data previews: 8 cases in batch 1; 16 desktop/phone light/dark cases in batch 2. Final checks used pointer events for menu open/close, theme toggle and confirmation. Checked keyboard focus, Escape/Confirm, restored focus, viewport centering, no checked root/main overflow, and Published contrast 6.70:1. Screenshots inspected. QA harness initial duplicate React imports and OKLCH measurement were corrected in the isolated tools; production logic was not changed for them. Native analysis clean; full existing suite 79 passed/1 optional live API probe skipped; existing profile layout capture suite 3 passed. Separate isolated native visual probe: 4 passed for 360px/enlarged-text light/dark dialog centering, cancel/confirm callbacks, empty-state action/heading contrast and selected-navigation contrast >=4.5:1. Initial Ahem-font title overflow in that probe was corrected by using local real font metrics in the QA harness only. Android debug APK build passed.

Scope/limits: shared-theme refresh retains existing per-page overrides; representative layouts/interactions were checked, not every page/state/live workflow. Physical Android/mobile Chrome, native production-font rendering and real-account end-to-end acceptance remain untested. Backend tests were not rerun because backend files are unchanged. Isolated preview server/browser closed. No setup/migration needed. Full exact-file report and limitations: VISUAL_MODERNIZATION.md.
Latest APK SHA-256: 5344B2C696AB39088B3BBECEF3BD31B2C29EFC526BE3DC2D2C28B08D1EB63176
## Top navigation Profile visibility and design - 2026-10-18

Inspected the actual Navbar and existing role routes. My Profile already existed inside the account dropdown, but below sm the user details and chevron were hidden, leaving only an avatar. The navbar also read only user.profile_photo_url, although applicant login can contain applicant.profile_photo and staff can contain user.profile_photo. No backend/authentication/API changes were made.

Updated frontend/src/components/Navbar.jsx and scoped navbar CSS in frontend/src/index.css: circular gold-ring avatars, a visible phone Profile label, My Profile caption next to desktop account details, compact 320px spacing, and a viewport-height-constrained scrollable dropdown. Kept header height, mobile menu target, brand/dashboard/About links, role destinations, theme toggle, dropdown callbacks, outside-click/Escape listeners, and sign-out confirmation/action. New frontend/src/services/profilePhoto.js resolves existing role-specific photo fields and relative public-storage paths, rewrites unusable loopback-host photo URLs to the configured backend host for LAN browsers, and rejects unsupported URL protocols. Broken image loads fall back to existing initials without changing the stored photo or account. Added frontend/tests/profilePhoto.test.mjs for role shapes, relative/absolute URLs, LAN rewriting, missing values and unsupported protocols.

Verified: ESLint passed; all 30 frontend tests passed; production build passed. Isolated real-component browser checks passed for Admin/Staff/Applicant at 1280px, 390px and 320px in both themes (18 cases): photo rendering, visible Profile, no root horizontal overflow, dropdown within viewport, existing role-specific hrefs, actual pointer-click My Profile navigation, Escape dismissal, and theme toggling. Broken-image initials and sign-out confirmation Cancel were checked; Cancel did not call logout. No runtime exceptions in the successful checks. Desktop and small-phone screenshots inspected. Logout handler and dropdown listener effect compared byte-for-byte with the pre-task snapshot and match. Browser tests used test accounts and a test image, not live accounts or backend writes. No physical-phone/live-account acceptance claimed. Native Flutter app and database untouched; no migrations/setup required. Backups, reviewed diff, logs and screenshots: storage/navbar-refresh/. Refresh the web app, then select Profile at the top right and My Profile in its menu.
## Admin Profile visual redesign - 2026-10-18

Updated the active frontend/src/pages/admin/Profile.jsx and added its scoped profile.css. Consolidated the two oversized headers into one compact TMC campus cover; introduced an overlapping circular account photo/initials, real account email alongside name/role/status, a gold Edit Profile action, softer teal section headers, and responsive stacked phone layout. Personal Information and Account Information remain side by side on desktop; the unchanged password form follows them. Existing photo selection/upload, all existing fields (including read-only phone), account metadata, administrator information, error/success dismissal, and edit/save/cancel controls remain. Added scoped visible keyboard focus and reduced-motion styling. No backend, database, API, authentication, permissions, routes, or native mobile changes; no migration/setup needed.

Verification executed: ESLint passed, 30 frontend tests passed, final production build passed. Reviewed the focused diff against a pre-task snapshot. Component logic is identical after newline normalization; AST comparison confirms every existing input/button/form/label property except className is unchanged. Isolated browser checks at 1280/390/320px in both light and dark themes passed for layout without horizontal overflow, TMC background, loaded circular photo, Edit/Cancel restoring data with no writes. Additional checks passed for initials fallback, successful save and existing POST payload, failed save retaining edit mode and showing the error, photo FormData POST, password mismatch blocking a request, password PUT success and existing payload, and reduced-motion styling. No runtime exceptions. Desktop and phone screenshots visually inspected. Fixture responses were used for browser writes; no real account or database records were changed. Live-account saves and physical-device testing remain untested. Backups, scope verification, isolated QA scripts and screenshots: storage/admin-profile-refresh/. To review, sign in as Admin and open Profile > My Profile from the top navigation, then refresh if necessary.

## Admin profile photo URL fix - 2026-10-18

Read-only diagnostics confirmed the existing Admin account has a saved profile photo, its file exists, and backend/public/storage is a valid junction. Laravel APP_URL is http://localhost, so its public disk emits http://localhost/storage/... without the development API port. The Admin Profile page used that raw URL, while the navbar resolver corrected localhost only for LAN clients and missed local API port mismatches. This was a URL-resolution problem, not a missing upload.

Changed frontend/src/services/profilePhoto.js to resolve local Laravel /storage/ URLs using the configured active API origin, including its port even on localhost. The existing navbar automatically receives the fix. Changed frontend/src/pages/admin/Profile.jsx to use that resolver with support for the stored path, retain local upload previews, and show initials plus a clear error if image loading fails. Existing upload/save/password handlers, authentication, backend, database, storage files and API contracts unchanged. Added a regression case to frontend/tests/profilePhoto.test.mjs covering localhost, 127.0.0.1 and LAN origins and preserving external CDN URLs.

Executed verification: ESLint passed; all 31 frontend tests passed; production build passed; Laravel AdminProfileTest passed (2 tests, 11 assertions against in-memory SQLite/fake storage). Retrieved the real pre-existing saved Admin image through a temporary loopback Laravel server: HTTP 200 and valid image bytes, without changing the record or file. Isolated browser checks at 1280/390/320px in both themes verified that a deliberately incorrect http://localhost/storage/ fixture resolves to the active API host/port and both the profile and navbar load it. Edit/Cancel, save success/failure, photo upload, password mismatch/success, reduced motion, and failed-photo initials/error were checked with fixture requests; no runtime exceptions. Diff reviewed. No migrations or setup changes. Physical-device and live authenticated browser testing remain untested. Diagnostic scripts, snapshot and browser screenshots: storage/admin-photo-fix/. Refresh the web app (Ctrl+F5) and open Admin My Profile; the existing photo does not need to be uploaded again. Temporary QA services were stopped.

## Security, workflow accountability, scholarship clarification, reports and operational checks - 2026-10-18

Completed the user-authorized batches in the active React source, Laravel API, and existing Flutter applicant app. Full scope, exact major file list, setup commands, rollout behavior and remaining acceptance work are in RELIABILITY_IMPLEMENTATION.md. No dependencies added; inactive frontend/src/src left untouched; existing user changes preserved. No live application decisions, awards, passwords or uploaded documents were changed for tests. Additive migrations 000004/000005/000006 ran successfully in batches 23/24/25; no reset or seed.

Security: OTP verification returns a random, hashed-at-rest single-use reset credential; reset requires that credential and matching email, locks account/OTP rows, expires after ten minutes, and revokes existing Sanctum tokens. Resending invalidates prior credentials; incorrect attempts persist. React and Flutter recovery updated together. Named IP/account throttles added to public authentication/recovery routes. Unexpected API errors are sanitized even with local debug enabled while server diagnostics, normal validation/auth errors, HTTP status and Retry-After headers remain. Existing verified OTP rows must request a new code; old email-only clients cannot reset passwords.

Decisions: shared transactions connect admission decisions, document reviews and scholarship review to existing history, actor-attributed workflow events, in-app notifications and durable push records. Identical decision retries do not duplicate notifications. Staff recommendations and staff account/permission/program updates/deletion are audited. Online and scheduled result releases notify only after official release and record activity; existing exam eligibility, timings, scoring, attempts and result privacy retained. New Admin-only final scholarship award record is distinct from review approval, requires a reason and revision, and is never inferred from existing approval or examination completion. Applicant web/mobile show the separate award; existing category rules/unlimited awards were not changed. Institution-specific renewal/payment/retention policies were not invented.

Delivery: account-scoped server preferences with stale-revision protection replace browser-only preferences across all web roles and native applicant Settings. Preference saves do not broadcast global refresh. Native editing requests a fresh server revision rather than an offline cache value. Push token registration now really persists its value and serializes device-token reassignment between accounts. Scheduler handles due publications and a retryable push outbox with failure/retry visibility. Existing future scheduled announcements are queued without replaying old publications. In-app records remain available regardless of push preference/failure. No real mail or device pushes were sent.

Reporting: new protected Admin Reports & Activity page, Sidebar link and route. Filters for program/period/scholarship/status/submitted dates; paginated records; pending reviews; missing/unverified requirement samples using the existing document-name convention; actor/type activity filters; workload and decision-hours summaries; delivery-status filters/retry; CSV exports with formula escaping and 10,000-row cap; browser Print/Save PDF for displayed records. Legacy list contracts unchanged; scholarship period/program filters reflect associated admission records, not a nonexistent separate scholarship term.

Executed verification: final full Laravel suite 128 passed / 853 assertions against isolated SQLite; after preserving HTTP 503/retry headers, final targeted security suite 8 passed / 49 assertions. Earlier fixture-token and workflow checks included account scoping, atomic rollback, award revision conflicts, no inferred awards, due announcement dispatch/retry/idempotency, document history, staff permission/deletion audit, CSV formulas and reports. Frontend lint passed; 31 Node tests passed; final production build passed. PHP syntax sweep checked 134 app/migration files with zero failures; final touched controllers/backup command also parsed successfully. Route inventory: 164; auth middleware and schedule listing inspected; new migrations all Ran. Flutter full suite 83 passed / 1 optional live probe skipped; final targeted recovery/preferences/model/widget tests 4 passed; final analysis clean; final Android debug APK build passed. APK SHA-256: CF4198DF9BEF7E9841B8DCC58EACDDC8035E453F624C73E8016657F29F857D61.

Browser: isolated real-component fixture checks at 1280/390px in light/dark passed reports layout/pagination/activity/delivery retry, account preferences for all three roles, stale conflict/reload and skipGlobalRefresh, OTP-to-reset credential transport, and explicit award confirmation Cancel/Confirm. Confirmation cards centered within their fixed viewport backdrops (including existing reserved scrollbar gutter); screenshots inspected. No application runtime exceptions in successful checks. CSV request/body and print stylesheet checked; Edge opened its Downloads hub so automated final file saving is unverified. Headless print-to-PDF returned Printing is not available; actual interactive PDF output remains unverified. QA initially had timing/textarea/scrollbar measurement errors, corrected in fixture harnesses; no global modal behavior was changed to satisfy those checks.

Operations: added private backup/isolated restoration and read-only deployment-check commands. Verified SQL restore into a newly generated disposable database, all source/restored table counts, native two-connection row lock contention and private/public storage archive checksums; only that successfully created disposable database was removed. Final verified backup: backend/storage/app/edupath-backups/20261018-121126-o9W9RaHt/. Private artifacts are Git-ignored. XAMPP's older MariaDB dump client failed MySQL 8 authentication; using installed MySQL 8 tools fixed it. Backup command helper naming collision was fixed; final verification passed. Pint was unavailable because its executable requires PHP 8.3 while local PHP is 8.2.12; no version check was bypassed.

Remaining environment acceptance: Firebase backend credentials are missing; SMTP transport is configured but live recipient/device details were requested and not supplied during this run. No OS scheduler was installed; run php artisan schedule:work locally or configure schedule:run every minute in deployment. Local Apache document-denial probe could not connect; deployed raw URL denial remains unverified. Physical-phone, real cross-role live-account workflows, and full concurrent HTTP MySQL exam/decision races remain untested; the native lock probe is not a full race/load test. Local APP_DEBUG was not changed; deployment must configure production settings. No scheduled mass notifications or real applicant decisions were executed. Preview services and isolated browser were closed after checks.
Final follow-up: clarified Staff scholarship review labels and showed the separate award state without changing its recommendation handlers or permissions. Final security response check also retained HTTP 503 and Retry-After while hiding diagnostic details (8 security tests / 49 assertions passed). Final web build/lint rechecked after Staff wording changes. Focused git diff whitespace check flagged existing whitespace in Staff Settings/AppRoutes; no unrelated formatting cleanup was applied. Updated main checkpoint supersedes prior test counts.

## Shared navigation performance - 2026-10-18

Updated active React portal navigation for Applicant, Staff and Admin: page-local Suspense in KeepAliveOutlet; retryable shared module imports warmed by Sidebar pointer/focus intent; activity-aware auto-refresh that coalesces hidden pages until revisited. Global unread counts and Staff authorization refresh continue. Existing route JSX/destinations, page actions, tutorial targets, initial loading conditions, dirty-form guards and exam logic preserved. No backend/schema/dependency/native Flutter or inactive nested source changes; no migration required.

Executed fixture comparison after three visited pages: refresh wave page requests decreased from 4 for Admin or 3 for Applicant/Staff to 1 visible-page request; a revisited dirty page refreshed once and retained search. These counts exclude global subscribers and are not live latency claims. Both sampled baseline/updated React Router transitions retained the shell; destination-local loading was confirmed. All-role browser checks passed at 1280/390px light/dark, with code-only preloading, cached search, unsaved Applicant Profile draft preservation, mobile menu closure, no root overflow, API error/recovery, Staff revocation and exam code preload without attempt API/actions. No runtime exceptions in successful runs; screenshots inspected. Initial test mapping and baseline expectations corrected; isolated Vite caches resolved preview cache contention.

Final checks: 40 frontend tests passed; lint/build passed (1,971 modules). Laravel Staff/onboarding/examination regressions 66 passed / 578 assertions. Snapshot verifier confirmed unchanged route JSX/import destinations, Sidebar actions/targets and refresh bus runtime. Details/files/limitations: NAVIGATION_PERFORMANCE.md. QA artifacts: storage/navigation-speed/. Live backend load/production timing and physical-device testing unverified. Refresh the web app once to receive changes.
