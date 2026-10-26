# Applicant onboarding tutorial

The native Flutter implementation is now documented separately in `MOBILE_ONBOARDING.md`. It uses this same account progress API and tutorial version.

Implemented 2026-10-18. Only the active `frontend/src/` tree was changed. The inactive `frontend/src/src/` copy remains untouched.

## Behavior and rollout

- Eight steps: Welcome, Profile, Programs, Admission Application, Documents, Scholarships, Notifications, Finish.
- Existing accounts have no automatic enrollment or invitation. Settings provides **Start Tutorial**. Once manually enrolled, Settings provides **Restart Tutorial** and, for interrupted progress, **Resume Tutorial**.
- New applicant registrations receive `not_started` progress. Once authentication is verified, a nonmodal invitation offers Start Tour, Skip, and Later. An interrupted session offers Resume; it never opens the spotlight automatically.
- The Profile step supports clicking the highlighted My Profile link. Next provides an equivalent navigation action. The destination explanation remains Step 2; Next then continues to Programs.
- Progress is stored in Laravel, with one row per user/tutorial/version, validated step IDs, completion/skipped timestamps, and an optimistic revision. No localStorage tutorial flag is used.
- `backend/config/onboarding.php` enables new registrations and defines the current version. Changing versions does not enroll existing accounts. There is no historical-account backfill.
- Restart explicitly resets only tutorial state. Applications, documents, scholarship decisions, exams, and notifications are not changed by tour actions.
- Scholarship copy reflects the current approved-admission and approved qualifying `other` scholarship application checks. It does not promise awards. Broader scholarship/award-state policy questions recorded in the inspection remain outside this change.

## Files added

- `backend/config/onboarding.php`
- `backend/database/migrations/2026_10_18_000002_create_user_onboarding_states_table.php`
- `backend/app/Models/UserOnboardingState.php`
- `backend/app/Http/Requests/UpdateApplicantOnboardingRequest.php`
- `backend/app/Http/Controllers/Api/Applicant/OnboardingController.php`
- `backend/tests/Feature/ApplicantOnboardingTest.php`
- `frontend/src/onboarding/ApplicantOnboardingProvider.jsx`
- `frontend/src/onboarding/ApplicantTourOverlay.jsx`
- `frontend/src/onboarding/applicantTour.js`
- `frontend/src/onboarding/onboardingContext.js`
- `frontend/src/onboarding/useApplicantOnboarding.js`
- `frontend/src/onboarding/tourGeometry.js`
- `frontend/src/onboarding/onboarding.css`
- `frontend/src/services/onboardingService.js`
- `frontend/tests/onboarding.test.mjs`
- Current cropped PNGs are maintained directly in `frontend/public/images/onboarding/`. Browser URLs use `/images/onboarding/<filename>.png`; the removed web `tmc-guide/` subfolder is no longer referenced. Flutter has bundled copies under its own `assets/images/onboarding/tmc-guide/` folder.

## Files modified

- `backend/app/Models/User.php`: account relationship.
- `backend/app/Http/Controllers/Api/Auth/AuthController.php`: new-registration enrollment; user, applicant, tutorial state, and token creation now share a transaction so failed enrollment cannot leave a partial account. Authentication response fields remain unchanged.
- `backend/routes/api.php`: three applicant-only Sanctum endpoints.
- `frontend/src/services/api.js`: explicit `skipGlobalRefresh` option used only for onboarding requests, preventing progress saves from refreshing every cached page.
- `frontend/src/layouts/ApplicantLayout.jsx`: account-keyed provider and mobile-menu coordination.
- `frontend/src/components/Sidebar.jsx` and `Navbar.jsx`: stable applicant tutorial target attributes.
- `frontend/src/components/ui/ModalPortal.jsx`: dispatch a synchronous modal-opening event before recording inert states, allowing the tour to yield focus and restore its background state first.
- `frontend/src/pages/applicant/Dashboard.jsx`, `Profile.jsx`, `Programs.jsx`, `AdmissionApplication.jsx`, `Documents.jsx`, `Scholarships.jsx`, `Notifications.jsx`: stable post-loading heading targets, including alternative page branches.
- `frontend/src/pages/applicant/Settings.jsx`: start/restart/resume, error feedback, availability check, and final-step targets.
- `frontend/src/pages/applicant/OnlineScholarshipExam.jsx`: dispatch exam-starting event before its existing start request. No exam API or scoring change.
- `AUDIT.md`: checkpoint and actual verification results.

## API

All routes use existing `auth:sanctum` and `role:applicant` middleware and resolve the account from the authenticated user:

- `GET /api/applicant/onboarding`: `{ success, data: { tutorial_version, state, exam_active } }`. Does not enroll accounts or advance exam timing. Includes `Cache-Control: no-store`.
- `PATCH /api/applicant/onboarding`: `tutorial_version`, `revision`, `status` (`in_progress`, `skipped`, `completed`), `current_step_id`.
- `POST /api/applicant/onboarding/restart`: `tutorial_version`, `revision`; creates a manual enrollment if absent.

Revision 0 represents no existing record. Stale writes return 409. Invalid values return 422. Completion requires visiting the final step. Completed/skipped progress cannot be reopened by delayed PATCH requests; explicit restart is required.

## UI safeguards

- Portal renders directly into body, with stable attributes and visible-element lookup that excludes hidden KeepAlive pages.
- Destination headings exist after initial loaders. The tour waits for the expected route and visible heading before highlighting; a 10-second timeout shows usable Retry/Next/Skip controls.
- Sidebar scrolling, content scrolling, resizing, target resize, and mobile visual viewport changes trigger new measurements. When a small screen cannot fit both guide and target, the guide remains usable without an interactive spotlight.
- Backdrop blocks background pointer interactions. Temporary inert states and keyboard handling restrict interaction to controls and the allowed navigation target. The final Settings restart button is highlighted for explanation without allowing accidental restart through the spotlight.
- Focus enters the guide, updates between steps, and is restored on close. Listeners, observers, inert states, and scroll positions are cleaned up. Real modals close/pause the tour instead of competing for focus.
- Light/dark themes, reduced motion, 44px controls, progress announcements, Escape, and keyboard navigation are supported in code; real browser acceptance remains required.
- Any active online attempt suppresses onboarding, even on another applicant page. The online exam route is always excluded. Start/resume rechecks the server. Availability is checked every 15 seconds and on focus/visibility; BroadcastChannel immediately suppresses other tabs when this web client starts an exam. External clients/devices are detected at the next check; there is no server-push channel. A failed availability check closes the overlay.
- Failed saves show an error and retain the last acknowledged progress. Server errors are presented generically. Conflicts close the overlay, load the latest state, and require an explicit resume/restart. No automatic mutation retries.

## Database/setup

The additive migration was executed successfully against the configured local database, in batch 21. It only creates `user_onboarding_states` and its constraints. No existing accounts were enrolled, and no reset, seed, or application-data migration was run.

For another installation, run from `backend/` **before deploying the new registration code**:

```powershell
C:\xampp\php\php.exe artisan migrate --path=database/migrations/2026_10_18_000002_create_user_onboarding_states_table.php
```

If Laravel configuration is cached, rebuild it through your normal deployment procedure. No package installation is needed. Rebuild the frontend for production with `npm run build`; an existing Vite dev session should load source changes.

## Existing-account acceptance

1. Sign in as an existing applicant with no active online attempt. There should be no automatic tour invitation.
2. Open Settings and select Start Tutorial. Check all eight steps, including selecting the highlighted My Profile link.
3. Close the tour, reload, and verify that Resume is offered without reopening the spotlight. Resume should retain progress.
4. Finish, reload, then use Restart Tutorial. Also verify Skip remains skipped across sign-ins/devices.
5. Repeat on mobile Chrome, light/dark themes, 200% zoom, keyboard-only navigation, and reduced motion. Test scrolling and rotating during a step.
6. Use a second tab to change progress, then verify stale writes do not overwrite it. Simulate a failed save and retry; no false completion should appear.
7. On a test account with an active exam, verify Settings tutorial controls are unavailable. Do not start a real examination merely to test onboarding.
8. Check the supplied PNG edges against both themes. The latest five images are 1254 × 1254px and have transparent background samples. They are used unchanged with square display frames and contain fitting. Some red edge fringing remains in the supplied artwork; no image editing or background removal was performed by this update.

Automated verification and environment limitations are recorded in the latest `AUDIT.md` checkpoint.
