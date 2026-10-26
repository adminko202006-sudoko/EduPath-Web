# Applications grouped by applicant

Admission Applications and Scholarship Applications now display a collapsed dropdown for each applicant in both Admin and Staff portals.

Each summary displays the applicant's name, email when present, number of matching submissions, and pending count. Clicking or using the keyboard on the summary expands the existing application table/cards and their individual actions. Groups start collapsed, support multiple open applicants, and retain expansion during ordinary data refreshes while the applicant remains in the filtered results.

Search and status filters run before grouping. Counts in each summary reflect matching applications. Groups use applicant record IDs, falling back to user IDs and finally individual application IDs; people are not combined by matching names. Existing API calls, permissions, application records, review dialogs, and decisions are unchanged.

## Files

- frontend/src/components/ApplicantApplicationGroups.jsx: shared accessible native details/summary dropdown, identity grouping, counts, and light/dark responsive styles.
- frontend/src/pages/admin/AdmissionApplications.jsx: groups the existing table beneath each applicant.
- frontend/src/pages/admin/ScholarshipApplications.jsx: groups desktop rows and mobile cards beneath each applicant.
- frontend/src/pages/staff/AdmissionApplications.jsx: groups desktop rows and mobile cards; preserves loading/empty states.
- frontend/src/pages/staff/ScholarshipApplications.jsx: groups desktop rows and mobile cards beneath each applicant.

Only the active frontend/src tree was changed. No database migration was necessary.

## Verification

- Targeted ESLint for the shared component and all four pages: passed.
- npm run build: passed (1973 modules transformed).
- npm test: 40 passed.
- git diff --check on the four pages: passed; Git reported only line-ending conversion notices.
- Browser runtime reported no browser available, so authenticated desktop/mobile interaction and visual QA were not performed.
