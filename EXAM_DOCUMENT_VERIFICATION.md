# Document verification before examinations

The applicant must satisfy every active, required admission document configured for their program before examination participation. Missing uploads and uploads that are pending, under review, or rejected do not satisfy a requirement. Optional and inactive requirements do not block eligibility.

The shared `ExamDocumentEligibility` service matches requirement names to verified uploads, ignoring case and surrounding spaces, following the existing Documents screen. All requirements must be satisfied on the same admission application; files cannot be borrowed from another applicant or combined across admissions. A current admission is needed to identify the program. A program with no active required documents imposes no additional document requirement. Existing approved-admission and approved-scholarship prerequisites for online exams remain in force; scheduled entrance exams do not gain an admission-approval prerequisite.

| Workflow | Enforcement and feedback |
| --- | --- |
| Online overview (`GET /api/applicant/online-exam`) | Returns `eligible: false` with a document-verification explanation when blocked. |
| Online start and active attempt access | Backend checks documents before new or resumed attempts, questions, answers, navigation, and submission. Uses HTTP 403 and `EXAM_DOCUMENT_VERIFICATION_REQUIRED`. |
| Online availability notification | Does not announce availability until documents satisfy eligibility. The existing dispatch scheduler discovers newly verified applicants and retains per-attempt deduplication. |
| Entrance candidate picker | Excludes applicants without document clearance before pagination and explains the rule in the dialog. |
| Entrance assignment | Rechecks all selected applicants inside the existing assignment transaction. An invalid selection saves no assignments. |
| Existing entrance assignments | Applicant list/detail responses expose document clearance for scheduled assignments. The web screen explains incomplete clearance and withholds roster controls. Scheduled applicants cannot download the roster through the API without clearance. |
| Entrance completion and scoring | An applicant without clearance cannot transition from an unfinished assignment to completed or receive a new score. Changing scheduled to absent first does not bypass the check. |
| Historical records | Existing schedules, attempts, answers, scores, and result-release restrictions are retained. Previously completed/released results remain accessible under existing ownership rules. |

Admission approval alone does not override the document rule. This change does not add staff permissions or change scholarship-award authority. Scholarship form attachments retain their existing workflow; they do not have a separate per-file verification state in this implementation.

Existing online timers are not paused or reset if a requirement or document status changes. Active access is denied until eligibility is restored, and elapsed time still counts. This change does not cancel historical schedules. Physical entrance-exam attendance remains the responsibility of examination personnel; the software enforces clearance at assignment, applicant roster access, and completion/scoring operations.

No migration, database reset, or update to real applicant records was performed. New response fields are computed from existing data. The inactive nested frontend source tree was preserved.

## Verification

- `php artisan test --no-ansi`: 269 passed, 2,248 assertions.
- `npm.cmd test`: 93 passed, zero failures/skips.
- `npm.cmd run lint`: passed, exit code 0.
- `npm.cmd run build`: passed.
- `php tests/native/defense-rehearsal.php`: passed against a disposable MySQL schema with fictional users/files. Includes required-document configuration through the Admin API, missing-document candidate exclusion, rejected assignment, Staff verification, successful assignment, document re-review, blocked online start despite approved applications, existing-schedule warning, re-verification, and successful online attempt through result release and retake. No messages were sent to external recipients.

New regression tests cover missing/pending/rejected requirements, case/space matching, optional/inactive/other-program exclusions, same-application ownership, atomic bulk assignment, repeated eligibility checks across active online endpoints, timer preservation, eligibility notification deduplication, and access to historical results. Test fixtures were updated to include the existing document schema and current admissions where participation is expected.

Signed-in browser and physical-device interaction were not executed in this change; build, API, and automated test results do not claim visual end-to-end verification.
