# Admission requirements research and Documents page update

Reviewed: 24 October 2026 (Asia/Manila).

## Official TMC reference

The municipality publishes the [Office of the School Registrar service charter](https://trinidad-bohol.gov.ph/wp-content/uploads/2026/04/EXTERNAL-TRINIDAD-MUNICIPAL-COLLEGE-OFFICE-OF-THE-SCHOOL-REGISTRAR.pdf), uploaded April 2026. See PDF pages 35–37 (zero-based indices 34–36), “Enrolment for Incoming Students.” This is an enrollment checklist; it does not establish that every item must be uploaded before the entrance examination.

| Applicant group | Documents identified in the charter |
| --- | --- |
| Freshmen | Form 138-A/report card; good moral certificate; PSA birth certificate; medical certificate; 1×1 identification photograph. |
| Transferees | Transfer credentials/TOR for evaluation with NSTP serial number; PSA birth certificate; medical certificate; 1×1 photograph. |
| Conditional | PSA marriage certificate where applicable; chest X-ray and HBsAg results for Criminology; Non-FHE waiver where applicable. |
| Returnees | Medical certificate, enrollment form, examination booklet, and applicable Non-FHE waiver. |

The charter also lists physical envelopes/folders, printed photos, an enrollment form and examination booklet. Digital copies do not replace required originals or physical supplies. Medical certificates have specified seal/receipt and paper-format conditions. The process routes medical certificates to the school nurse.

## Recommended EduPath configuration (proposal, not a policy change)

- Offer clearly named upload slots for the documentary items above, subject to the Registrar confirming the online stage and applicant category.
- Keep physical supplies as checklist instructions, not mandatory file uploads.
- Keep scholarship-specific supporting evidence in the scholarship workflow.
- Obtain the current approved form before making any waiver downloadable; do not invent its text or request automatic acceptance.
- Confirm clinic access and retention arrangements before collecting medical results through a general admissions review screen.
- Existing upload API accepts PDF/JPG/JPEG/PNG up to 5 MB; preserve private, authorized file access.

The existing `AdmissionRequirement` model supports active/required flags and program assignment, but not freshman/transferee/returnee or marital applicability. Making conditional items globally mandatory would block unrelated applicants. No requirement records, required flags, application statuses, or institutional rules were changed for this request.

## Admin Documents implementation

The active entry chain is `frontend/index.html` → `src/main.jsx` → `src/App.jsx` → `src/routes/AppRoutes.jsx` → `src/pages/admin/Documents.jsx`. `src/src/pages/admin/Documents.jsx` differs from the active file, and its inactive tree is already excluded from lint. It was not merged or deleted.

Previously every document occupied a separate applicant card. The admin screen now uses collapsed applicant dropdowns with matching-document, verified-document, and application counts. Each document retains its View, Review, Delete, remarks, status, submission date, and program information, plus an application ID. Search and status filters run before grouping. Applicant IDs prevent same-name applicants from being combined; missing relations fall back to application/document IDs. Existing API contracts and authorization remain in place.

## Verification

- Targeted grouping tests: 2 passed (multiple applications, same-name separation, missing relationships, empty input).
- Broader frontend tests excluding the About page: 76 passed with `node --test --experimental-test-isolation=none`.
- Targeted ESLint for both changed JS/JSX source files: passed.
- Laravel admin document route inventory: all five existing routes present.
- `php artisan test --filter=ApplicantDocumentAccessTest`: 18 tests passed, 79 assertions (authentication, ownership, private downloads, upload/replacement/deletion validation, history, rollback and storage failures).
- Production build: passed with `npm run build -- --configLoader native`.
- Standard `npm test`: blocked by environment `spawn EPERM`. A whole-suite run without process isolation failed in the existing About-page Vite setup, before its shared hook could complete.
- Standard build config bundling could not load native Tailwind/Lightning CSS dependencies; the native config loader completed successfully without changing dependency versions or config.
- Browser inventory returned no available apps or browsers; live visual and click-through verification remains outstanding.

The earlier proposed admission-record cleanup remains pending its eligibility clarification. No admission applications or uploaded files were deleted.
