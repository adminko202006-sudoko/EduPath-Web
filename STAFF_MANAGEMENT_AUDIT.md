# Staff management and access repair — 2026-10-18

## Findings and fixes

1. **Primary access failure:** Admin saves `manage_admissions`, `verify_documents`, `manage_exams`, `manage_scholarships`, `manage_announcements`, `send_notifications`, and `view_reports`. The active Sidebar checked unrelated keys such as `admission_applications` and `documents`. It therefore hid legitimately granted features. Navigation now uses a shared list of the seven real Staff routes and their exact stored permissions. Notifications and Reports are reachable. Removed only nonexistent Staff menu destinations; their corresponding pages/endpoints do not exist. About now points to the existing `/about` route.
2. **Permissions stayed stale after login:** AuthContext previously restored identity only at sign-in/startup. Staff access now refreshes when the visible tab regains focus, on the existing refresh bus, and every 30 seconds while visible. Requests are coalesced. Results from an obsolete session/token are discarded. Outages retain the credential and show a warning; a confirmed 401 clears the session. This does not turn on the global session loader during background refresh.
3. **Cached restricted screens:** StaffLayout checks the current route before rendering it. Access/program changes invalidate its KeepAlive cache, removing previously opened restricted screens and their portal dialogs. Ordinary name/profile updates do not invalidate that cache. API permission checks still enforce access independently on every request.
4. **Missing scope assignments:** Read-only local diagnostics found 3 active staff accounts, all with permission records; 2 have no academic program assignments. Enabled features correctly return empty applicant queues for these accounts. Added an explicit explanation on affected Staff screens and clarified Admin assignment instructions. No actual assignments or grants were changed.
5. **Role mismatch:** Admin's dropdown offered `Clinic Staff`, rejected by the actual controller, and omitted supported `Exam Staff`. The dropdown now matches the backend's five accepted roles. No role is inferred from a permission and no new role/policy was created.
6. **Inactive profile access:** The feature middleware checked active status, but common Staff routes did not consistently do so. Staff role middleware now rejects missing/inactive staff profiles for all `/api/staff/*` routes, including profile writes. `/auth/user` can still report account state so the client can explain it and recover if Admin reactivates the account.
7. **Dashboard bypass and nested program leakage:** Dashboard stats/recent applicants now follow feature permissions or existing report authority. Dashboard and scholarship responses scope nested admissions to assigned programs, as the scheduled-exam controller already did. Future announcements are excluded from the published dashboard total. Existing response keys remain.
8. **Profile transport and wording:** Added explicit POST support alongside PUT for Staff profile updates; existing multipart `_method=PUT` compatibility remains. This is additional transport support, not a claim that method-overridden uploads were previously broken. Clarified the Admin exam permission description to match actual schedule/cancellation authority and Staff Reports to distinguish scholarship review approval from a final award.

## Feature connection checklist

All entries below were traced in active `frontend/src/` through handlers, API routes, middleware and models. Inactive `frontend/src/src/` was not changed. Existing source modifications were preserved.

| Feature / active page | API | Authorization / records | Verification |
| --- | --- | --- | --- |
| Admin StaffManagement, StaffProfileDialog | Admin staff list/show/create/update/delete | Admin role; users, staff, staff_permissions, staff_programs, workflow_events | Isolated lifecycle, default grants preserved, explicit grants/revocation, duplicate/invalid input, role escalation rejection, deletion audit; browser edit payload |
| Staff Dashboard | GET `/staff/dashboard` | Active Staff; permitted stats and assigned programs | Permission suppression, scoped recent records, future announcement exclusion; browser loading/navigation |
| Staff AdmissionApplications | GET list/show; PUT approve/reject | `manage_admissions`; admission_applications and program assignments | Seven-permission matrix, out-of-program reads/writes denied; existing decision/history/notification regression suite; browser route |
| Staff Documents | GET list/show/file; PUT status | `verify_documents`; application_documents through assigned admission | Scoped list/detail/file/status denials; existing document/decision regression tests; browser route |
| Staff EntranceExams | GET list/show; PUT schedule; DELETE cancellation | `manage_exams`; entrance_exams and assigned exam applicants | Existing schedule/time validation, nested scope and unreleased-result privacy tests passed; browser route |
| Staff ScholarshipApplications | GET list/show; PUT recommendation | `manage_scholarships`; scholarship_applications and assigned applicant admissions | Scoped nested admissions; existing recommendation/finalization restriction tests; browser route |
| Staff Announcements | GET list/show; POST/PUT/DELETE | `manage_announcements`; announcements and existing publication notification service | Grant/revoke/read/write-denial coverage; existing publication idempotency/scheduling tests; browser route |
| Staff Notifications | GET/POST/DELETE | `send_notifications`; notifications and applicant program assignments | Grant/revoke/read/write-denial coverage; existing recipient-scope tests; browser route and revocation while send dialog is open |
| Staff Reports | GET `/staff/reports` | `view_reports`; program-scoped admission/scholarship/exam summaries | Permission matrix and actual scoped counts; browser route; scholarship review wording clarified |
| Staff Profile | GET/PUT/POST `/staff/profile` | Active Staff, own profile; Admin-controlled fields excluded | POST transport, no role/status/permission/assignment escalation; existing photo/edit/failure regression tests |
| Staff Settings | Existing password and notification-preference endpoints | Authenticated account, existing validation/revision protections | Handler/endpoint inspection; existing recovery/preferences regression tests; no new settings behavior |
| Staff guide, theme, navigation | Existing routes and contexts | Existing guide permission filters, shared themes | Existing guide tests; actual menu pointer navigation at desktop/phone widths in light/dark |

## Changed files

- `frontend/src/services/staffAccess.js` — shared exact permission/route mapping, fail-closed checks and stable cache identity.
- `frontend/src/components/Sidebar.jsx` — real authorized Staff links, Notifications/Reports and About repair.
- `frontend/src/context/AuthContext.jsx` — bounded background Staff identity refresh, error handling and stale-session protection.
- `frontend/src/layouts/StaffLayout.jsx` — route guard, access-aware cache and missing-assignment guidance.
- `frontend/src/pages/admin/StaffManagement.jsx` — supported Exam Staff role and accurate access descriptions.
- `frontend/src/pages/staff/Dashboard.jsx` — authorized overview cards, empty-access guidance and removal of account-data console logging.
- `frontend/src/pages/staff/Reports.jsx` — explicit review/award distinction.
- `backend/app/Http/Middleware/RoleMiddleware.php` — consistent active Staff checks.
- `backend/app/Http/Controllers/Api/Staff/DashboardController.php` — permission-aware, program-scoped data.
- `backend/app/Http/Controllers/Api/Staff/ScholarshipController.php` — program-scoped nested admissions in list/detail/save responses.
- `backend/routes/api.php` — additive Staff profile POST route.
- `backend/tests/Feature/StaffAccessTest.php` and `frontend/tests/staffAccess.test.mjs` — regression coverage.
- `AUDIT.md` and this document — findings, verification and limitations. Private/local QA scripts, snapshots and screenshots are in `storage/staff-access/`.

## Checks actually executed

- Laravel full suite: **134 passed, 1,018 assertions**. Includes online and scheduled examination integrity, document privacy, decisions/history/notifications, profile uploads, recovery, preferences and reports.
- After adding further lifecycle/write-denial/POST cases: final focused StaffAccessTest **9 passed, 197 assertions**. Its earlier six cases were included in the full suite; the three added cases passed in the final focused run.
- Frontend tests: **34 passed**, including three new Staff access tests.
- Frontend ESLint and production build passed. The first sandboxed Node test/build attempt could not spawn workers; rerunning with the permitted process-spawn environment passed without dependency changes.
- `php artisan route:list --except-vendor` completed; inventory recorded in `storage/staff-access/routes.txt`.
- Isolated browser with real components/AuthProvider and fixture API: all seven Staff destinations navigated by pointer at **1280px and 390px, light and dark**; no root horizontal overflow or runtime exceptions. Admin permission checkbox save payload, active-session grant/revoke, denied direct route, missing assignments, inactive account, failed-refresh credential retention/recovery, and portal/scroll cleanup on revocation passed. Desktop light and phone dark screenshots visually inspected.
- Scope review compared touched files with available pre-task snapshots and reviewed the new files. No inactive nested source, exam logic, backend schema, dependencies, real grants or program records were changed. No migration/setup command is required.

## Remaining scope and acceptance limits

- Live cross-account browser acceptance and physical-phone testing were not performed. Browser writes used fixtures; backend tests used isolated in-memory SQLite. No real staff/applicant records were edited for testing.
- Admin must choose the correct programs for the two currently unassigned staff accounts. This is an institutional scope choice and was not guessed. A job-role label does not replace explicit permissions.
- The existing Staff notification composer still accepts an applicant ID, and manual notifications use the existing in-app delivery path. A searchable recipient picker or extending manual sends to push delivery would be separate enhancements; no push-delivery guarantee is added here.
- Staff Entrance Exams manages existing assigned schedules and cancellation. Assignment management, official result release, online question management and retakes retain their current Admin authority. No new Staff online-examination workflow was invented.
- An existing exam schedule can contain applicants from multiple programs. Editing/cancelling a shared schedule can affect those programs under the current API authority; changing that policy needs an explicit institutional decision.
- Legacy browser alert/prompt feedback in some Staff actions remains. This repair does not replace all existing dialogs or redesign every Staff page.

## How to test with your accounts

1. Refresh the web app once to load the updated client.
2. As Admin, open Staff Management → Edit. Select the intended permissions **and** academic programs, then save. Existing creation defaults remain unchanged; configure permissions after creating a staff account.
3. Switch back to the Staff tab. Focus/visibility refresh normally updates access immediately; otherwise allow up to 30 seconds while visible. Check all granted sidebar links, including Notifications and Reports.
4. If a feature opens but has no records, inspect the assignment notice and verify that applicants actually have admissions under the selected programs.
5. Disable one permission as Admin, then refocus Staff. Its link disappears and a direct/cached visit explains the restriction. Unrelated permissions remain usable. Backend access is checked on every request independently of the client refresh interval.
