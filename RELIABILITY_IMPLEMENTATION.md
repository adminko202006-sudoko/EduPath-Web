# EduPath security, decisions, reporting, and operations

Implemented on 2026-10-18 in the active React source tree, Laravel API, and existing Flutter applicant app. No dependencies were added. Existing admission, scholarship-category, and examination eligibility rules remain in effect. No real application decisions, passwords, awards, or uploads were changed for testing.

## Implemented behavior

- OTP verification now issues a cryptographically random, short-lived reset credential. Only its SHA-256 hash is stored. Password reset requires that credential and the matching email; verification and reset serialize on the account and OTP rows. Reset credentials are single use, expire after ten minutes, and are invalidated by a new OTP request. Successful password resets revoke existing Sanctum tokens. Old verified OTP rows without a credential cannot reset passwords.
- React carries the credential between the existing recovery screens. Flutter holds it only in memory for the verified email. Older clients must be updated before using password recovery; an email-only reset is intentionally rejected.
- Named route throttles protect login, registration, OTP requests, verification, and both reset endpoints. Per-minute IP/account limits are respectively 10/5 for login, 10/5 for registration, 10/3 for recovery requests, and 30/10 for verification/reset. The OTP's five-incorrect-attempt limit also remains. Responses include the normal HTTP 429 retry information.
- Unexpected API server errors return a generic error even when local debug mode is enabled; diagnostic exceptions remain in server logs. Expected validation/authorization errors, HTTP status codes, and retry headers are retained.
- Admission decisions and document reviews save the status, existing history, a new actor-attributed workflow event, an applicant in-app notification, and a durable push-delivery record transactionally. Identical retries do not duplicate decision notifications. Staff scope and permission checks remain in the existing controllers.
- Scholarship application reviews and staff recommendations have actor-attributed history. Staff still cannot finalize scholarship awards. Staff account/permission/program changes and official online/scheduled result releases also create workflow events. Audit records contain no passwords, tokens, answer keys, or unreleased scores.
- Application `approved` continues to mean approval for the existing eligibility/examination workflow. A separate Admin-only award record has `undecided`, `awarded`, or `not_awarded`, decision-maker/time, required remarks, history, and an optimistic revision. Existing approvals remain **undecided**, not automatically awarded. A recorded award must be explicitly corrected with a reason before application approval can be withdrawn. Exam completion/passing does not automatically award a scholarship. These are manual administrative records, not confirmation of provider payment.
- Admin scholarship review includes separate award controls and history, using the existing centered confirmation/focus infrastructure. Applicant web/mobile displays review approval and the award separately. Current UniFAST/TES/TDP/Other configuration, unlimited-award setting, and examination prerequisites were not changed or represented as independently verified institutional policy.
- Notification preferences now save per account in Laravel with revision checking. All three web roles and the Flutter applicant Settings can load/save them. Conflicts require reloading; failed saves do not display success. Web saves use `skipGlobalRefresh` so they do not refresh unrelated pages. Browser-only preferences are not automatically copied between accounts.
- Preferences control optional push delivery; in-app decision records remain accessible. Scheduled announcements dispatch when due. Migration queues existing **future** published announcements without replaying historical publications. Push records retry after five minutes, up to eight attempts, and Admin can queue a failed delivery again. The device-token endpoint now actually persists the token rather than silently dropping it through mass-assignment filtering.
  Device registration also serializes reassignment of a shared phone token so a token is not retained by two accounts after switching accounts. Push transport is at-least-once across a crash after provider acceptance; the durable in-app record is unique, but external push cannot guarantee exactly-once delivery.
- Admin **Reports & Activity** provides program/period/scholarship/status/date filters, paginated application lists, pending review counts, missing/unverified required-document samples, recorded workload, average admission-decision hours, activity records, and delivery failure/retry visibility. CSV exports include all filtered records up to 10,000 and escape spreadsheet formula prefixes. Print/Save PDF uses the browser's print facility for the displayed pages. Scholarship program/period filters use associated admission records because scholarship applications have no independent term relationship.

## Database changes — already executed here

```powershell
cd C:\xampp\htdocs\G5_Edupath\backend
C:\xampp\php\php.exe artisan migrate
```

Additive migrations:

1. `2026_10_18_000004_secure_password_reset_credentials.php`: nullable reset credential hash.
2. `2026_10_18_000005_add_workflow_accountability.php`: workflow events, separate award fields/revision, account preferences, durable deliveries, scheduled-dispatch flag.
3. `2026_10_18_000006_queue_existing_future_announcements.php`: queues previously scheduled future publications only.

No database reset/seed was performed. Existing historical actor/award information is not fabricated or backfilled. Existing clients/endpoints retain their established role boundaries and response fields; new award/report/preference fields and endpoints are additive. Password reset has the necessary security contract change above.

## Setup still needed

Run the scheduler locally while demonstrating scheduled publication/push:

```powershell
cd C:\xampp\htdocs\G5_Edupath\backend
C:\xampp\php\php.exe artisan schedule:work
```

On a deployed server, configure the OS scheduler to invoke `php artisan schedule:run` every minute instead. Laravel registers the dispatcher with overlap protection. No OS task or unattended worker was installed in this session, and no real user messages were sent.

Configure the existing Firebase service account at `backend/storage/app/firebase-credentials.json` using the institution's credentials. That file is currently missing; installing the Android APK alone cannot enable server push. Email transport is configured as SMTP, but delivery was not tested against a real recipient.

Install the rebuilt Flutter debug APK or rebuild/run the Flutter app to obtain the new recovery contract and preference/award UI:

`C:\Users\oseas\StudioProjects\edupath_mobile\build\app\outputs\flutter-apk\app-debug.apk`

## Operational commands

```powershell
C:\xampp\php\php.exe artisan edupath:operations-check
C:\xampp\php\php.exe artisan edupath:operations-check --url=https://YOUR-BACKEND-ORIGIN
C:\xampp\php\php.exe artisan edupath:backup --verify
C:\xampp\php\php.exe artisan edupath:notifications-dispatch --limit=100
```

The last command performs real due notification processing; use an appropriate configured environment. It was tested with fake FCM responses, not run to send to real applicants.

The access probe creates a random disposable public-storage canary and removes it afterward, without opening actual applicant files. The localhost Apache URL was unavailable in this environment, so deployed raw-document denial remains unverified. Run the probe against the actual deployed URL.

Backup creates SQL plus checksummed private/public storage archives under `backend/storage/app/edupath-backups/`. `--verify` creates a new generated `edupath_restore_check_*` database, restores into it, compares table counts, checks native row locking using two connections, verifies archived storage hashes, then removes only that generated database. Source records are read only. A compatible MySQL client and temporary-database privileges are required; use `--mysql-bin=...` if necessary. The command prefers the installed MySQL 8 client on this computer because XAMPP's older client cannot authenticate to the current server. These private backups are Git-ignored. Move a verified copy to institution-controlled off-machine storage; no automatic deletion/retention policy was imposed.

A verified backup was created here at:
`backend/storage/app/edupath-backups/20261018-121126-o9W9RaHt/`

The backup directory name uses the backend's configured timezone. It contains real data and is not a public download artifact.

## Major changed files

Backend:
- `app/Http/Controllers/Api/Auth/AuthController.php`, `app/Models/PasswordResetOtp.php`, `app/Providers/AppServiceProvider.php`, `bootstrap/app.php`, `routes/api.php` — secure recovery, throttles, and safe API failure responses.
- `app/Services/WorkflowDecisionService.php`, `app/Models/WorkflowEvent.php` — transactional decisions/history.
- Admin/Staff admission and document controllers; Admin/Staff scholarship controllers; Admin staff, scheduled-exam and online-exam controllers — connection to the above services and result/activity records.
- `app/Http/Controllers/Api/Admin/ScholarshipAwardController.php`, `app/Models/ScholarshipApplication.php` — separate manual awards/history.
- `app/Http/Controllers/Api/NotificationPreferenceController.php`, `app/Services/ApplicantNotificationService.php`, `app/Services/NotificationDispatchService.php`, `app/Services/AnnouncementNotificationService.php`, `routes/console.php`, Applicant notification controller — preferences, durable dispatch, scheduled delivery, token persistence.
- `app/Http/Controllers/Api/Admin/ReportController.php` — protected reports, CSV, activity, delivery retry.
- `app/Console/Commands/BackupCheck.php`, `app/Console/Commands/OperationalCheck.php` — backup/restore and operational diagnostics.
- Three migrations above; new security/workflow test suites and fixture support; existing Admission/Entrance/Online test schemas extended for the new tables.

Web:
- Existing auth VerifyResetOtp/ResetPassword pages.
- `hooks/useNotificationPreferences.js` and existing Admin/Staff/Applicant Settings pages.
- `components/ScholarshipDecisionPanel.jsx`, Admin/Staff/Applicant ScholarshipApplications pages and `content/userGuides.js`.
- `pages/admin/Reports.jsx`, `pages/admin/reports.css`, Sidebar and AppRoutes.

Flutter:
- `lib/core/auth/auth_provider.dart`.
- `lib/features/settings/screens/settings_screen.dart`, new `notification_preference_card.dart`.
- Scholarship application model/list and progress stepper.
- New `test/recovery_and_preferences_test.dart`.

## Verification and limits

See the final entry in `AUDIT.md` for final executed test counts. Checks include isolated security/workflow APIs, real MySQL backup/restore and native lock probe, web light/dark desktop/phone-sized fixture interactions, Flutter recovery/preferences/model tests and existing suite, analysis, web lint/build, and Android build. No live passwords, admissions, scholarship awards, or applicant uploads were changed for acceptance testing.

Limitations: real SMTP delivery, Firebase device delivery, physical-phone interactions, deployed Apache/Nginx document denial and simultaneous real HTTP examination/decision races still need environment-specific acceptance. A native row-lock probe is not a complete concurrent examination load test. Existing admission/scholarship category policies still need institutional sign-off. Renewal, disbursement/payment processing, record-retention automation and new institutional eligibility policies were not invented; those require approved requirements. The new report lists paginate; legacy list API contracts were preserved. Historical audit entries cannot be reconstructed. PDF output is the browser print view, not a separately generated full-dataset PDF.

The browser fixture checks confirmed the CSV export request and no export error; the backend suite verified the CSV body and formula escaping. This headless Edge opened its Downloads hub instead of completing the final CSV filesystem save, and its print-to-PDF command returned “Printing is not available.” Print styles were checked, but final interactive CSV saving and actual PDF output remain unverified in this environment.

Pint could not run because the installed Pint executable requires PHP 8.3 while the local CLI is PHP 8.2.12. No formatter requirement or runtime version was changed to bypass that check.
