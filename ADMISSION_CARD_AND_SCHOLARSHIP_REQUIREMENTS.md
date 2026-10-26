# Mobile admission card and scholarship requirement uploads

Updated 26 October 2026.

## Findings

- Mobile Admission displayed all applications as small list cards, and Apply New remained clickable after submission.
- The backend already prevents concurrent active admissions within the same period. Rejected and withdrawn records do not block a new application.
- Scholarship requirements were descriptive text. The application supported one optional private attachment but could not enforce a selected checklist of uploaded documents.

## Admission behavior

The mobile page displays one large application card. Active records in the current admission period take priority, so a newer rejected historical duplicate cannot hide an approved or pending record. Older applications remain available in History. Apply New is disabled for active applications, while loading, when the latest application check failed, or when no admission period is open. Rejected or withdrawn applications permit a new submission during an open period. A previous-period application does not change the existing backend rule for a new period. Withdrawal refreshes the current application and retains the record and its documents.

The canonical backend duplicate and admission-period rules were preserved.

## Scholarship configuration and submission

- Admin Create and Edit Scholarship include a checklist of required uploads sourced only from active entries in the existing Requirement List. Add document names through Requirement List; the scholarship form has no custom-name field or suggested defaults. New selections are also validated against the active catalog by the backend. Previously saved selections remain intact, even if the catalog entry is later renamed, removed or deactivated, and can be explicitly removed during editing.
- Up to 10 required documents can be configured. Each file must be PDF, JPG, JPEG or PNG, no larger than 5 MB. All attachments combined are limited to 25 MB.
- Both web and mobile scholarship forms show one upload control per selected document. Applicants upload these inside the scholarship form. Admission My Documents remains separate.
- The server checks every required index, file type, size and the configured checklist. Client-provided labels do not determine which requirements were satisfied.
- Applications and private file metadata are saved together. A failed submission cleans up only its newly uploaded files. A changed checklist during submission causes a validation error and cleanup.
- Saved application metadata includes the requirement name and original filename at submission. Later configuration edits do not rewrite previous submissions.
- Admin, authorized assigned Staff and the owning Applicant can download the submitted files. Private storage paths are hidden from API JSON.
- Existing requirements text, applications and optional attachments remain supported. No scholarship decision or award policy changed.

## Main files

Backend: Scholarship and ScholarshipApplication models; Admin and Applicant ScholarshipController; ScholarshipAttachmentController; ScholarshipRequirementUploads; routes/api.php; ScholarshipApplicationFormTest.

Web: Admin Scholarships, ScholarshipApplyDialog, shared ScholarshipApplicantDetails and its rendering tests.

Mobile: AdmissionScreen; scholarship models/provider/application modal/answers card; admission status-card tests, scholarship submission/form tests and notification navigation fixture.

## Database

Applied `2026_10_26_000001_add_scholarship_required_documents.php` after inspecting its SQL with migrate --pretend. It adds nullable JSON columns `scholarships.required_documents` and `scholarship_applications.requirement_documents`. It does not delete, rewrite or backfill existing records.

Authenticated file endpoint: `GET /api/scholarship-applications/{application}/requirements/{index}`. Existing application and attachment endpoints remain in place.

## Verification

- Full Laravel suite: 257 passed, 2128 assertions in isolated test databases.
- Scholarship form API suite: 16 passed, 114 assertions, including Admin configuration, validation, snapshots, private files, ownership and cleanup.
- Existing full frontend regression suite passed; two new shared-review rendering tests also passed.
- Changed web source files passed ESLint; production build passed.
- Targeted mobile admission/scholarship checks passed, including small-screen layout, active status restrictions, form validation and indexed multipart uploads.
- Final full mobile suite: 192 passed, 1 skipped. The skipped test requires a configured live API URL.
- Changed Dart files passed analysis with no issues.

Notification navigation regression checks passed after adding the new admission-period lookup to their mock provider. No signed-in physical phone or browser walkthrough was performed. A live-API connection test requires an explicitly configured server URL.

## Requirement List selector follow-up

The scholarship form loads `/api/admin/requirements` when opened and refreshes it through the existing page refresh mechanism. Loading and error states prevent saving until the current list is available, with a Retry action for failed reads. Active duplicate names appear only once. No schema or mobile API changes were needed; web and mobile applicants continue to receive the selected required document names through the scholarship API.

Targeted scholarship API tests passed with 16 tests and 129 assertions, including rejected unknown/inactive names for create and update, preservation/removal of existing inactive selections, and retained submission snapshots.

Follow-up verification: full Laravel suite passed with 257 tests and 2143 assertions; frontend regression suite, selector rendering tests, changed-source ESLint and production build passed. Rendering-test servers now disable unused WebSocket listeners to avoid port collisions. No further migration or mobile client changes were required for this selector adjustment.
