# Scholarship application flow — October 24, 2026

## Completed requirements

| Requested improvement | Implementation |
| --- | --- |
| Show scholarship context first | Both forms show the name, deadline, current admission check, configured eligibility/requirements, and applicable examination steps above the answers. |
| Deliberate year/income selection | Year, grading scale, and income begin unselected on web and mobile. |
| Correct household size | Numeric total people in the household, including the applicant; no dependent-count dropdown. |
| Review before submitting | Both forms provide Review application, Back to edit, and explicit Submit application. |
| Preserve answers and report upload failures | Failed submissions retain answers and the selected file; users can retry or edit. Cancellation asks before discarding a draft. Web warns before unloading an unsent draft. |
| Match web/mobile | Both send the same academic, financial, motivation and notes fields, with the same options and optional private PDF/JPG/PNG attachment up to 5 MB. |
| Separate applicant answers from review | JSON application_details is separate from remarks and staff recommendation fields. Admin, Staff, and Applicant details display the saved answers. |
| Fix year-level overflow | Mobile fields use a single-column layout, expanded dropdowns and ellipsized option text. Footer actions wrap and remain outside the scroll area. |

## Initial causes

The web submitted an empty payload after a browser confirmation. The mobile form preselected financial/year answers, labelled dependent ranges as household size, and put applicant answers into reviewer remarks. Its optional attachment was uploaded separately against an admission application. The year dropdown shared a narrow Row with the academic-average input.

## Storage and API

- Migration `backend/database/migrations/2026_10_24_000001_add_scholarship_applicant_details.php` adds three nullable columns: application_details, supporting_document_path, supporting_document_name. Its SQL was inspected with --pretend and the single migration was applied successfully to the local database. Existing rows, statuses and remarks were preserved.
- Existing POST /api/applicant/scholarships/{scholarship}/apply accepts nested application_details in JSON or multipart and an optional supporting_document. Both clients receive canonical numeric household size/average values.
- Legacy callers may still submit without application_details; existing remarks are not parsed or rewritten. New forms never put applicant answers into reviewer remarks.
- The upload and application metadata form one operation. Storage failure creates no application; a failed transaction removes only the newly uploaded file. Applicant locking prevents duplicate application creation through this endpoint. Eligibility and application dates are checked again inside the transaction.
- GET /api/scholarship-applications/{application}/attachment requires authentication plus applicant ownership, Admin role, or active Staff scholarship permission and matching program assignment. Files are private, downloaded with no-store/nosniff headers, and storage paths are hidden from serialized applications.
- No application, examination or scholarship award is automatically approved. Existing examination and retake rules remain unchanged.

## Main files changed

- Backend Applicant/ScholarshipController.php, ScholarshipApplication.php, new ScholarshipAttachmentController.php, routes/api.php, additive migration, and ScholarshipApplicationFormTest.php.
- Web ScholarshipApplyDialog.jsx, ScholarshipApplicantDetails.jsx, services/scholarshipApplication.js, applicant Scholarships.jsx and ScholarshipApplication.jsx, and Admin/Staff ScholarshipApplications.jsx.
- Flutter `C:/Users/oseas/StudioProjects/edupath_mobile/lib/features/scholarships/`: scholarship/application models, scholarships_provider.dart, scholarship_apply_modal.dart, scholarship_answers_card.dart, scholarship_applications_screen.dart.
- Flutter tests: scholarship_form_test.dart and scholarship_submission_test.dart.
- The unused frontend/src/src source copy was preserved.

## Executed checks

- Broad Laravel regression run: 94 tests passed, 899 assertions (scholarship submission, Staff access, workflow accountability, online-exam integrity). This run included the initial seven new form tests.
- Final focused ScholarshipApplicationFormTest run: 10 passed, 72 assertions, including migration preservation, multipart/JSON consistency, admission revoked during upload, private attachment authorization, invalid/oversized files, failure cleanup, legacy compatibility, duplicate submission, and reviewer-answer separation.
- Web npm test: 70 passed.
- Final web npm run build and affected-file ESLint: passed.
- Flutter new form and submission tests: 11 passed. Tested the long year choice at widths 320, 360 and 390, keyboard layout, deliberate selections, Review/Edit, success feedback, draft cancellation, failed upload preservation, JSON/multipart fields and model parsing.
- Existing Flutter model, result-release, notification-navigation and document-action regression tests: 21 passed.
- Final Flutter analyze of the scholarship source and new tests: no issues found.
- Scholarship route list: 18 routes present, including the protected attachment route.

The backend tests use isolated SQLite databases and fake storage; mobile transport tests use a fake API adapter. No live applicant records or uploads were created as tests. Initial test fixture/assertion and lint issues were corrected before the passing runs above. No browser was connected for interactive web QA, and no physical-device upload test was performed.

## Practical limits

One optional supporting file is accepted per application. Existing legacy files stay in admission Documents; this change does not move or reinterpret them. Draft retention lasts while the form remains open, with discard protection; sensitive unsent financial details are not saved to browser/device draft storage. Other deployments must run the additive migration before serving the new forms.
