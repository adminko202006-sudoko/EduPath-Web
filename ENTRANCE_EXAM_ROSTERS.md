# Scheduled entrance-exam rosters and FHE eligibility

Implemented October 20, 2026, following the user's confirmation of **both uploaded and generated roster PDFs**, and an **officially released passing result of at least 40/100** for FHE.

## Findings and completed priorities

1. FHE was categorized as `other` with online examination enabled, although the user requires the existing face-to-face Entrance Exams workflow. Corrected FHE and protected future FHE saves from that misclassification.
2. Neither application approval nor the separate final award enforced the scheduled entrance-exam prerequisite. Both now enforce the confirmed rule on the server, including repeated approval/award requests.
3. The scheduled module had attendance, scores, assignments, exact start/end times, and official release, but no passing rule or roster workflow. It now exposes 100 questions / 100 maximum points / 40 passing points, validates score bounds, and supports private PDF rosters.
4. Admin can select the requested session presets, upload a prepared roster during creation/editing, replace an uploaded roster in session details, and generate a current roster from assigned applicants. Existing batch assignment remains the source of account assignments.
5. Assigned applicants can download either roster on the web and save either PDF from the mobile exam details screen. Uploaded PDFs do not automatically create accounts or assign students based on names.

## Connection and security checks

| Action | Route | Controller/service and records | Result |
| --- | --- | --- | --- |
| Create/edit session, optionally with PDF | `POST /api/admin/exams`, `PUT /api/admin/exams/{exam}`; multipart edits use POST with `_method=PUT` | Admin ExamController; entrance_exams and private local storage | Validated; tested multipart create/edit and existing time validation |
| Assign accounts | `POST /api/admin/exams/{exam}/assignments` | Existing Admin ExamController; exam_assignments | Existing records, attendance, and grades preserved |
| Upload/replace prepared roster | `POST /api/admin/exams/{exam}/roster` | ExamRosterController / EntranceExamRosterService | Admin only; PDF MIME/extension/header, 10 MB maximum; private random storage names |
| Generate/download roster | `GET /api/admin/exams/{exam}/roster?source=generated` or `uploaded` | EntranceExamRosterService and Blade PDF template | Authenticated Admin; source validated |
| Applicant roster download | `GET /api/applicant/exams/{assignment}/roster?source=generated` or `uploaded` | Applicant ExamController; assignment ownership | Other applicants and Staff cannot use the Admin route; applicant IDOR rejected |
| Record/release grades | Existing assignment and release routes | Admin ExamController | 0–100 score validation; release rejects missing/out-of-range scores; released grades stay immutable |
| View official outcome | Existing applicant exam list/detail routes | Applicant ExamController | Score, remarks, and new `passed` field remain hidden before release |
| Approve FHE review | Existing scholarship-application update | WorkflowDecisionService / FheEntranceEligibilityService | Requires own completed, released score from 40 through 100 |
| Record FHE award | Existing separate award endpoint | ScholarshipAwardController / same eligibility service | Same exam gate plus existing approval, authorization, revision, reason, and audit checks |

Passing does not automatically approve an application or grant a scholarship. Other scholarship rules and admission decisions were not changed. Any qualifying officially released passing scheduled entrance-exam record belonging to the applicant satisfies this prerequisite; an absent, scheduled, unscored, unreleased, or another applicant's record does not.

Generated PDFs contain names, session schedule, venue, question/score information, and generation time. They exclude email addresses, contact details, individual grades, attendance, and remarks. Remote resources, embedded PHP, and JavaScript are disabled in PDF generation. Blade escapes names and session text. Prepared PDF contents remain Admin-authored; the interface instructs Admin to include names and schedule details only.

PDF storage paths are excluded from API serialization. Previous uploaded versions remain in private storage; upload events record a version identifier. Mobile downloads use the existing authenticated Dio client and file picker, bypass offline caching, check PDF response bytes, and report cancellation/failure without false success.

## Live data correction and preservation

The read-only audit was repeated immediately before correction: 14 applicants, 13 with no scheduled-exam assignment, one with only a scheduled assignment. Only one FHE application existed.

- Scholarship **17**: corrected to `unifast`, face-to-face examination required, online examination disabled.
- FHE application **10**, applicant **2**: changed `approved` to `pending`; award remains `undecided`, revision remains 0. Its applicant has no completed passing result.
- Existing remarks were retained and the pending reason appended. An audit event identifies user-authorized system maintenance with a nullable actor; no Admin was impersonated. An in-app update was created.
- A before-change snapshot is stored under `backend/storage/app/private/fhe-entrance-exam-audit/before-correction-*.json`.
- No admission decisions, final awards, exam scores, assignments, online attempts, answers, retake history, or other scholarship settings were deleted/reset. FHE no longer confers online-exam eligibility; stored online attempts remain intact.
- A repeat reconciliation preview reported **zero remaining changes**.

Only the additive migration `2026_10_20_000001_add_private_roster_to_entrance_exams.php` was applied. It adds a nullable private roster path; no table reset or destructive migration ran. The confirmed fixed score rule is defined by EntranceExam constants and exposed as additive API metadata. The scholarship's pre-existing online `exam_passing_score` field is separate and was not repurposed.

## Main files

- `backend/app/Services/FheEntranceEligibilityService.php`: FHE recognition and released passing-result enforcement.
- `backend/app/Services/WorkflowDecisionService.php`, `Api/Admin/ScholarshipAwardController.php`, `Api/Admin/ScholarshipController.php`: enforce review/award gates and normalize FHE workflow settings.
- `backend/app/Models/EntranceExam.php`, `Api/Admin/ExamController.php`, `Api/Applicant/ExamController.php`: score rule, validation, private serialization, released outcomes, optional PDF on save, and applicant ownership.
- `backend/app/Services/EntranceExamRosterService.php`, `Api/Admin/ExamRosterController.php`, `backend/resources/views/pdf/entrance-exam-roster.blade.php`, `backend/routes/api.php`: private upload and generated PDF endpoints.
- `backend/composer.json`, `backend/composer.lock`: added Dompdf 3.1.6 and its four dependencies; no existing dependency version was updated.
- `backend/database/migrations/2026_10_20_000001_add_private_roster_to_entrance_exams.php`: nullable roster field.
- `frontend/src/components/ExamRosterPanel.jsx`, Admin `EntranceExams.jsx`, applicant `EntranceExam.jsx`: upload, authenticated downloads, session presets, score limits, and official outcome display.
- `frontend/src/components/EntranceExamReviewPanel.jsx`, `ScholarshipDecisionPanel.jsx`: visible FHE prerequisite and clear maintenance-history actor label. The existing scholarship review integration and helpers remain in place.
- `backend/tests/Feature/EntranceExamManagementTest.php`: missing/unreleased/failing/passing/foreign results, manual award distinction, score limits, upload validation, private ownership, generated contents, and multipart saves.
- Mobile `lib/features/exams/models/exam_model.dart`, `screens/exams_screen.dart`, `screens/exam_roster_actions.dart`, `test/exam_roster_model_test.dart`: roster metadata, authenticated PDF saving, and released-result privacy. Staging files and original mobile backups are in `storage/mobile-exam-rosters/`.
- `storage/fhe-entrance-exam-audit.php`, `storage/reconcile-fhe-entrance-rule.php`: CLI-only read-only audit and explicit `--apply` reconciliation. The latter previews by default and stops if an existing final award requires manual review.
- `storage/preview-entrance-roster.php`: CLI-only synthetic PDF QA using SQLite memory, never live applicant records.

## Verification actually executed

- `php artisan route:list --path=exams --except-vendor`: verified 26 scheduled/online exam routes including the three new roster routes.
- Full `php artisan test --compact`: **164 passed, 1,377 assertions**. Feature suites explicitly use SQLite memory; no test resets the live database.
- `npm run lint`: passed, including the final prerequisite/history-label changes.
- `node --test --test-isolation=none tests/*.test.mjs`: **52 passed**. This runner avoids the environment's process-spawn restriction.
- `npm run build`: passed, including the final prerequisite/history-label changes.
- Flutter full `test --no-pub`: **108 passed, 1 skipped**. The existing live-server connectivity test was skipped because `EDUPATH_LIVE_API_BASE_URL` was not supplied. No emulator/device PDF-save interaction was exercised.
- After discovering the running local API, reran `test/server_url_connection_test.dart` with `--dart-define=EDUPATH_LIVE_API_BASE_URL=http://127.0.0.1:8000/api`: **all five passed**, including the previously skipped live public-programs connectivity check. This is a connection check, not an authenticated roster/device test.
- Flutter `analyze --no-pub`: initially reported five brace-style issues in the new widget; fixed and rerun: **no issues found**.
- PHP production dependency platform check: passed on PHP **8.2.12**.
- Targeted `git diff --check`: passed for the touched tracked backend/frontend files. The broad working-tree check still reports whitespace issues in unrelated ThemeContext, Programs, Staff pages, and AppRoutes files; those changes were preserved.
- Generated and rendered a synthetic 150-applicant A4 roster: **six pages**, all visually reviewed after fixing column proportions. Extracted text verified all 150 names and accented names. No PDF JavaScript is present. The preview is `output/pdf/entrance-exam-roster-preview.pdf`.
- Live correction verified by a fresh read-only audit and an empty reconciliation preview. No automatic grant or result release was performed.

## Remaining limitations and separate findings

- Browser interaction and physical Android/iOS save dialogs still need manual testing; no browser surface was available for this session. The mobile action saves a PDF for opening through the device Files app; it does not embed a PDF viewer.
- TES and TDP are also classified as Other in the existing database. Their institutional workflow was outside this FHE request and was not changed.
- Composer's audit reports **five advisories affecting four existing packages**: Laravel framework (debug-page XSS), league/commonmark (raw HTML filtering and table parsing denial of service), Symfony HTTP Foundation (header parsing denial of service), and Symfony YAML (unbounded recursion). No advisory was reported for the new PDF packages. These existing framework/dependency updates remain separate work; this feature did not broadly upgrade the application stack.
- Existing locked Laravel Pint requires PHP 8.3, while local XAMPP is 8.2.12. The targeted PDF dependency installation retained that development lock using Composer's PHP-requirement override; the separate production platform check and all Laravel tests passed. Pint was not used or claimed to pass.

## Manual check

1. Admin → Entrance Exams → Add: choose a session preset, date and venue; optionally attach a prepared PDF and save.
2. Use Assign Applicants; open session details and download the generated roster. Upload or download a prepared roster there as well.
3. As an assigned applicant, open Entrance Exams on the web or mobile → View Pass & Details → save/download roster. Another applicant's assignment URL must be denied.
4. Record a completed score of 39 and release it: FHE approval must fail. A completed officially released result of 40 or higher permits Admin review/award actions, subject to their other existing checks. Passing itself never awards the scholarship.
