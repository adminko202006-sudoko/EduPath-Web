# Mobile admission requirements connection

Updated 24 October 2026.

## Cause and repair

Laravel already serves admin-managed requirements at `GET /api/applicant/programs/{program}/requirements`. It returns active requirements assigned to that program, including name, description and required flag. Flutter's API config already declared the endpoint, but the admission form used four fixed checklist entries and the Documents upload dialog used fixed preset tags. Those lists never requested the admin configuration.

The mobile app now uses `AdmissionProvider.fetchProgramRequirements` and an `AdmissionRequirement` model. Both screens read the same existing endpoint through the authenticated API client.

## Mobile changes

Project: `C:/Users/oseas/StudioProjects/edupath_mobile`.

- `lib/features/admission/models/admission_requirement.dart`: parses IDs, names, descriptions and flags; malformed records produce errors.
- `lib/features/admission/admission_provider.dart`: loads program requirements; distinguishes empty configuration from HTTP or malformed-response failures.
- `lib/features/admission/screens/apply_admission_screen.dart`: replaces the hardcoded checklist; reloads before entering the Documents step; supports explicit refresh, loading and retry; preserves attachments by requirement ID for the same program; shows missing-required count. Switching programs clears unrelated attachments on the next load.
- `lib/features/documents/screens/documents_screen.dart`: replaces upload presets with admin requirements and their instructions/flags; reloads when switching applications; blocks upload while requirements are loading or failed; includes application IDs in selectors and prevents duplicate upload-dialog launches.
- Phone-width checks exposed existing overflows in the filter row, upload-dialog title and application selector. Filters now wrap, the title uses available width, and the selector expands within its constraints.
- `test/admission_requirements_test.dart`: API path, flags, descriptions, empty lists, invalid payloads and HTTP failures.
- `test/admission_simple_flow_test.dart`: renders admin-provided checklist content while preserving optional notes and the existing three-step workflow.
- `test/mobile_requirement_screens_test.dart`: Documents upload integration and switching programs, including a 390-pixel phone viewport.

Backend regression coverage added to `backend/tests/Feature/ProgramVisibilityTest.php`: admin create/update/deactivate → applicant requirements response, program isolation, required flags, unauthenticated access and applicant write denial.

## Behavior and data preservation

The current workflow submits the admission application first and uploads selected files afterward. This remains unchanged: a required label identifies an eventual document obligation, and missing attachments are shown; it does not establish a new rule that all uploads must finish before creating an application. File validation, private storage, review permissions and upload endpoints remain in place.

There are no migrations, production requirement changes, application deletions, or permission changes. A read-only inspection confirmed that the five requested requirements are saved and assigned to programs.

## Verification

- Flutter targeted suite: 12 tests passed across requirements API parsing, application flow, Documents screen and document-action regressions.
- Laravel `ProgramVisibilityTest`: 3 tests passed, 37 assertions.
- Laravel applicant program route inventory: 2 expected routes present.
- Dart analysis of changed source and tests: no issues after lint fixes.
- Device installation and a live Cloudflare-connected handset walkthrough were not performed.

## Use

Hot restart/relaunch the updated Flutter app (an existing installed APK needs a rebuild/reinstall). Confirm the mobile Server URL points to the same backend as the admin web app. In Admin → Admission Requirements, keep the requirement active and assign the appropriate programs. Select a program under Apply for Admission, then continue to Documents; use Refresh requirements to reload edits. My Documents → Upload Document also loads the selected application's current program requirements.

This fetches live configuration when entering or refreshing the screen; it is not a push subscription. Admin edits do not silently alter a checklist already being viewed.
