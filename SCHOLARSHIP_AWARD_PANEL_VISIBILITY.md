# Scholarship award panel visibility

Updated 26 October 2026.

The Admin Review Scholarship Application dialog shows the separate award-decision panel only when the associated scholarship has `requires_online_exam` enabled. Scholarships without online examinations no longer mount the panel or request its decision history from this dialog.

The user selected this visibility change instead of removing the panel from every application. Application review, required document viewing, staff recommendations and scheduled entrance-examination review remain available under their existing rules. The backend award endpoints, authorization, audit history, saved awards and applicant award-status displays were preserved. Approving an application still does not automatically grant a scholarship.

Changed `frontend/src/pages/admin/ScholarshipApplications.jsx`. No migration, backend policy change or mobile client change was needed.

Verification: changed-source ESLint passed, all 93 frontend regression tests passed, and the production build passed. No signed-in browser walkthrough was performed for this visibility-only change.
