# Grouped examination attempts and released results

## Findings and completed changes

| Workflow | Cause | Change |
| --- | --- | --- |
| Admin Examination attempts | Every attempt occupied a separate top-level table row; pagination could split an applicant's history | One collapsed section per applicant, with matching attempt count and released count. Expanding shows the existing Details, Release and Grant retake actions. Search/status/release filters remain active. |
| Attempts pagination | Existing API paginated individual attempts | Optional `group_by=applicant` on the existing Admin endpoint paginates 25 applicants and includes their matching attempts together. The default flat response remains compatible with other clients. |
| Applicant result details | Web history showed only score/pass; mobile result showed score and remarks | Released results now include attempt ID, question count, answered/unanswered/correct/incorrect counts, passing score, timing, release date and remarks. No selected options or answer keys are exposed. |
| Release notification destination | Generic `exam` notifications always opened scheduled Entrance Exams on mobile | Notification JSON now includes a computed destination. Existing online exam notifications are recognized without rewriting records. Web and mobile show the requested **View Online Exam Schedule** button and open the Online Examination page. Scheduled Entrance Exams keep their original destination. |
| Mobile release visibility | Opening a previously visited page could reuse an overview cached before release | Opening Online Examination now refreshes availability from the server. |

The button wording follows the user's requested label. “View Online Exam Result” would describe a released-result action more precisely; no examination scheduling policy or separate online schedule feature was added.

## Main files

- `backend/app/Http/Controllers/Api/Admin/OnlineExamController.php`: grouped attempt pagination and clearer release notification message.
- `backend/app/Http/Controllers/Api/Applicant/OnlineExamController.php`: release-gated aggregate result details in result/history responses.
- `backend/app/Models/Notification.php`: computed online/scheduled exam destination, including existing records.
- `frontend/src/pages/admin/OnlineExamManagement.jsx`: applicant dropdown sections.
- `frontend/src/pages/applicant/OnlineScholarshipExam.jsx`: detailed released-result history cards.
- `frontend/src/pages/applicant/Notifications.jsx`, `frontend/src/services/examNotification.js`: online exam button and destination classification.
- Mobile project `C:/Users/oseas/StudioProjects/edupath_mobile`: notification model/screen and online exam result model/screen. Originals retained under workspace `storage/exam-result-mobile/originals/`.
- Backend integrity tests, frontend notification test and mobile `test/online_exam_release_test.dart`: grouping, release privacy, legacy destination compatibility and actual widget navigation to the detailed result.

No migration was needed. Existing applications, attempts, answers and notifications were preserved. Notification type remains `exam`, preserving notification preferences. Release remains administrator-only, validates score integrity, and sends one notification on the first release. Result release remains separate from scholarship selection.

## Verification

- `php artisan test`: **203 passed, 1,662 assertions**; isolated test databases.
- Targeted `OnlineExamIntegrityTest`: **61 passed, 515 assertions**. New coverage confirms 27 attempts stay in one applicant group, filters still apply, other roles are denied, result detail counts are hidden before release, and online/scheduled notification destinations differ.
- Frontend tests: **60 passed**.
- Frontend lint and production build: passed.
- Mobile tests across release, models, runner, approval, notification navigation and announcement dismissal: **36 passed**. Includes tapping the actual notification button, verifying `OnlineExamScreen` opens, and checking detailed result fields render.
- Mobile analysis of the affected exam/notification modules and new test: no issues found.
- No connected browser was available for manual web interaction. No real administrator result was released and no real notification was dispatched during testing. Physical-device acceptance remains outstanding.

## Manual check

1. Reload the web app and hot restart the Flutter app.
2. In Admin → Online Scholarship Examination, expand an applicant in Examination attempts. Verify each matching attempt retains its actions.
3. Release a completed fictional test attempt. Confirm only one release notification is created.
4. On the applicant web/mobile account, open that notification and select **View Online Exam Schedule**. Verify it opens Online Examination. On mobile select View Result to fetch the latest released result if needed.
5. Confirm score, pass status, answer summary, timing, remarks and official release date. An unreleased attempt must still hide score and grading details. Confirm a scheduled Entrance Exam notification still opens its original page.
