# Application navigation badges

Implemented for the Admin and authorized Staff sidebars, for Admission Applications and Scholarship Applications.

- No pending applications: no badge.
- One pending application: a small red dot.
- Two or more: a red circular count (99+ above 99).
- Counts represent pending submissions, not unread notifications. Viewing a page does not clear them; moving an application out of pending reduces the count.
- Refresh on mount, successful API mutations, tab return, and every 30 seconds while visible. Requests are cancelled on cleanup and superseded refreshes. Account/permission/program changes invalidate cached counts.

## Findings and connection checklist

| Menu | Existing API | Source | Finding and repair |
| --- | --- | --- | --- |
| Admission Applications | GET /api/admin/dashboard or /api/staff/dashboard | AdmissionApplication / admission_applications | Existing pending_applications count was not connected to navigation. Sidebar now uses it. |
| Scholarship Applications | Same dashboard routes | ScholarshipApplication / scholarship_applications | Existing scholarship_applicants includes every status. Added pending_scholarship_applications without changing existing fields. |

Staff counts preserve the dashboard's permission and assigned-program scoping. Sidebar badges appear only beside permitted application menus. No migrations or changes to stored records, application statuses, decisions, or notification read state.

The Vite entry is frontend/index.html -> src/main.jsx -> App.jsx. Active layouts import ../components/Sidebar. The nested frontend/src/src/components/Sidebar.jsx differs from the active copy; it was left untouched, along with the rest of the inactive duplicate tree.

## Files

- frontend/src/components/Sidebar.jsx: display both application badges with accessible count labels.
- frontend/src/hooks/useApplicationCounts.js: load existing dashboard data and maintain refreshed counts.
- backend/app/Http/Controllers/Api/Admin/DashboardController.php: additive pending scholarship count.
- backend/app/Http/Controllers/Api/Staff/DashboardController.php: additive permission/program-scoped pending scholarship count.
- backend/tests/Feature/StaffAccessTest.php: verify counts of zero, one, and two, exclusion of reviewed applications, feature permission enforcement, and program scoping using an isolated in-memory SQLite database.

## Verification

- php artisan route:list --path=dashboard: passed; both existing routes confirmed.
- php artisan test --filter=StaffAccessTest: 10 passed, 207 assertions.
- npm run build: passed outside the sandbox after the sandbox blocked Vite helper processes.
- npm run lint: completed without reported lint errors.
- npm test: 40 passed outside the sandbox after the sandbox blocked Node test workers.
- No authenticated browser visual verification or real applicant submission was performed. Refresh from another session is polling-based, with up to 30 seconds delay while the tab is visible.

Scope: the requested application badges; this change does not claim a new full-system audit.
