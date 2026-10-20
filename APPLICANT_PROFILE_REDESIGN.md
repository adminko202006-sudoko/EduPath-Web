# Applicant Profile redesign — web and mobile

Implemented the supplied mockup's profile structure using actual authenticated account data and the existing TMC campus image. No database, authentication, backend validation, permission, or API contract was changed.

## What changed

- Compact campus cover with overlapping circular profile photo or real account initials, applicant name, role badge, email, and Edit Profile button.
- Personal Information, Contact & Address, and Educational Background cards. Desktop web uses a completion sidebar beside the cards; phone browsers and Flutter use stacked cards.
- Completion counts saved first name, last name, birth date, gender, phone, address, and email: the seven non-secret details required by the current registration API. Optional education and photo do not lower completion. This does not introduce eligibility gates, scholarship promises, or new required fields in the profile update API.
- Read-only web summary opens the existing profile update flow inline. Cancel restores saved values. Failed saves retain edits; only confirmed server responses change completion. Existing photo type/2 MB checks, separate upload/preview/cancel controls, and read-only email/account role are preserved.
- Web now exposes all seven education fields already implemented by Laravel and Flutter. Optional fields explicitly cleared by the user remain cleared after the server response; leading zeros in LRN are preserved.
- Flutter keeps the existing profile/photo edit screen, education editor, drawer/bottom navigation, account actions, application counts, refresh, and logout. Education details are now fully visible in their own card. Initials fallback now has readable dark-mode contrast in the shared avatar widget.
- Skeleton loading follows Requirements.jsx on web. Both clients retain tutorial targets, responsive spacing, light/dark themes, and reduced-motion handling.

## Files

Web:

- `frontend/src/pages/applicant/Profile.jsx`
- `frontend/src/pages/applicant/profile.css`
- `frontend/src/services/applicantProfile.js`
- `frontend/tests/applicantProfile.test.mjs`

Native Flutter project `C:\Users\oseas\StudioProjects\edupath_mobile`:

- `lib/features/profile/screens/profile_screen.dart`
- `lib/features/profile/profile_photo_avatar.dart`
- `lib/features/profile/profile_completion.dart`
- `test/profile_redesign_test.dart`

The inactive nested frontend source was untouched. Original web/native profile files and the shared avatar are backed up under `storage/profile-redesign/`. QA harnesses, logs, and captured previews are there too; preview data is isolated from the real database and is not part of the product.

## Verification

- Web ESLint, all 28 Node tests, and production build passed.
- Isolated headless browser used the actual React component with a test-only Axios adapter. Verified desktop (1280 px), phone (390 px), light/dark layouts, TMC background loading, no horizontal overflow, Cancel without a write, validation failure retaining edits, successful retry, completion updating after save, and education preservation. No browser runtime exceptions occurred in the successful check. Desktop/light and phone/light/dark screenshots inspected.
- Relevant Laravel profile/education/photo suites: 13 passed, 150 assertions. Covered saved/cleared education, upload validation/storage failures, ownership/roles, and transactional preservation.
- Native completion/layout/navigation and existing education-save tests: 10 passed. New layout checks cover a 360 px phone with enlarged text in both themes. Additional native visual capture run: 3 passed, with campus image decoded and a local font substituted for visual QA where available.
- Full native suite: 79 passed, 1 optional live API probe skipped.
- Flutter analysis passed with no issues after correcting the analyzer's null-aware-element style warning.
- Android debug APK built at `C:\Users\oseas\StudioProjects\edupath_mobile\build\app\outputs\flutter-apk\app-debug.apk`.

No migration/setup command is required. Physical-phone acceptance and live-server browser saves with a real applicant account remain to be performed. Browser save checks used isolated test data; Laravel tests used isolated SQLite, not existing production records.

## Try it

Web: refresh My Profile, select Edit Profile, change details, and save or cancel. Select and upload a profile photo separately using the labeled controls. Mobile: install the rebuilt APK, open Profile, use Edit Profile for personal details/photo, and the education card's edit icon for education. Completion may already be 100% for existing applicants who supplied every required registration detail.
