# FHE entrance-exam audit and Admin review integration

> Historical initial audit: this records the state before the user confirmed the 40/100 officially released passing rule. Implementation and the authorized Pending correction are now complete. See [ENTRANCE_EXAM_ROSTERS.md](ENTRANCE_EXAM_ROSTERS.md) for the current files, database changes, PDF workflow, verification, and remaining limitations.

## Initial findings and prioritized work

1. The live FHE scholarship (ID 17, Free Higher Education) is stored as category `other`, `requires_online_exam = 1`, `requires_face_to_face_exam = 0`. The category-normalization code has a face-to-face requirement for `unifast`, but the actual FHE record does not use that category. TES and TDP are also currently categorized as Other; their policy settings are outside this requested FHE change and were not changed.
2. The final scholarship award endpoint checks application approval and optimistic revision, but does not enforce an entrance-exam prerequisite. Application review approval is separate from the final award.
3. Scheduled Entrance Exams record attendance (`scheduled`, `completed`, `absent`), a numeric score, remarks, and official release time. There is no scheduled-exam passing cutoff, score denominator, or explicit passed/failed field. The scholarship's existing `exam_passing_score` is part of its online-exam configuration and must not be reused as an assumed face-to-face cutoff.
4. Admin scholarship review previously linked only to online exam results. It did not display the relevant applicant's face-to-face record beside the award controls.

## Live audit — read only

The audit ran under a database read-only transaction and rolled it back. No existing decision, scholarship setting, or applicant record was changed.

- Applicants checked: **14**.
- Applicants with no entrance-exam assignment: **13**.
- Applicants with only a scheduled assignment and no completed scored result: **1**.
- FHE applications: **1**.
- That FHE application is ID **10**, linked to applicant ID **2** and scholarship ID **17**.
- Its application-review status is **approved**, but its separate final award status is **undecided**. It has not been granted an award in the current database.
- Its applicant has only a scheduled entrance-exam assignment, with no completed scored result.
- FHE awards with no exam record: **0**.
- The other 13 applicants have no FHE application in this audit. A missing exam assignment alone does not provide a reason to change their unrelated admission decisions or other scholarship applications.

Re-run: `C:\xampp\php\php.exe storage/fhe-entrance-exam-audit.php` from the repository root. The ID-only audit report is stored in `backend/storage/app/private/fhe-entrance-exam-audit/audit.json`. Names, email addresses, contact details, and actual scores are not exported.

## Changes completed

- `frontend/src/components/EntranceExamReviewPanel.jsx`: a read-only Admin panel in FHE/face-to-face scholarship application review. Uses the existing authenticated Admin applicant-details endpoint to show that applicant's exam title, date, attendance, raw score, result-release status, and remarks. Includes loading, invalid-response, missing-applicant, error, retry, and no-record states. It does not infer passing from a score or a scheduled assignment.
- `frontend/src/utils/entranceExamReview.js`: helpers for showing the panel and accurately distinguishing completed scored records from mere assignments. A zero score is recorded data, not a missing value; no pass/fail outcome is inferred.
- `frontend/src/pages/admin/ScholarshipApplications.jsx`: displays the panel in the existing review modal, above application status selection.
- `frontend/src/components/ScholarshipDecisionPanel.jsx`: FHE/face-to-face review now links to the existing `/admin/exams` page. Other scholarships retain their online-exam link.
- `frontend/tests/entranceExamReview.test.mjs`: four tests cover misclassified FHE, zero/missing scores, attendance states, and separate result-release counting.
- `storage/fhe-entrance-exam-audit.php`: repeatable read-only audit.

No new endpoint, database migration, permission change, student-data mutation, mobile-app change, or automatic grant/rejection was made.

## Pending rule confirmation and data correction

The user was asked whether FHE requires any completed recorded result for Admin review or an officially released passing result. If passing is required, the face-to-face passing cutoff and maximum score are needed. These are not currently configured. The rule must also distinguish eligibility-review approval from final award approval.

Once confirmed, the concrete items to review are:

1. Correct scholarship ID 17 to its confirmed face-to-face workflow, accounting for existing online-exam eligibility and preserving any attempts/history.
2. Add the confirmed server-side prerequisite to the appropriate FHE review/award operations, with concurrency checks and tests. An interface-only warning is not enforcement.
3. If the confirmed rule excludes the current scheduled-only record, return FHE application ID 10 from `approved` to `pending`, leave `award_status = undecided`, record the reason and authorized actor, and preserve decision history. No existing final award requires reversal in this audit.
4. Re-run the audit immediately before any update so a newly entered exam result or changed decision is not overwritten.

The application/award gates and those data changes are **not implemented yet**, pending the required rule confirmation. The repository AGENTS.md prohibits inventing business policies and requires approval where an action changes institutional policy or could damage data.

## Verification executed

- Existing Admin applicant and scholarship application routes were verified with `php artisan route:list`.
- `npm run lint`: passed.
- `node --test --test-isolation=none tests/*.test.mjs`: **52 passed**. The ordinary `npm test` runner could not spawn its workers inside the restricted environment (`EPERM`); disabling process isolation ran the complete suite successfully.
- `npm run build`: passed. Build ran with the permitted sandbox override for Vite's local build subprocesses.
- `php artisan test --compact tests/Feature/EntranceExamManagementTest.php tests/Feature/WorkflowAccountabilityTest.php tests/Feature/StaffAccessTest.php`: **33 passed, 384 assertions**. These suites explicitly create SQLite in-memory schemas; the live database was not used for test mutations.
- Browser testing was unavailable. The new panel's actual DOM rendering and interactions have not been exercised in a browser.

The Admin review panel is informational. No claim is made that a passing requirement or automatic pending reconciliation is already enforced.
