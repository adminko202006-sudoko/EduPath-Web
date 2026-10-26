# Question bank, attempts and scholarship form review — October 24, 2026

Read-only database verification found 100 questions, all assigned to existing attempts, with zero unused questions. Attempt status counts were two completed, two expired, and three in progress. No records were modified.

Both frontend and API intentionally prevent editing question wording/options or deleting questions after assignment. These restrictions preserve historical answers and scores. Unused questions remain editable/deletable; assigned questions can be deactivated for future selection.

Updated frontend/src/pages/admin/OnlineExamManagement.jsx to show the reason for disabled actions and offer Create editable copy for assigned questions. The existing editor preloads the wording, source, options and correct answer, but saves through the existing question-creation endpoint with no original question/option IDs. The modal explains that saving creates a separate active question and does not deactivate the original automatically. Historical attempts retain their original question IDs and order.

No attempt Delete action was added. Status other than completed is insufficient authorization for deletion: expired attempts may contain answers/scores and released results; in-progress attempts contain timing and saved answers. Removing rows would also change the count used for attempt limits and retake authorization. Existing Details, Release and Grant retake actions remain. A future exceptional invalidation workflow should retain history and record an authorized actor/reason, with its effect on retake limits explicitly decided.

Scholarship form review found that the detailed Apply for Scholarship form is in Flutter, while the web page currently sends an application after a confirmation with an empty payload. Flutter stores academic/financial/motivation fields together in remarks; income, year and dependent choices are preselected, and the field labelled household family size offers dependent-count choices. Optional scholarship attachments are uploaded to an admission document record rather than a dedicated scholarship attachment relationship.

Suggested next improvements (not implemented in this review):

1. Show scholarship name, application deadline, actual admission eligibility and applicable examination steps above the form.
2. Require deliberate selections for financial/year fields; distinguish household size from dependents and explain the accepted academic grading scale without inventing eligibility thresholds.
3. Align web/mobile fields and use validated structured applicant data separate from reviewer remarks.
4. Show a checklist based on configured requirements; clearly explain attachment destination and per-file upload outcomes. Dedicated scholarship attachments require backend/schema work.
5. Add a review-before-submit step, preserve entered information on failure, protect unsaved work, and keep submission controls visible above the mobile keyboard.

Executed verification: four targeted OnlineExamIntegrityTest cases passed (21 assertions), covering assigned-question locks, unused-question deletion and retake restrictions. Web production build and ESLint for the changed page passed. No live browser UI test was performed because no browser was connected. No database migrations or institutional policy changes were made.
